'use stricts';

/**

 */

var MemoryTest = {
  init: function mt_init() {
    var deviceStorage = navigator.getDeviceStorage('apps');

    if (!deviceStorage) {
      console.error('Cannot get DeviceStorage');
      return;
    }
    var request = deviceStorage.stat();
    request.onsuccess = function(e) {
      var totalSize = e.target.result.totalBytes;
      document.getElementById("ram_total").innerHTML = 'Unable to get it';
      document.getElementById("ram_available").innerHTML = 'Unable to get it';
      document.getElementById("rom_total").innerHTML = e.target.result.totalBytes;
      document.getElementById("rom_available").innerHTML = e.target.result.freeBytes;
    };
  },
  uninit: function mt_uninit() {
  }
};

window.addEventListener('load', MemoryTest.init.bind(MemoryTest));
window.addEventListener('unload', MemoryTest.uninit.bind(MemoryTest));
