module.exports=(api, opts, env)=>{
    const envOptions=opts.envOptions||{};
    const reactOptions=opts.reactOptions;
    const typescriptOptions=opts.typescriptOptions;
    return {
        presets:[[require('@babel/preset-env'),{
            ...envOptions
        }],
        reactOptions&&[require('@babel/preset-react'),{  useBuiltIns: true,...reactOptions}],
        typescriptOptions&&[require('@babel/preset-typescript'),{...typescriptOptions}],
        ].filter(Boolean),

        plugins:[
            //装饰器
            [require('@babel/plugin-proposal-decorators'),{legacy:true}],
            //类属性
            [require('@babel/plugin-proposal-class-properties'),{loose:true}],
            [require('@babel/plugin-proposal-private-methods'),{loose:true}]
        ]
    }
};