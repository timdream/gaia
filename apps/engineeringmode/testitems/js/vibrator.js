'use stricts';

/**

 */

var VibratorTest = {
  init: function vt_init() {
    if (!('vibrate' in navigator)) {
      alert('Vibrator could not work!');
      return;
    }
    this.vibrateInterval = window.setInterval(function vibrate() {
      // Wait for the setting value to return before starting a vibration.
      navigator.vibrate([200]);
    }, 600);
  },
  uninit: function vt_uninit() {

  }
};

window.addEventListener('load', VibratorTest.init.bind(VibratorTest));
window.addEventListener('unload', VibratorTest.uninit.bind(VibratorTest));
