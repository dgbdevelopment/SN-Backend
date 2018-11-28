'use strict'
const path = require('path');
const fs = require('fs');
const moment = require('moment');
require('mongoose-pagination');

const Publication = require('../models/publication');
const User = require('../models/user');
const Follow = require('../models/follow');

const pubController = {

   pruebaPub: function (req, res) {
      res.status(200).send({ message: 'Mensaje desde el método de pruebas de publication' })
   },
   savePub: function (req, res) {
      let params = req.body;

      if (!params.text) {
         return res.status(200).send({ message: 'No puedes crear una publicación sin texto' });
      }

      let pub = new Publication();

      pub.text = params.text;
      pub.file = 'null';
      pub.user = req.user.sub;
      pub.created_at = moment().unix();

      pub.save((err, pubStored) => {
         if (err) throw err;
         if (!pubStored) return res.status(404).send({ message: 'La publicación no ha podido ser guardada' });
         res.status(200).send({ message: 'Publicación guardada correctamente', pub: pubStored });
      });
   },
   getPubs: function (req, res) {
      let page = 1;
      if (req.params.page) {
         page = req.params.page;
      }
      let itemsPerParge = 4;

      Follow.find({ followed: req.user.sub }, (err, follows) => {
         if (err) throw err;
         let follows_clean = [];
         follows.forEach((follow) => {
            follows_clean.push(follow.user);
         });
         Publication.find({ user: { "$in": follows_clean } }).sort('-created_at').populate('user', { password: 0, role: 0 }).paginate(page, itemsPerParge, (err, pubs, total) => {
            if (err) throw err;
            if (!pubs) return res.status(404).send({ message: 'No hay publicaciones' });
            res.status(200).send({
               total_items: total,
               pages: Math.ceil(total / itemsPerParge),
               page,
               pubs
            });
         });
      }).populate('user', { password: 0, role: 0 });
   },
   getMyPubs: function (req, res) {
      let page = 1;
      let userId = req.params.id;
      if (req.params.page) {
         page = req.params.page;
      }
      let itemsPerParge = 4;

      Publication.find({ user: userId }).sort('-created_at').populate('user', { password: 0, role: 0 }).paginate(page, itemsPerParge, (err, pubs, total) => {
         if (err) throw err;
         if (!pubs) return res.status(404).send({ message: 'No hay publicaciones' });
         res.status(200).send({
            total_items: total,
            pages: Math.ceil(total / itemsPerParge),
            page,
            pubs
         });
      });
   },

   getPub: function (req, res) {
      let id = req.params.id;

      Publication.findById(id, (err, pub) => {
         if (err) throw err;
         if (!pub) return res.status(404).send({ message: 'No existe la publicación' });
         res.status(200).send({ publication: pub });
      });
   },
   deletePub: function (req, res) {
      let id = req.params.id;

      Publication.findOne({ user: req.user.sub, _id: id }, (err, pub) => {
         if (err) throw err;
         if (!pub) return res.status(404).send({ message: 'No puedes borrar una publicación que no es tuya' });
         Publication.findByIdAndRemove(id, (err, pubRemoved) => {
            if (err) throw err;
            if (!pubRemoved) return res.status(404).send({ message: 'No se encuentra la publicación para borrar' });
            let filePath = './uploads/publications/' + pubRemoved.file;
            removeFiles(filePath);
            res.status(200).send({ messgae: `La publicación con id ${id} ha sido borrada con éxito` });
         });
      })
   },
   uploadImage: function (req, res) {
      let pubId = req.params.id;

      if (!req.files.file) return res.status(200).send({ message: 'No se han adjuntado archivos para subir' });

      let filePath = req.files.file.path;
      let fileName = filePath.split('\\').pop();
      let ext = fileName.split('.').pop();

      if (ext != 'png' && ext != 'jpg' && ext != 'jpeg' && ext != 'gif') {
         removeFiles(filePath);
         return res.status(200).send({ message: 'Archivo de imágen no válido' });
      }
      Publication.findOne({ user: req.user.sub, _id: pubId }, (err, pub) => {
         if (err) throw err;
         if (!pub) {
            removeFiles(filePath);
            return res.status(500).send({ message: 'No eres el autor de esta publicación' });
         }
         let oldImage = './uploads/publications/' + pub.file;
         Publication.findByIdAndUpdate(pubId, { file: fileName }, { new: true }, (err, updatedPub) => {
            if (err) return res.status(500).send({ mesage: 'Error actualizando imagen' });
            if (!updatedPub) return res.status(404).send({ message: 'No se ha podido actualizar la imagen de la publicación' });
            removeFiles(oldImage);
            res.status(200).send({ message: `Archivo de imágen subido correctamente (${fileName})`, pub: updatedPub });

         })
      })
   },
   getImage: function (req, res) {
      let imageFile = req.params.imageFile;
      let filePath = './uploads/publications/' + imageFile;

      fs.exists(filePath, (exists) => {
         if (exists) return res.sendFile(path.resolve(filePath));
         res.status(404).send({ message: 'No hay imagen para mostrar' })
      })
   }

}

function removeFiles(filePath) {
   fs.exists(filePath, (exists) => {
      if (!exists) {
         return ({ message: 'La imagen a borrar no existe' })
      } else {
         fs.unlink(filePath, (err) => {
            if (err) throw err;
            return ({ message: `Imagen (${filePath}) borrada con éxito` })
         })
      }
   })
}

module.exports = pubController;