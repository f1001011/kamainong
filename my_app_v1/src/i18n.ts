import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zh from './locales/zh.json'

const SUPPORTED = ['zh', 'en'] as const
export type Locale = typeof SUPPORTED[number]

const LOCALE_KEY = 'app_locale'

function getInitialLocale(): Locale {
    const cached = localStorage.getItem(LOCALE_KEY)
    return SUPPORTED.includes(cached as Locale) ? (cached as Locale) : 'zh'
}

export const i18n = createI18n({
    legacy: false,
    locale: getInitialLocale(),
    fallbackLocale: 'en',
    messages: { zh, en }
})

export function setLocale(lang: string) {
    const locale = SUPPORTED.includes(lang as Locale) ? (lang as Locale) : 'zh'
    i18n.global.locale.value = locale
    localStorage.setItem(LOCALE_KEY, locale)
}
