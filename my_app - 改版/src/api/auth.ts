import request from './request'

// ── 真实接口（后续替换）────────────────────────────────────────────────────────
export const loginByPhone = (data: { phone: string; password: string }) =>
  request.post('/auth/login', data)

// ── 图形验证码（后续替换为真实接口）──────────────────────────────────────────
const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const fetchCaptcha = (): Promise<{ captchaId: string; code: string }> =>
  new Promise(resolve =>
    setTimeout(() => {
      const code = Array.from({ length: 4 }, () =>
        CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)]
      ).join('')
      resolve({ captchaId: `cap_${Date.now()}`, code })
    }, 80)
  )

export const register = (data: { phone: string; code: string; password: string }) =>
  request.post('/auth/register', data)

// ── 旧接口保留兼容 ─────────────────────────────────────────────────────────────
export const login = (data: { username: string; password: string }) =>
  request.post('/auth/login', data)
