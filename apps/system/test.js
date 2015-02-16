'use strict';

var iframe;

var url =
  'data:text/html,<style> input { font-size: 30px; } *:focus { background-color: rgb(255, 128, 128) }</style><input value="tap me to focus">';

document.body.children[0].addEventListener('click', function() {
  if (iframe) {
    document.body.removeChild(iframe);
  }

  iframe = document.createElement('iframe');
  iframe.setAttribute('mozbrowser', 'true');

  iframe.src = url;

  document.body.appendChild(iframe);
});

document.body.children[1].addEventListener('click', function() {
  if (iframe) {
    document.body.removeChild(iframe);
  }

  iframe = document.createElement('iframe');
  iframe.setAttribute('mozbrowser', 'true');
  iframe.setAttribute('remote', 'true');

  iframe.src = url;

  document.body.appendChild(iframe);
});

document.body.children[2].addEventListener('mousedown', function(evt) {
  iframe.focus();
  evt.preventDefault();
});

window.addEventListener('mozChromeEvent', function(e) {
  if (e.detail.type !== 'remote-debugger-prompt') {
    return;
  }

  var event = document.createEvent('CustomEvent');
  event.initCustomEvent('mozContentEvent', true, true,
                        { type: 'remote-debugger-prompt',
                          value: true });
  window.dispatchEvent(event);
});
