'use stricts';

/**

 */

var IMSITest = {
  init: function imsi_init() {
    var _battery = window.navigator.battery;
    document.getElementById("imsi").innerHTML = _battery.charging;
  }
};

window.addEventListener('load', IMSITest.init.bind(IMSITest));
//window.addEventListener('unload', BatteryTest.uninit.bind(BatteryTest));
