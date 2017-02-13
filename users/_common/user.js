"use strict";


const DB=require('../../db/coreFunctions');
const multiparty=require('multiparty');
const FILE_FUNCTIONS = require('../../files/fileFunctions');
const FILE_CONFIG= require('../../files/config.json');
const FTP= require('../../files/FTP');
const DBCommonQueries=require('../../db/queries/user/_common.json');
const DBCourseQueries=require('../../db/queries/course.json');


class User{


  constructor(id_usuario=-1,queries){
    this._id_usuario=id_usuario;
    this._profile_queries=queries;
    this._common_queries=DBCommonQueries;
  }

  _logOnDB(action){
    DB.recordOnLog(action,{
      id_usuario:this._id_usuario
    });
  }

  _get_type_of_user(){
    let _self=this;


    if(_self._id_usuario===-1) return "Administrador";

    return new Promise((resolve,reject)=>{
      _self.get_user_info().then((result)=>{
        DB.sendQuery(DBCommonQueries.GET.type_of_user,{
          id_perfil:result.id_perfil}
        ).then((data)=>{
          resolve(data[0].descripcion);
        })
        .catch((err)=>{
          reject(err);
        });
      })
      .catch((err)=>{
        reject(err);
      });
    });
  }

  download_zip(filename,response){
    FILE_FUNCTIONS.downloadFile(filename,response);
  }

  search_course(fields){

    return new Promise((resolve,reject)=>{
      DB.sendQuery(DBCommonQueries.GET.search,fields,true).then((data)=>{
        resolve(data);
      })
      .catch((err)=>{
        reject(err);
      });
    });
  }


  get_user_info(){

    let _self=this;
    return new Promise((resolve,reject)=>{
      DB.sendQuery(DBCommonQueries.GET.user_info,{id_usuario:_self._id_usuario}).then((data)=>{
        resolve(data[0]);
      })
      .catch((err)=>{
        reject(err);
      });
    });
  }



  get_contents(){
    let _self=this;
    return new Promise((resolve,reject)=>{
      _self.get_user_info().then((result)=>{

        DB.sendQuery(DBCommonQueries.GET.contents_proveedor,result).then((data)=>{

          let arrayPromises=[];
          for (let i = 0; i < data.length; i++) {
            arrayPromises[i]=DB.sendQuery(DBCourseQueries.GET.tableOfCompatibilities,data[i]);
          }

          Promise.all(arrayPromises).then((values)=>{
            for (let i = 0; i < data.length; i++) {
              data[i].compatibilities_table=values[i];
            }
            resolve(data);

          })
          .catch((err)=>{
            reject(err);
          });
        })
        .catch((err)=>{
          reject(err);
        });
      })
      .catch((err)=>{
        reject(err);
      });
    });


  }


  get_platform_generic_info(){
    const _self=this;
    return new Promise((resolve,reject)=>{
      DB.sendQuery(_self._common_queries.GET.generic_information,null).then((data)=>{
        resolve({
          platforms:data[0],
          evaluationSystems:data[1],
          contentTypes:data[2],
          states:data[3],
          tabla_compatibilidades:data[4],
          educationLevels:data[5],
          exploitedRights:data[6],
          tipoProveedores:data[7],
          proyectos:data[8],
          idiomas:data[9],
          puntos_control:data[10],
          valores_certificacion:data[11],
          tecnologias:data[12],
          tipo_desarrollo:data[13]
        });
      })
      .catch((err)=>{
        reject(err);
      });
    });
  }



  get_avatar(filename){
    return new Promise((resolve,reject)=>{
      FILE_FUNCTIONS.downloadImageInBase64(filename).then((data)=>{
        resolve(data);
      })
      .catch((err)=>{
        reject(err);
      });
    });

  }


  modify_avatar(request){
    let _self=this;
    let formData={};
    let form = new multiparty.Form();
    let fieldFile='';

    return new Promise((resolve,reject)=>{

      form.once("error",(err)=>{
        reject(err);
      });
      form.once("field",(name,value)=>{
        formData[name]=value;
      });

      form.once("file",(name,file)=>{
        fieldFile=name;
        formData[fieldFile]=file;
      });

      form.once("close",()=>{



        FILE_FUNCTIONS.uploadContentFile(formData[fieldFile],formData,FILE_CONFIG.avatarUpload.directory,FILE_CONFIG.avatarUpload.extensionsAllowed,true);
        DB.sendQuery(_self._common_queries.UPDATE.avatar,formData).then(()=>{

          _self._id_usuario=formData.id_usuario;
          this._logOnDB("user.modify_avatar");
          form.removeAllListeners();

          resolve(true);
        })
        .catch((err)=>{
          reject(err);
        });
      });

      form.parse(request);
    });
  }

  modify_personal_info(request){
    const _self=this;

    return new Promise((resolve,reject)=>{
      DB.sendQuery(_self._common_queries.UPDATE.personalInfo,request.body).then(()=>{

        this._logOnDB("user.modify_info");

        resolve(true);
      })
      .catch((err)=>{
        reject(err);
      });
    });
  }


  modify_password(fields){

    const _self=this;

    return new Promise((resolve,reject)=>{
      DB.sendQuery(_self._common_queries.UPDATE.password,fields).then(()=>{

        this._logOnDB("user.modify_password");
        resolve(true);
      })
      .catch((err)=>{
        reject(err);
      });
    });
  }


  create_course(request){

    const _self=this;

    return new Promise((resolve,reject)=>{

      debugger;
      let form = new multiparty.Form();
      let formFields={};


      function clear(){
        form.removeAllListeners();
        form=null;
        formFields=null;
      }


      form.once("error",(err)=>{
        console.log("Error on parse form...");
        clear();
        reject({error:err});
      });

      // Once the form is parsed, we call the "close" function to send back the response
      form.once("close",()=>{

        _self._id_usuario=formFields.id_usuario;

        formFields["multiple_insert_query"]=eval("["+ formFields.tableTechnologies +"]");
        FILE_FUNCTIONS.uploadContentFile(formFields['file_to_upload'],formFields,FILE_CONFIG.fileUpload.directory,FILE_CONFIG.fileUpload.extensionsAllowed).then(()=>{


          FILE_FUNCTIONS.insertNewContentToDB(form,formFields,_self._profile_queries).then(()=>{


            FTP.extractZIP(formFields['file_to_upload'],formFields['ruta_zip']).then(()=>{
              console.log("ZIP EXTRACTED CORRECTLY....");
              DB.recordOnLog("course.upload",{
                id_usuario:_self._id_usuario,
                id_contenido:formFields.id_contenido
              });
              clear();
            })
            .catch((err)=>{
              console.error("*****  ERROR EXTRACTING ZIP  *****");
              console.error(err);
            });

            resolve(true);

          })
          .catch((err)=>{
            reject({error:err});
          });
        })
        .catch((err)=>{
          reject({error:err});
        });

      });

      form.on("file",(name,file)=>{
        if(name==='screenshot'){
          formFields['screenshot']=file;
        }else{
          formFields['file_to_upload']=file;
        }

      });

      form.on("field",(name,value)=>{
        formFields[name]=value;
      });


      form.parse(request);


    });
  }


}



module.exports=User;
