const User = require('../models/user');
const Follow = require('../models/follow');

require('mongoose-pagination');

const followController = {

   prueba: function(req,res){
      res.status(200).send({message: 'Mensaje de prueba de follow'})
   },//Seguir a...
   saveFollow: function(req,res){
      let follow = new Follow();
      follow.user = req.body.user;
      follow.followed = req.user.sub;

      if (follow.user.toString() == follow.followed.toString()) return res.status(500).send({message: 'No puedes seguirte a ti mismo'});

      Follow.findOne({user: follow.user, followed: follow.followed}, (err, followFound)=>{
         if (err) throw err;
         if (followFound) return res.status(200).send({message: 'Ya estás siguiendo a este usuario'});

         follow.save((err, followStored)=>{
            if (err) throw err;
            if (!followStored) return res.status(404).send({message: 'No se ha podido realizar el seguimiento'});
            res.status(200).send({message: 'El seguimiento se ha realizado correctamente', follow: followStored});
         })
      })      
   },//Dejar de seguir
   deleteFollow: function(req, res){
      let userId = req.params.id;
      let followedId = req.user.sub;

      Follow.findOneAndRemove({user: userId, followed: followedId}, (err)=>{
         if (err) throw err
         res.status(200).send({message: 'El seguimiento se ha eliminado'})
      })
   },//Usuarios que te siguen 
   getFollowedUsers: function(req,res){
      let userId = req.user.sub;
      let page = 1;
      let itemsPerPage = 3;

      if(req.params.id && req.params.page) {
         userId= req.params.id;
         page = req.params.page;
      }       

      if (req.params.id && isNaN(req.params.id) && !req.params.page) userId = req.params.id;
      
      if (!isNaN(req.params.id) && !req.params.page) page = req.params.id;

      Follow.find({user: userId}).populate('followed', {password:0}).paginate(page, itemsPerPage, (err,follows, total)=>{
         if (err) return res.status(500).send({message: 'El usuario no existe'});
         if (!follows) return res.status(404).send({message: 'No se sigue a ningun usuario'})         
         res.status(200).send({
            total,
            pages: Math.ceil(total/itemsPerPage),
            follows
         })
      })
   },//Usuarios a los que sigues
   getFollowingUsers: function (req,res){
      let userId = req.user.sub;
      let page = 1;
      let itemsPerPage = 3;

      if(req.params.id && req.params.page) {
         userId= req.params.id;
         page = req.params.page;
      }       

      if (req.params.id && isNaN(req.params.id) && !req.params.page) userId = req.params.id;
      
      if (!isNaN(req.params.id) && !req.params.page) page = req.params.id;

      Follow.find({followed: userId}).populate('user', {password:0}).paginate(page, itemsPerPage, (err,follows, total)=>{
         if (err) return res.status(500).send({message: 'El usuario no existe'});
         if (!follows) return res.status(404).send({message: 'No es seguido por ningun usuario'})         
         res.status(200).send({
            total,
            pages: Math.ceil(total/itemsPerPage),
            follows,
         })
         
      })
   },//Listados de usuarios
   getFollows: function(req,res){
      let userId = req.user.sub;
      //que me siguen ...
      let find = Follow.find({user: userId})
      //que siguen a...
      if(req.params.followed){
         userId=req.params.followed;
         find=Follow.find({user: userId})
      }
      find.populate('followed').exec((err,follows)=>{
         if (err) return res.status(500).send({message: 'El usuario no existe'});
         if (!follows) return res.status(404).send({message: 'No se sigue a ningun usuario'})
         res.status(200).send({ follows })
      });
   }
}


module.exports = followController;