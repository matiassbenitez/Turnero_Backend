import mongoose from 'mongoose';
import Appointment from './scr/models/Appointment.js';

const MONGO_URI = 'mongodb://localhost:27017/appointments'

const mockAppointments = [
  { dateTime: '2026-06-15 09:00' },
  { dateTime: '2026-06-15 10:00' },
  { dateTime: '2026-06-15 11:00' },
  { dateTime: '2026-06-16 15:00' },
  { dateTime: '2026-06-16 16:00' }
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    
    // Limpia la base para no duplicar
    await Appointment.deleteMany({});
    
    // Inserta los turnos disponibles
    await Appointment.insertMany(
      mockAppointments
    );
    
    console.log('Database seeded successfully!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedDB();