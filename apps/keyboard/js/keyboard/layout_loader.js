'use strict';

/* global Promise, KeyboardEvent, KeyEvent */

(function(exports) {

// Keyboard layouts register themselves in this object, for now.
var Keyboards = {};

Keyboards.alternateLayout = {
  alt: {
    '0': ['º'],
    '$': ['€', '£', '¥'],
    '?': ['¿'],
    '!': ['¡']
  },
  keys: [
    [
      { value: '1' }, { value: '2' }, { value: '3' }, { value: '4' },
      { value: '5' }, { value: '6' }, { value: '7' }, { value: '8' },
      { value: '9' }, { value: '0' }
    ], [
      { value: '@', hidden: ['email'] }, { value: '#' }, { value: '$' },
      { value: '%' },
      { value: '&' }, { value: '*' }, { value: '-' }, { value: '+' },
      { value: '(' }, { value: ')' }, { value: '_', visible: ['email'] }
    ], [
      { value: 'ALT', ratio: 1.5, keyCode: KeyEvent.DOM_VK_ALT },
      { value: '!' }, { value: '\"' }, { value: '\'' }, { value: ':' },
      { value: ';' }, { value: '/' }, { value: '?' },
      { value: '⌫', ratio: 1.5, keyCode: KeyEvent.DOM_VK_BACK_SPACE }
    ], [
      { value: '&nbsp', ratio: 8, keyCode: KeyboardEvent.DOM_VK_SPACE },
      { value: '↵', ratio: 2, keyCode: KeyEvent.DOM_VK_RETURN }
    ]
  ]
};

Keyboards.symbolLayout = {
  keys: [
    [
      { value: '`' }, { value: '~' }, { value: '_' }, { value: '^' },
      { value: '±' }, { value: '|' }, { value: '[' }, { value: ']' },
      { value: '{' }, { value: '}' }
    ], [
      { value: '°' }, { value: '²' }, { value: '³' }, { value: '©' },
      { value: '®' }, { value: '§' }, { value: '<' }, { value: '>' },
      { value: '«' }, { value: '»' }
    ], [
      { value: 'ALT', ratio: 1.5, keyCode: KeyEvent.DOM_VK_ALT },
      { value: '¥' }, { value: '€' }, { value: '£' }, { value: '$' },
      { value: '¢' }, { value: '\\' }, { value: '=' },
      { value: '⌫', ratio: 1.5, keyCode: KeyEvent.DOM_VK_BACK_SPACE }
    ], [
      { value: '&nbsp', ratio: 8, keyCode: KeyboardEvent.DOM_VK_SPACE },
      { value: '↵', ratio: 2, keyCode: KeyEvent.DOM_VK_RETURN }
    ]
  ]
};

Keyboards.numberLayout = {
  width: 3,
  keyClassName: 'big-key special-key',
  keys: [
    [ { value: '1'}, { value: '2'}, { value: '3'} ],
    [ { value: '4'}, { value: '5'}, { value: '6'} ],
    [ { value: '7'}, { value: '8'}, { value: '9'} ],
    [ { value: '.', altNote: ',' },
      { value: '0', altNote: '-' },
      { value: '⌫', keyCode: KeyEvent.DOM_VK_BACK_SPACE } ]
  ],
  alt: {
    '.' : [','],
    '0' : ['-']
  }
};

Keyboards.pinLayout = {
  width: 3,
  keyClassName: 'big-key special-key',
  keys: [
    [ { value: '1'}, { value: '2'}, { value: '3'} ],
    [ { value: '4'}, { value: '5'}, { value: '6'} ],
    [ { value: '7'}, { value: '8'}, { value: '9'} ],
    [ { value: ''}, { value: '0'},
      { value: '⌫', keyCode: KeyEvent.DOM_VK_BACK_SPACE } ]
  ]
};

Keyboards.telLayout = {
  width: 3,
  keyClassName: 'big-key special-key',
  keys: [
    [ { value: '1'}, { value: '2'}, { value: '3'} ],
    [ { value: '4'}, { value: '5'}, { value: '6'} ],
    [ { value: '7', altNote: '#'},
      { value: '8', altNote: '-'},
      { value: '9', altNote: '*'} ],
    [ { value: '(', altNote: ')'},
      { value: '0', altNote: '+'},
      { value: '⌫', keyCode: KeyEvent.DOM_VK_BACK_SPACE } ]
  ],
  alt: {
    '7' : ['#'],
    '8' : ['-'],
    '9' : ['*'],
    '(' : [')'],
    '0' : ['+']
  }
};

var LayoutLoader = function() {
};

LayoutLoader.prototype.SOURCE_DIR = './js/layouts/';

LayoutLoader.prototype.start = function() {
  this._initializedLayouts = {};
  this._layoutsPromises = {};
  this.initLayouts();
};

LayoutLoader.prototype.initLayouts = function() {
  // Reset the exposed Keyboards object and collect all layouts
  // in the original one.
  var Keyboards = exports.Keyboards;
  exports.Keyboards = {};
  var layoutName;
  for (layoutName in Keyboards) {
    if (this._initializedLayouts[layoutName]) {
      console.warn('LayoutLoader: ' + layoutName + ' is overwritten.');
    }
    this._initializedLayouts[layoutName] = Keyboards[layoutName];
    this._normalizeAlternatives(layoutName);

    // Create a promise so that these panels can be loaded async
    // even if they are not loaded with file of their name.
    if (!this._layoutsPromises[layoutName]) {
      this._layoutsPromises[layoutName] =
        Promise.resolve(this._initializedLayouts[layoutName]);
    }
  }
};

// This function go through the 'alt' property of the layout and normalize
// our existing mixed notation into arrays, so others won't have to do it again.
LayoutLoader.prototype._normalizeAlternatives = function(layoutName) {
  var layout = this.getLayout(layoutName);

  var alt = layout.alt = layout.alt || {};
  var upperCase = layout.upperCase = layout.upperCase || {};
  var keys = Object.keys(alt);
  keys.forEach(function(key) {
    var alternatives = alt[key];

    // Split alternatives
    // If the alternatives are delimited by spaces, it means that one or more
    // of them is more than a single character long.
    if (!Array.isArray(alternatives)) {
      if (alternatives.indexOf(' ') !== -1) {
        alternatives = alternatives.split(' ');

        // If there is just a single multi-character alternative, it will have
        // trailing whitespace which we have to discard here.
        if (alternatives.length === 2 && alternatives[1] === '') {
          alternatives.pop();
        }
      } else {
        // No spaces, so all of the alternatives are single characters
        alternatives = alternatives.split('');
      }
    }

    alt[key] = alternatives;

    var upperCaseKey = upperCase[key] || key.toUpperCase();
    if (!alt[upperCaseKey]) {
      var needDifferentUpperCaseLockedAlternatives = false;
      // Creating an array for upper case too.
      // XXX: The original code does not respect layout.upperCase here.
      alt[upperCaseKey] = alternatives.map(function(key) {
        if (key.length === 1) {
          return key.toUpperCase();
        }

        // The 'l·l' key in the Catalan layout needs to be
        // 'L·l' in upper case mode and 'L·L' in upper case locked mode.
        // (see http://bugzil.la/896363#c19)
        // If that happens we will create a different array for
        // upper case locked mode.

        // Last chance for figuring out if we need a different list of
        // alternatives; if key.substr(1) has no upper case form,
        // (e.g. R$ key) we should be able to skip this.
        needDifferentUpperCaseLockedAlternatives =
          needDifferentUpperCaseLockedAlternatives ||
          (key.substr(1).toUpperCase() !== key.substr(1));

        // We only capitalize the first character of the key in
        // the normalization here.
        return key[0].toUpperCase() + key.substr(1);
      });

      // If we really need an special upper case locked alternatives,
      // do it here and attach that as a property of the
      // alt[upperCaseKey] array/object. Noted that this property of the array
      // cannot be represented in JSON so it's not visible in JSON.stringify().
      if (needDifferentUpperCaseLockedAlternatives) {
        alt[upperCaseKey].upperCaseLocked = alternatives.map(function(key) {
          return key.toUpperCase();
        });
      }
    }
  }, this);
};

LayoutLoader.prototype.getLayout = function(layoutName) {
  return this._initializedLayouts[layoutName];
};

// This method returns a promise and resolves when the IMEngine script
// is loaded.
LayoutLoader.prototype.getLayoutAsync = function(layoutName) {
  if (this._layoutsPromises[layoutName]) {
    return this._layoutsPromises[layoutName];
  }

  var p = new Promise(function(resolve, reject) {
    var script = document.createElement('script');
    script.onload = function() {
      this.initLayouts();
      resolve(this._initializedLayouts[layoutName]);
    }.bind(this);
    script.onerror = function() {
      this._layoutsPromises[layoutName] = null;
      console.error('LayoutLoader: unable to load ' + layoutName + '.');
      reject();
    }.bind(this);
    script.src = this.SOURCE_DIR + layoutName + '.js';
    document.body.appendChild(script);
  }.bind(this));

  this._layoutsPromises[layoutName] = p;
  return p;
};

// Expose Keyboards object
exports.Keyboards = Keyboards;

exports.LayoutLoader = LayoutLoader;

})(window);
