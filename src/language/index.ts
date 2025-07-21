/*
 * @Author: June
 * @Description:
 * @Date: 2023-10-29 12:18:14
 * @LastEditors: June
 * @LastEditTime: 2023-11-01 12:01:24
 */
import { createI18n } from 'vue-i18n';
import zh from 'view-ui-plus/dist/locale/zh-CN';
import en from 'view-ui-plus/dist/locale/en-US'; //新版本把'iview'改成'view-design'
// @ts-expect-error - view-ui-plus Spanish locale may not have proper TypeScript definitions
import es from 'view-ui-plus/dist/locale/es-ES';
// @ts-expect-error - view-ui-plus Portuguese locale may not have proper TypeScript definitions
import pt from 'view-ui-plus/dist/locale/pt-PT';
import US from './en.json';
import CN from './zh.json';
import ES from './es.json';
import PT from './pt.json';
import { getLocal, setLocal } from '@/utils/local';
import { LANG } from '@/config/constants/app';

const messages = {
  en: Object.assign(US, en), //将自己的英文包和iview提供的结合
  zh: Object.assign(CN, zh), //将自己的中文包和iview提供的结合
  es: Object.assign(ES, es), //将自己的西班牙语包和iview提供的结合
  pt: Object.assign(PT, pt), //将自己的葡萄牙语包和iview提供的结合
};

function getLocalLang() {
  let localLang = getLocal(LANG);
  if (!localLang) {
    let defaultLang = navigator.language;
    if (defaultLang) {
      // eslint-disable-next-line prefer-destructuring
      defaultLang = defaultLang.split('-')[0];
      // eslint-disable-next-line prefer-destructuring
      localLang = defaultLang.split('-')[0];
    }
    setLocal(LANG, defaultLang);
  }
  return localLang;
}
const lang = getLocalLang();

const i18n = createI18n({
  allowComposition: true,
  globalInjection: true,
  legacy: false,
  locale: lang,
  messages,
});

export default i18n;
export const t = (key: any) => {
  return i18n.global.t(key);
};
