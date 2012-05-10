'use strict';

var dictionary;
var affData;
var dicData;

var debug = function(str) {
  self.postMessage('Worker: ' + str);
}

/* load typo.js */
importScripts('typo.js');

function load(lang) {
  debug('Load');
  if (!affData || !dicData || typeof Typo == 'undefined')
    return;

  dictionary = new Typo(lang, affData, dicData);

  debug('Loaded');

  // remove our own references
  affData = undefined;
  dicData = undefined;
};

function loadDic(lang) {
  debug('LoadDic: ' + lang);

  /* load dictionaries */
  var affXhr = new XMLHttpRequest();
  affXhr.open('GET', ('./dictionaries/' + lang + '/' + lang + '.aff'), true);
  affXhr.overrideMimeType('text/plain; charset=utf-8');
  affXhr.onreadystatechange = function xhrReadystatechange(ev) {
    if (affXhr.readyState !== 4)
      return;
    affData = affXhr.responseText;
    debug('aff file loaded, length: ' + affData.length);
    load(lang);
    affXhr = null;
  }
  affXhr.send();

  var dicXhr = new XMLHttpRequest();
  dicXhr.open('GET', ('./dictionaries/' + lang + '/' + lang + '.dic'), true);
  dicXhr.responseType = 'text';
  dicXhr.overrideMimeType('text/plain; charset=utf-8');
  dicXhr.onreadystatechange = function xhrReadystatechange(ev) {
    if (dicXhr.readyState !== 4)
      return;
    dicData = dicXhr.responseText;
    debug('dic file loaded, length: ' + dicData.length);
    load(lang);
    dicXhr = null;
  }
  dicXhr.send();
}

self.onmessage = function (evt) {
  if (!dictionary)
    return loadDic(evt.data);
  debug('Got word: ' + evt.data);
  self.postMessage(dictionary.suggest(evt.data));
};
