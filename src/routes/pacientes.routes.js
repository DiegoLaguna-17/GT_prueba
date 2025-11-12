const express = require('express');
const router = express.Router();

const {perfilPaciente,registrosPaciente,registrarGlucosa,registrarPaciente}=require('../controllers/paciente.controller');
router.get('/perfil/:idPaciente',perfilPaciente);
router.get('/registros/:idPaciente',registrosPaciente);

router.post('/registrarGlucosa',registrarGlucosa);
router.post('/registrarPaciente',registrarPaciente);
/*
router.get('/activos',pacientesActivos);
router.get('/solicitantes',pacientesSolicitantes)

router.put('/activar/:idPaciente',activarPaciente)*/

module.exports=router;