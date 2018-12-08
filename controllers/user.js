'use strict'
const User = require('../models/user');
const bcrypt = require('bcrypt');
const JwtService = require('../services/jwt');
const fs = require('fs');
const path = require('path');
const Follow = require('../models/follow');
const Publication = require('../models/publication');
require('mongoose-pagination');

const userController ={
   prueba: function(req,res){
      res.status(200).send({message: 'Mensaje desde el metodo prueba de users'})
   },
   saveUser: function(req,res){
      let params = req.body;
      let user = new User(); 
      if (params.name && params.surname && params.nick &&
         params.email && params.password){
            user.name = params.name;
            user.surname = params.surname;
            user.nick = params.nick.toLowerCase();
            user.email = params.email.toLowerCase();
            user.role = params.role || 'Standard'
            user.image = params.image || 'No image selected'   

            bcrypt.hash(params.password, 10, (err, hash)=>{
               if (err) throw err;
               user.password=hash;

               user.save((err, savedUser)=>{
                  if (err) return res.status(500).send({message: 'El Usuario no se ha podido registrar. Error: '+err});
                  if (!savedUser) return res.status(404).send({message: 'No se ha registrado el usuario'})
                  res.status(200).send({message: 'Usuario guardado correctamente', user: savedUser});
               })
            })

      }else{
         return res.status(200).send({message: 'Envía todos los campos necesarios'});
      }
   },
   login: function(req,res){
      let params = req.body;
      User.findOne({$or:[{email: params.email},{nick: params.nick}]}, (err, user)=>{
         if (err) throw err;
         if (!user) return res.status(404).send({message: `El usuario no existe`});
         bcrypt.compare(params.password, user.password, (err, check)=>{
            if (err) throw err;
            if (check==false) return res.status(401).send({message: 'La contraseña no es válida'});
            user.password = undefined;
            if (params.getToken) return res.status(200).send({message: 'Usuario logueado correctamente.', user: user, token: JwtService.createToken(user)});
            res.status(200).send({message: 'Usuario logueado correctamente.', user: user});
         })
      })
   },
   getUser: function (req,res){
      let userId;
      if (req.params.id) {
         userId = req.params.id;
      } else {
         if (req.user.sub){
            userId = req.user.sub;
         } else {
            return res.status(404).send({message: 'No existe el ususario'});
         }         
      }
      User.findById(userId, (err, user)=>{
         if (err) return res.status(404).send({message: err});
         if (!user) return res.status(404).send({message: 'El usuario no existe en la BBDD'});
         user.password=undefined;
         user.role=undefined;
         follows(req.user.sub, userId).then(data=>{
            return res.status(200).send({
            user, 
            following: data.following,
            followed: data.followed});
         });
      });
   },
   getUsers: function (req, res){
      let page = 1;
      let itemsPerPage = 5;
      let userId = req.user.sub;

      if (req.params.page) page=req.params.page;

      User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total)=>{
         if (err) throw err;
         if (!users) return res.status(404).send({message: 'No hay usuarios disponibles'});
         
         followUserId(userId).then(data=>{
            res.status(200).send({
               users,
               users_following: data.following,
               users_follow_me: data.followed,
               total,
               totalPages: Math.ceil(total/itemsPerPage)
            })
         })
         
      })
   },
   getAllUsers: function (req, res){
      let userId = req.user.sub;

      User.find({},{password:0, role:0}).sort('nick').exec((err, users) => {
         if (err) throw err;
         if (!users) return res.status(404).send({message: 'No hay usuarios disponibles'});         
         
         res.status(200).send({
            users
         })
      })      
   },
   updateUser: function(req, res){
      let userId = req.params.id;
      let update = req.body;

      delete update.password;

      if (userId != req.user.sub) return res.status(500).send({message: 'No tienes permiso para actualizar datos de otros usuarios'});

      User.findByIdAndUpdate(userId, update, {new: true}, (err, updatedUser)=>{
         if (err) return res.status(500).send({message: 'Es posible que el nick o el e-mail estén en uso: '+err});
         if (!updatedUser) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});
         updatedUser.password = undefined;
         updatedUser.role = undefined;
         res.status(200).send({message: 'Usuario actualizado correctamente', user: updatedUser});
      })
   },
   uploadImage: function(req,res){
      let userId = req.params.id;
      if (userId != req.user.sub){
         removeFiles(filePath);
         return res.status(500).send({message: 'No tienes permiso para actualizar datos de otros usuarios'});}
      if (!req.files.image) return res.status(200).send({message: 'No se han adjuntado archivos para subir'});      
      
      let filePath = req.files.image.path;
      let fileName = filePath.split('\\').pop();
      let ext = fileName.split('.').pop();
      
      if (ext!='png' && ext!='jpg' && ext!='jpeg' && ext!='gif'){
         removeFiles(filePath);
         return res.status(200).send({message: 'Archivo de imágen no válido'});
      }
      User.findById(userId, (err, user)=>{
         if (err) res.status(400).send({message: 'Usuario para borrar imagen no encontrado'});
         let oldImage = './uploads/users/'+user.image;
         removeFiles(oldImage);
      }) 
      User.findByIdAndUpdate(userId, {image: fileName}, {new:true}, (err, updatedUser)=>{
         if (err) return res.status(500).send({mesage: 'Error actualizando imagen'});
         if (!updatedUser) return res.status(404).send({message: 'No se ha podido actualizar la imagen del usuario'});
         res.status(200).send({message: `Archivo de imágen subido correctamente (${fileName})`})
      })      
   },
   getImage: function(req,res){
      let imageFile = req.params.imageFile;
      let filePath = './uploads/users/'+imageFile;

      fs.exists(filePath, (exists)=>{
         if (exists) return res.sendFile(path.resolve(filePath));
         res.status(404).send({message: 'No hay imagen para mostrar'})
      })
   },
   getCounters: function(req,res){
      if (req.params.id){
         getCountFollows(req.params.id).then(data=>{
            return res.status(200).send(data)
         });
      }else{
         getCountFollows(req.user.sub).then(data=>{
            return res.status(200).send(data)
         });
      }
   }
}

function removeFiles(filePath){
   fs.exists(filePath, (exists)=>{
      if (!exists) {
         return ({message: 'La imagen a borrar no existe'})
      }else{
         fs.unlink(filePath, (err)=>{
            if (err) throw err;
            return ({message: `Imagen (${filePath}) borrada con éxito`})
         })
      }
   })
}

async function follows(firstUserId, secondUserId){
   let following = await Follow.findOne({user: secondUserId, followed: firstUserId}, (err, follow)=>{
      if (err) throw err;
      return follow;
   });

   let followed = await Follow.findOne({user: firstUserId, followed: secondUserId}, (err, follow)=>{
      if (err) throw err;
      return follow;            
   });
   return {
      following: following,
      followed: followed
   }
}

async function followUserId (userId){
   //Usuarios que sigo
   let following = await Follow.find({followed: userId},((err,follows)=>{      
      if (err) throw err;      
      return follows;
   })).select({_id:0, __v:0, followed:0});

   //Usuarios que me siguen
   let followed = await Follow.find({user: userId},((err,follows)=>{
      if (err) throw err;
      return follows;
   })).select({_id:0, __v:0, user:0});

   //Procesar array de Ids de usuarios que sigo
   let following_clean =[];      
   following.forEach((follow)=>{
      following_clean.push(follow.user);
   });

   //Procesar array de Ids de usuarios que me siguen
   let followed_clean =[];      
   followed.forEach((follow)=>{
      followed_clean.push(follow.followed);
   });

   return {
      following: following_clean,
      followed: followed_clean
   }
}

async function getCountFollows(userId){
   let followed = await Follow.countDocuments({user: userId},(err,count)=>{
      if (err) console.log(err);
      return count;
   });
   let following = await Follow.countDocuments({followed: userId},(err,count)=>{
      if (err) console.log(err);
      return count;
   });
   let pubs = await Publication.countDocuments({user: userId}, (err, count)=>{
      if (err) console.log(err);
      return count;
   })
   return {
      following,
      followed,
      publications: pubs
   }
}

module.exports = userController;