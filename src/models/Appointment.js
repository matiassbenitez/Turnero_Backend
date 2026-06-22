import mongoose from 'mongoose'

const AppointmentSchema = 
  new mongoose.Schema({
    dateTime: { 
      type: String, 
      required: true,
      unique: true // <-- Evita duplicados
    },
    status: { 
      type: String, 
      default: 'available' 
    },
    email: String,
    userType: String,
    isReturning: String,
    fullName: String,
    phone: String
  });
  
const Appointment = mongoose.model(
  'Appointment', 
  AppointmentSchema
);

export default Appointment