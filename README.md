# 代码工程化构建
* [leran](#leran包管理)
* [typescript](#typescript)
## leran包管理
* [add](#lerna-add)
* [clean](#lerna-clean)
* [bootstrap](#lerna-bootstrap)
* [create](#lerna-craete)
* [publish](#lerna-publish)
* [run](#lerna-run)
* [exec](#lerna-exec)

```bash
npx leran init --independent

```
### lerna create
```bash
# 根目录的package.json 
 "workspaces": [
    "packages/*",
    "packages/@gp0320/*"
  ],
  
# 创建一个包gpnote默认放在 workspaces[0]所指位置
lerna create gpnote 
A）提供--ignore-version-check标志或类似标志。
B）提供ignoreVersionCheck为lerna.json选项
# 创建一个包gpnote指定放在 packages/@gp0320文件夹下，注意必须在workspaces先写入packages/@gp0320，看上面
lerna create gpnote packages/@gp0320
## 命令
lerna create <name> [loc]
Create a new lerna-managed package

Positionals:
  name  The package name (including scope), which must be locally unique _and_
        publicly available                                   [string] [required]
  loc   A custom package location, defaulting to the first configured package
        location                                                        [string]

Command Options:
  --access        When using a scope, set publishConfig.access value
                             [choices: "public", "restricted"] [default: public]
  --bin           Package has an executable. Customize with --bin
                  <executableName>                             [default: <name>]
  --description   Package description                                   [string]
  --dependencies  A list of package dependencies                         [array]
  --es-module     Initialize a transpiled ES Module
  --homepage      The package homepage, defaulting to a subpath of the root
                  pkg.homepage                                          [string]
  --keywords      A list of package keywords                             [array]
  --license       The desired package license (SPDX identifier)   [default: ISC]
  --private       Make the new package private, never published
  --registry      Configure the package's publishConfig.registry        [string]
  --tag           Configure the package's publishConfig.tag             [string]
  --yes           Skip all prompts, accepting default values
```
### lerna add
`lerna add [@version] [--dev] [--exact]`

    增加本地或者远程package做为当前项目packages里面的依赖
    --dev devDependencies 替代 dependencies
    --exact 安装准确版本，就是安装的包版本前面不带^, Eg: "^2.20.0" ➜ "2.20.0"
>example:
```bash
npx lerna add gulp --scope=@dxyl/gulp --dev
# Adds the module-1 package to the packages in the 'prefix-' prefixed folders
lerna add module-1 packages/prefix-*

# Install module-1 to module-2
lerna add module-1 --scope=module-2

# Install module-1 to module-2 in devDependencies
lerna add module-1 --scope=module-2 --dev

# Install module-1 in all modules except module-1
lerna add module-1

# Install babel-core in all modules
lerna add babel-core
```
### lerna bootstrap
`lerna bootstrap`

    默认是npm i,因为我们指定过yarn，so,run yarn install,会把所有包的依赖安装到根node_modules.

`lerna list`

    列出所有的包，如果与你文夹里面的不符，进入那个包运行yarn init -y解决

`lerna link`项目包建立软链，类似npm link
### lerna clean
`lerna clean`删除所有包的node_modules目录
### lerna publish
`lerna publish`

    会打tag，上传git,上传npm。 如果你的包名是带scope的例如："name": "@gp0320/gpwebpack", 那需要在packages.json添加


  ## typescript
  安装
```bash
yarn add -D typescript ts-loader
npx tsc --init
```

### lerna run
在包含该脚本的每个软件包中运行一个npm脚本
```bash
$ lerna run <脚本> -[..args] ＃在所有有它的软件包中运行npm run my-script 
$ lerna run test
$ lerna运行版本

＃观看所有包并在更改时进行转换，流式输出前缀 
$ lerna run --parallel watch
```

### lerna exec
在每个包中执行任意命令
```bash
$ lerna exec --scope my-component -- ls -la
$ lerna exec -- <command> [..args] # runs the command in all packages
$ lerna exec -- rm -rf ./node_modules
$ lerna exec -- protractor conf.js
```
