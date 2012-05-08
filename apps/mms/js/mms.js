'use strict';

var MMSShowCase = {
  init: function mmsshowcase_init() {
    if (!navigator.mozMms)
      return;

    navigator.mozMms.addEventListener('received', this);
  },
  handleEvent: function mmsshowcase_handleEvent(evt) {
    switch (evt.type) {
      case 'received':
        this.prependMessage(evt.message);
      break;
    }
  },
  prependMessage: function mmsshowcase_prependMessage(msg) {
    var appendHTML = function appendHTML(el, html) {
      var docFragment = document.createDocumentFragment();
      docFragment.innerHTML = html;
      el.appendChild(docFragment);
    };

    var msgDiv = document.createElement('div');
    msgDiv.className = 'sender';

    appendHTML(msgDiv, '<div class="photo">' +
        '<img src="style/images/contact-placeholder.png" />' +
      '</div>');

    for (filename in msg.attachments)
        if (msg.attachments.hasOwnProperty(filename)) {
      var file = msg.attachments[filename];

      switch (file.type.split('/')[0]) {
        case 'image':
          // XXX: remember to window.URL.revokeObjectURL
          var el = new Image();
          el.className = 'attach-image';
          el.src = window.URL.createObjectURL(file);
          break;
        case 'text':
          var el = document.createElement('div');
          el.className = 'text';

          // XXX: need to verify we would get charset info this say
          var charset = (file.type.match(/charset=(.+)/) || [])[1];

          // XXX: File.getAsText is obsolete
          // use FileReader instead (but it's async)
          el.textContent = file.getAsText(charset || 'UTF-8');
          break;
        default:
          // XXX: we drop other file type here.
          break;
      }
      msgDiv.appendChild(el);
    }

    appendHTML(msgDiv, '<div class="time" ' +
      'data-time="' + msg.timestamp.getTime() + '">' +
                 prettyDate(msg.timestamp) + '</div>' +
      '</div>');

    if (!this.list)
      this.list = document.getElementById('mms-list');

    this.list.prepend(msgDiv);
    this.list.scrollTop = 0;
  }
};

MMSShowCase.init();

// Based on Resig's pretty date
function prettyDate(time) {

  switch (time.constructor) {
    case String:
      time = parseInt(time);
      break;
    case Date:
      time = time.getTime();
      break;
  }

  var diff = (Date.now() - time) / 1000;
  var day_diff = Math.floor(diff / 86400);

  if (isNaN(day_diff))
    return '(incorrect date)';

  if (day_diff < 0 || diff < 0) {
    // future time
    return (new Date(time)).toLocaleFormat('%x %R');
  }

  return day_diff == 0 && (
    diff < 60 && 'Just Now' ||
    diff < 120 && '1 Minute Ago' ||
    diff < 3600 && Math.floor(diff / 60) + ' Minutes Ago' ||
    diff < 7200 && '1 Hour Ago' ||
    diff < 86400 && Math.floor(diff / 3600) + ' Hours Ago') ||
    day_diff == 1 && 'Yesterday' ||
    day_diff < 7 && (new Date(time)).toLocaleFormat('%A') ||
    (new Date(time)).toLocaleFormat('%x');
}

(function() {
  var updatePrettyDate = function updatePrettyDate() {
    var labels = document.querySelectorAll('[data-time]');
    var i = labels.length;
    while (i--) {
      labels[i].textContent = prettyDate(labels[i].dataset.time);
    }
  };
  var timer = setInterval(updatePrettyDate, 60 * 1000);

  window.addEventListener('message', function visibleAppUpdatePrettyDate(evt) {
    var data = evt.data;
    if (data.message !== 'visibilitychange')
      return;
    clearTimeout(timer);
    if (!data.hidden) {
      updatePrettyDate();
      timer = setInterval(updatePrettyDate, 60 * 1000);
    }
  });
})();

