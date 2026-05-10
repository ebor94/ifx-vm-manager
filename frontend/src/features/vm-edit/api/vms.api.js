import { http } from '@shared/api/http.client'

export const update = async (id, fields) => {
  const { data } = await http.put(`/vms/${id}`, fields)
  return data.vm
}
