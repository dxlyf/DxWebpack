const commander=require('commander');
const webpack=require('webpack');
const WebpackDevServer=require('webpack-dev-server')
const createConfig=require('./config/webpack.base');
const fs=require('fs');
const path=require('path');
const chokidar=require('chokidar');//观察文件
const chalk=require('chalk');//颜色
const glob=require('glob');
const {mergeConfig}=require('./util')
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
                    const watcher=chokidar.watch(modulePath);

                    watcher.on('change',(path,stats)=>{
                        watcher.close();
                        if(server){
                            server.close();
                        }
                        console.log(chalk.green('配置发生变化,生新启动',path));
                        process.send({type:"RESTART",message:"配置发生变化，重新启动"})
                    })
         }catch(e){
                console.log(chalk.red('异常',e))
         }
    }
    //console.log('userConfig',userConfig)
    return userConfig;
}

const defaultOptions={
    cwd:process.cwd(),
    mode:"development",
    entry:"./src/index.js",
    babelOptions:{
      envOptions:{}
    },//babel配置
    outputPath:"dist",//输出目录
    output:{},//输出配置
    serve:false, //是否启动服务,
    //plugin
    html:{title:"dx-webpack"},//是否生成html
    open:false,
    css:false,//css配置
}

function getWebpackConfig(cliConfig={}){
    let opts=commander.opts();
    let userConfig=getUserConfig();
    let options=(Array.isArray(userConfig)?userConfig:[userConfig]).map(config=>(mergeConfig(defaultOptions,{ 
        outputPath:opts.outputPath,
        ...cliConfig,
        ...config})))
    let entrys;
    if(opts.glob){
        let files=glob.sync(argv.input,{cwd:options[0].cwd||process.cwd()});
        entrys={};
        files.forEach(file=>{
            let ext=path.extname(file);
            let basename=path.basename(file,ext)
            entrys[basename]=file;
        })
    }

 
    options=options.reduce((optionList,options)=>{
        if(opts.ts){
            if(!options.babelOptions){
                options.babelOptions={};
            }
            options.babelOptions={
                ...options.babelOptions,
                typescriptOptions:{
                    ...(options.babelOptions.typescriptOptions||{})
                }
            }
        }
        if(opts.react){
            if(!options.babelOptions){
                options.babelOptions={};
            }
            options.babelOptions={
                ...options.babelOptions,
                reactOptions:{
                    ...(options.babelOptions.reactOptions||{})
                }
            }
        }
        if(entrys){
            options.entry=entrys;
        }
        if(opts.format){
            opts.format.forEach((format)=>{
                let config=createConfig(options);
                config.output.libraryTarget(format);
                config.output.library(opts.library);
                config.output.path(path.resolve(options.cwd,options.outputPath,format));
                if(options.webpackConfig&&typeof options.webpackConfig=='function'){
                    options.webpackConfig(config)
                } 
                optionList.push(config.toConfig())
            })
        }else{
            let config=createConfig(options);
            if(options.webpackConfig&&typeof options.webpackConfig=='function'){
                options.webpackConfig(config)
            } 
            optionList.push(config.toConfig())
        }

        return optionList;
    },[])

   
    return options.length==1?options[0]:options;
}
function runDevServe(entry,command){
     let argv=command.opts();
     let webPackConfig=getWebpackConfig({entry:entry,serve:true,open:argv.open});
     let compiler=webpack(webPackConfig);
     server=new WebpackDevServer(compiler,webPackConfig.devServer);
     server.listen(webPackConfig.devServer.port,webPackConfig.devServer.host);
     
    
}
function runBuild(entry,command){
    let compiler;
    let webPackConfig=getWebpackConfig({entry:entry});
    try{
        compiler=webpack(webPackConfig);
    }catch(e){
        throw new Error('创建webpack实例错误'+e)
    }
    compiler.hooks.done.tap("WebpackInfo", compilation => {
        const compilationName = compilation.name ? compilation.name : "";
        console.error("\nCompilation " + compilationName + " finished\n");
    });
    compiler.run((err,stats)=>{
            if(err){
                console.log(chalk.red('运行错误'),err);
                return;
            }
            if(stats.hasErrors()){
                console.log(chalk.red('编译错误'),stats.toString({errors:true,errorDetails:true}))
                return;
            }
            console.log(stats.toString({
                colors:true,
                assets:true

            }))
    })
}

commander.usage('使用webpack编译服务')
.option('-o,--outpath','输出路径','dist')
.option('-g,--glob [glob]','是否启用glob模式',false)
.option('-c,--config [configFile]','配置文件')
.option('--library [library]','导出库名','myLibrary')
.option('-f,--format [format...]','导出格式')
.option('--ts [typescript]','是否支持typescript',false)
.option('--react [react]','是否支持react',false)
.command('serve [entry]')
.option('--open <openBorswer>',false)
.action(runDevServe)

commander
.command('build <entry>')
.option('-f,--format <format>','格式','umd')
.action(runBuild)

commander.parse(process.argv);