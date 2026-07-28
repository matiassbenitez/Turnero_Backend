import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getPublicPath = (file) => 
  path.join(__dirname, '../public', file);

export const renderDashboard = (req, res) => {
  res.sendFile(getPublicPath('dashboard.html'));
};

export const renderSetup = (req, res) => {
  res.sendFile(getPublicPath('setup.html'));
};

export const renderLogin = (req, res) => {
  res.sendFile(getPublicPath('login.html'));
};