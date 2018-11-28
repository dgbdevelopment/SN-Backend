'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
   name: String,
   surname: String,
   nick: {type: String, unique: true},
   email: {type: String, unique: true},
   password: {type: String},
   role: String,
   image: String
});

module.exports = mongoose.model('User', userSchema);