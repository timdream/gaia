'use stricts';

/**

 */

var GPSTest = {
  init: function gpst_init() {
    var _battery = window.navigator.battery;
    document.getElementById("svStatus").innerHTML = _battery.charging;
    document.getElementById("satellites").innerHTML = _battery.level;
  },
  uninit: function gpst_uninit() {
  }
};

window.addEventListener('load', GPSTest.init.bind(GPSTest));
window.addEventListener('unload', GPSTest.uninit.bind(GPSTest));
