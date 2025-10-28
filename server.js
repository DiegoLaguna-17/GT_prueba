const express = require('express');
const supabase = require('./database');
const bcrypt = require('bcrypt');
require('dotenv').config();
const cors=require('cors')
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// ENDPOINTS 

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
        nombre_medico,
        nivel_actividad,
        genero,
        peso,
        altura,
    } = req.body;

    if (!nombre_completo || !correo || !contrasena || !rol || !fecha_nac || !teléfono || !nombre_medico || !nivel_actividad || !genero || !peso || !altura) {
        return res.status(400).json({ error: 'Todos los campos deben ser llenados' });
    }

    try {
        
        // Primero buscar la equivalencia de nivel de actividad
        const { data: nivelData, error: nivelError } = await supabase
            .from("nivel_actividad_fisica")
            .select("id_nivel_actividad")
            .eq("descripcion", nivel_actividad)
            .single();

        if (nivelError) throw nivelError;
        
        if (!nivelData) {
            return res.status(404).json({ error: `Nivel de actividad ${nivel_actividad} no encontrado` });
        }

        const id_nivel_actividad = nivelData.id_nivel_actividad;

        // Luego la equivalencia del médico
        const { data: usuarioData, error: usuarioError } = await supabase
            .from("usuario")
            .select("id_usuario")
            .eq("nombre_completo", nombre_medico)
            .single();

        if (usuarioError) throw usuarioError;

        if (!usuarioData) {
            return res.status(404).json({ error: `Usuario con nombre: ${nombre_medico} no encontrado` });
        }

        const id_usuario = usuarioData.id_usuario;

        const { data: medicoData, error: medicoError } = await supabase
            .from("medico")
            .select("id_medico")
            .eq("id_usuario", id_usuario)
            .single();

        if (medicoError) throw medicoError;

        if (!medicoData) {
            return res.status(404).json({ error: `Médico con id de usuario: ${id_usuario} no encontrado` });
        }

        const id_medico = medicoData.id_medico;

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
                    id_nivel_actividad: id_nivel_actividad,
                    genero,
                    peso,
                    altura
                }
            ]).select();

        if (pacienteError) throw pacienteError;

        const paciente = pacienteData[0];

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
                usuario ( id_usuario, nombre_completo )
            `);
        
            if (error) throw error;

            res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener médicos: ', error.message);
        res.status(500).json({ error: 'Error al obtener médicos' });
    }
});


// ENDPOINT DE PRUEBA
app.get('/get_medico_por_nombre', async (req, res) => {
    const {
        nombre_completo
    } = req.body;

    const { data, error } = await supabase
        .from("medico")
        .select("id_medico")
        .eq("nombre_completo", nombre_completo)
});





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





app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});