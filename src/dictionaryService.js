const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const converter = require('xml-js');
const alphabetize = require('alphabetize-object-keys');
const dictionaryHtmlEncoder = require('./dictionaryHtmlEncoder');

const DICTIONARY_TEMPLATE = {
  _declaration: {
    _attributes: {
      encoding: 'UTF-8',
      version: '1.0'
    }
  },
  'jcr:root':
    {
      _attributes:
        {
          'jcr:language': 'en',
          'jcr:mixinTypes': '[mix:language]',
          'jcr:primaryType': 'sling:Folder',
          'xmlns:jcr': 'http://www.jcp.org/jcr/1.0',
          'xmlns:mix': 'http://www.jcp.org/jcr/mix/1.0',
          'xmlns:sling': 'http://sling.apache.org/jcr/sling/1.0'
        }
    }
};

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';

const XML_TO_JSON_OPTIONS = {
  compact: true
};

const JSON_TO_XML_OPTIONS = {
  compact: true,
  spaces: 4,
  indentAttributes: true,
  ignoreDeclaration: true,
  attributeValueFn: dictionaryHtmlEncoder
};

function createEntry (key, value) {
  return {
    '_attributes': {
      'jcr:primaryType': 'sling:MessageEntry',
      'sling:key': key,
      'sling:message': value
    }
  };
}

function putEntry (dict, key, value) {
  const entry = this.createEntry(key, value);
  dict['jcr:root'][key] = entry;
  return dict;
}

function hasEntry (dict, key) {
  return !!getEntry(dict, key);
}

function getEntry (dict, key) {
  return dict['jcr:root'][key];
}

function create (locale) {
  const dict = _.cloneDeep(DICTIONARY_TEMPLATE);
  dict['jcr:root']['_attributes']['jcr:language'] = locale.getLocaleISOCode();
  return dict;
}

function sort (dict) {
  return alphabetize(dict);
}

function listDict (_path) {
  const normalizedPath = path.resolve(_path);
  const paths = fs.readdirSync(normalizedPath);
  return _.filter(paths, (item) => {
    return !item.startsWith('.') && item.endsWith('.xml');
  });
}

function exists (_path) {
  const normalizedPath = path.resolve(_path);
  return fs.existsSync(normalizedPath);
}

async function readDict (source) {
  return new Promise((resolve, reject) => {
    const normalizedPath = path.resolve(source);
    fs.readFile(normalizedPath, 'utf-8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          const json = converter.xml2js(data, XML_TO_JSON_OPTIONS);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      }
    });
  });
}

async function saveDict (jsonDict, target) {
  function isValidDictionary (dict) {
    return _.isObject(dict) && dict['_declaration'] && dict['jcr:root'];
  }

  return new Promise((resolve, reject) => {
    try {
      if (!isValidDictionary(jsonDict)) {
        reject(new Error('Given dictionary is not an object'));
        return;
      }
      let xml = converter.js2xml(jsonDict, JSON_TO_XML_OPTIONS);
      xml = XML_DECLARATION + xml;
      xml = _.replace(xml, /\n[ ]*\/>/mg, '/>');
      xml = _.replace(xml, /\n[ ]*>/mg, '>');
      fs.writeFile(target, xml+'\n', 'utf-8', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  create,
  createEntry,
  putEntry,
  hasEntry,
  getEntry,
  sort,
  saveDict,
  readDict,
  exists,
  listDict
};
