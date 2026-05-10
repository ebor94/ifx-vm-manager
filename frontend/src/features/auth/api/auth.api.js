// Wrappers HTTP de la feature auth.
// El cliente axios ya está configurado con withCredentials:true en shared/api,
// así que la cookie HttpOnly del JWT viaja automáticamente.

import { http } from '@shared/api/http.client'

export const login    = (email, password) => http.post('/login', { email, password })
export const logout   = ()                 => http.post('/logout')
export const fetchMe  = ()                 => http.get('/me')
