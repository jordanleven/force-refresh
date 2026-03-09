import { createI18n } from 'vue-i18n';
import en from '@/locale/en.json';

const messages = {
  en,
};

export default () => createI18n({
  legacy: true,
  locale: 'en',
  messages,
});
