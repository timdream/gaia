'use strict';

/* global MockEventTarget, Promise */

(function(exports) {

  var MockInputMethod = function MockInputMethod() {
    this.mgmt = new MockInputMethodManager();
  };

  MockInputMethod.prototype = new MockEventTarget();

  MockInputMethod.prototype.oninputcontextchange = null;

  MockInputMethod.prototype.inputcontext = null;

  MockInputMethod.prototype.setInputContext = function(inputContext) {
    if (inputContext) {
      this.inputcontext = inputContext;
    } else {
      this.inputcontext = null;
    }

    var evt = {
      type: 'inputcontextchange'
    };
    this.dispatchEvent(evt);
  };

  var MockInputContext = function MockInputContext(ctx) {
    ctx = ctx || {};
    this._resolveSurroundingText(ctx);
    this._updateContextProperties(ctx, false);
  };

  MockInputContext.prototype = new MockEventTarget();

  MockInputContext.prototype._value = '';

  MockInputContext.prototype.type = 'text';
  MockInputContext.prototype.inputType = 'text';
  MockInputContext.prototype.inputMode = '';
  MockInputContext.prototype.lang = '';

  MockInputContext.prototype.selectionStart = 0;
  MockInputContext.prototype.selectionEnd = 0;
  MockInputContext.prototype.textBeforeCursor = '';
  MockInputContext.prototype.textAfterCursor = '';

  MockInputContext.prototype.onsurroundingtextchange = null;

  MockInputContext.prototype.ononselectionchange = null;

  MockInputContext.prototype.updateContext = function(ctx) {
    ctx = ctx || {};
    this._resolveSurroundingText(ctx);
    this._updateContextProperties(ctx, true);
  };

  MockInputContext.prototype._resolveSurroundingText = function(ctx) {
    // Text value of the represented input field.
    // in the real implementation, this information is kept at the app process,
    // not the keyboard process here.
    ctx.value = ctx.value || this._value;

    // Make sure we have selection range in the new context.
    if (!('selectionStart' in ctx)) {
      ctx.selectionStart = this.selectionStart;
    }
    if (!('selectionEnd' in ctx)) {
      ctx.selectionEnd = this.selectionEnd;
    }

    // Update textBeforeCursor according to changed range.
    ctx.textBeforeCursor = ctx.selectionStart < 100 ?
      ctx.value.substr(0, ctx.selectionStart) :
      ctx.value.substr(ctx.selectionStart - 100, 100);

    // Update textAfterCursor according to changed range.
    ctx.textAfterCursor = ctx.selectionEnd + 100 > ctx.value.length ?
      ctx.value.substr(ctx.selectionStart, ctx.value.length) :
      ctx.value.substr(ctx.selectionStart,
        ctx.selectionEnd - ctx.selectionStart + 100);
  };

  MockInputContext.prototype._updateContextProperties =
    function(ctx, fireEvents) {
      var selectionDirty =
        (this.selectionStart !== ctx.selectionStart) ||
        (this.selectionEnd !== ctx.selectionEnd);
      var surroundDirty =
        (this.textBeforeCursor !== ctx.textBeforeCursor) ||
        (this.textAfterCursor !== ctx.textAfterCursor);

      if ('type' in ctx) {
        this.type = (['textarea', 'contenteditable'].indexOf(ctx.type) > -1) ?
          ctx.type : 'text';
        this.inputType = ctx.type;
      }
      if ('inputMode' in ctx) {
        this.inputMode = ctx.inputMode;
      }
      if ('lang' in ctx) {
        this.lang = ctx.lang;
      }

      // Always update; should be filled by _resolveSurroundingText()
      this._value = ctx.value;
      this.selectionStart = ctx.selectionStart;
      this.selectionEnd = ctx.selectionEnd;
      this.textBeforeCursor = ctx.textBeforeCursor;
      this.textAfterCursor = ctx.textAfterCursor;

      var evt;
      if (selectionDirty) {
        evt = {
          type: 'selectionchange',
          detail: {
            selectionStart: ctx.selectionStart,
            selectionEnd: ctx.selectionEnd
          }
        };

        this.dispatchEvent(evt);
      }

      if (surroundDirty) {
        evt = {
          type: 'surroundingtextchange',
          detail: {
            beforeString: ctx.textBeforeCursor,
            afterString: ctx.textAfterCursor
          }
        };

        this.dispatchEvent(evt);
      }
    };

  MockInputContext.prototype.getText = function(offset, length) {
    var oResolve, oReject;
    offset = offset || 0;
    length = length || this._value.length;
    // We are using the native Promise here but expose
    // the reject method and a resolveGetText method.
    // See http://mdn.io/promise
    var p = new Promise(function(resolve, reject) {
      oResolve = resolve;
      oReject = reject;
    });
    p.resolveGetText = (function() {
      oResolve(this._value.substr(offset, length));
    }).bind(this);
    p.reject = oReject;

    return p;
  };

  MockInputContext.prototype.setSelectionRange = function(start, length) {
    var oResolve, oReject;
    // We are using the native Promise here but expose
    // the reject method and a resolveSetSelectionRange method.
    // See http://mdn.io/promise
    var p = new Promise(function(resolve, reject) {
      oResolve = resolve;
      oReject = reject;
    });
    p.resolveSetSelectionRange = (function() {
      // XXX: we are not firing events here. Should we?
      var ctx = {
        selectionStart: start,
        selectionEnd: start + length
      };
      this._resolveSurroundingText(ctx);
      this._updateContextProperties(ctx, false);

      oResolve();
    }).bind(this);
    p.reject = oReject;

    return p;
  };

  MockInputContext.prototype.replaceSurroundingText =
    function(text, offset, length) {
      var oResolve, oReject;
      // We are using the native Promise here but expose
      // the reject method and a resolveReplaceSurroundingText method.
      // See http://mdn.io/promise
      var p = new Promise(function(resolve, reject) {
        oResolve = resolve;
        oReject = reject;
      });
      p.resolveReplaceSurroundingText = (function() {
        // XXX: we are not firing events here. Should we?

        // Check the parameters.
        var start = this.selectionStart + offset;
        if (start < 0) {
          start = 0;
        }
        if (length < 0) {
          length = 0;
        }
        var end = start + length;

        var ctx = {
          value: this._value
        };

        if (this.selectionStart !== start || this.selectionEnd !== end) {
          // Change selection range before replacing.
          ctx.selectionStart = start;
          ctx.selectionEnd = end;
        }

        if (start !== end) {
          // Delete the selected text.
          ctx.value = this._value.substr(0, this.selectionStart) +
            this._value.substr(this.selectionEnd);
          ctx.selectionEnd = ctx.selectionStart;
        }

        if (text) {
          // Insert the text to be replaced with.
          ctx.value = this._value.substr(0, this.selectionStart) +
            text + this._value.substr(this.selectionEnd);
        }

        this._resolveSurroundingText(ctx);
        this._updateContextProperties(ctx, false);

        oResolve();
      }).bind(this);
      p.reject = oReject;

      return p;
    };

  MockInputContext.prototype.deleteSurroundingText = function(offset, length) {
    // We are using the native Promise here but expose
    // the reject method and a resolveDeleteSurroundingText method.
    // See http://mdn.io/promise
    var p = this.replaceSurroundingText(null, offset, length);
    p.resolveDeleteSurroundingText = p.resolveReplaceSurroundingText;
    delete p.resolveReplaceSurroundingText;

    return p;
  };

  MockInputContext.prototype.sendKey = function(keyCode, charCode, modifiers) {
    var oResolve, oReject;
    // We are using the native Promise here but expose
    // the reject method and a resolveSendKey method.
    // See http://mdn.io/promise
    var p = new Promise(function(resolve, reject) {
      oResolve = resolve;
      oReject = reject;
    });
    p.resolveSendKey = (function() {
      // XXX: we are not firing events here. Should we?

      var ctx = {
        value: this._value,
        selectionStart: this.selectionStart,
        selectionEnd: this.selectionEnd
      };

      if (this.selectionStart !== this.selectionEnd) {
        // Delete the selected text.
        ctx.value = this._value.substr(0, this.selectionStart) +
          this._value.substr(this.selectionEnd);
        ctx.selectionEnd = ctx.selectionStart;
      }

      if (charCode) {
        ctx.value = this._value.substr(0, this.selectionStart) +
            String.fromCharCode(charCode) +
            this._value.substr(this.selectionEnd);
        ctx.selectionStart++;
        ctx.selectionEnd = ctx.selectionStart;
      } else {
        // XXX: This is incomplete.
        switch (keyCode) {
          case 8:
            ctx.value = this._value.substr(0, this.selectionStart - 1) +
                this._value.substr(this.selectionEnd);
            ctx.selectionStart--;
            ctx.selectionEnd = ctx.selectionStart;

            break;

          case 13:
            ctx.value = this._value.substr(0, this.selectionStart) +
                '\n' +
                this._value.substr(this.selectionEnd);
            ctx.selectionStart++;
            ctx.selectionEnd = ctx.selectionStart;

            break;
        }
      }

      this._resolveSurroundingText(ctx);
      this._updateContextProperties(ctx, false);

      oResolve();
    }).bind(this);
    p.reject = oReject;

    return p;
  };

  MockInputContext.prototype.setComposition = function(text, cursor, clauses) {
    throw 'Not implemented';
  };

  MockInputContext.prototype.endComposition = function(text) {
    throw 'Not implemented';
  };

  // -------------------------------------

  var MockInputMethodManager = function MozInputMethodManager() {
  };

  MockInputMethodManager.prototype.showAll = function() {
  };

  MockInputMethodManager.prototype.next = function() {
  };

  MockInputMethodManager.prototype.hide = function() {
  };

  MockInputMethodManager.prototype.supportSwitching = false;

  exports.MockInputMethod = MockInputMethod;
  exports.MockInputContext = MockInputContext;
}(window));
