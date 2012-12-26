'use stricts';

/**

 */

var ProductionTest = {
  init: function pt_init() {

  },
  uninit: function pt_uninit() {

  }
};

window.addEventListener('load', ProductionTest.init.bind(ProductionTest));
window.addEventListener('unload', ProductionTest.uninit.bind(ProductionTest));
