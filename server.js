const express = require('express');
const supabase = require('./database');
const bcrypt = require('bcrypt');
require('dotenv').config();
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

const  multer =require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Endpoint POST para registrar médicos
app.post('/registrar_medico', async (req, res) => {
    const { 
        nombre_completo, 
        correo, 
        contrasena, 
        rol, 
        fecha_nac, 
        teléfono,
        especialidad, 
        matricula_profesional,
        departamento,
        carnet_profesional, 
    } = req.body;

    if (!nombre_completo || !correo || !contrasena || !rol || !fecha_nac || !teléfono || !especialidad || !matricula_profesional || !departamento || !carnet_profesional) {
        return res.status(400).json({ error: "Todos los campos deben ser llenados" });
    }

    try {

        // Primero buscar la equivalencia de la especialidad
        const { data: especialidadData, error: especialidadError } = await supabase
            .from("especialidad")
            .select("id_especialidad")
            .eq("nombre", especialidad).single();
        
        if (especialidadError) throw especialidadError;
        if (!especialidadData) {
            return res.status(404).json({ error: `Especialidad ${especialidad} no encontrada` });
        }

        const id_especialidad = especialidadData.id_especialidad;

        // Luego hasheo

        const saltRounds = 10;
        const hashed_contrasena = await bcrypt.hash(contrasena, saltRounds);

        const { data: usuarioData, error: usuarioError } = await supabase
            .from("usuario")
            .insert([
                {
                    nombre_completo,
                    correo,
                    contrasena: hashed_contrasena,
                    rol,
                    fecha_nac,
                    teléfono
                },
            ]).select();

            if (usuarioError) throw usuarioError;

            const usuario = usuarioData[0];

            const { data: medicoData, error: medicoError } = await supabase
                .from("medico")
                .insert([
                    {
                        id_usuario: usuario.id_usuario,
                        id_especialidad: id_especialidad,
                        matricula_profesional,
                        departamento,
                        carnet_profesional,
                    },
                ]).select();

            if (medicoError) throw medicoError;
            const medico = medicoData[0];

            delete usuario.contrasena;

            res.status(200).json({ 
                message: "Usuario y médico registrados correctamente",
                usuario,
                medico 
            });
    } catch (error) {
        console.error("Error al insertar datos: ", error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint POST para registrar pacientes
app.post('/registrar_paciente', async (req, res) => {
    const { 
        nombre_completo,
        correo,
        contrasena,
        rol,
        fecha_nac,
        teléfono,
        id_medico,
        id_actividad,
        genero,
        peso,
        altura,
        enfermedad_id,
        tratamiento_id,
        dosis_
    } = req.body;

    if (!nombre_completo || !correo || !contrasena || !rol || !fecha_nac || !teléfono || !id_medico || !id_actividad || !genero || !peso || !altura
       ||!enfermedad_id||!tratamiento_id||!dosis_)  {
        return res.status(400).json({ error: 'Todos los campos deben ser llenados' });
    }

    try {
        
        // Primero buscar la equivalencia de nivel de actividad
    

        // Luego hasheo
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

        const { data: usuarioInsertadoData, error: usuarioInsertadoError } = await supabase
            .from("usuario")
            .insert([
                {
                    nombre_completo,
                    correo,
                    contrasena: hashedPassword,
                    rol,
                    fecha_nac,
                    teléfono
                },
            ]).select();

        if (usuarioInsertadoError) throw usuarioInsertadoError;

        const usuario_insertado = usuarioInsertadoData[0];

        const { data: pacienteData, error: pacienteError } = await supabase
            .from("paciente")
            .insert([
                {
                    id_usuario: usuario_insertado.id_usuario,
                    id_medico: id_medico,
                    id_nivel_actividad: id_actividad,
                    genero,
                    peso,
                    altura
                }
            ]).select();

        if (pacienteError) throw pacienteError;

        const paciente = pacienteData[0];

       const {data:dataTratamiento,error:errorTratamiento}=await supabase
       .from('tratamiento_enfermedad').insert({
            id_paciente:paciente.id_paciente,
            id_tratamiento:tratamiento_id,
            dosis:dosis_
       });
       if(errorTratamiento)throw errorTratamiento;

       const {data:dataEnfermedad, error: errorEnfermedad}=await supabase
       .from('paciente_enfermedad').
       insert({
          id_paciente:paciente.id_paciente,
          id_enfermedad:enfermedad_id,
       })

       if(errorEnfermedad)throw errorEnfermedad;

        res.status(200).json({
            message: 'Usuario y paciente registrados correctamente',
            usuario_insertado,
            paciente
        });
        
    } catch (error) {
        console.error("Error al insertar datos: ", error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint GET para obtener todos los médicos
app.get('/ver_medicos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("medico")
            .select(`
                id_medico,
                usuario ( nombre_completo )
            `);
        
            if (error) throw error;

            res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener médicos: ', error.message);
        res.status(500).json({ error: 'Error al obtener médicos' });
    }
});

// ENDPOINT para obtener todos los medicos activos (admitidos)
app.get('/medicos_activos', async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('get_medicos_activos')

    if (error) {
      console.error('Error ejecutando función:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(data) // ✅ devuelve arreglo JSON
  } catch (err) {
    console.error('Error interno:', err)
    return res.status(500).json({ error: 'Error del servidor' })
  }
})

// ENDPOINT para obtener todos los medicos solicitantes (no admitidos)
app.get('/medicos_solicitantes', async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('get_medicos_solicitantes')

    if (error) {
      console.error('Error ejecutando función:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(data) // ✅ devuelve arreglo JSON
  } catch (err) {
    console.error('Error interno:', err)
    return res.status(500).json({ error: 'Error del servidor' })
  }
});

// ENDPOINT para activar un medico solicitante (admitirlo)
app.put('/activar-medico/:idMedico', async (req, res) => {
  const idMedico = req.params.idMedico;

  try {
    // 1. Obtener id_usuario desde medico
    const { data: medicoData, error: medicoError } = await supabase
      .from('medico')
      .select('id_usuario')
      .eq('id_medico', idMedico)
      .single();

    if (medicoError) {
      return res.status(400).json({ error: medicoError.message });
    }

    if (!medicoData) {
      return res.status(404).json({ error: 'Medico no encontrado' });
    }

    const idUsuario = medicoData.id_usuario;

    // 2. Actualizar estado del usuario
    const { data: updateData, error: updateError } = await supabase
      .from('usuario')
      .update({ estado: true })
      .eq('id_usuario', idUsuario);

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.json({ mensaje: 'Usuario activado correctamente', usuario: updateData });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detalles: err.message });
  }
});

//ENDPOINT para obtener todos los pacientes activos (admitidos)
app.get('/pacientes_activos',async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('obtener_pacientes_activos')

    if (error) {
      console.error('Error ejecutando función:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(data) // ✅ devuelve arreglo JSON
  } catch (err) {
    console.error('Error interno:', err)
    return res.status(500).json({ error: 'Error del servidor' })
  }
});

// ENDPOINT para obtener todos los pacientes solicitantes (no admitidos)
app.get('/pacientes_solicitantes',async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('obtener_pacientes_solicitantes')

    if (error) {
      console.error('Error ejecutando función:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(data) // ✅ devuelve arreglo JSON
  } catch (err) {
    console.error('Error interno:', err)
    return res.status(500).json({ error: 'Error del servidor' })
  }
});

// ENDPOINT para activar un paciente solicitante (admitirlo)
app.put('/activar-paciente/:idPaciente', async (req, res) => {
  const idPaciente = req.params.idPaciente;

  try {
    // 1. Obtener id_usuario desde medico
    const { data: pacienteData, error: pacienteError } = await supabase
      .from('paciente')
      .select('id_usuario')
      .eq('id_paciente', idPaciente)
      .single();

    if (pacienteError) {
      return res.status(400).json({ error: medicoError.message });
    }

    if (!pacienteData) {
      return res.status(404).json({ error: 'Medico no encontrado' });
    }

    const idUsuario = pacienteData.id_usuario;

    // 2. Actualizar estado del usuario
    const { data: updateData, error: updateError } = await supabase
      .from('usuario')
      .update({ estado: true })
      .eq('id_usuario', idUsuario);

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.json({ mensaje: 'Usuario activado correctamente', usuario: updateData });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor', detalles: err.message });
  }
});

// ENDPOINT para obtener el perfil de un medico en base al ID_MEDICO
app.get('/perfil_medico/:idUsuario', async (req, res) => {
  try {
    const idUsuario = parseInt(req.params.idUsuario)

    // Llamada a la función RPC con el parámetro
    const { data, error } = await supabase.rpc('obtener_medico_por_usuario', {
      id_usuario_input: idUsuario
    })

    if (error) {
      console.error('Error ejecutando función:', error)
      return res.status(500).json({ error: error.message })
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No se encontró el médico' })
    }

    // ✅ Devuelve el resultado como JSON
    return res.status(200).json(data[0]) // devuelve el objeto (no arreglo)
    
  } catch (err) {
    console.error('Error interno:', err)
    return res.status(500).json({ error: 'Error del servidor' })
  }
})

// ENDPOINT para obtener el perfil de un administrador en base al ID_USUARIO
app.get('/perfil_admin/:idUsuario', async (req, res) => {
  try {
    const idUsuario = parseInt(req.params.idUsuario);

    const { data, error } = await supabase.rpc('obtener_admin_por_usuario', {
      id_usuario_input: idUsuario
    });

    if (error) {
      console.error('Error ejecutando función:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No se encontró el administrador' });
    }

    return res.status(200).json(data[0]); // devuelve el objeto directamente
  } catch (err) {
    console.error('Error interno:', err);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

//Obtener los pacientes activos de un medico en base al ID_MEDICO
app.get("/ver_pacientes/:idMedico", async (req, res) => {
  const { idMedico } = req.params;

  try {
    // 🔹 Ejecutar la función SQL
    const { data, error } = await supabase.rpc("obtener_pacientes_por_medico", {
      id_medico_input: parseInt(idMedico),
    });

    if (error) throw error;

    // 🔹 Si no hay datos, devolvemos vacío
    if (!data || data.length === 0) {
      return res.status(404).json({ mensaje: "No se encontraron pacientes." });
    }

    // 🔹 La función devuelve un arreglo JSON directamente
    res.json(data);
  } catch (err) {
    console.error("Error ejecutando función:", err.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// ENDPOINT para obtener las alertas activas en base al ID_MEDICO
app.get('/alertas_activas_medico/:idMedico', async (req, res) => {
  try {
    const idMedico = parseInt(req.params.idMedico);

    const { data, error } = await supabase.rpc('obtener_alertas_activas_por_medico', {
      id_medico_input: idMedico
    });

    if (error) {
      console.error('Error ejecutando función:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Error interno:', err);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint POST para login
app.post('/login', async (req, res) => {
    const { correo, contrasena } = req.body;

    const { data: usuarioData, error: usuarioError } = await supabase
        .from("usuario")
        .select("id_usuario, correo, contrasena, rol")
        .eq("correo", correo).eq("estado", true); 

    if (usuarioError) throw usuarioError;

    if (!usuarioData) {
        return res.status(401).json({ error: `No se encontró ningún usuario con correo: ${correo}` });
    }

    const usuario = usuarioData[0];
    const id_usuario = usuario.id_usuario;
    const rol = usuario.rol;
    let id_rol = 0;

    if (rol === "administrador") {
        const { data: adminData, error: adminError } = await supabase
            .from("administrador")
            .select("id_admin")
            .eq("id_usuario", id_usuario)
            .single();
        if (adminError) throw adminError;

        id_rol = adminData.id_admin;

    } else if (rol === "medico") {
        const { data: medicoData, error: medicoError } = await supabase
            .from("medico")
            .select("id_medico")
            .eq("id_usuario", id_usuario)
            .single();
        if(medicoError) throw medicoError;

        id_rol = medicoData.id_medico;

    } else {
        const { data: pacienteData, error: pacienteError } = await supabase
            .from("paciente")
            .select("id_paciente")
            .eq("id_usuario", id_usuario)
            .single();
        if (pacienteError) throw pacienteError;

        id_rol = pacienteData.id_paciente;
    }

    const isMatch = await bcrypt.compare(String(contrasena), usuario.contrasena);

    if (!isMatch) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    res.status(200).json({
        message: "Credenciales correctas, login exitoso",
        id_usuario: id_usuario,
        id_rol: id_rol,
        rol: rol
    });
});

// Endpoint POST para registrar glucosa
app.post('/registrar_glucosa', async (req, res) => {
    const {
      fecha,
      hora, 
      id_medico,
      id_momento,
      id_paciente,
      nivel_glucosa,
      observaciones
    } = req.body;

    if (!fecha || !hora || !id_medico || !id_momento || !id_paciente || !nivel_glucosa) {
      return res.status(400).json({ error: "Todos los campos (menos observaciones) deben estar llenados" });
    }

    try {
      const { data: glucosaData, error: glucosaError } = await supabase
        .from("registro_glucosa")
        .insert([
          {
            id_paciente: id_paciente,
            id_medico: id_medico,
            id_momento: id_momento,
            fecha: fecha,
            hora: hora,
            nivel_glucosa: nivel_glucosa,
            observaciones: observaciones
          }
        ]).select();

      if (glucosaError) throw glucosaError;

      const registro_glucosa = glucosaData[0];

      res.status(200).json({
        message: "Registro insertado correctamente",
        registro_glucosa
      });

    } catch (error) {
      console.error("Error al insertar los datos: ", error.message);
      res.status(500).json({ error: error.message });
    }
});

app.get('/ver_momentos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("momento_dia")
            .select(`
                id_momento, momento 
            `);
        
            if (error) throw error;

            res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener momentos: ', error.message);
        res.status(500).json({ error: 'Error al obtener momentos' });
    }
});


app.get('/registros_paciente/:idPaciente', async (req, res) => {
  try {
    const idPaciente = parseInt(req.params.idPaciente);

    const { data, error } = await supabase.rpc('obtener_registros_por_paciente', {
      id_paciente_input: idPaciente
    });

    if (error) {
      console.error('Error ejecutando función:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Error interno:', err);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});


app.get('/alertas_resueltas_medico/:idMedico', async (req, res) => {
  try {
    const idMedico = parseInt(req.params.idMedico);

    const { data, error } = await supabase.rpc('obtener_alertas_resueltas_por_medico', {
      id_medico_input: idMedico
    });

    if (error) {
      console.error('Error ejecutando función:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Error interno:', err);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});


app.get('/perfil_paciente/:id', async (req, res) => {
  const idPaciente = parseInt(req.params.id);

  try {
    const { data, error } = await supabase
      .rpc('obtener_paciente_por_id', { id_paciente_input: idPaciente });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Error al obtener paciente:', err);
    res.status(500).json({ error: 'Error al obtener paciente' });
  }
});






app.get('/niveles_actividad',async (req,res)=>{
  try{
    const {data,error}=await supabase
    .from('nivel_actividad_fisica').select('id_nivel_actividad,descripcion')
    if (error) throw error;

            res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener niveles de actividad: ', error.message);
        res.status(500).json({ error: 'Error al obtener actividades' });
    }
  
});

app.get('/obtener_enfermedades',async (req,res)=>{
  try{
    const {data,error}=await supabase
    .from('enfermedades_base').select('id_enfermedad,nombre_enfermedad')
    if (error) throw error;

            res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener enfermedades: ', error.message);
        res.status(500).json({ error: 'Error al obtener enfermedades' });
    }
  
});

app.get('/obtener_tratamientos',async (req,res)=>{
  try{
    const {data,error}=await supabase
    .from('tratamientos').select('id_tratamiento,nombre_tratamiento,descripcion')
    if (error) throw error;

            res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener tratamientos: ', error.message);
        res.status(500).json({ error: 'Error al obtener tratamientos' });
    }
});





app.get('/obtener_especialidades',async (req,res)=>{
  try{
    const {data,error}=await supabase
    .from('especialidad').select('id_especialidad,nombre')
    if (error) throw error;

            res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener tratamientos: ', error.message);
        res.status(500).json({ error: 'Error al obtener tratamientos' });
    }
});



app.post("/registrar_medicos", upload.fields([
  { name: "matriculaProfesional", maxCount: 1 },
  { name: "carnetProfesional", maxCount: 1 },
]), async (req, res) => {
  try {
    const { nombre_completo, correo, contrasena, telefono, fecha_nac,id_especialidad ,departamento} = req.body;
    const pdf = req.files["matriculaProfesional"]?.[0];
    const img = req.files["carnetProfesional"]?.[0];

    // subir archivos a Supabase
    const pdfUpload = await supabase.storage
      .from("Matriculas_PDF")
      .upload(`pdfs/${Date.now()}_${pdf.originalname}`, pdf.buffer, {
        contentType: pdf.mimetype,
      });

    const imgUpload = await supabase.storage
      .from("Carnets_IMG")
      .upload(`imgs/${Date.now()}_${img.originalname}`, img.buffer, {
        contentType: img.mimetype,
      });

    // verificar errores en subida
    if (pdfUpload.error) throw pdfUpload.error;
    if (imgUpload.error) throw imgUpload.error;

    // URLs públicas
    const pdfUrl = supabase.storage.from("Matriculas_PDF").getPublicUrl(pdfUpload.data.path).data.publicUrl;
    const imgUrl = supabase.storage.from("Carnets_IMG").getPublicUrl(imgUpload.data.path).data.publicUrl;
      const rol='medico'
    // insertar datos en la BD (según tu esquema)
    const { data, error } = await supabase
      .from("usuario")
      .insert([
        {
          nombre_completo,
          correo,
          contrasena,
          rol,
          "teléfono":telefono,
          fecha_nac,
          
        },
      ]).select();


    if (error) throw error;
    const usuario=data[0];
    const {data:medicoData,error:errorMedico}=await supabase
    .from('medico')
    .insert([{
      id_usuario:usuario.id_usuario,
      id_especialidad:id_especialidad,
      matricula_profesional:pdfUrl,
      departamento: departamento,
      carnet_profesional:imgUrl,
      administrador_id_admin:1
    }])
    res.status(200).json({ mensaje: "Médico registrado correctamente", data });
  } catch (error) {
    console.error("❌ Error en /registrar_medicos:", error);
    res.status(500).json({ error: error.message });
  }
});
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});