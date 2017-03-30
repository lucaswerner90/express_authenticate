const spawn = require('child_process').spawn;
const fs=require('fs');
const CONFIG=require('./config.json');
class Microservices {


  constructor() {

    console.log("***********   [MICROSERVICES] ****************");
    console.log("Inside the microservices...");
    console.log("**********************************************");
  }


  runAllServices(){
    const _self=this;
    const regular_expression=/.*_microservice(\.js)$/;
    let microservices_files=[];

    fs.readdir(CONFIG.main_conf.dir,(err,files)=>{
      microservices_files=files.filter(function(file){
        return regular_expression.test(file);
      });

      for (let i = 0; i < microservices_files.length; i++) {
        _self._startProcess(CONFIG.main_conf.dir+"/"+microservices_files[i]);
      }
    });
  }



  _startProcess(file){
    let bat = spawn('node',[file]);

    const _self=this;
    bat.stdout.on('data', (data) => {
      console.log(data.toString());
    });

    bat.stderr.on('data', (data) => {
      console.log(data.toString());
    });

    bat.once('exit', (code) => {
      if(code===1){
        bat.removeAllListeners();
        bat=null;
        _self._startProcess(file);
      }
    });
  }
}

module.exports=new Microservices();
