const commander=require('commander');
const rollup=require('rollup');
const fs=require('fs');
const path=require('path');
const chokidar=require('chokidar');//观察文件
const chalk=require('chalk');//颜色
const {mergeConfig,mergeOutput}=require('./util');
const {default:babel,getBabelOutputPlugin}=require('@rollup/plugin-babel');
const {nodeResolve}=require('@rollup/plugin-node-resolve');
const alias=require('@rollup/plugin-alias');
const commonjs=require('@rollup/plugin-commonjs');
const beep=require('@rollup/plugin-beep');//提示错误和警告 
const json=require('@rollup/plugin-json');
const replace=require('@rollup/plugin-replace');
const nodePolyfills=require('rollup-plugin-node-polyfills');
const html=require('rollup-plugin-generate-html-template');
const postcss=require('rollup-plugin-postcss');
const serve=require('rollup-plugin-serve');
const mergeWith = require('lodash.mergewith');
const glob=require('glob');

let server;
function getUserConfig(){
    let opts=commander.opts();
    let userConfig={};
    //console.log('opts',opts)
    if(opts.config){
        let configPath=path.resolve(process.cwd(),opts.config);
        //console.log(path.relative(__dirname,configPath))
         try{
                    let modulePath=require.resolve(configPath);
                    require('@babel/register')({
                        ignore: [/node_modules/],
                        only:[modulePath],
                        extensions: ['.jsx', '.js', '.ts', '.tsx'],
                        babelrc: false,
                        cache: false,
                        presets:[[require.resolve('@dxyl/babel-presets-dx')]],
                    });
                    userConfig=require(modulePath).default||require(modulePath);
                    if(opts.watch){
                        const watcher=chokidar.watch(modulePath);
                        watcher.on('change',(path,stats)=>{
                            watcher.close();
                            if(server){
                                server.close();
                            }
                            console.log(chalk.green('配置发生变化,生新启动',path));
                            process.send({type:"RESTART",message:"配置发生变化，重新启动"})
                        })
                    }
         }catch(e){
                console.log(chalk.red('异常',e))
         }
    }
    //console.log('userConfig',userConfig)
    return userConfig;
}

function createInputOptions(options={},plugins=[]){
    let inputOptions={
        ...options
    }
    if(!inputOptions.plugins){
        inputOptions.plugins=(inputOptions.extraPlugins||[]).concat(plugins);
    }
    return inputOptions;
}
function createOutPutOptions(options={},plugins=[]){
    let outputOptions={
        banner:`/***
@desc dx-rollup
***/`,
        name:"myLibrary",
        entryFileNames:'[name].js',
        chunkFileNames:'[name].js',
        exports:'auto',
       ...options,

    }
    if(!outputOptions.plugins){
        outputOptions.plugins=[]
    }
    outputOptions.plugins=outputOptions.plugins.concat(plugins);
    return outputOptions
}

async function runBuild(entry,command){
    let userConfig=getUserConfig();
    
    let argv=commander.opts();
    let babelOptions=userConfig.babelOptions||{};
    let rollupConfig=userConfig.rollupConfig||{};
    let nodeResolveOpts=userConfig.nodeResolve||{};
    let commonjsOpts=userConfig.commonjs||{};
    if(argv.ts&&!babelOptions.typescriptOptions){
        babelOptions.typescriptOptions={};
    }
    if(argv.react&&babelOptions.reactOptions){
        babelOptions.reactOptions={}
    }

    let outputs=rollupConfig.output;
    if(outputs&&!Array.isArray(outputs)){
        outputs=[outputs];
    }
    const inputPlugins=[
        alias({
            ...(userConfig.alias||{})
        }),
        (userConfig.nodeResolve!==false)&&nodeResolve({
            //  include:"node_modules/**",
              extensions: ['.js', '.jsx','.mjs','.ts','.tsx', '.json', '.sass', '.scss'],
              ...nodeResolveOpts
          }),
        json(),
        beep(),
        (userConfig.nodePolyfills!==false)&&argv.polyfillNode&&nodePolyfills({...(userConfig.nodePolyfills||{})}),
        replace({...(userConfig.replace||{})}),
        (userConfig.babel!==false)&&babel({
        babelrc: false,
        configFile: false,
        babelHelpers:"bundled",//runtime
        exclude:"**/node_modules/**",
        //skipPreflightCheck:true,
        extensions:['.js', '.jsx','.ts','.tsx', '.es6', '.es', '.mjs'],
        presets:[[require.resolve('@dxyl/babel-presets-dx'),babelOptions]],
        ...(userConfig.babel||{})}),
        (userConfig.commonjs!==false)&&commonjs({include:"node_moduels/**",...commonjsOpts}),
        (argv.html===true&&userConfig.html!==false)&&html({
            template: 'src/index.html',
            ...(userConfig.html||{})
        }),
        (argv.postcss===true&&userConfig.postcss!==false)&&postcss({
            ...(userConfig.postcss||{})
        }),
        (argv.serve===true&&userConfig.serve!==false)&&serve({
            open: true,
            contentBase: 'dist',
            port: 3000,
            ...(userConfig.serve||{})
        })
            
    ].filter(Boolean);
  
    const outputPlugins=[
     
    ]
    let inputs={
        
    }
    if(argv.glob){
        let files=glob.sync(argv.input,{});
        files.forEach(file=>{
            let ext=path.extname(file);
            let basename=path.basename(file,ext)
            inputs[basename]=file;
            /*
            path.format({
                dir:path.dirname(file),
                name:basename,
                ext:'.js'
            }).replace(/\\/g,'/');
            */
        })
    }else{
        inputs[entry?entry:'index']=argv.input
    }

    let config={
        ...createInputOptions({
            input:{
                ...inputs
            },
            ...rollupConfig
        },inputPlugins),
        output:outputs?outputs.map(output=>createOutPutOptions({      
             dir:argv.dir,
            format:"umd",
            name:argv.library,
            exports:argv.exports,
            ...output
        },outputPlugins)):argv.format.map(format=>{

            return createOutPutOptions({
                dir:argv.independent?format:argv.format.length>1?argv.dir+'/'+format:argv.dir,
                format:format,
                name:argv.library,
                exports:argv.exports,
                ...argv.output
            })
        },outputPlugins)
    };

 
   
    if(argv.watch){
        const watcher=rollup.watch({...config,       
         watch:{}
        });  
        watcher.on('event', event => {
            // event.code can be one of:
            //   START        — the watcher is (re)starting
            //   BUNDLE_START — building an individual bundle
            //   BUNDLE_END   — finished building a bundle
            //   END          — finished building all bundles
            //   ERROR        — encountered an error while bundling
            if(event.code=='BUNDLE_START'){
                let input = event.input;
                if (typeof input !== 'string') {
                    input = Array.isArray(input)
                        ? input.join(', ')
                        : Object.keys(input)
                                .map(key =>input)
                                .join(', ');
                }
                console.log(`bundles ${chalk.bold(input)} → ${chalk.bold(event.output.map(out=>out).join(', '))}...`);
            }
            if(event.code=='BUNDLE_END'){
                console.log(
                    chalk.green(
                        `created ${chalk.bold(event.output.map(out=>out).join(', '))} in ${chalk.bold(event.duration)
                        }`
                    )
                );
            }
            if(event.code=='ERROR'){
                console.log(chalk.red(event.error.message))
            }
        });
        console.log(chalk.blue('启动观察'))
    }else{
        const bundle = await rollup.rollup(config);
        try{
            await Promise.all(config.output.map(bundle.write));
        }catch(e){
            console.log(chalk.red(e))
        }
        
        console.log(chalk.blue('编译完成'))
    }

}

commander.usage('使用rollup编译服务')
.option('-c,--config [configFile]','配置文件')
.option('-i,--input [input]','输入文件','./src/index.js')
.option('-d,--dir [dir]','输出目录','dist')
.option('-n,--library [library]','输出包名','myLibary')
.option('-f,--format [format...]','格式',['umd'])
.option('-w,--watch [watch]','观察',false)
.option('-e,--exports [exports]','导出类型','auto')
.option('--ts [typescript]','是否支持typescript',false)
.option('--react [react]','是否支持react',false)
.option('-g,--glob [glob]','是否启用glob模式',false)
.option('--html [html]','模板',false)
.option('--serve [serve]','服务',false)
.option('--postcss [postcss]','postcss',false)
.option('--no-polyfill-node [polyfillNode]','是否填充nodejs')
.option('--independent [independent]','是否以输出格式为单独目录,默认放在dist下面',false)
.option('-o,--output <output...>','输出选项',(value,prev)=>{
        var attr=value.split('=');
        prev[attr[0]]=attr[1];
        return prev;
},{
 
})
commander
.command('build [entry]')
.action(runBuild);

commander.parse(process.argv);