'use strict'

const config = require('../config');
const jwt = require('jwt-simple');
const moment = require('moment');

exports.createToken=function(user){
   let payload = {
      sub: user._id,
      name: user.name,
      surname: user.surname,
      nick: user.nick,
      email: user.email,
      password: user.password,
      role: user.role,
      image: user.image,
      iat: moment().unix(),
      exp: moment().add(14, 'days').unix()
   }
   return jwt.encode(payload, config.SECRET_TOKEN)
}

