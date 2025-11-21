const express = require('express');
const router = express.Router();
const {datosParaGlucosa,registrarAlerta}=require('../controllers/registro.controller');

router.get('/datosGlucosa/:idUsuario',datosParaGlucosa);

router.post('/registrarAlerta', registrarAlerta);
module.exports=router;