'use strict';

function choiceChanged(target) {
  var choice = target.dataset.choice;
  if (!choice)
    return;

  var view = document.getElementById(choice + '-view');
  if (!view)
    return;

  var tabs = document.getElementById('tabs').querySelector('fieldset');
  var tabsCount = tabs.childElementCount;
  for (var i = 0; i < tabsCount; i++) {
    var tab = tabs.children[i];
    delete tab.dataset.active;

    var tabView = document.getElementById(tab.dataset.choice + '-view');
    if (tabView)
      tabView.hidden = true;
  }

  target.dataset.active = true;
  view.hidden = false;
}

// XXX: Hack to trigger onring.html for test
window.addEventListener('load', function loaded() {
  window.removeEventListener('load', loaded);

  var dayDate = document.getElementById('clock-day-date');
  dayDate.addEventListener('click', function() {
    alert('Hack: open up onring screen after 10 sec.');
    setTimeout(function() {
      AlarmManager._onFireAlarm = AlarmEditView.getDefaultAlarm();

      var protocol = window.location.protocol;
      var host = window.location.host;
      window.open(protocol + '//' + host + '/onring.html',
                  'ring_screen', 'attention');
    }, 10000);
  });
});

// Set the 'lang' and 'dir' attributes to <html> when the page is translated
window.addEventListener('localized', function showBody() {
  document.documentElement.lang = navigator.mozL10n.language.code;
  document.documentElement.dir = navigator.mozL10n.language.direction;
  // <body> children are hidden until the UI is translated
  document.body.classList.remove('hidden');
});
