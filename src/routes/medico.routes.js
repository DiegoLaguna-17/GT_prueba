const express = require('express');
const router = express.Router();
const multer = require('multer');

// ✅ Definir storage en memoria


const { registrarMedico,verMedicos,medicosActivos,medicosSolicitantes,activarMedico, 
    perfilMedico, verPacientes, alertasActivas, alertasResueltas,retroalimentacionAlerta} = require('../controllers/medico.controller');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/registrar', upload.fields([
  { name: "matriculaProfesional", maxCount: 1 },
  { name: "carnetProfesional", maxCount: 1 },
]), registrarMedico);

router.post('/responder/alerta',retroalimentacionAlerta);

router.get('/perfil/:idUsuario',perfilMedico);
router.get('/ver', verMedicos);
router.get('/misPacientes/:idMedico',verPacientes);
router.get('/alertasActivas/:idMedico',alertasActivas);
router.get('/alertasResueltas/:idMedico',alertasResueltas);



module.exports = router;
