'use strict';

/* global TTLView */

(function(exports) {
  /**
   * The System module is the starting point of the entire System app,
   * and where the dependencies starts.
   *
   * We'll start the System this way, when `bootstrap.js` is being loaded.
   *
   * In the future we would like to move some more high level states to this
   * module too.
   *
   * @example
   * var system = window.system = new System();
   * system.start();
   *
   * @class System
   */
  var System = function System() {
  };

  /**
   * Set this to true to print out console in system.debug()
   * @memberof System.prototype
   * @type {Boolean}
   */
  System.prototype.DEBUG = false;

  /**
   * Enable slow transition or not for debugging.
   * Note: Turn on this would make app opening/closing durations become 3s.
   * @memberof System.prototype
   * @type {Boolean}
   */
  System.prototype.slowTransition = false;

  /**
   * Record the start time of the system for later debugging usage.
   * @access private
   * @type {Number}
   * @memberof System.prototype
   */
  System.prototype._startTime = 0;

  /**
   * Start the system
   * @memberof System.prototype
   */
  System.prototype.start = function start() {
    this._startTime = new Date().getTime() / 1000;

    // We need to be sure to get the focus in order to wake up the screen
    // if the phone goes to sleep before any user interaction.
    // Apparently it works because no other window has the focus at this point.
    window.focus();

    // modules loaded in deferred scripts should be initialized here.

    this.ttlView = new TTLView();
  };

  /**
   * Get current time offset from the start.
   *
   * @return {Number} The time offset.
   * @memberof System.prototype
   */
  System.prototype.currentTime = function currentTime() {
    return (new Date().getTime() / 1000 - this._startTime);
  };

  /**
   * Dispatch a DOM CustomEvent from window.
   * @param  {String} eventName Name of the event.
   * @param  {Object} detail    Detail of the event.
   * @return {Boolean}          False if the event was canceled.
   */
  System.prototype.publish = function sys_publish(eventName, detail) {
    var evt = new CustomEvent(eventName, { detail: detail });
    return window.dispatchEvent(evt);
  };

  /**
   * Print a debug message if DEBUG is turned on.
   * This function takes arbitrary amount of arguments and send it to
   * console.log().
   * @memberof System.prototype
   */
  System.prototype.debug = function sys_debug() {
    if (this.DEBUG) {
      console.log('[System]' +
        '[' + this.currentTime() + ']' +
        Array.slice(arguments).concat());
    }
  };

  /**
   * Print a debug message regardless.
   * This function takes arbitrary amount of arguments and send it to
   * console.log().
   * @memberof System.prototype
   */
  System.prototype.forceDebug = function sys_forceDebug() {
    console.log('[System]' +
      '[' + this.currentTime() + ']' +
      Array.slice(arguments).concat());
  };

  /**
   * Print out the stack when called.
   * @memberof System.prototype
   */
  System.prototype._dump = function sys__dump() {
    try {
      throw new Error('dump');
    } catch (e) {
      console.log(e.stack);
    }
  };

}(window));
