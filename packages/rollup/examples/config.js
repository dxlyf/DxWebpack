
export default {
    rollupConfig:{
        input:{
            'index':"./examples/index.ts"
        },
        external:['react'],
        output:{
            format:"umd",
            name:"Dx"
        },
  
    },
    commonjs:{
        include:"node_module/react/**"
    },
    babelOptions:{
        envOptions:{
           // modules:"umd"
        },
        reactOptions:{},
        typescriptOptions:{}
    },
    babel:{
        
    }
}