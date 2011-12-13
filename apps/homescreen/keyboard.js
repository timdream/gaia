
const IMEManager = {
  BASIC_LAYOUT: -1,
  ALTERNATE_LAYOUT: -2,
  SWITCH_KEYBOARD: -3,
  // TBD: allow user to select desired keyboards in settings
  keyboards: ['qwertyLayout', 'azertyLayout', 'dvorakLayout','zhuyingGeneralLayout'],

  get ime() {
    delete this.ime;
    return this.ime = document.getElementById('keyboard');
  },
  events: ['showime', 'hideime', 'unload', 'appclose'],
  init: function km_init() {
    this.events.forEach((function attachEvents(type) {
      window.addEventListener(type, this);
    }).bind(this));

    this.ime.addEventListener('touchstart', this);
    this.ime.addEventListener('touchend', this);
    this.ime.addEventListener('click', this);

    this.layout = KeyboardAndroid[IMEManager.keyboards[0]];
    this.currentKeyboard = 0;
    this.isUpperCase = false;
  },
  uninit: function km_uninit() {
    this.events.forEach((function attachEvents(type) {
      window.removeEventListener(type, this);
    }).bind(this));

    this.ime.removeEventListener('touchstart', this);
    this.ime.removeEventListener('touchend', this);
    this.ime.removeEventListener('click', this);
  },
  handleEvent: function km_handleEvent(evt) {
    var activeWindow = Gaia.AppManager.foregroundWindow;

    switch (evt.type) {
      case 'showime':
        this.showIME(activeWindow, evt.detail.type);
        break;
      case 'hideime':
      case 'appclose':
        this.hideIME(activeWindow);
        break;
      case 'touchstart':
        var keyCode = parseInt(evt.target.getAttribute('data-keycode'));
        if (!keyCode)
          return;
        evt.target.dataset.active = 'true';
        break;
      case 'touchend':
        var keyCode = parseInt(evt.target.getAttribute('data-keycode'));
        if (!keyCode)
          return;
        delete evt.target.dataset.active;
        break;
      case 'click':
        var keyCode = parseInt(evt.target.getAttribute('data-keycode'));
        if (!keyCode)
          return;

        switch (keyCode) {
          case IMEManager.BASIC_LAYOUT:
            this.layout = KeyboardAndroid[IMEManager.keyboards[this.currentKeyboard]];
            this.ime.innerHTML = this.getLayout(window.innerWidth);
          break;
          case IMEManager.ALTERNATE_LAYOUT:
            this.layout = KeyboardAndroid.alternateLayout;
            this.ime.innerHTML = this.getLayout(window.innerWidth);
            this.updateKeyboardHeight();
          break;
          case IMEManager.SWITCH_KEYBOARD:
            this.currentKeyboard++;
            if (this.currentKeyboard === IMEManager.keyboards.length)
              this.currentKeyboard = 0;
            this.layout = KeyboardAndroid[IMEManager.keyboards[this.currentKeyboard]];
            this.ime.innerHTML = this.getLayout(window.innerWidth);
            this.updateKeyboardHeight();
          break;
          case KeyEvent.DOM_VK_CAPS_LOCK:
            if (this.isUpperCase) {
              this.layout = KeyboardAndroid[IMEManager.keyboards[this.currentKeyboard]];
            } else {
              this.layout = KeyboardAndroid[IMEManager.keyboards[this.currentKeyboard] + 'UpperCaps'];
            }
            this.isUpperCase = !this.isUpperCase;
            this.ime.innerHTML = this.getLayout(window.innerWidth);
            //this.updateKeyboardHeight();
          break;
          default:
            window.navigator.mozKeyboard.sendKey(keyCode);
            if (this.isUpperCase) {
              this.isUpperCase = !this.isUpperCase;
              this.layout = KeyboardAndroid[IMEManager.keyboards[this.currentKeyboard]];
              this.ime.innerHTML = this.getLayout(window.innerWidth);
              //this.updateKeyboardHeight();
            }
          break;
        }
        break;
      case 'unload':
        this.uninit();
        break;
    }
  },
  getLayout: function km_getLayout(width) {
    var content = '';
    this.layout.keys.forEach(function (row) {
      content += '<div class="keyboard-row">';

      row.forEach(function (key) {
        var code = key.keyCode || key.value.charCodeAt(0);
        var size = ((width - (row.length * 2)) / 10) * (key.ratio || 1) - 2;
        content += '<span class="keyboard-key"' +
                          'data-keycode="' + code + '"' +
                          'style="width:' + size + 'px"' +
                   '>' +
                   key.value +
                   '</span>';
      });
      content += '</div>';
    });

    return content;
  },
  updateKeyboardHeight: function km_updateKeyboardHeight() {
    var newHeight = this.targetWindow.dataset.rectHeight -
                    this.ime.getBoundingClientRect().height;
    var ime = this.ime, targetWindow = this.targetWindow;
    if (ime.getBoundingClientRect().top < window.innerHeight) {
      this.targetWindow.style.height = newHeight + 'px';
      return;
    }

    ime.addEventListener('transitionend', function imeShow(evt) {
      ime.removeEventListener('transitionend', imeShow);
      targetWindow.style.height = newHeight + 'px';
    });
  },
  showIME: function km_showIME(targetWindow, type) {
    var oldHeight = targetWindow.style.height;
    targetWindow.dataset.cssHeight = oldHeight;
    targetWindow.dataset.rectHeight = targetWindow.getBoundingClientRect().height;

    var ime = this.ime;
    ime.innerHTML = this.getLayout(window.innerWidth);
    this.targetWindow = targetWindow;
    this.updateKeyboardHeight();

    delete ime.dataset.hidden;
  },
  hideIME: function km_hideIME(targetWindow) {
    targetWindow.style.height = targetWindow.dataset.cssHeight;
    delete targetWindow.dataset.cssHeight;
    delete targetWindow.dataset.rectHeight;
    delete this.targetWindow;

    var ime = this.ime;
    ime.dataset.hidden = 'true';
    ime.innerHTML = '';
  }
};

window.addEventListener('load', function initIMEManager(evt) {
  window.removeEventListener('load', initIMEManager);
  IMEManager.init();
});

