const commander=require('commander');
const webpack=require('webpack');
const WebpackDevServer=require('webpack-dev-server')
const createConfig=require('./config/webpack.base');
const fs=require('fs');
const path=require('path');
const chokidar=require('chokidar');//观察文件
const chalk=require('chalk');//颜色
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
function getWebpackConfig(cliConfig={}){
    let userConfig=getUserConfig();
    let options={
        ...cliConfig,
        ...userConfig
    }
    let config=createConfig(options);
    if(options.webpackConfig&&typeof options.webpackConfig=='function'){
        options.webpackConfig(config)
    }
    return config.toConfig();
}
function runDevServe(entry,command){
     let commonConfig=commander.opts();
     let webPackConfig=getWebpackConfig({entry:entry,serve:true});
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
.option('-c,--config [configFile]','配置文件')
.command('serve [entry]')
.action(runDevServe)

commander
.command('build <entry>')
.option('-f,--format <format>','格式','umd')
.action(runBuild)

commander.parse(process.argv);