import { Router } from 'express';
import { 
  renderDashboard, 
  renderSetup, 
  renderLogin 
} from '../controllers/views.js';

const viewsRoutes = Router();

viewsRoutes.get('/dashboard', renderDashboard);
viewsRoutes.get('/setup', renderSetup);
viewsRoutes.get('/login', renderLogin);

export default viewsRoutes;