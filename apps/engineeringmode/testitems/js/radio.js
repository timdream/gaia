'use stricts';

/**

 */

var RadioTest = {
  init: function rit_init() {
    var _battery = window.navigator.battery;
  },
  uninit: function rit_uninit() {
    var _battery = window.navigator.battery;
  }
};

window.addEventListener('load', RadioTest.init.bind(RadioTest));
window.addEventListener('unload', RadioTest.uninit.bind(RadioTest));
