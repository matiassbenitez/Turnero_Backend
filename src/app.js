import express from 'express'
import mongoose from 'mongoose'
import appointmentRoutes from './routes/appointments.js'
import patientRoutes from './routes/patients.js'
import viewsRoutes from './routes/views.js'
import dotenv from 'dotenv'

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
app.use('/api/appointments', appointmentRoutes)
app.use("/api/patients", patientRoutes);
app.use('/', viewsRoutes)
app.use(express.static(path.join(__dirname, "public")));
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})
