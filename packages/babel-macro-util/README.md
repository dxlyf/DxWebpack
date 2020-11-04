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
## 场景
`index.js`
```js
import store from './store'
ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App></App>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
```
`slices/global.js`
```js

export default {
    name:"global",
    initialState:{
        theme:"default2",
        count:0
    },
    reducers:{
        setTheme(state,action){
            state.theme=action.payload
        },
        setCount(state,action){
            state.count+=action.payload
        }
    },
    asyncReducers:{
        async addCount(action,thunkAPI){
                await new Promise(resolve=>{
                    setTimeout(resolve,2000)
                })
                thunkAPI.dispatch({
                    type:"global/setCount",
                    payload:action.payload*10
                })
        }
    },
    extraReducers: builder => {
    
    }

}
```
`store.js`
```js
import {configureStore,createAsyncThunk,createSlice,getDefaultMiddleware} from '@reduxjs/toolkit'
import { requireGlob } from '../utils/util.macro'
const allSlices=requireGlob('./slices/*.js');

let createStoreFactory=(slices)=>{
    let stores={}
    let reducers={}
    let asyncReducer=new Map()
    let middlewares=[]
    let asyncMiddleWare=({getState,dispatch})=>next=>action=>{
        let type=action.type
        if(asyncReducer.has(type)){
           let fn=asyncReducer.get(type).fn
           return dispatch(fn(action))
        }else{
           return next(action)
        }
    }
    function create(sliceConfig){
            let sliceStore=createSlice(sliceConfig)
            if(sliceConfig.asyncReducers){
               Object.keys(sliceConfig.asyncReducers).forEach(name=>{
                    let type=sliceStore.name+'/'+name
                    asyncReducer.set(type,{
                        namspace:sliceStore.name,
                        name:name,
                        type:type,
                        fn:((oldFn)=>{
                            let ops={}
                            if(Array.isArray(oldFn)){
                                ops=oldFn[1]
                                oldFn=oldFn[0]                            
                            }
                            let asyncFn=createAsyncThunk(type,async (action,thunkApi)=>{
                                let result=await oldFn(action,thunkApi)
                                return result
                            },ops)
                            return (action)=>{
                                let asyncDispatch=asyncFn(action)
                                return  (dispatch,getState)=>{
                                     let promise=asyncDispatch(dispatch,getState)                                   
                                     let p=Promise.resolve(promise).then((result)=>{
                                         if(asyncFn.fulfilled.type===result.type){
                                             return result.payload
                                         }else if(asyncFn.rejected.type==result.type){
                                             return Promise.reject(result)
                                         }else{
                                             return Promise.reject(result)
                                         }
                                     })
                                     Object.assign(p,promise)
                                     return p;
                                }
                            }
                        })(sliceConfig.asyncReducers[name])
                    })
               })
            }
            reducers[sliceStore.name]=sliceStore.reducer
            stores[sliceStore.name]=sliceStore
            return sliceStore
    }
    function addMiddlewares(...fns){
        middlewares.push(...fns)
    }
    slices.forEach(create)
    addMiddlewares(...getDefaultMiddleware())
    addMiddlewares(asyncMiddleWare)
    return {
        stores,
        reducers,
        create,
        addMiddlewares,
        middlewares:middlewares,
        createStore(options={}){
            return configureStore ({
                middleware:middlewares,
                reducer:reducers,
                ...options
            })
        }
    }
}
export default createStoreFactory(allSlices.map(slice=>slice.ref['default'])).createStore()
```
`app.js`
```js
import React from 'react';
import {useSelector,useDispatch} from 'react-redux'
import './App.css';
function UpdateTheme(){
    const dispatch=useDispatch()
    const onChange=(e)=>{
        dispatch({
          type:"global/setTheme",
          payload:e.target.value
        })
    }
    const onAdd=()=>{
       dispatch({
         type:"global/addCount",
         payload:10
       }).then((result)=>{
          console.log('result',result)
       })
    }
    return <div><button onClick={onAdd}>add</button><input onChange={onChange}/></div>
}
function App() {
  let global=useSelector(state=>state.global)
  return (
    <div className="App">
      theme2:{global.theme}{global.count}
      <UpdateTheme></UpdateTheme>
    </div>
  );
}

export default App;

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