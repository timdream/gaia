/* global System, lockScreenWindowManager */

(function() {
'use strict';

requireApp('system/shared/test/unit/mocks/mock_manifest_helper.js');
requireApp('system/shared/test/unit/mocks/mock_system.js');
requireApp('system/shared/test/unit/mocks/mock_navigator_moz_settings.js');
requireApp('system/test/unit/mock_lock_screen.js');
requireApp('system/test/unit/mock_lockscreen_window.js');
requireApp('system/js/lockscreen_window_manager.js');

var mocksForLockScreenWindowManager = new window.MocksHelper([
  'LockScreen', 'LockScreenWindow', 'System'
]).init();

suite('system/LockScreenWindowManager', function() {
  var stubById;
  var appFake;
  var originalSettingsListener;
  var originalMozActivity;
  var originalMozSettings;

  mocksForLockScreenWindowManager.attachTestHelpers();

  setup(function() {
    stubById = this.sinon.stub(document, 'getElementById');
    stubById.returns(document.createElement('div'));
    appFake = new window.LockScreenWindow();

    originalSettingsListener = window.SettingsListener;
    originalMozActivity = window.MozActivity;
    window.SettingsListener = {
      observe: function(name, bool, cb) {},
      getSettingsLock: function() {
        return {
          get: function(name) {
            if ('lockscreen.enabled' === name) {
              return true;
            }
          },
          set: function() {}
        };
      }
    };
    window.MozActivity = function() {};

    originalMozSettings = window.navigator.mozSettings;
    window.navigator.mozSettings = window.MockNavigatorSettings;

    // To prevent the original one has been
    // initialized in the bootstrap stage.
    //
    // XXX: On Travis the manager would be a empty object,
    // but on local everything is fine. So the second condition
    // is necessary.
    if (window.lockScreenWindowManager &&
        0 !== Object.keys(window.lockScreenWindowManager).length) {
      window.lockScreenWindowManager.stopEventListeners();
      window.lockScreenWindowManager.startEventListeners();
    } else {
      window.lockScreenWindowManager = new window.LockScreenWindowManager();
    }
    window.lockScreenWindowManager.setup();
    window.lockScreenWindowManager.startObserveSettings();
    window.lockScreenWindowManager.elements = {};
    window.lockScreenWindowManager.elements.screen =
      document.createElement('div');
    // Differs from the existing mock which is expected by other components.
    window.LockScreen = function() {};
  });

  teardown(function() {
    window.SettingsListener = originalSettingsListener;
    window.MozActivity = originalMozActivity;
    window.navigator.mozSettings = originalMozSettings;
    window.MockNavigatorSettings.mTeardown();
    stubById.restore();
  });

  suite('Hierarchy functions', function() {
    test('Should register hierarchy on start', function() {
      this.sinon.stub(System, 'request');
      window.lockScreenWindowManager.start();
      assert.isTrue(System.request.calledWith('registerHierarchy'));
    });

    test('Should activate when openApp is called', function() {
      window.lockScreenWindowManager.states.enabled = true;
      var app = new window.MockLockScreenWindow();
      window.lockScreenWindowManager.states.instance = app;
      this.sinon.stub(app, 'isActive').returns(false);
      this.sinon.stub(lockScreenWindowManager, 'publish');
      window.lockScreenWindowManager.openApp();
      assert.isTrue(lockScreenWindowManager.publish.calledWith(
        lockScreenWindowManager.EVENT_PREFIX + '-activated'));
    });

    test('Should deactivate when closeApp is called', function() {
      window.lockScreenWindowManager.states.enabled = true;
      var app = new window.MockLockScreenWindow();
      window.lockScreenWindowManager.states.instance = app;
      this.sinon.stub(app, 'isActive').returns(true);
      this.sinon.stub(lockScreenWindowManager, 'publish');
      window.lockScreenWindowManager.closeApp();
      assert.isTrue(lockScreenWindowManager.publish.calledWith(
        lockScreenWindowManager.EVENT_PREFIX + '-deactivated'));
    });

    test('Should be active if the instance is active', function() {
      var app = new window.MockLockScreenWindow();
      window.lockScreenWindowManager.states.instance = app;
      this.sinon.stub(app, 'isActive').returns(true);
      assert.isTrue(window.lockScreenWindowManager.isActive());
    });

    test('Should be inactive if the instance is inactive', function() {
      var app = new window.MockLockScreenWindow();
      window.lockScreenWindowManager.states.instance = app;
      this.sinon.stub(app, 'isActive').returns(false);
      assert.isFalse(window.lockScreenWindowManager.isActive());
    });

    test('Should be inactive if there is no instance', function() {
      assert.isFalse(window.lockScreenWindowManager.isActive());
    });
  });

  suite('Handle events', function() {
    test('It should stop home event to propagate', function() {
      var evt = {
            type: 'home',
            stopImmediatePropagation: this.sinon.stub()
          };
      // Need to be active to block the home event.
      this.sinon.stub(window.lockScreenWindowManager, 'isActive',
        function() {
          return true;
      });
      window.lockScreenWindowManager.handleEvent(evt);
      assert.ok(evt.stopImmediatePropagation.called,
        'it didn\'t call the stopImmediatePropagation method');
    });

    test('App created', function() {
      window.lockScreenWindowManager.handleEvent(
        { type: 'lockscreen-appcreated',
          detail: appFake });
      assert.equal(
        window.lockScreenWindowManager.states.instance.instanceID,
          appFake.instanceID,
        'the app was not activated');
        window.assert.isObject(window.lockScreenWindowManager
          .states.instance,
        'the app was not registered in the maanger');
      window.lockScreenWindowManager.unregisterApp(appFake);
    });

    test('Initialize when screenchange', function() {
      var originalCreateWindow = window.lockScreenWindowManager.createWindow;
      var originalLockScreenInputWindow = window.LockScreenInputWindow;
      window.LockScreenInputWindow = function() {};
      var stubCreateWindow =
      this.sinon.stub(window.lockScreenWindowManager, 'createWindow',
        function() {
          return originalCreateWindow.bind(this).call();
        });
      window.lockScreenWindowManager.states.ready = true;
      window.lockScreenWindowManager.handleEvent(
        { type: 'screenchange',
          detail: { screenEnabled: true } });
      assert.isTrue(stubCreateWindow.called,
          'the manage didn\'t create the singleton window');
      var app = window.lockScreenWindowManager.states.instance;
      if (app) {
        window.lockScreenWindowManager.unregisterApp(app);
      }
      window.lockScreenWindowManager.stopEventListeners();
      window.LockScreenInputWindow = originalLockScreenInputWindow =
        originalLockScreenInputWindow;
    });

    test('Screenchange by proximity sensor, should not open the LockScreen app',
    function() {
      var stubOpenApp = this.sinon.stub(window.lockScreenWindowManager,
        'openApp');
      window.lockScreenWindowManager.states.ready = true;
      window.lockScreenWindowManager.handleEvent(
        {
          type: 'screenchange',
          detail: { screenEnabled: true,
                    screenOffBy: 'proximity'
          }
        });
      assert.isFalse(stubOpenApp.called,
        'the manager still open the LockScreen app even the ' +
        'screenchange was caused by proximity sensor');
    });

    test('Open the app when screen is turned on', function() {
      window.lockScreenWindowManager.registerApp(appFake);
      var stubOpen = this.sinon.stub(appFake, 'open');
      window.lockScreenWindowManager.states.ready = true;
      window.lockScreenWindowManager.handleEvent(
        { type: 'screenchange',
          detail: { screenEnabled: true } });
      assert.isTrue(stubOpen.called,
        'the manager didn\'t call the app.open when screen on');
      window.lockScreenWindowManager.unregisterApp(appFake);
    });

    test('When FTU occurs, try to close the app', function() {
      var stubCloseApp = this.sinon.stub(window.lockScreenWindowManager,
        'closeApp');
      window.lockScreenWindowManager.handleEvent({ type: 'ftuopen' });
      assert.isTrue(stubCloseApp.called,
        'the LockScreenWindowManager doesn\'t call the closeApp');
    });

    test('When FTU occurs, the window should not be instantiated', function() {
      var stubOpenApp = this.sinon.stub(window.lockScreenWindowManager,
        'openApp');
      window.lockScreenWindowManager.states.ready = true;
      window.lockScreenWindowManager.handleEvent({ type: 'ftuopen' });
      window.lockScreenWindowManager.handleEvent(
        { type: 'screenchange',
          detail: { screenEnabled: true } });
      assert.isFalse(stubOpenApp.called,
        'the LockScreenWindow still be instantiated while the FTU is opened');
    });

    test('When the lockscreen settings is not ready, ' +
          'the window should not be instantiated', function() {
      var stubOpenApp = this.sinon.stub(window.lockScreenWindowManager,
        'openApp');
      window.lockScreenWindowManager.states.ready = false;
      window.lockScreenWindowManager.handleEvent(
        { type: 'screenchange',
          detail: { screenEnabled: true } });
      assert.isFalse(stubOpenApp.called,
        'the LockScreenWindow still be instantiated while the FTU is opened');
    });

    test('But after FTU done, the window should be instantiated', function() {
      var stubOpenApp = this.sinon.stub(window.lockScreenWindowManager,
        'openApp');
      window.lockScreenWindowManager.handleEvent({ type: 'ftuopen' });
      window.lockScreenWindowManager.handleEvent({ type: 'ftudone' });
      window.lockScreenWindowManager.states.ready = true;
      window.lockScreenWindowManager.handleEvent(
        { type: 'screenchange',
          detail: { screenEnabled: true } });
      assert.isTrue(stubOpenApp.called,
        'the LockScreenWindow is not instantiated after the FTU was closed.');
    });

    test('Send lockscreen window to background while overlay is there.',
      function() {
        var app = new window.MockLockScreenWindow();
        this.sinon.stub(app, 'isActive').returns(true);
        window.lockScreenWindowManager.states.instance = app;
        var stubSetVisible = this.sinon.stub(app, 'setVisible');
        window.lockScreenWindowManager.handleEvent({ type: 'overlaystart' });
        assert.isTrue(stubSetVisible.calledWith(false));
      });

    test('Send lockscreen window to foreground.', function() {
      var app = new window.MockLockScreenWindow();
      this.sinon.stub(app, 'isActive').returns(true);
      window.lockScreenWindowManager.states.instance = app;
      var stubSetVisible = this.sinon.stub(app, 'setVisible');
      window.lockScreenWindowManager.handleEvent({
        type: 'showlockscreenwindow'
      });
      assert.isTrue(stubSetVisible.calledWith(true));
    });

    test('LockScreen request to unlock without activity detail', function() {
      var evt = { type: 'lockscreen-request-unlock' },
          stubCloseApp = this.sinon.stub(window.lockScreenWindowManager,
            'closeApp');
      window.lockScreenWindowManager.handleEvent(evt);
      assert.isTrue(stubCloseApp.called,
        'it did\'t close the window while unlock request arrive');
    });

    test('Open the app when asked via lock-immediately setting', function() {
      window.lockScreenWindowManager.registerApp(appFake);
      var stubOpen = this.sinon.stub(appFake, 'open');
      window.MockNavigatorSettings.mTriggerObservers(
        'lockscreen.lock-immediately', {settingValue: true});
      assert.isTrue(stubOpen.called,
        'the manager didn\'t open the app when requested');
      window.lockScreenWindowManager.unregisterApp(appFake);
    });

    test('onInputpadOpen would open the window and call resize', function() {
      window.lockScreenWindowManager.states.instance = appFake;
      appFake.inputWindow = {
        open: this.sinon.stub(),
        close: this.sinon.stub()
      };
      var stubResize = this.sinon.stub(appFake, 'resize');
      window.lockScreenWindowManager.onInputpadClose();
      assert.isTrue(appFake.inputWindow.close.called, 'called no |open|');
      assert.isTrue(stubResize.called, 'called no |resize|');
    });

    test('Open the app would set the corresponding mozSettings', function() {
      var originalEnabled = window.lockScreenWindowManager.states.enabled;
      window.lockScreenWindowManager.states.enabled = true;
      window.lockScreenWindowManager.registerApp(appFake);
      var stubToggleSystemSettings = this.sinon.stub(
        window.lockScreenWindowManager, 'toggleLockedSetting');
      window.lockScreenWindowManager.openApp();
      assert.isTrue(stubToggleSystemSettings.calledWith(true),
        'the manager didn\'t set the mozSettings value');
      window.lockScreenWindowManager.unregisterApp(appFake);
      window.lockScreenWindowManager.states.enabled = originalEnabled;
    });
  });
});

})();
