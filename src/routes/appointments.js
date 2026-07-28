import {Router} from 'express'
import controller from '../controllers/appointments.js'

const appointmentRoutes = Router();

appointmentRoutes.get('/', controller.getAll);
appointmentRoutes.post('/', controller.create);
appointmentRoutes.delete('/:id', controller.cancel);

appointmentRoutes.post('/bulk', controller.createBulk); 
appointmentRoutes.delete('/:id', controller.cancel);

export default appointmentRoutes