const supabase = require('../../database'); // tu cliente Supabase


const datosParaGlucosa = async (req, res) => {
  const idUsuario = parseInt(req.params.idUsuario);

  try {
    const { data, error } = await supabase
      .rpc('obtener_info_paciente_json', { id_usuario_input: idUsuario });

    if (error) throw error;

    res.json(data); // ✅ data ya es objeto JSON
  } catch (err) {
    console.error('Error al obtener datos paciente:', err);
    res.status(500).json({ error: 'Error al obtener datos paciente' });
  }
};
 



const registrarAlerta = async (req, res) => {
  const { id_tipo_alerta, id_registro, id_medico, fecha_alerta } = req.body;

  // Validación básica
  if (!id_tipo_alerta || !id_registro || !id_medico || !fecha_alerta) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    const { data, error } = await supabase
      .from('alertas')
      .insert([
        {
          id_tipo_alerta,
          id_registro,
          id_medico,
          fecha_alerta
        }
      ])
      .select(); // devuelve el registro insertado

    if (error) throw error;

    const alertaInsertada = data[0];

    res.status(200).json({
      message: 'Alerta registrada correctamente',
      alerta: alertaInsertada
    });
  } catch (err) {
    console.error('Error al insertar alerta:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { datosParaGlucosa ,registrarAlerta };
