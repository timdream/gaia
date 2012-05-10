'use strict';

(function () {

  var debugging = true;
  var debug = function(str) {
    if (!debugging)
      return;

    if (window.dump)
      window.dump('typoJS: ' + str + '\n');
    if (console && console.log) {
      console.log('typoJS: ' + str);
      if (arguments.length > 1)
        console.log.apply(this, arguments);
    }
  };

  /* for non-Mozilla browsers */
  if (!KeyEvent) {
    var KeyEvent = {
      DOM_VK_BACK_SPACE: 0x8,
      DOM_VK_RETURN: 0xd,
      DOM_VK_SPACE: 0x20
    };
  }


  var SpellChecker = function spellchecker() {
    var settings;
    var dictionary;

    var currentWord = '';

    this.init = function spellchecker_init(options) {
      settings = options;
      var affData;
      var dicData;

      var load = function load() {
        if (!affData || !dicData || typeof Typo == 'undefined')
          return;
        debug('load');
        dictionary = new Typo(settings.lang, affData, dicData);
      };

      /* load typo.js */
      var script = document.createElement('script');
      script.src = settings.path + '/typo.js';
      script.addEventListener('load', function typoJSLoaded() {
        script.removeEventListener('load', typoJSLoaded);
        load();
      });
      document.body.appendChild(script);

      /* load dictionaries */
      var affXhr = new XMLHttpRequest();
      affXhr.open('GET', (settings.path + '/dictionaries/' + settings.lang + '/' + settings.lang + '.aff'), true);
      affXhr.overrideMimeType('text/plain; charset=utf-8');
      affXhr.onreadystatechange = function xhrReadystatechange(ev) {
        if (affXhr.readyState !== 4)
          return;
        affData = affXhr.responseText;
        load();
        affXhr = null;
      }
      affXhr.send();

      var dicXhr = new XMLHttpRequest();
      dicXhr.open('GET', (settings.path + '/dictionaries/' + settings.lang + '/' + settings.lang + '.dic'), true);
      dicXhr.responseType = 'text';
      dicXhr.overrideMimeType('text/plain; charset=utf-8');
      dicXhr.onreadystatechange = function xhrReadystatechange(ev) {
        if (dicXhr.readyState !== 4)
          return;
        dicData = dicXhr.responseText;
        load();
        dicXhr = null;
      }
      dicXhr.send();
    };

    var empty = function spellchecker_empty() {
      debug('Empty');
      currentWord = '';
    };

    this.empty = empty;

    var doSpellCheck = function () {
      setTimeout(function spellcheckTheWord() {
        debug('output suggestion.');

        var suggestions = dictionary.suggest(currentWord);
        var candidates = [];
        suggestions.forEach(function (word) {
          candidates.push([word]);
        });
        settings.sendCandidates(candidates);
      });
    };

    this.click = function spellchecker_click(keyCode) {
      debug('Clicked ' + keyCode);

      switch (keyCode) {
        case KeyEvent.DOM_VK_RETURN:
        case KeyEvent.DOM_VK_SPACE:
          empty();
          settings.sendCandidates([]);
          break;
        case KeyEvent.DOM_VK_BACK_SPACE:
          currentWord = currentWord.substr(0, currentWord.length - 1);
          debug('current word: ' + currentWord);
          doSpellCheck();
          break;
        default:
          currentWord += String.fromCharCode(keyCode);
          debug('current word: ' + currentWord);
          doSpellCheck();
          break;
      }
    };

    this.select = function (text, type) {
      var i = currentWord.length;
      while (i--) {
        settings.sendKey(KeyEvent.DOM_VK_BACK_SPACE);
      }

      settings.sendString(text + ' ');
      empty();
      settings.sendCandidates([]);
    };
  };

  var typoJSWrapper = new SpellChecker();

  // Expose JSZhuyin as an AMD module
  if (typeof define === 'function' && define.amd)
    define('typo-js', [], function() { return typoJSWrapper; });

  // Expose to IMEManager if we are in Gaia homescreen
  if (typeof IMEManager !== 'undefined')
    IMEManager.SpellCheckers['typo-js'] = typoJSWrapper;
})();
