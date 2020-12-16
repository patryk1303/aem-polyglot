const fetch = require('node-fetch');

const TranslateService = require('./TranslateService');
const dictionaryService = require('../dictionaryService');

const API = 'https://api.mymemory.translated.net/get';

class MyMemoryTranslateService extends TranslateService {
  async translate (key, text, from, to, options) {
    return new Promise((resolve, reject) => {
      this.log.addEntry(key, from, text);

      const URL = this.getUrl(this.getParams(text, from, to, options.email));

      fetch(URL)
        .then(data => data.json())
        .then(data => {
          const translatedText = data.responseData.translatedText;
          this.log.addEntry(key, to, translatedText);
          resolve(dictionaryService.createEntry(key, translatedText));
        })
        .catch(err => reject(err));
    });
  }

  getUrl (params) {
    return `${API}?${params}`;
  }

  getParams (text, from, to, email = '') {
    const params = new URLSearchParams();

    params.append('q', text);
    params.append('langpair', `${from}|${to}`);

    if (email) {
      params.append('de', email)
    }

    return params.toString();
  }
}

module.exports = MyMemoryTranslateService;
