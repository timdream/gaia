'use strict';

// refer to mock_contact1.xml for the entry XML we are getting.

var MockGoogleEntry = (function MockGoogleEntry() {

  var oReq = new XMLHttpRequest();
  oReq.responseType = 'text';
  // XXX: perform a synchronous request here
  oReq.open('get', 'mock_contact1.xml', false);
  oReq.send();

  var entryBuffer = oReq.responseText;
  var parser = new DOMParser();
  return parser.parseFromString(entryBuffer, 'text/xml');
})();
