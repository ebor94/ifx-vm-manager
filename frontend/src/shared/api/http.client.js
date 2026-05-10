// Cliente HTTP compartido — axios con cookies automáticas.
// withCredentials: true es OBLIGATORIO para que el navegador envíe la
// cookie HttpOnly del JWT en cada request cross-origin (frontend en
// :5173, backend en :3000). Sin esto, /me, /vms, etc. responderían 401.

import axios from 'axios'
import { API_URL } from '@shared/config/constants'

export const http = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 10_000
})

// Decisión: NUNCA setear el token manualmente en headers.
// Si el backend responde 401, el caller (auth.store) decide la acción
// (redirect a login). No hacemos refresh token — el JWT dura 8h y al
// expirar el usuario re-loggea, que es aceptable para esta app.
