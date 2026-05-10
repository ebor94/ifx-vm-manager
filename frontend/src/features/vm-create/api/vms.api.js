import { http } from '@shared/api/http.client'

export const create = async (vm) => {
  const { data } = await http.post('/vms', vm)
  return data.vm
}
