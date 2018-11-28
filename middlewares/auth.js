'use strict'

const jwt = require('jwt-simple');
const moment = require('moment');
const config = require('../config');


exports.ensureAuth = function(req,res,next){
   if(!req.headers.authorization) return res.status(403).send({message: 'La petición no tiene cabecera de autenticación'});

   let token = req.headers.authorization.replace(/['"]+/g, '');
   let payload;
   try{
      payload = jwt.decode(token, config.SECRET_TOKEN);
      if (payload.exp <= moment().unix()) return res.status(401). send({message: 'El token ha expirado'});

   }catch(ex){
      return res.status(404).send({message: 'El token no es válido. '+ex});
   }
   req.user = payload;
   // console.log('Token válido. Acceso permitido');
   // console.log(req.user);
   
   next();
}