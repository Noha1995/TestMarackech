//import * as Localization from 'expo-localization';
import i18n from 'i18n-js';

import Fr from './Fr.json'
import En from './En.json'


 // Set the key-value pairs for the different languages you want to support.
 i18n.translations = {
  en: En,
  fr: Fr,
};
// // Set the locale once at the beginning of your app.
 i18n.locale = "en";

// When a value is missing from a language it'll fallback to another language with the key present.
i18n.fallbacks = true;
export const  t=i18n.t
