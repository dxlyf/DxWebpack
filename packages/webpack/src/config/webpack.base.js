
   const path=require('path');
   const HtmlWebpackPlugin = require('html-webpack-plugin');
   const { CleanWebpackPlugin } = require('clean-webpack-plugin');
   const webpack=require('webpack');
   const ChainConfig = require('webpack-chain');
   const {mergeConfig} = require('../util');

   function cssLoader(config){
    
    
    
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

   module.exports=(options={})=>{
        options=mergeConfig(defaultOptions,options)
        let cwd=options.cwd;
        let mode=options.mode||'development';
        let isProduction=mode==='production';
        let entry=options.entry;
        let babelOptions=options.babelOptions;
        let outputPath=options.outputPath;
        let asbOutputPath=path.resolve(cwd,outputPath);
        let serve=options.serve;
        let chainConfig=new ChainConfig();


        chainConfig
            .mode(mode)
            .context(cwd)
            .devtool('cheap-module-source-map')
            .target('web');
        //entry
        if(typeof entry =='object'){
            Object.keys(entry).forEach((name)=>{
                 let entrySet=chainConfig.entry(name);
                 let value=entry[name];
                 if(Array.isArray(value)){
                    value.forEach(v=>{
                        entrySet.add(v);
                    })
                 }else{
                    entrySet.add(value)
                 }
            })
        }else if(typeof entry=='string'){
            chainConfig.entry('index').add(entry);
        }
            
        chainConfig.output
            .path(asbOutputPath)
            .filename('[name].js')
            .publicPath('/')
            .chunkFilename('[chunkhash].js').merge(options.output).end()
            .module
            .rule('js')
            .test(/\.(?:jsx?|tsx?)$/)
            .exclude
            .add(/node_modules/).end()
            .use("babel")
            .loader('babel-loader')
            .options({
                babelrc: false,
                configFile: false,
                presets:[[require.resolve('./babel-presets-dx'),babelOptions]]
            });

            chainConfig
            .resolve
            .extensions
            .add('.js').add('.jsx').add('.ts').add('.tsx').add('.json');
            
            chainConfig.plugin('progress').use(webpack.ProgressPlugin);
            chainConfig.plugin('clear').use(CleanWebpackPlugin,[{
                    // 模拟删除
                        // default: false
                        dry: false, 
                        //在重建时自动删除所有未使用的webpack资产 默认:true
                        cleanStaleWebpackAssets:true,
                        //  在Webpack编译之前删除一次文件
                        //    不包含在重建中（监视模式）
                        cleanOnceBeforeBuildPatterns:["**/*"]
            }]);
            options.html&&chainConfig.plugin('html').use(HtmlWebpackPlugin,[options.html])
            chainConfig.devServer
            .contentBase(asbOutputPath)
            .port(3000)
            .compress(true)
            //.color(true)
            .progress(true)
            .filename("index.html")
            .hot(true)
            if(serve){
                 if(chainConfig.devServer.get('progress')===true){
                    chainConfig.plugins.delete('progress');
                 }
                 if(options.open){
                     chainConfig.devServer.open(true);
                 }
           
            }
            return chainConfig;
   }