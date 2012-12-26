'use stricts';

/**

 */

var IMEITest = {
  init: function imei_init() {
    var _battery = window.navigator.battery;
    document.getElementById("imei").innerHTML = _battery.charging;
  }
};

window.addEventListener('load', IMEITest.init.bind(IMEITest));
//window.addEventListener('unload', BatteryTest.uninit.bind(BatteryTest));
