const {series,parallel,task,src,dest,lastRun}=require('gulp');
const rename = require("gulp-rename");
const clean = require("gulp-clean");
const gulpif = require('gulp-if');
const concat = require('gulp-concat');
const commander=require('commander');
const chalk=require('chalk');


let testTask=(...args)=>{
    console.log('testTask',args)
    return Promise.resolve('testTask')
}
let testTask2=(...args)=>{
    console.log('testTask2',args)
    return new Promise((resolve)=>{
        setTimeout(() => {
            resolve('testTask2')
        }, 3000);
    })
}
let testTask3=(...args)=>{
    console.log('testTask3',args)
    return new Promise((resolve)=>{
        setTimeout(() => {
            resolve('testTask3')
        }, 3000);
    })
}
let testTask4=(...args)=>{
    console.log('testTask4',args)
    return Promise.resolve('testTask4')
}
task('task',testTask)
task('task2',testTask2)
task('task3',testTask3)
task('task4',testTask4)



let createGulpTask=(opts)=>{
    
    let cleanTask=()=>{
        if(opts.clean){
            return src(opts.clean).pipe(clean);
        }
        return Promise.resolve();
    } 
    let defaultTask=()=>{
        return src(opts.src,opts.srcOptions)
        .pipe(gulpif(!!opts.concat,concat(opts.concat||'all.js')))
        .pipe(dest(opts.dest,opts.destOptions))
    }
    return series(cleanTask,defaultTask)
}

commander.usage('使用gulp任务服务')
.option('-c,--clean [clean]','清除')
.option('--concat [concat]]','合并')
.option('--src-options [srcOptions]','src选项',(value,prev)=>{
    var attr=value.split('=');
    prev[attr[0]]=attr[1];
    return prev;
},{})
.option('-o,--dest <dest>','输出目录','./dist')
.option('--dest-options [destOptions]','dest选项',(value,prev)=>{
    var attr=value.split('=');
    prev[attr[0]]=attr[1];
    return prev;
},{})

commander.command('run <task>')
.option('-c,--config [configFile]','配置文件')
.action((taskName,command)=>{
    let userConfig={};
    let opts=command.opts();
    if(opts.config){
        let configPath=path.resolve(process.cwd(),opts.config);
         try{
                    let modulePath=require.resolve(configPath);
                    userConfig=require(modulePath).default||require(modulePath);
         }catch(e){
                console.log(chalk.red('异常',e))
         }
    }
    let tasks=Object.keys((name)=>{
        return name;
    })
    tasks.forEach(name=>{
        if(typeof userConfig[name]=='function'){
            task(name,userConfig[name])
        }
    })
    if(tasks.includes(taskName)){
        series(taskName)();
    }
})

commander
.command('test <src...>')
.action((srcPatter)=>{
         // series(testTask,parallel(testTask2,testTask3),testTask4)
         series('task',parallel(testTask2,testTask3),testTask4)((error,result)=>{
            console.log('完成',result)
         })
       //console.log(lastRun('task'))
});

commander
.command('build <src...>')
.action((srcPatter)=>{
    let opts=commander.opts();
    console.log(opts)
    let runTask=createGulpTask({src:srcPatter,...opts});
    runTask((error)=>{
         if(error){
             console.log(chalk.red('运行失败'))
         }else{
             console.log(chalk.green('运行成功'))
         }
    });
});

commander.parse(process.argv);