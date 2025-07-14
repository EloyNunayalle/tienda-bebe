import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from "./contexts/AuthContext";
import {CartProvider} from "./contexts/CartContext.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <AuthProvider>
          <CartProvider> {/* ⬅ Envuelve aquí tu app */}
              <App />
          </CartProvider>
      </AuthProvider>
  </StrictMode>,
)
