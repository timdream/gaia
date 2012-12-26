'use stricts';

/**

 */

var FMTest = {
  init: function fmt_init() {
    var _battery = window.navigator.battery;
    document.getElementById("mounted").innerHTML = _battery.charging;
    document.getElementById("used").innerHTML = _battery.level;
    document.getElementById("total").innerHTML = _battery.charging;
    document.getElementById("available").innerHTML = _battery.level;
  },
  uninit: function fmt_uninit() {
  }
};

window.addEventListener('load', FMTest.init.bind(FMTest));
window.addEventListener('unload', FMTest.uninit.bind(FMTest));
