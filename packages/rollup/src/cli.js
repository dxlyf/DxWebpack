const commander=require('commander');
const rollup=require('rollup');
const fs=require('fs');
const path=require('path');
const chokidar=require('chokidar');//观察文件
const chalk=require('chalk');//颜色
const {mergeConfig,mergeOutput}=require('./util');
const babel=require('@rollup/plugin-babel').default;
const {nodeResolve}=require('@rollup/plugin-node-resolve');
const alias=require('@rollup/plugin-alias');
const commonjs=require('@rollup/plugin-commonjs');
const mergeWith = require('lodash.mergewith');
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
                        presets:[[require.resolve('./config/babel-presets-dx')]],
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

async function runBuild(entry,command){
    let userConfig=getUserConfig();
    
    let argv=commander.opts();
    let babelOptions=userConfig.babelOptions||{};
    let rollupConfig=userConfig.rollupConfig||{};
    if(userConfig.babelOptions){
        babelOptions=userConfig.babelOptions;
        delete userConfig.babelOptions;
    }
    let config={
        input:{
            [entry?entry:'index']:argv.input
        },
        ...rollupConfig,
        output:mergeOutput({
            ...argv.output,
            dir:argv.dir,
            format:argv.format,
            exports:argv.exports,
            plugins:[
                alias(userConfig.alias||{}),
                nodeResolve(userConfig.nodeResolve||{}),
                commonjs(userConfig.commonjs||{}),
                babel({
                babelrc: false,
                configFile: false,
                babelHelpers:"bundled",
                exclude:/node_modules/,
                extensions:['.js', '.jsx', '.es6', '.es', '.mjs'],
                presets:[[require.resolve('./config/babel-presets-dx'),babelOptions]],
                ...(userConfig.babel||{})
            })]
        },rollupConfig.output||{})
    };
 
   
    const bundle = await rollup.rollup(config);

    await bundle.write(config);

    console.log(chalk.blue('编译完成'))
}

commander.usage('使用rollup编译服务')
.option('-c,--config [configFile]','配置文件')
.option('-i,--input [input]','输入文件','./src/index.js')
.option('-d,--dir [dir]','输出目录','dist')
.option('-f,--format [format]','格式','umd')
.option('-e,--exports [exports]','导出类型','auto')
.option('-o,--output <output...>','输出选项',(value,prev)=>{
        var attr=value.split('=');
        prev[attr[0]]=attr[1];
        return prev;
},{
    name:"myLibary"
})
commander
.command('build <entry>')
.action(runBuild)

commander.parse(process.argv);