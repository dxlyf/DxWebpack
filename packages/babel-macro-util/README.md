有些代码不适合在运行时计算，在编译时运算会更安全。而且还可以结合nodejs端做更强的代码整合。
之前有在webpack通过自定义loader去导出编译后的代码。但那种无法传递结构化的参数。只能通过url形式

## 使用
该库基于babel-plugin-macros
create-react-app脚手架生成的项目自带引用了babel-plugin-macros
```js
// 用法
import {mul} from 'babel-macro-util/lib/util.macro'
let value=12;
let a=mul(2,value)
//解析后
let value=12;
let a=24

```
其它构建工具用到babel时，在babel配置项中添加`babel-plugin-macros`即可
.babelrc
```json
{
  "plugins":["babel-plugin-macros"]
}
```
## 自定义宏文件
`cust.macro.js`
```js
  import {createMacroHandle,PluginManager,macroPlugin,convertToJsObject} from 'babel-macro-util'

  let custMacroPlugin=new PluginManager(macroPlugin.plugins)//继承
  custMacroPlugin.add('mul',(currentPath, babel, state) => {
      const t = babel.types
      const args = currentPath.get('arguments').map(convertToJsObject)

    currentPath.replaceWith(t.valueToNode(args[0]*args[1]))
  }))
  export default createMacroHandle(custMacroPlugin)
util
```
## 自定义添加方法
```js
import {macroPlugin,convertToJsObject} from 'babel-macro-util'

macroPlugin.add('mul',(currentPath, babel, state) => {
    const t = babel.types
    const args = currentPath.get('arguments').map(convertToJsObject)

   currentPath.replaceWith(t.valueToNode(args[0]*args[1]))
}))

```
## 匹配模式加载模块

```js
import {configureStore} from '@reduxjs/toolkit'
import { requireGlob } from '../utils/util.macro'

let reducers=requireGlob('./reducers/**/*.js');
reducers=reducers.reduce((memo,reducers)=>{
     reducers=reducers.ref['default']
     return {
         ...memo,
        ...reducers
     }
},{})

let sliceReducers=requireGlob('./slices/**/*.js');
sliceReducers=sliceReducers.reduce((memo,slice)=>{
     slice=slice.ref['default']
     return {
         ...memo,
        [slice.name]:slice.reducer
     }
},{})

const store= configureStore ({
    reducer:{
        ...reducers,
        ...sliceReducers
    }
})
export default store
```
## requireProperties 加载模块
```js 

const config = [{
  path: "/",
  component: "src/layouts/BasicLayout",
  routes: [{
    path: "/",
    redirect: "/home",
  }, {
    path: "/home",
    component: "src/App"
  }]
}]
const routes = requireProperties(config,['component'])
// 编译后
const config = [{
  path: "/",
  component: "src/layouts/BasicLayout",
  routes: [{
    path: "/",
    redirect: "/home",
  }, {
    path: "/home",
    component: "src/App"
  }]
}]
const routes = [{
  path: "/",
  component: require("src/layouts/BasicLayout"),
  routes: [{
    path: "/",
    redirect: "/home",
  }, {
    path: "/home",
    component: require("src/App")
  }]
}]

```
## evalCode
```js
const files=evalCode(`
  const fs=require('fs)
  module.exports=fs.readdirSync('./src')
`,{sourceString:false})
```
`sourceString:true`
```js
const routes=evalCode(`
  let routes=[{
    path:"/",
    component:"src/layouts/BasicLayout",
    routes:[{
        path:"/",
        component:"src/layouts/BasicLayout",
    }]
  }]  
  module.exports=JSON.stringify(routes,(key,value)=>{
    if(key==='component'&&typeof value ==='string'){
        return 'require(\\''+value+'\\')'
    }
    return value
},2).replace(/"component":\\s*"require\\((.*?)\\)"/g,'"component":require($1)')
`,{sourceString:true})
```

## evalCode
```js
const files=evalCode(`
  const fs=require('fs)
  module.exports=fs.readdirSync('./src')
`,{sourceString:false})
```
`sourceString:true`
```js
const routes=evalCode(`
  let routes=[{
    path:"/",
    component:"src/layouts/BasicLayout",
    routes:[{
        path:"/",
        component:"src/layouts/BasicLayout",
    }]
  }]  
  module.exports=JSON.stringify(routes,(key,value)=>{
    if(key==='component'&&typeof value ==='string'){
        return 'require(\\''+value+'\\')'
    }
    return value
},2).replace(/"component":\\s*"require\\((.*?)\\)"/g,'"component":require($1)')
`,{sourceString:true})
```