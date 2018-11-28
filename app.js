'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

//Cargar rutas
const userRoutes = require('./routes/user');
const followRoutes = require('./routes/follow');
const pubRoutes = require('./routes/publication');
const mesRoutes = require('./routes/message');

// Cargar Middlewares
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

// CORS
app.use((req, res, next) => {
   res.header('Access-Control-Allow-Origin', '*');
   res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
   res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
   res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
   next();
});

//Rutas

app.use('/api', userRoutes);
app.use('/api', followRoutes);
app.use('/api', pubRoutes);
app.use('/api', mesRoutes);


//Exportar
module.exports = app;