import VueI18n from 'vue-i18n';
import en from '@/locale/en.json';

const messages = {
  en,
};

export default () => new VueI18n({
  locale: 'en',
  messages,
});
