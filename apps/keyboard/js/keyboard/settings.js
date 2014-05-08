'use strict';

/* global Promise */

(function(exports) {

/**
 * SettingsPromiseManager wraps Settings API into methods return Promises,
 * so we can easily mix and match these async actions.
 *
 * It also manages the lock for us.
 *
 */
var SettingsPromiseManager = function SettingsPromiseManager() {
  this._lock = null;
};

SettingsPromiseManager.prototype._getLock = function() {
  // If there is a lock present we return that
  if (this._lock && !this._lock.closed) {
    return this._lock;
  }

  // If there isn't we return one.
  var settings = window.navigator.mozSettings;
  this._lock = settings.createLock();

  return this._lock;
};

SettingsPromiseManager.prototype.get = function(obj) {
  if (typeof obj === 'string') {
    return this.getOne();
  }

  if (typeof obj !== 'object') {
    throw new Error('SettingsPromiseManager.get: ' +
      'require object, array, or string.');
  }

  var arr = Array.isArray(obj) ? obj : Object.keys(obj);
  var promise = Promise.all(arr.map(function(key) {
    return this.getOne(key);
  }, this));

  return promise;
};

SettingsPromiseManager.prototype.getOne = function(key) {
  var promise = new Promise(function(resolve, reject) {
    var req = this._getLock().get(key);
    req.onsuccess = function() {
      resolve(req.result[key]);
    };
    req.onerror = function() {
      reject();
    };
  }.bind(this));

  return promise;
};

SettingsPromiseManager.prototype.set = function(obj, value) {
  if (typeof obj === 'string') {
    return this.setOne(obj, value);
  }

  if (typeof obj !== 'object') {
    throw new Error('SettingsPromiseManager.set: require object.');
  }

  var promise = new Promise(function(resolve, reject) {
    var req = this._getLock().set(obj);
    req.onsuccess = function() {
      resolve();
    };
    req.onerror = function() {
      reject();
    };
  }.bind(this));

  return promise;
};

SettingsPromiseManager.prototype.setOne = function(key, value) {
  var obj = {};
  obj[key] = value;
  return this.set(obj);
};

var SettingsManagerBase = function() {
  this._callbacks = null;
};

SettingsManagerBase.prototype.onsettingschange = null;

SettingsManagerBase.prototype.KEYS = [];
SettingsManagerBase.prototype.PROPERTIES = [];

SettingsManagerBase.prototype.initSettings = function() {
  var promise = new Promise(function(resolve, reject) {
    this.promiseManager.get(this.KEYS)
    .then(function(results) {
      results.forEach(function(value, i) {
        this[this.PROPERTIES[i]] = value;
      }, this);

      this.startObserve();

      resolve();
    }.bind(this),
    reject);
  }.bind(this));

  return promise;
};

SettingsManagerBase.prototype.startObserve = function() {
  var callbacks = this._callbacks = [];

  this.KEYS.forEach(function(key, i) {
    var callback = function(e) {
      this[this.PROPERTIES[i]] = e.settingsValue;
      if (typeof this.onsettingschange === 'function') {
        this.onsettingschange();
      }
    }.bind(this);

    navigator.mozSettings.addObserver(key, callback);
    callbacks.push(callback);
  }, this);
};

SettingsManagerBase.prototype.stopObserve = function() {
  if (!this._callbacks) {
    return;
  }

  var callbacks = this._callbacks;
  this.KEYS.forEach(function(key, i) {
    navigator.mozSettings.removeObserver(key, callbacks[i]);
  }, this);

  this._callbacks = null;
};

var SoundFeedbackSettings = function() {};
SoundFeedbackSettings.prototype = new SettingsManagerBase();
SoundFeedbackSettings.prototype.KEYS = [
  'keyboard.clicksound', 'audio.volume.notification'];
SoundFeedbackSettings.prototype.PROPERTIES = [
  'clickEnabled', 'isSoundEnabled'];

var VibrationFeedbackSettings = function() {};
VibrationFeedbackSettings.prototype = new SettingsManagerBase();
VibrationFeedbackSettings.prototype.KEYS = ['keyboard.vibration'];
VibrationFeedbackSettings.prototype.PROPERTIES = ['vibrationEnabled'];

var IMEngineSettings = function() { };
IMEngineSettings.prototype = new SettingsManagerBase();
IMEngineSettings.prototype.KEYS = [
  'keyboard.wordsuggestion', 'keyboard.autocorrect'];
IMEngineSettings.prototype.PROPERTIES = [
  'suggestionsEnabled', 'correctionsEnabled'];

exports.SettingsPromiseManager = SettingsPromiseManager;
exports.SettingsManagerBase = SettingsManagerBase;
exports.SoundFeedbackSettings = SoundFeedbackSettings;
exports.VibrationFeedbackSettings = VibrationFeedbackSettings;
exports.IMEngineSettings = IMEngineSettings;

})(window);
