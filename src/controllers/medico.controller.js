const supabase = require('../../database'); // tu cliente Supabase
const bcrypt=require('bcrypt');

const registrarMedico = async (req, res) => {
  try {
    const { nombre_completo, correo, contrasena, telefono, fecha_nac, id_especialidad, departamento } = req.body;

    // 1️⃣ Validar archivos
    const pdfFiles = req.files?.matriculaProfesional;
    const imgFiles = req.files?.carnetProfesional;

    if (!pdfFiles || pdfFiles.length === 0) {
      return res.status(400).json({ error: "Archivo de matrícula faltante" });
    }
    if (!imgFiles || imgFiles.length === 0) {
      return res.status(400).json({ error: "Archivo de carnet faltante" });
    }

    const pdf = pdfFiles[0];
    const img = imgFiles[0];

    // 2️⃣ Subir archivos a Supabase
    const pdfUpload = await supabase.storage
      .from("Matriculas_PDF")
      .upload(`pdfs/${Date.now()}_${pdf.originalname}`, pdf.buffer, { contentType: pdf.mimetype });

    const imgUpload = await supabase.storage
      .from("Carnets_IMG")
      .upload(`imgs/${Date.now()}_${img.originalname}`, img.buffer, { contentType: img.mimetype });

    if (pdfUpload.error) throw pdfUpload.error;
    if (imgUpload.error) throw imgUpload.error;

    const pdfUrl = supabase.storage.from("Matriculas_PDF").getPublicUrl(pdfUpload.data.path).data.publicUrl;
    const imgUrl = supabase.storage.from("Carnets_IMG").getPublicUrl(imgUpload.data.path).data.publicUrl;

    // 3️⃣ Hashear contraseña
    const hashed_contrasena = await bcrypt.hash(contrasena, 10);
    const rol = 'medico';

    // 4️⃣ Insertar usuario
    const { data: usuarioData, error: usuarioError } = await supabase
      .from("usuario")
      .insert([{
        nombre_completo,
        correo,
        contrasena: hashed_contrasena,
        rol,
        "teléfono": telefono,
        fecha_nac
      }])
      .select();

    if (usuarioError) throw usuarioError;
    const usuario = usuarioData[0];

    // 5️⃣ Insertar médico
    const { data: medicoData, error: medicoError } = await supabase
      .from('medico')
      .insert([{
        id_usuario: usuario.id_usuario,
        id_especialidad,
        matricula_profesional: pdfUrl,
        departamento,
        carnet_profesional: imgUrl,
        administrador_id_admin: 1
      }])
      .select();

    if (medicoError) throw medicoError;

    res.status(200).json({ mensaje: "Médico registrado correctamente", usuario, medico: medicoData[0] });

  } catch (error) {
    console.error("❌ Error en registrarMedico:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { registrarMedico };




const verMedicos = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('medico')
      .select(`
        id_medico,
        usuario ( nombre_completo )
      `);

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error('Error al obtener médicos:', error.message);
    res.status(500).json({ error: 'Error al obtener médicos' });
  }
};



const perfilMedico= async (req, res) => {
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
};


const verPacientes= async (req, res) => {
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
};


const alertasActivas= async (req, res) => {
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
};


const alertasResueltas= async (req, res) => {
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
};


// ✅ export correcto
module.exports = { verMedicos, 
    perfilMedico, registrarMedico, verPacientes, alertasActivas,alertasResueltas};
