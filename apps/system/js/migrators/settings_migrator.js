'use strict';
(function(exports) {

  /**
   * SettingsMigrator is used to set default value if the new property is
   * not defined in system.
   *
   * @class SettingsMigrator
   */
  var SettingsMigrator = function SettingsMigrator() {
  };

  SettingsMigrator.prototype = {
    /**
     * Query all settings key and do the migration
     */
    start: function km_start() {
      var request = window.navigator.mozSettings.createLock().get('*');
      request.onsuccess = function(e) {
        this.doKeyMigration(request.result);
      }.bind(this);
    },

    /**
     * Place to put key migration code when the new key is used in system.
     * @param  {[type]} result all settings keys
     */
    doKeyMigration: function km_doKeyMigration(result) {
      var setLock = window.navigator.mozSettings.createLock();

      // locale.hour12
      (() => {
        var kLocaleTime = 'locale.hour12';
        if (result[kLocaleTime] === undefined) {
          var _ = navigator.mozL10n.get;
          var localeTimeFormat = _('shortTimeFormat');
          var is12hFormat = (localeTimeFormat.indexOf('%I') >= 0);
          var cset = {};
          cset[kLocaleTime] = is12hFormat;
          Promise.resolve(setLock.set(cset)).catch(e => {
            console.error(
              'SettingsMigrator: locale.hour12 migration failed.', e);
          });
        }
      })();

      // keyboard.layouts.english etc.
      (() => {
        if (result['keyboard.enabled-layouts'] === undefined) {
          var defaultKeyboardManifestURL =
            'app://keyboard.gaiamobile.org/manifest.webapp';
          var kKeyboardEnabled = 'keyboard.enabled-layouts';

          var depercatedLayoutGroupMap = {
            en: 'keyboard.layouts.english',
            'en-Dvorak': 'keyboard.layouts.dvorak',
            cs: 'keyboard.layouts.czech',
            fr: 'keyboard.layouts.french',
            de: 'keyboard.layouts.german',
            hu: 'keyboard.layouts.hungarian',
            nb: 'keyboard.layouts.norwegian',
            my: 'keyboard.layouts.myanmar',
            sl: 'keyboard.layouts.slovak',
            tr: 'keyboard.layouts.turkish',
            ro: 'keyboard.layouts.romanian',
            ru: 'keyboard.layouts.russian',
            ar: 'keyboard.layouts.arabic',
            he: 'keyboard.layouts.hebrew',
            'zh-Hant-Zhuyin': 'keyboard.layouts.zhuyin',
            'zh-Hans-Pinyin': 'keyboard.layouts.pinyin',
            el: 'keyboard.layouts.greek',
            'jp-kanji': 'keyboard.layouts.japanese',
            pl: 'keyboard.layouts.polish',
            'pt-BR': 'keyboard.layouts.portuguese',
            'sr-Cyrl': 'keyboard.layouts.serbian',
            'sr-Latn': 'keyboard.layouts.serbian',
            sr: 'keyboard.layouts.serbian',
            es: 'keyboard.layouts.spanish',
            ca: 'keyboard.layouts.catalan'
          };

          var newSettings = {};
          newSettings[defaultKeyboardManifestURL] = {
            number: true
          };

          var hasLayoutEnabled = false;
          var layoutId, oldSettingKey;
          for (layoutId in depercatedLayoutGroupMap) {
            oldSettingKey = depercatedLayoutGroupMap[layoutId];

            if (result[oldSettingKey]) {
              newSettings[defaultKeyboardManifestURL][layoutId] = true;
              hasLayoutEnabled = true;
            }
          }
          if (!hasLayoutEnabled) {
            newSettings[defaultKeyboardManifestURL].en = true;
          }

          var cset = {};
          cset[kKeyboardEnabled] = newSettings;
          for (layoutId in depercatedLayoutGroupMap) {
            cset[depercatedLayoutGroupMap[layoutId]] = null;
          }
          Promise.resolve(setLock.set(cset)).catch(e => {
            console.error(
              'SettingsMigrator: Keyboard layouts migration failed.', e);
          });
        }
      })();
    }
  };

  exports.SettingsMigrator = SettingsMigrator;

}(window));
