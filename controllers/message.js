'use strict'
const moment = require('moment');
require('mongoose-pagination');

const User = require('../models/user');
const Message = require('../models/message');

const messageController ={
   pruebaMessage: function (req,res) {
      res.status(200).send({message: 'Mensaje de prueba desde el controlador de Message'})
   },
   saveMessage: function(req,res){
      let params = req.body;

      if(!params.text || !params.receiver) return res.status(200).send({message: 'Envía los datos necesarios'});

      let message = new Message();
      message.emitter = req.user.sub;
      message.receiver = params.receiver;
      message.text = params.text;
      message.created_at = moment().unix();
      message.viewed=false;

      message.save((err, messageStored)=>{
         if (err) throw err;
         if (!messageStored) return res.status(500).send({message: 'No se ha podido enviar el mensaje'});
         res.status(200).send({message: 'Mensaje enviado correctamente', message: messageStored});
      })
   },
   getReceivedMessages: function(req,res){
      let userId = req.user.sub;
      let page = 1;

      if (req.params.page) page = req.params.page;

      let itemsPerPage = 4;

      Message.find({receiver: userId}).sort('-created_at').populate('emitter','nick').paginate(page, itemsPerPage, (err, messages, total)=>{
         if (err) throw err;
         if (!messages) return res.status(404).send({message: 'No hay mensajes para mostrar'});
         res.status(200).send({
            total,
            page,
            pages: Math.ceil(total/itemsPerPage),
            messages
         })
      })
   },
   getEmittedMessages: function(req,res){
      let userId = req.user.sub;
      let page = 1;

      if (req.params.page) page = req.params.page;

      let itemsPerPage = 4;

      Message.find({emitter: userId}).sort('-created_at').populate('receiver','nick').paginate(page, itemsPerPage, (err, messages, total)=>{
         if (err) throw err;
         if (!messages) return res.status(404).send({message: 'No hay mensajes para mostrar'});
         res.status(200).send({
            total,
            page,
            pages: Math.ceil(total/itemsPerPage),
            messages
         })
      })
   },
   countNotViewedMessage: function(req,res){
      let userId = req.user.sub;

      Message.countDocuments({receiver: userId, viewed: false}, (err, count)=>{
         if (err) throw err;
         res.status(200).send({notViewed: count})
      })
   },
   setViewedMessages: function(req,res){
      let userId = req.user.sub;

      Message.update({receiver: userId, viewed: false}, {viewed: true}, {multi: true}, (err,messagesUpdated)=>{
         if (err) throw err;
         res.status(200).send({messages: messagesUpdated});
      })
   }
}

module.exports = messageController;
