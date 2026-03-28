import request from './request'

export async function getSystemConfig(key: string): Promise<string> {
  const res = await request.get('/config', { params: { key } })

  if (typeof res === 'string') return res
  if (typeof res?.value === 'string') return res.value
  if (typeof res?.content === 'string') return res.content
  if (typeof res?.[key] === 'string') return res[key]

  return ''
}
