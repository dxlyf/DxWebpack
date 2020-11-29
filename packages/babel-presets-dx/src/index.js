
/**
 * 
 * Experimental(实验性)
    class-properties
    decorators
    do-expressions
    export-default-from
    export-namespace-from
    function-bind
    function-sent
    logical-assignment-operators
    nullish-coalescing-operator
    numeric-separator
    optional-chaining
    partial-application
    pipeline-operator
    private-methods
    throw-expressions
    private-property-in-object
 * 
 Minification（优化）

inline-consecutive-adds
inline-environment-variables
member-expression-literals
merge-sibling-variables
minify-booleans
minify-builtins
minify-constant-folding
minify-dead-code-elimination
minify-flip-comparisons
minify-guarded-expressions
minify-infinity
minify-mangle-names
minify-numeric-literals
minify-replace
minify-simplify
minify-type-constructors
node-env-inline
property-literals
regexp-constructors
remove-console
remove-debugger
remove-undefined
simplify-comparison-operators
undefined-to-void

React
react-constant-elements
react-display-name
react-inline-elements
react-jsx
react-jsx-compat
react-jsx-self
react-jsx-source

Other
external-helpers
flow-strip-types
jscript
object-assign
object-set-prototype-of-to-assign
proto-to-assign
regenerator
runtime
strict-mode
typescript
*/
module.exports=(api, opts, env)=>{
    const presets=opts.presets;
    const extraPresets=opts.extraPresets||[];

    const plugins=opts.plugins;
    const extraPlugins=opts.extraPlugins||[];

    const envOptions=opts.envOptions||{};
    const reactOptions=opts.reactOptions;
    const typescriptOptions=opts.typescriptOptions;
    return {
        presets:presets?presets:[[require('@babel/preset-env'),{    
            ...envOptions
        }],
        reactOptions&&[require('@babel/preset-react'),{  useBuiltIns: true,...reactOptions}],
        typescriptOptions&&[require('@babel/preset-typescript'),{isTSX:true,allExtensions:true,allowNamespaces:true,...typescriptOptions}],...extraPresets
        ].filter(Boolean),

        plugins:plugins?plugins:[
            // 宏
            [require('babel-plugin-macros')]
            [require('@babel/plugin-syntax-dynamic-import')],
            //装饰器
            [require('@babel/plugin-proposal-decorators'),{legacy:true}],
            //类属性
            [require('@babel/plugin-proposal-class-properties')],
            //私有方法
            [require('@babel/plugin-proposal-private-methods')],
            (typeof opts.runtime=='object'||opts.runtime==true)&&[require('@babel/plugin-transform-runtime'),opts.runtime],
            ...extraPlugins
        ].filter(Boolean)
    }
};