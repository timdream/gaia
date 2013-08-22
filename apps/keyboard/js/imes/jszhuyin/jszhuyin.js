/* -*- Mode: js; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/*
 * This file implements a the glue between FxOS Keyboard app UI and
 * the JSZhuyin library.
 */

var JSZhuyinGaiaKeyboardGlue = function JSZhuyinGaiaKeyboardGlue() {
  this.callbacks = null;
  this.iframe = null;

  this.composing = false;
};
JSZhuyinGaiaKeyboardGlue.prototype.init = function jszg_init(callbacks) {
  this.callbacks = callbacks;

  this.requestId = 0;
  this.handledId = 0;

  var iframe = this.iframe = document.createElement('iframe');
  iframe.addEventListener('load', this);
  iframe.addEventListener('error', this);
  window.addEventListener('message', this);

  iframe.src = callbacks.path + '/lib/frame.html';
  iframe.hidden = true;
  document.body.appendChild(iframe);
};
JSZhuyinGaiaKeyboardGlue.prototype.uninit = function jszg_uninit() {
  this.callbacks = null;

  document.body.removeChild(this.iframe);

  var iframe = this.iframe;
  this.iframe = null;
  iframe.removeEventListener('load', this);
  iframe.removeEventListener('error', this);
  window.removeEventListener('message', this);
};
JSZhuyinGaiaKeyboardGlue.prototype.click = function jszg_click(code) {
  // Let's not use BopomofoEncoder.isBopomofoSymbol(code) here
  var BOPOMOFO_START = 0x3105;
  var BOPOMOFO_END = 0x3129;
  var BOPOMOFO_TONE_1 = 0x02c9;
  var BOPOMOFO_TONE_2 = 0x02ca;
  var BOPOMOFO_TONE_3 = 0x02c7;
  var BOPOMOFO_TONE_4 = 0x02cb;
  var BOPOMOFO_TONE_5 = 0x02d9;

  // We must handle Bopomofo symbols.
  if (code >= BOPOMOFO_START && code <= BOPOMOFO_END ||
      code === BOPOMOFO_TONE_1 || code === BOPOMOFO_TONE_2 ||
      code === BOPOMOFO_TONE_3 || code === BOPOMOFO_TONE_4 ||
      code === BOPOMOFO_TONE_5) {
    this.sendMessage('handleKeyEvent', code, ++this.requestId);

    return;
  }

  // Send BOPOMOFO_TONE_1 for the SPACE key.
  if (this.composing && code === KeyboardEvent.DOM_VK_SPACE) {
    this.sendMessage('handleKeyEvent', BOPOMOFO_TONE_1, ++this.requestId);

    return;
  }

  // Handle the key anyway if we might be currently composing.
  if (this.composing || this.requestId !== this.handledId) {
    this.sendMessage('handleKeyEvent', code, ++this.requestId);

    return;
  }

  // Not handling the key; send it out directly.
  this.callbacks.sendKey(code);
};
JSZhuyinGaiaKeyboardGlue.prototype.select = function jszg_select(candidate) {
  this.sendMessage('selectCandidate', candidate, ++this.requestId);
};
JSZhuyinGaiaKeyboardGlue.prototype.activate = function jszg_activate() {
  this.empty();
};
JSZhuyinGaiaKeyboardGlue.prototype.deactivate = function jszg_activate() {
  this.empty();
};
JSZhuyinGaiaKeyboardGlue.prototype.empty = function jszg_empty() {
  // Simply send escape.
  this.sendMessage('handleKeyEvent', KeyEvent.DOM_VK_ESCAPE, ++this.requestId);
};
JSZhuyinGaiaKeyboardGlue.prototype.handleEvent =
  function jszg_handleEvent(evt) {
    var iframe = this.iframe;
    switch (evt.type) {
      case 'load':
        iframe.removeEventListener('load', this);
        this.sendMessage('load');

        break;

      case 'error':
        throw 'JSZhuyinGaiaKeyboardGlue: Iframe loading error.';

        break;

      case 'message':
        if (!this.iframe || evt.source !== this.iframe.contentWindow)
          break;

        this.handleMessage(evt.data);

        break;
    }
  };
JSZhuyinGaiaKeyboardGlue.prototype.handleMessage =
  function jszg_handleMessage(msg) {
    var data = msg.data;
    switch (msg.type) {
      case 'actionhandled':
        this.handledId = data;

      case 'candidateschange':
        this.callbacks.sendCandidates(data);
        break;

      case 'compositionupdate':
        this.composing = !!data;
        this.callbacks.sendPendingSymbols(data);
        break;

      case 'compositionend':
        this.composing = false;
        this.callbacks.sendString(data);
        break;
    }
  };
JSZhuyinGaiaKeyboardGlue.prototype.sendMessage =
  function jszg_sendMessage(type, data, reqId) {
    var contentWindow = this.iframe.contentWindow;
    if (!contentWindow) {
      throw 'Iframe is not loaded yet.';
    }

    contentWindow.postMessage(
      { 'type': type, 'data': data, 'requestId': reqId }, '*');
  };

// Expose the engine to the Gaia keyboard
if (typeof InputMethods !== 'undefined') {
  InputMethods.jszhuyin = new JSZhuyinGaiaKeyboardGlue();
}
