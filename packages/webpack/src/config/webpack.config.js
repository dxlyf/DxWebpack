const path=require('path');
const createConfig=require('./webpack.base');

module.exports=(env=process.env,argv={})=>{
    let config=createConfig({});

    return config.toConfig();
}