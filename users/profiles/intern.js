"use strict";


const DBQueries=require('../../db/queries/user/intern.json');
const User=require('../_common/user');

class InternProfile extends User{
  constructor(id_usuario=-1){
    super(id_usuario,DBQueries);
  }
}





module.exports=InternProfile;
