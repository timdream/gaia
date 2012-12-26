'use stricts';

/**

 */

var AudioLoopTest = {
  init: function alt_init() {
    var _battery = window.navigator.battery;
    document.getElementById("status").innerHTML = _battery.charging;
    document.getElementById("level").innerHTML = _battery.level;
  },
  uninit: function alt_uninit() {
  }, 
  loopBackTest: function alt_loopBackTest() {
  }
};

window.addEventListener('load', AudioLoopTest.init.bind(AudioLoopTest));
window.addEventListener('unload', AudioLoopTest.uninit.bind(AudioLoopTest));
