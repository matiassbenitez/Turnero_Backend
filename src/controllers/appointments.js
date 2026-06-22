import Appointment from '../models/Appointment.js';

// Ver turnos (clientes ven disponibles, podólogos todos)
const getAll = async (req, res) => {
  try {
    const { status } = req.query;
    const filtro = status ? { status } : {};
    
    const appointments = 
      await Appointment.find(filtro);
      
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    });
  }
};

// Cliente reserva un turno existente
const create = async (req, res) => {
  try {
    const { id, email, userType, 
      isReturning, fullName, phone } = req.body;

    const updated = 
      await Appointment.findByIdAndUpdate(
        id,
        {
          email,
          userType,
          isReturning,
          fullName,
          phone,
          status: 'booked'
        },
        { new: true }
      );

    if (!updated) {
      return res.status(404).json({ 
        message: 'Turno no encontrado' 
      });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    });
  }
};

// Profesional cancela y libera el turno
const cancel = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = 
      await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ 
        message: 'No encontrado' 
      });
    }

    // Si está libre, lo desactivamos (soft delete)
    if (appointment.status === 'available') {
      appointment.status = 'inactive';
      await appointment.save();
      return res.status(200).json({ 
        message: 'Horario desactivado' 
      });
    }

    // Si está inactivo, lo volvemos a activar
    if (appointment.status === 'inactive') {
      appointment.status = 'available';
      await appointment.save();
      return res.status(200).json({ 
        message: 'Horario reactivado' 
      });
    }

    // Si está ocupado (booked), lo liberamos
    appointment.status = 'available';
    appointment.email = undefined;
    appointment.userType = undefined;
    appointment.isReturning = undefined;
    appointment.fullName = undefined;
    appointment.phone = undefined;

    await appointment.save();
    res.status(200).json({ 
      message: 'Turno liberado' 
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    });
  }
};

const createBulk = async (req, res) => {
  try {
    const { slots } = req.body; 
    
    // ordered: false permite que si uno falla 
    // por duplicado, continúe con el resto
    const newSlots = 
      await Appointment.insertMany(slots, { 
        ordered: false 
      });
      
    res.status(201).json(newSlots);
  } catch (error) {
    // Si el error es por duplicados (código 11000)
    // igual devolvemos éxito porque salteó los viejos
    if (error.code === 11000) {
      return res.status(201).json({
        message: 'Agenda actualizada (se omitieron duplicados)'
      });
    }
    res.status(500).json({ 
      error: error.message 
    });
  }
};


export default {
  getAll,
  create,
  createBulk,
  cancel
};
