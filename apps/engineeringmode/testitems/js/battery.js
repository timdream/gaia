'use stricts';

/**

 */

var BatteryTest = {
  init: function ct_init() {
    var _battery = window.navigator.battery;
    document.getElementById("status").innerHTML = _battery.charging;
    document.getElementById("level").innerHTML = _battery.level;
  },
  uninit: function ct_uninit() {
  }
};

window.addEventListener('load', BatteryTest.init.bind(BatteryTest));
window.addEventListener('unload', BatteryTest.uninit.bind(BatteryTest));
