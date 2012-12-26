'use stricts';

/**

 */

var KeyTest = {
  init: function kt_init() {
    var key = 'audio.volume.notification';
    var settings = window.navigator.mozSettings;
    settings.addObserver('audio.volume.notification', function(evt) {
      alert(evt.settingValue);
      document.getElementById("vol_up").style.visibility = 'hidden';
      document.getElementById("vol_down").style.visibility = 'hidden';
    });
    window.addEventListener('mozChromeEvent', function(e) {
      var type = e.detail.type;
      switch (type) {
        case 'volume-up-button-press':
          alert('volume-up-button-press');
          document.getElementById("vol_up").style.visibility = 'hidden';
          break;
        case 'volume-down-button-press':
          alert('volume-down-button-press');
          
          break;
      }
    });
  },
  uninit: function kt_uninit() {
  }
};

window.addEventListener('load', KeyTest.init.bind(KeyTest));
window.addEventListener('unload', KeyTest.uninit.bind(KeyTest));
