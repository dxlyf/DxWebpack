const { createMacro } = require('babel-plugin-macros');
const {getCallExpression,macroPlugin}=require('./index')
module.exports = createMacro(({ references, state, babel }) => {
    Object.keys(references).forEach((name) => {
        const paths = references[name]
        paths.forEach(path => {
            let { name, node } = getCallExpression(path)
            macroPlugin.apply(name, node, babel, state, babel)
        })
    })

})