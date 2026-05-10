// Entry point del frontend.
// Smoke imports: verifica que las capas shared/ y entities/vm/ resuelven y que
// Tailwind + axios + Vite envs están operativos.
// El bootstrap real (createApp + Pinia + Router + mount) llega en el Paso 11.

import './app/styles/globals.css'
import { http } from '@shared/api/http.client'
import { API_URL } from '@shared/config/constants'

// eslint-disable-next-line no-console
console.log('[frontend] shared layer loaded. API base:', http.defaults.baseURL || API_URL)
