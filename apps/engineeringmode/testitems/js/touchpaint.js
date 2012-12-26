'use stricts';

/**

 */

var TouchpaintTest = {
  init: function tpt_init() {
    document.getElementById('touchtest').addEventListener('click', this.touchTest);
  },
  uninit: function tpt_uninit() {
  },
  touchTest: function tpt_init() {
    window.parent.document.getElementById('test-iframe').mozRequestFullScreen();
  }
};

window.addEventListener('load', TouchpaintTest.init.bind(TouchpaintTest));
window.addEventListener('unload', TouchpaintTest.uninit.bind(TouchpaintTest));
