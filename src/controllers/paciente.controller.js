const supabase = require('../../database'); // tu cliente Supabase
const bcrypt=require('bcrypt')


const registrarPaciente= async (req, res) => {
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
};



const perfilPaciente=async (req, res) => {
  const idPaciente = parseInt(req.params.idPaciente);

  try {
    const { data, error } = await supabase
      .rpc('obtener_paciente_por_id', { id_paciente_input: idPaciente });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Error al obtener paciente:', err);
    res.status(500).json({ error: 'Error al obtener paciente' });
  }
};


const registrosPaciente= async (req, res) => {
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
};



const registrarGlucosa= async (req, res) => {
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
};


module.exports={perfilPaciente,registrosPaciente,registrarGlucosa,registrarPaciente};