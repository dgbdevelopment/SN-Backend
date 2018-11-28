'use strict'
const express = require('express');
const MessageController = require('../controllers/message');

const api = express.Router();
const md_auth = require('../middlewares/auth');

// const multipart = require('connect-multiparty');
// const md_upload = multipart({uploadDir: './uploads/messages'});

api.get('/pruebaMessage', MessageController.pruebaMessage);
api.post('/newmessage', md_auth.ensureAuth, MessageController.saveMessage);
api.get('/received/:page?', md_auth.ensureAuth, MessageController.getReceivedMessages);
api.get('/emitted/:page?', md_auth.ensureAuth, MessageController.getEmittedMessages);
api.get('/notviewed', md_auth.ensureAuth, MessageController.countNotViewedMessage);
api.put('/setviewed', md_auth.ensureAuth, MessageController.setViewedMessages);

module.exports = api;