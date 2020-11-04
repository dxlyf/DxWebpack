const glob = require('glob')
const path=require('path')
const { createMacro } = require('babel-plugin-macros');
let uid=0;
export class PluginManager {
    constructor(plugins) {
        this.plugins = new Map(plugins||[])
    }
    add(name, plugin, opts) {
        this.plugins.set(name, {
            name: name,
            fn: plugin,
            opts: opts
        })
    }
    get(name) {
        if (this.plugins.has(name)) {
            return this.plugins.get(name)
        }
    }
    apply(name, ...args) {
        let plugin = this.get(name)
        if (plugin) {
            plugin.fn.apply(plugin, args)
        }
    }
}
export const macroPlugin = new PluginManager()

export const createMacroHandle=(macroPlugin)=>{
        return createMacro(({ references, state, babel }) => {
            Object.keys(references).forEach((name) => {
                const paths = references[name]
                paths.forEach(path => {
                    let { name, node } = getCallExpression(path)
                    macroPlugin.apply(name, node, babel, state, babel)
                })
            })
        
        })
}
export function getCallExpression(path) {
    let currentPath = path.find(d => {
        return d.isCallExpression();
    })
    let callFn = currentPath.get('callee')
    let name
    if (callFn.isIdentifier()) {
        name = callFn.node.name
    } else if (callFn.isMemberExpression()) {
        name = callFn.node.property.name
    }
    return {
        name: name,
        node: currentPath
    }
}
export function convertToJsObject(nodePath) {
    try {
        let source=''
        if (nodePath.type === 'Identifier') {
            let initValue = nodePath.scope.getBinding(nodePath.node.name).path.get('init')
            source=initValue.getSource()
        }else{
            source=nodePath.getSource()
        }
        let resultFn = new Function(`return ${source}`)
        return resultFn()
    } catch (e) {

    }
}
macroPlugin.add('requireProperties', (currentPath, babel, state) => {
    const t = babel.types
    let arg0 = currentPath.get('arguments.0');
    let arg1 =convertToJsObject(currentPath.get('arguments.1'));
    let array;
    if (arg0.type === 'ArrayExpression') {
        array = arg0.node
    } else if (arg0.type === 'Identifier') {
        let initValue = arg0.scope.getBinding(arg0.node.name).path.get('init')
        array = t.cloneDeep(initValue.node)
    }
    if (!array) {
        return;
    }
    t.traverse(array, {
        enter(path, parents) {
            if (path.type == "Identifier" && arg1.includes(path.name)) {
                let parent = parents[parents.length - 1].node
                parent.value = t.callExpression(t.identifier('require'), [t.stringLiteral(parent.value.value)])
            }
        }
    })
    currentPath.replaceWith(array)
})
macroPlugin.add('evalCode', (currentPath, babel, state) => {
    const t = babel.types
    const args = currentPath.get('arguments').map(convertToJsObject)
    const opts = args[1] || { sourceString: true }
    const result = eval(args[0]);
    if (opts.sourceString) {
        currentPath.replaceWithSourceString(result)
    } else {
        currentPath.replaceWith(t.valueToNode(result))
    }
})
macroPlugin.add('glob', (currentPath, babel, state) => {
    const t = babel.types
    const args = currentPath.get('arguments').map(convertToJsObject)
    const files = glob.sync(...args)
    currentPath.replaceWith(t.valueToNode(files))
})
macroPlugin.add('requireGlob', (currentPath, babel, state) => {
    const t = babel.types
    const args = currentPath.get('arguments').map(convertToJsObject)
    const files = glob.sync(args[0],{
        cwd:path.dirname(state.filename),
    })
   let arrs=[]
   files.forEach(file=>{
       let requirePath=file
      // let  requirePath=path.relative(state.filename,path.resolve(state.filename,file)).replace(/\\/g,'/')
        arrs.push(t.objectExpression([
            t.ObjectProperty(t.stringLiteral('file'),t.stringLiteral(file)),
            t.ObjectProperty(t.stringLiteral('ref'),t.callExpression(t.identifier('require'), [t.stringLiteral(requirePath)]))
        ]))
   }) 
   currentPath.replaceWith(t.arrayExpression(arrs))
})
macroPlugin.add('importGlob', (currentPath, babel, state) => {
    const t = babel.types
    const args = currentPath.get('arguments').map(convertToJsObject)
    const files = glob.sync(...args)
   // add import
   let program=currentPath.findParent(d=>d.isProgram())
   let arrs=[]
   files.forEach(file=>{
        let importName='importComponent'+(uid++)
        arrs.push(t.objectExpression([
            t.ObjectProperty(t.stringLiteral('file'),t.stringLiteral(file)),
            t.ObjectProperty(t.stringLiteral('ref'),t.identifier(importName))
        ]))
        program.node.body.unshift(t.importDeclaration([t.importDefaultSpecifier(t.identifier(importName))],t.stringLiteral(file)))
   }) 
   currentPath.replaceWith(t.arrayExpression(arrs))
})
