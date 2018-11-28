'use stric'
const app = require('./app');
const config = require('./config');
const mongoose = require('mongoose');


mongoose.Promise = global.Promise;
mongoose.connect(config.db,{ useNewUrlParser: true })
  .then(()=>{
      console.log('Conexión a la Base de Datos establecida con éxito');

    //CREACIÓN DEL SERVIDOR
      app.listen(config.port, (err)=>{
      if (err) throw err;
      console.log('API listening on port '+config.port);
      });
  }).catch((error)=>{
    console.log('NO se pudo conectar: '+error);
  });





