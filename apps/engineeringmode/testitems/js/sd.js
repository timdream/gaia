'use stricts';

/**

 */

var SDTest = {
  init: function sdt_init() {
    var deviceStorage = navigator.getDeviceStorage('sdcard');

    if (!deviceStorage) {
      console.error('Cannot get DeviceStorage');
      return;
    }

    var request = deviceStorage.stat();
    request.onsuccess = function(e) {
      var totalSize = e.target.result.totalBytes;
      document.getElementById("mounted").innerHTML = '';
      document.getElementById("used").innerHTML = e.target.result.totalBytes;
      document.getElementById("total").innerHTML = '';
      document.getElementById("available").innerHTML = e.target.result.freeBytes;
    };

  },
  uninit: function sdt_uninit() {
  }
};

window.addEventListener('load', SDTest.init.bind(SDTest));
window.addEventListener('unload', SDTest.uninit.bind(SDTest));
