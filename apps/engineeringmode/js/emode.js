'use stricts';

var EMode = {
  get testList() {
    delete this.testList;
    return this.testList = document.getElementById(this.testClass);
  },
  get listContainer() {
    delete this.listContainer;
    return this.listContainer = document.getElementById('tests');
  },
  get testContainer() {
    delete this.testContainer;
    return this.testContainer = document.getElementById('test-panel');
  },
  get iframe() {
    delete this.iframe;
    return this.iframe = document.getElementById('test-iframe');
  },
  get backBtn() {
    delete this.backBtn;
    return this.backBtn = document.getElementById('test-panel-back');
  },
  get mainTitle() {
    delete this.mainTitle;
    return this.mainTitle = document.getElementById('main-title');
  },
  get panelTitle() {
    delete this.panelTitle;
    return this.panelTitle = document.getElementById('test-panel-title');
  },
  init: function ut_init() {
    this.testClass = 'production-test';
    this.listContainer.setAttribute('data-class', this.testClass);
    this.testList.addEventListener('click', this);
    this.iframe.addEventListener('load', this);
    this.iframe.addEventListener('unload', this);
    document.body.addEventListener('transitionend', this);
    window.addEventListener('keyup', this);
    window.addEventListener('hashchange', this);
    this.backBtn.addEventListener('click', this);
    this.updateMainTitle();

    var name = this.getNameFromHash();
    if (name)
      this.openTest(name);
  },
  uninit: function ut_uninit() {
    this.testList.removeEventListener('click', this);
    this.iframe.removeEventListener('load', this);
    this.iframe.removeEventListener('unload', this);
    document.body.removeEventListener('transitionend', this);
    window.removeEventListener('keyup', this);
    window.removeEventListener('hashchange', this);
    this.backBtn.removeEventListener('click', this);
  },
  getNameFromHash: function ut_getNameFromHash() {
    return (/\btest=(.+)(&|$)/.exec(window.location.hash) || [])[1];
  },
  handleEvent: function ut_handleEvent(ev) {
    switch (ev.type) {
      case 'click':
        if (ev.target.nodeName == 'A') {
          ev.target.setAttribute('data-checked', true);
          this.updateMainTitle();
          this.panelTitle.textContent = ev.target.textContent;
        }
        if (ev.target != this.backBtn) {
          return;
        }
        if (window.location.hash) {
          window.location.hash = '';
        }
        break;
      case 'load':
        this.iframe.contentWindow.addEventListener('keyup', this);
        break;
      case 'unload':
        this.iframe.contentWindow.removeEventListener('keyup', this);
        break;
      case 'hashchange':
        var name = this.getNameFromHash();
        if (!name) {
          this.closeTest();
          return;
        }
        this.openTest(name);
        break;
      case 'transitionend':
        var name = this.getNameFromHash();
        if (!name)
          this.iframe.src = 'about:blank';
        break;
    }
  },
  updateMainTitle: function em_updateMainTitle() {
    var total = this.testList.children.length;
    var queryStr = 'a[data-checked=true]';
    var checked = this.testList.querySelectorAll(queryStr).length;
    this.mainTitle.textContent = 'Completed : ' + checked + ' / ' + total ;
  },
  openTest: function ut_openTest(name) {
    document.body.classList.add('test');

    var self = this;
    window.setTimeout(function openTestPage() {
      self.iframe.src = './testitems/' + name + '.html';
    }, 200);
  },
  closeTest: function ut_closeTest() {
    var isOpened = document.body.classList.contains('test');
    if (!isOpened)
      return false;
    document.body.classList.remove('test');
    return true;
  }
};

window.onload = EMode.init.bind(EMode);
