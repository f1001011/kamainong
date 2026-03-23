import request from './request'

export const uploadWithdrawProof = (formData: FormData) => request.post('/upload/withdrawProof', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
