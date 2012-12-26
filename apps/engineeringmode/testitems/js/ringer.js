'use stricts';

/**

 */

var RingerTest = {
  init: function rt_init() {
    document.getElementById('ringertest').addEventListener('click', this.play);
  },
  uninit: function rt_uninit() {

  },
  play: function rt_play(src) {
    var ringtonePlayer = new Audio();
    ringtonePlayer.loop = true;
    var selectedSound = '../../style/ringtones/' + src;
    ringtonePlayer.src = selectedSound;
    ringtonePlayer.play();
    window.setTimeout(function _pauseRingtone() {
      ringtonePlayer.pause();
    }, 20000);
  }
};

window.addEventListener('load', RingerTest.init.bind(RingerTest));
window.addEventListener('unload', RingerTest.uninit.bind(RingerTest));
