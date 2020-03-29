const webpack = require('webpack');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const fs = require('fs');
const path = require('path');
var argv = require('yargs-parser')(process.argv.slice(2))
const pkgPath = path.resolve(__dirname, '../packages');
const pkgs = fs.readdirSync(pkgPath);
//console.log(argv)
const pkgConfigs=[{
    filename:'[name].js',
    library:"[name]",
    devtool:"none",//"cheap-module-source-map",
    target:"web",//node
    libraryTarget:"umd",
    path:"dist"
},{
    filename:'[name].js',
    library:"myLibrary",
    devtool:"none",//"cheap-module-source-map",
    target:"node",//node
    libraryTarget:"commonjs2",//commonjs2
    path:"lib"
}];
const buildPkgs=['webpack'];
function getConfigs() {
    return pkgs.filter(name=>buildPkgs.includes(name)).reduce((a,name)=> {
        return a.concat(buildConfig(name));
    },[]);  
}

function build(){
    let configs=getConfigs();
    let compiler=webpack(configs);
    compiler.run(()=>{
        console.log('编译完成')
    })
}
function createComiler(config) {
    return ()=>{
        const compiler=webpack(config);
        return new Promise((resolve,reject)=>{
            compiler.run((err, stats) => {
                if (err || stats.hasErrors()) {
                    // 在这里处理错误
                    resolve();
                    return;
                }
                // 处理完成
                resolve();
            });
        })
    }
}

function buildConfig(name) {
    return pkgConfigs.map(d=>{
        return {
            mode:argv.mode=='dev'?"development":"production",//production,development,none
            context: path.join(pkgPath,name),
            entry: {
                [name]:`./src/index.ts`
            },
            devtool:d.devtool,
            resolve: {
                extensions: ['.tsx', '.ts', '.js']
            },
            output: {
                filename:d.filename,
                library:d.library,
                libraryTarget:d.libraryTarget,
                path: path.join(pkgPath,name, d.path)
            },
            target:d.target,
            plugins:[new CleanWebpackPlugin()]
        }
    })
}

build();