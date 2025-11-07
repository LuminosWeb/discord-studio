import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import "./global.css";

// Attendre que le DOM soit chargé
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);