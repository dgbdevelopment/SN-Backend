'use strict'
const express = require('express');
const PubController = require('../controllers/publication');

const api = express.Router();
const md_auth = require('../middlewares/auth');

const multipart = require('connect-multiparty');
const md_upload = multipart({uploadDir: './uploads/publications'});

api.get('/pruebaPub', PubController.pruebaPub);
api.post('/newpub', md_auth.ensureAuth, PubController.savePub);
api.get('/getpubs/:page?', md_auth.ensureAuth, PubController.getPubs);
api.get('/getmypubs/:id/:page?', md_auth.ensureAuth, PubController.getMyPubs);
api.get('/getpub/:id', md_auth.ensureAuth, PubController.getPub);
api.delete('/deletepub/:id', md_auth.ensureAuth, PubController.deletePub);
api.post('/uploadimagepub/:id', [md_auth.ensureAuth, md_upload], PubController.uploadImage);
api.get('/getimagepub/:imageFile', PubController.getImage);

module.exports = api;