import express from 'express'
import mongoose from 'mongoose'
import appointmentRoutes from './routes/appointments.js'
import patientRoutes from './routes/patients.js'
import viewsRoutes from './routes/views.js'
import dotenv from 'dotenv'
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

const MONGO_URI = process.env.MONGO_URI

mongoose.connect(MONGO_URI)
.then(() => {
  console.log('Connected to MongoDB')
})
.catch((error) => {
  console.error('Error connecting to MongoDB:', error)
})


app.use(express.json())
app.use(express.static(path.join(__dirname, "public")));
app.use('/api/appointments', appointmentRoutes)
app.use("/api/patients", patientRoutes);
app.use('/', viewsRoutes)
app.listen(PORT, () => {
  console.log(`Server listening on https://turnero-backend-o6mj.onrender.com`)
})
