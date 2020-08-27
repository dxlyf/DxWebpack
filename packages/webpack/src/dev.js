const webpack=require('webpack');
const webpackDevServer=require('webpack-dev-server')
const config=require('../config/webpack.config')({},{progress:true});


let devServer=webpackDevServer(compiler,config.devServer)
