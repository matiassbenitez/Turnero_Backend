import mongoose from 'mongoose';

const AppointmentSchema = 
  new mongoose.Schema({
    dateTime: { 
      type: String, 
      required: true,
      unique: true 
    },
    status: { 
      type: String, 
      enum: ['available', 'booked', 'inactive'],
      default: 'available' 
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      default: null
    },
    appointmentType: {
      type: String,
      enum: ['consultorio', 'domicilio'],
      default: 'consultorio'
    }
  }, { 
    timestamps: true 
  });

export default mongoose.model(
  'Appointment', 
  AppointmentSchema
);