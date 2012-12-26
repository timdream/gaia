'use stricts';

/**

 */

var LCDTest = {
  init: function lt_init() {
    document.getElementById('lcdtest').addEventListener('click', this.startTest);
  },
  startTest: function lt_startTest() {
    document.getElementById('lcdtest').mozRequestFullScreen();
    var testContainer = document.getElementById('lcdtest');
    var lcdTestHandler = function lt_lcdTestHandler() {
      switch (testContainer.style.backgroundColor) {
        case 'red':
          testContainer.style.backgroundColor = 'green';
          break;
        case 'green':
          testContainer.style.backgroundColor = 'blue';
          break;
        case 'blue':
          testContainer.style.backgroundColor = 'black';
          break;
        case 'black':
          testContainer.style.backgroundColor = 'white';
          break;
        case 'white':
          testContainer.removeEventListener('click', lcdTestHandler);
          testContainer.style.backgroundColor = '';
          document.mozCancelFullScreen();
          testContainer.innerHTML = 'Test Complete!';
          testContainer.disabled = true;          
          break;
      }
    }
    testContainer.innerHTML = '';
    testContainer.style.backgroundColor = 'red';
    testContainer.addEventListener('click', lcdTestHandler);
  },
  uninit: function lt_uninit() {
  }
};

window.addEventListener('load', LCDTest.init.bind(LCDTest));
window.addEventListener('unload', LCDTest.uninit.bind(LCDTest));
