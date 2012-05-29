/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

var LockScreen = {
  get overlay() {
    delete this.overlay;
    return this.overlay = document.getElementById('lockscreen');
  },

  get padlockOverlay() {
    delete this.padlockOverlay;
    return this.padlockOverlay = document.getElementById('keypadscreen');
  },

  get notification() {
    delete this.notification;
    return this.notification =
      document.getElementById('lockscreen-notification');
  },

  get notificationTitle() {
    delete this.notificationTitle;
    return this.notificationTitle =
      document.getElementById('lockscreen-notification-title');
  },

  get notificationDetail() {
    delete this.notificationDetail;
    return this.notificationDetail =
      document.getElementById('lockscreen-notification-detail');
  },

  get screen() {
    delete this.screen;
    return this.screen = document.getElementById('screen');
  },

  locked: true,

  init: function lockscreen_init() {
    var events = ['touchstart', 'touchmove', 'touchend', 'transitionend'];
    AddEventHandlers(LockScreen.overlay, this, events);
    this.update();

    this.notification.addEventListener('click', this);

    window.addEventListener('keydown', this, true);
    window.addEventListener('keyup', this, true);

    window.addEventListener('mozChromeEvent', this);

    PadLock.init();
    if (localStorage['passcode-lock'] == 'false')
      this.unlockPadlock(true);

    this.padlockOverlay.addEventListener(
      'transitionend',
      function padlockTransitionend() {
        LockScreen.screen.classList.remove('locked');
      }
    );

  },

  update: function lockscreen_update() {
    if (localStorage['lockscreen'] == 'false') {
      this.unlock(true);
      return;
    }

    this.lock(true);
  },

  showNotification: function lockscreen_showNotification(title, detail) {
    this.notification.hidden = false;
    this.notificationTitle.textContent = title;
    this.notificationDetail.textContent = detail;
  },

  hideNotification: function lockscreen_hideNotification() {
    this.notification.hidden = true;
  },

  lock: function lockscreen_lock(instant) {
    var style = this.overlay.style;

    if (this.locked) {
      if (instant) {
        style.MozTransition = style.MozTransform = '';
      } else {
        style.MozTransition = '-moz-transform 0.2s linear';
      }
      style.MozTransform = 'translateY(0)';
      return;
    }

    var wasAlreadyLocked = this.locked;

    this.locked = true;
    this.screen.classList.add('locked');
    if (instant) {
      style.MozTransition = style.MozTransform = '';
      this.lockPadlock();
    } else {
      style.MozTransition = '-moz-transform 0.2s linear';
      style.MozTransform = 'translateY(0)';
    }

    screen.mozLockOrientation('portrait-primary');

    if (!wasAlreadyLocked) {
      var evt = document.createEvent('CustomEvent');
      evt.initCustomEvent('locked', true, true, null);
      window.dispatchEvent(evt);
    }
  },

  lockPadlock: function lockscreen_lockPadlock() {
    if (localStorage['passcode-lock'] == 'false')
      return;

    var style = this.padlockOverlay.style;
    style.MozTransform = '';
    style.MozTransition = '';
  },

  // Unlock the lockscreen, doing an animation for the specified time.
  // If no time is specified use a default of 0.2 seconds.
  // For backward compatibility, you can pass true as the first argument
  // for a time of 0.
  unlock: function lockscreen_unlock(time) {
    var style = this.overlay.style;

    if (time == undefined)
      time = 0.2;
    else if (time === true)
      time = 0;

    if (time === 0)
      style.MozTransition = style.MozTransform = '';
    else
      style.MozTransition = '-moz-transform ' + time + 's linear';
    style.MozTransform = 'translateY(-100%)';

    if (localStorage['passcode-lock'] == 'false')
      this.unlockPadlock(true);
  },

  unlockPadlock: function lockscreen_unlockPadlock(instant) {
    var wasAlreadyUnlocked = !this.locked;

    var style = this.padlockOverlay.style;
    if (instant) {
      style.MozTransition = style.MozTransform = '';
      this.screen.classList.remove('locked');
    } else {
      style.MozTransition = '-moz-transform 0.2s linear';
    }
    style.MozTransform = 'translateY(-100%)';

    WindowManager.setOrientationForApp(WindowManager.getDisplayedApp());

    this.locked = false;
    delete this.padlockOverlay.dataset.active;

    if (!wasAlreadyUnlocked) {
      var evt = document.createEvent('CustomEvent');
      evt.initCustomEvent('unlocked', true, true, null);
      window.dispatchEvent(evt);

      this.hideNotification();
    }
  },

  onTouchStart: function lockscreen_touchStart(evt) {
    this.startY = this.lastY = evt.pageY;
    this.lastTime = evt.timeStamp;
    this.velocity = 0;
    this.moving = true;
  },

  onTouchMove: function lockscreen_touchMove(evt) {
    if (this.moving) {
      this.velocity = (this.lastY - evt.pageY) / (evt.timeStamp - this.lastTime);
      this.lastY = evt.pageY;
      this.lastTime = evt.timeStamp;
      var dy = Math.max(0, this.startY - evt.pageY);
      var style = this.overlay.style;
      style.MozTransition = '';
      style.MozTransform = 'translateY(' + (-dy) + 'px)';
    }
  },

  // Tune these parameters to make the lockscreen unlock feel right
  FRICTION: 0.01,           // pixels/ms/ms
  UNLOCK_THRESHOLD: 0.25,    // fraction of screen height

  onTouchEnd: function lockscreen_touchend(evt) {
    if (this.moving) {
      this.moving = false;

      // Physics:
      // An object moving with a velocity v against a frictional
      // deceleration a will travel a distance of 0.5*v*v/a before
      // coming to rest (I think).
      //
      // If the user's gesture plus the distance due to the gesture velocity
      // is more than the unlock threshold times screen height,
      // unlock the phonevt. Otherwise move the lockscreen back down again.
      //
      var dy = Math.max(0, this.startY - evt.pageY);
      var distance = dy +
        0.5 * this.velocity * this.velocity / LockScreen.FRICTION;

      if (distance > window.innerHeight * LockScreen.UNLOCK_THRESHOLD) {
        // Perform the animation at the gesture velocity
        var distanceRemaining = window.innerHeight - dy;
        var timeRemaining = distanceRemaining / this.velocity / 1000;
        // But don't take longer than 1/2 second to complete it.
        timeRemaining = Math.min(timeRemaining, .5);
        this.unlock(timeRemaining);
      } else {
        this.lock();
      }
    }
  },

  handleEvent: function lockscreen_handleEvent(evt) {
    switch (evt.type) {
      case 'mozChromeEvent':
        var detail = evt.detail;
        if (!this.locked || detail.type !== 'desktop-notification')
          return;

        this.showNotification(detail.title, detail.text);
        break;

      case 'click':
        this.hideNotification();
        break;

      case 'transitionend':
        if (this.locked)
          this.lockPadlock();
        break;

      case 'touchstart':
        this.onTouchStart(evt.touches[0]);
        this.overlay.setCapture(false);
        evt.preventDefault();
        break;

      case 'touchmove':
        this.onTouchMove(evt.touches[0]);
        evt.preventDefault();
        break;

      case 'touchend':
        this.onTouchEnd(evt.changedTouches[0]);
        document.releaseCapture();
        evt.preventDefault();
        break;

      case 'keydown':
        /*
        * Turn on the screen when sleep or home button is pressed.
        * Cancel other actions bind to the buttons.
        */
        if (evt.keyCode !== evt.DOM_VK_SLEEP && evt.keyCode !== evt.DOM_VK_HOME)
          return;

        if (ScreenManager.screenEnabled)
          return;

        this.isJustTurnedOn = true;
        this.update();
        ScreenManager.turnScreenOn();
        evt.preventDefault();
        evt.stopPropagation();

        break;

      case 'keyup':
        /*
        * Turn off the screen when sleep button is released.
        *
        */
        if (evt.keyCode !== evt.DOM_VK_SLEEP && evt.keyCode !== evt.DOM_VK_HOME)
          return;

        if (this.isJustTurnedOn) {
          this.isJustTurnedOn = false;
          return;
        }

        if (!ScreenManager.screenEnabled ||
            evt.keyCode !== evt.DOM_VK_SLEEP)
          return;

        this.update();
        ScreenManager.turnScreenOff();
        evt.preventDefault();
        evt.stopPropagation();

        break;
    }
  }
};

var PadLock = {
  get padlockOverlay() {
    delete this.padlockOverlay;
    return this.padlockOverlay = document.getElementById('keypadscreen');
  },

  get codeUI() {
    delete this.codeUI;
    return this.codeUI = document.getElementById('keypadscreen-code');
  },

  /* The pass code */
  passCode: '0000',

  /* code typed by the user */
  currentCode: '',

  /* number of tries */
  error: 0,

  /* time to wait before sliding up */
  kTimeout: 300,

  /* default timeout after incorrect attempt */
  kErrorTimeout: 500,

  /* number of attempts allowed */
  kTries: 3,

  /* cool down period after kTries */
  kTriesTimeout: 5000,

  init: function padlock_init() {
    this.padlockOverlay.addEventListener('click', this);
    // enable swiping of the keypad but break behavior on desktop
    this.padlockOverlay.addEventListener('mouseover', this);
  },

  updateCodeUI: function padlock_updateCodeUI() {
    var i = 4;
    while (i--) {
      var span = this.codeUI.childNodes[i];
      if (this.currentCode.length > i)
        span.dataset.dot = true;
      else
        delete span.dataset.dot;
    }
  },

  checkCode: function padlock_checkCode() {
    if (this.currentCode === this.passCode) {
      this.padlockOverlay.dataset.status = 'success';
      this.error = 0;

      setTimeout(function success() {
        delete PadLock.padlockOverlay.dataset.status;
        LockScreen.unlockPadlock();
        PadLock.currentCode = '';
        PadLock.updateCodeUI();
      }, this.kTimeout);
    } else {
      this.padlockOverlay.dataset.status = 'error';
      if (navigator.mozVibrate)
        navigator.mozVibrate([50, 50, 50]);
      var timeout = this.kErrorTimeout;
      this.error++;
      if (this.error === 3) {
        timeout = this.kTriesTimeout;
        this.error = 0;
      }

      setTimeout(function error() {
        delete PadLock.padlockOverlay.dataset.status;
        PadLock.currentCode = '';
        PadLock.updateCodeUI();
      }, timeout);
    }
  },

  handleEvent: function padlock_handleEvent(evt) {
    if (this.padlockOverlay.dataset.status)
      return;

    if (!evt.target.dataset.key)
      return;

    evt.preventDefault();

    switch (evt.target.dataset.key) {
      // Emergency
      case 'e':
        // XXX: TBD
        break;
      // Back
      case 'b':
        // Back to lock screen
        if (!this.currentCode) {
          LockScreen.lock();
          break;
        }

        // Back one character
        this.currentCode =
          this.currentCode.substr(0, this.currentCode.length - 1);
        this.updateCodeUI();

        break;
      default:
        this.currentCode += evt.target.dataset.key;
        this.updateCodeUI();

        if (this.currentCode.length === 4)
          this.checkCode();
        break;
    }
  }
};
