// middleware.js

var jwt=require('jwt-simple');
var moment=require('moment');
var config=require('./config');

/*

  En este fichero lo que se hace es detectar si el usuario está logueado:

  -Si esta logueado se pasa directamente a la siguiente funcion que maneja el server
  -Si no está logueado se manda una respuesta al servidor informandop de que no está logueado y se corta la pila de llamadas

*/




exports.ensureAuthenticated=function(req,res,next){

  if(req.originalUrl.indexOf("/download/filepath=")==-1){
    if(!req.headers.authorization){

      return res
        .status(200)
        .send(
          {
            status:false,
            message:"Your request has not authorization header"
          }
        );
    }

    var token = req.headers.authorization.split(" ")[1];
    var payload=jwt.decode(token,config.TOKEN_SECRET,config.SECURITY_ALGORITHM);

    if(payload.exp<=moment().unix()){
      return res
        .status(401)
        .send(
          {
            status:false,
            message:"Token has expired"
          }
        );
    }

    req.user=payload.sub;


  }

  //Si se da el caso de que el usuario está logueado correctamente entonces avanzamos al siguiente manejador de ruta
  next();
};
