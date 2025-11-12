const supabase = require('../../database'); // tu cliente Supabase
const { verMedicos } = require('./medico.controller');

const verMomentos=async (req, res) => {
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
};


const verNiveles=async (req,res)=>{
  try{
    const {data,error}=await supabase
    .from('nivel_actividad_fisica').select('id_nivel_actividad,descripcion')
    if (error) throw error;

            res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener niveles de actividad: ', error.message);
        res.status(500).json({ error: 'Error al obtener actividades' });
    }
  
};

const verEnfermedades=async (req,res)=>{
  try{
    const {data,error}=await supabase
    .from('enfermedades_base').select('id_enfermedad,nombre_enfermedad')
    if (error) throw error;

            res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener enfermedades: ', error.message);
        res.status(500).json({ error: 'Error al obtener enfermedades' });
    }
  
};


const verTratamientos=async (req,res)=>{
  try{
    const {data,error}=await supabase
    .from('tratamientos').select('id_tratamiento,nombre_tratamiento,descripcion')
    if (error) throw error;

            res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener tratamientos: ', error.message);
        res.status(500).json({ error: 'Error al obtener tratamientos' });
    }
};


const verEspecialidades =async (req,res)=>{
  try{
    const {data,error}=await supabase
    .from('especialidad').select('id_especialidad,nombre')
    if (error) throw error;

            res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener tratamientos: ', error.message);
        res.status(500).json({ error: 'Error al obtener tratamientos' });
    }
};


module.exports={verMomentos, verNiveles,verEnfermedades, verTratamientos, verEspecialidades

}