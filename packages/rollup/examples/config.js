import path from 'path';
import React from 'react';
console.log(React)
export default {
    rollupConfig:{
        //preserveModules:true,
       // shimMissingExports:true,
        input:{
            'index':"./examples/index.ts"
        },
        external:['react'],
        output:{
            esModule:true,
            format:"umd", //"amd", "cjs", "system", "es", "iife" or "umd".
            name:"Dx",
            //exports: 'named',
        },
      //  manualChunks:id=>path.parse(id).name
  
    },
    alias:{
        //"react":require('react')
    },
    commonjs:{
        include:["node_module/**"],
    },
    babelOptions:{
        envOptions:{
         //   "useBuiltIns": "usage",
           // "corejs": "3.3.3",
            modules:false
           //exclude: ["*node_modules/**"]
        },
        reactOptions:{},
        typescriptOptions:{}
    },
    babel:{
        
    },
    postcss:false
}