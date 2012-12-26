'use stricts';

/**

 */

var SensorTest = {
  init: function st_init() {
    var _battery = window.navigator.battery;
    document.getElementById("accelerometer").innerHTML = _battery.charging;
    document.getElementById("magnetic").innerHTML = _battery.level;
    document.getElementById("gyroscope").innerHTML = _battery.charging;
    document.getElementById("light").innerHTML = _battery.level;
    document.getElementById("proximity").innerHTML = _battery.charging;
  },
  uninit: function st_uninit() {
  }
};

window.addEventListener('load', SensorTest.init.bind(SensorTest));
window.addEventListener('unload', SensorTest.uninit.bind(SensorTest));
