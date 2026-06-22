import {Router} from 'express'
import controller from '../controllers/appointments.js'

const router = Router();

router.get('/', controller.getAll);
router.post('/', controller.create);
router.delete('/:id', controller.cancel);

router.post('/bulk', controller.createBulk); 
router.delete('/:id', controller.cancel);

export default router