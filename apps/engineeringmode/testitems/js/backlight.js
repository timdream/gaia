'use stricts';

/**

 */

var BacklightTest = {
  init: function blt_init() {
    this.power = power = navigator.mozPower;
    if (!this.power)
      return;

    this.flashInterval = window.setInterval(function flash() {
      if (power.screenBrightness === 1.0) {
        power.screenBrightness = 0.2;
      } else {
        power.screenBrightness = 1.0;
      }
    }, 600);
  },
  uninit: function blt_uninit() {
    if (!this.power)
      return;
    this.flashInterval.clearInterval();
    this.power.screenBrightness = 1.0;
  }
};

window.addEventListener('load', BacklightTest.init.bind(BacklightTest));
window.addEventListener('unload', BacklightTest.uninit.bind(BacklightTest));
