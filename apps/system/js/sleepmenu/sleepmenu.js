/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

var SleepMenu = {
  get element() {
    delete this.element;
    return this.element = document.getElementById('sleep');
  },

  get visible() {
    return this.element.classList.contains('visible');
  },

  kTimeout: 1500,

  init: function sm_init() {
    window.addEventListener('click', this, true);
    window.addEventListener('keydown', this, true);
    window.addEventListener('keyup', this, true);
  },

  show: function sm_show() {
    this.element.classList.add('visible');
  },

  hide: function sm_hide() {
    this.element.classList.remove('visible');
  },

  handleEvent: function sm_handleEvent(evt) {
    switch (evt.type) {
      case 'click':
        var action = evt.target.dataset.value;
        switch (action) {
          case 'airplane':
            var settings = window.navigator.mozSettings;
            if (settings)
              settings.getLock().set({ 'ril.radio.disabled': true});

            break;
          case 'silent':
            var settings = window.navigator.mozSettings;
            if (settings)
              settings.getLock().set({ 'phone.ring.incoming': false});

            document.getElementById('silent').hidden = true;
            document.getElementById('normal').hidden = false;
            break;
          case 'normal':
            var settings = window.navigator.mozSettings;
            if (settings)
              settings.getLock().set({'phone.ring.incoming': true});

            document.getElementById('silent').hidden = false;
            document.getElementById('normal').hidden = true;
            break;
          case 'restart':
            navigator.mozPower.reboot();
            break;
          case 'power':
            navigator.mozPower.powerOff();
            break;
        }
        this.hide();
        break;

      case 'keydown':
        if (evt.keyCode !== evt.DOM_VK_SLEEP || this.visible) {
          return;
        }

        this._timeout = window.setTimeout((function sm_timeout() {
          this._timeout = null;
          this.isJustTurnedOn = true;
          this.show();
        }).bind(this), this.kTimeout);

        break;

      case 'keyup':
        switch (evt.keyCode) {
          case evt.DOM_VK_SLEEP:
            if (this.visible && !this.isJustTurnedOn) {
              this.hide();
              this.isJustTurnedOn = false;
            }

            if (!this._timeout)
              return;

            window.clearTimeout(this._timeout);
            this._timeout = null;

            break;

          case evt.DOM_VK_ESCAPE:
          case evt.DOM_VK_HOME:
            if (!this.visible)
              break;

            this.hide();
            evt.preventDefault();
            evt.stopPropagation();
            break;
        }
        break;
    }
  }
};
