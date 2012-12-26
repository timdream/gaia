'use stricts';

/**

 */

var WifiTest = {
  init: function wt_init() {
    var settings = window.navigator.mozSettings;
    var mac = settings.createLock().get('deviceinfo.mac');
    document.getElementById("wifi_mac").innerHTML = JSON.stringify(mac);
  },
  uninit: function wt_uninit() {
  }
};

window.addEventListener('load', WifiTest.init.bind(WifiTest));
window.addEventListener('unload', WifiTest.uninit.bind(WifiTest));
