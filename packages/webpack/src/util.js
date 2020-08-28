const mergeWith = require('lodash.mergewith');

function mergeConfig(sourceConfig,newConfig){
    return mergeWith({},sourceConfig,newConfig,(objValue,srcValue,key,object,source)=>{
         if(Array.isArray(srcValue)){
             return srcValue;
         }
    })
}
module.exports={
    mergeConfig:mergeConfig
}