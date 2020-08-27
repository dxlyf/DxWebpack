const path=require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack=require('webpack');
const ChainConfig = require('webpack-chain');
module.exports=(env=process.env,argv={},userConfig={})=>{

    let chainConfig=new ChainConfig();

    let progress=argv.progress||true;//是否显示编译进度
    let isDevServer=env.isDevServer;//是否使用开发模式
    let isProduction=env.production;//是否生产环境
    let root=env.DXDIR||process.cwd();

    let outputPath=argv.outputPath||"dist";
    
    let extraPlugins=[];//额外插件
    let babelOptions={};//
    if(argv.typescript){
        babelOptions.typescriptOptions={}
    }
    if(argv.react){
        babelOptions.reactOptions={}
    }
    //如果配置有定义webpackConfig函数，就收集
    if(userConfig.webpackConfig&&typeof userConfig.webpackConfig=='function'){
        let webpackConfig=userConfig.webpackConfig;
        webpackConfig(config);
        delete userConfig.webpackConfig;
    }
    if(userConfig.babelOptions){
        babelOptions={...babelOptions,...userConfig.babelOptions};
        delete userConfig.babelOptions;
    }
    if(isDevServer){
        extraPlugins.push(new HtmlWebpackPlugin({
            title:"Dx-Webpack"
        }))
    }
    let webpackConfig={
        mode:isProduction?"production":"development",
        target:"web",
        context:root,
        devtool:"cheap-module-source-map",
        output:{
            path: path.resolve(root, outputPath), 
            filename:"[name].js",
            publicPath:"/",
            chunkFilename: "[chunkhash].js", // 长效缓存(/guides/caching)
        },
        module:{
            rules:[{
                test:/\.(?:jsx?|tsx?)$/,
                loader:"babel-loader",
                options:{
                    babelrc: false,
                    configFile: false,
                    presets:[[require.resolve('./babel-presets-dx'),babelOptions]]
                }
            }]
        },
        resolve:{
            extensions:['.js','.jsx','.ts','.tsx','.json']
        },
        plugins:[
            progress&&new webpack.ProgressPlugin(),
            new CleanWebpackPlugin({
                // 模拟删除
                // default: false
                dry: false, 
                //在重建时自动删除所有未使用的webpack资产 默认:true
                cleanStaleWebpackAssets:false,
                //  在Webpack编译之前删除一次文件
                //    不包含在重建中（监视模式）
                cleanOnceBeforeBuildPatterns:["**/*"]
            }),
            ...extraPlugins
        ].filter(Boolean),
        devServer:{
            contentBase:path.resolve(root, outputPath),
            port:3000,
            open:true
        }
    }
    chainConfig.merge(userConfig);
    chainConfig.merge(webpackConfig)
    let newConfig=chainConfig.toConfig();
    console.log(newConfig)
    return newConfig;
}