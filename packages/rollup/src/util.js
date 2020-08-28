const mergeWith = require('lodash.mergewith');
function isObject(value){
    return typeof value=='object'&&!Array.isArray(value)
}
function isArray(value){
    return Array.isArray(value);
}
function getType(value){
    return Object.prototype.toString.call(value);
}
function mergeOutput(target,source){
    if(isArray(source)&&!isArray(target)){
        return source.map(output=>{                  
            return mergeOutput(target||{},output);
        })
    }
     return mergeWith({},target||{},source,(objValue,srcValue,key,object,source,stack)=>{
         if(stack.size==0&&key=='plugins'){
            let plugins=[];
            if(objValue){
                plugins=plugins.concat(objValue)
            }
            return plugins.concat(srcValue);
         }
     })
}   
function mergeConfig(sourceConfig,newConfig){
    var nameStack=[];
    return mergeWith({},sourceConfig,newConfig,(objValue,srcValue,key,object,source,stack)=>{
         if(key=='output'&&stack.size==0&&srcValue){
            return mergeOutput(objValue,srcValue);
         }
         if(Array.isArray(srcValue)){
             return srcValue;
         }
    })
}
module.exports={
    mergeOutput:mergeOutput,
    mergeConfig:mergeConfig
}