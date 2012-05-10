'use strict';

var dictionary;
var affData;
var dicData;
var lang;

var debug = function(str) {
  self.postMessage('Worker: ' + str);
}

/* load typo.js */
importScripts('typo.js');

function load() {
  debug('Load');
  if (!affData || !dicData || !lang || typeof Typo == 'undefined')
    return;

  dictionary = new Typo(lang, affData, dicData);

  debug('Loaded');

  // remove our own references
  affData = undefined;
  dicData = undefined;
};

self.onmessage = function (evt) {
  if (typeof evt.data !== 'string') {
    var data = evt.data;
    debug('Got data: ' + data.name + ', length: ' + data.value.length);
    self[data.name] = data.value;
    load();
    return;
  }

  debug('Got word: ' + evt.data);
  self.postMessage(dictionary.suggest(evt.data));
};
