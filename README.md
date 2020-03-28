# 代码工程化构建
leran包管理
```bash
npx leran init --independent

```
```bash
# 根目录的package.json 
 "workspaces": [
    "packages/*",
    "packages/@gp0320/*"
  ],
  
# 创建一个包gpnote默认放在 workspaces[0]所指位置
lerna create gpnote 

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
`lerna add [@version] [--dev] [--exact]`

    增加本地或者远程package做为当前项目packages里面的依赖
    --dev devDependencies 替代 dependencies
    --exact 安装准确版本，就是安装的包版本前面不带^, Eg: "^2.20.0" ➜ "2.20.0"
>example:
```bash
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

`lerna bootstrap`

    默认是npm i,因为我们指定过yarn，so,run yarn install,会把所有包的依赖安装到根node_modules.

`lerna list`

    列出所有的包，如果与你文夹里面的不符，进入那个包运行yarn init -y解决

`lerna link`项目包建立软链，类似npm link

`lerna clean`删除所有包的node_modules目录

`lerna publish`

    会打tag，上传git,上传npm。 如果你的包名是带scope的例如："name": "@gp0320/gpwebpack", 那需要在packages.json添加