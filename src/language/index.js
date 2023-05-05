import { createI18n } from 'vue-i18n'
import zh from './zh.json'
import en from './en.json'
import es from './es.json'
import id from './id.json'
import ja from './ja.json'
import ko from './ko.json'
import ru from './ru.json'
import tr from './tr.json'
import tw from './tw.json'
import vi from './vi.json'
const messages = {
  'en_US': {
    ...en,
  },
  'zh_CN': {
    ...zh,
  },
  'jp': {
    ...ja
  },
  'kor': {
    ...ko
  },
  'ru': {
    ...ru
  },
  'id': {
    ...id
  },
  'vie': {
    ...vi
  },
  'tr': {
    ...tr
  },
  'spa': {
    ...es
  }
}

const i18n = createI18n({
  legacy: false,
  locale: uni.getStorageSync('language') || 'zh_CN',
  fallbackLocale: 'zh_CN',
  silentTranslationWarn: true, // 关闭警告，烦死了
  messages,
})
export const translate = (key) => {
  if (!key) {
    return ''
  }
  return i18n.global.t(key)
}

export default i18n
