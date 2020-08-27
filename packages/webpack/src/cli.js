const commander=require('commander');
const webpack=require('webpack');
const webpackDevServer=require('webpack-dev-server')
const createConfig=require('./config/webpack.config')


function runCompiler(options){
    let config=createConfig(process.env,options)
    let compiler;
    try{
        compiler=webpack(config);
    }catch(e){
        throw new Error('创建webpack实例错误'+e)
    }
    compiler.hooks.done.tap("WebpackInfo", compilation => {
        const compilationName = compilation.name ? compilation.name : "";
        console.error("\nCompilation " + compilationName + " finished\n");
    });
    compiler.run((err,stats)=>{
            if(err){
                console.log('运行错误',err);
                return;
            }
            if(stats.hasErrors()){
                console.log('编译错误',stats.toString({errors:true,errorDetails:true}))
                return;
            }
            console.log(stats.toString({
                colors:true,
                assets:true

            }))
    })
    return compiler;
}
function runDevServe(command){
    console.log(command)
}
commander.usage('使用webpack编译服务').command('serve')
.action(runDevServe)


commander.parse(process.argv);