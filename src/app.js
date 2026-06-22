import express from 'express'
import mongoose from 'mongoose'
import router from './routes/appointments.js'
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
app.use('/api/appointments', router)
app.use(express.static('src/public'));
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})
