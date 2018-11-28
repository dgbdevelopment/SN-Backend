'use strict'

const express = require('express');
const UserController = require('../controllers/user');

const api = express.Router();
const md_auth = require('../middlewares/auth');

const multiparty = require('connect-multiparty');
const md_upload = multiparty({uploadDir: './uploads/users'})

api.get('/prueba', UserController.prueba);
api.get('/user/:id?', md_auth.ensureAuth, UserController.getUser);
api.post('/signin', UserController.login);
api.post('/signup', UserController.saveUser);
api.get('/users/:page?', md_auth.ensureAuth, UserController.getUsers);
api.get('/allusers', md_auth.ensureAuth, UserController.getAllUsers);
api.put('/update/:id', md_auth.ensureAuth, UserController.updateUser);
api.post('/uploadimage/:id', [md_auth.ensureAuth, md_upload], UserController.uploadImage);
api.get('/getimage/:imageFile', UserController.getImage);
api.get('/counters/:id?', md_auth.ensureAuth, UserController.getCounters);

module.exports = api;