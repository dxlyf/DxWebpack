
const execa=require('execa');
const {fork,exec,execFile,spawn}=require('child_process');
// const spawn = require('cross-spawn');
 
// const child = spawn('node', ['list', '-g', '-depth', '0'], { stdio: 'inherit' });

 function runExecaTask(args){
    try{
        const subprocess = execa.node(require.resolve('./cli.js'),args,{});
        subprocess.stdout.pipe(process.stdout);
        subprocess.on('message',(data)=>{
            if(data.type=='RESTART'){
                subprocess.kill();
                runExecaTask(args);
            }else if(data.type="START"){

            }   

        })
    }catch(error){
        console.log(error)
    }
}
function run(args){
    let child=fork(require.resolve('./cli.js'),args,{
        cwd:process.cwd(),
        stdio:"inherit"
    })
    child.on('message',(data)=>{
        if(data.type=='RESTART'){
            child.kill();
            run(args);
        }
    })
}
runExecaTask(process.argv.slice(2));