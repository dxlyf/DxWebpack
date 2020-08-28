import path from 'path';
export default {
    entry:"./examples/index.js",
    babelOptions:{
        reactOptions:{},
        typescriptOptions:{}
    },
    html:{
        title:"dx-webpack",
        template:path.resolve(__dirname,'index.html')
    }
}