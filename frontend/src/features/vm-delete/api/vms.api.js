import { http } from '@shared/api/http.client'

export const remove = (id) => http.delete(`/vms/${id}`)
