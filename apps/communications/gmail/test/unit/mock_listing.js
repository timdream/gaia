'use strict';

/*

  This mock represents the following google contacts response
  for a list of contacts. See mock_listing.xml.

*/

var MockGoogleListing = (function MockGoogleListing() {

  var oReq = new XMLHttpRequest();
  oReq.responseType = 'text';
  // XXX: perform a synchronous request here
  oReq.open('get', 'mock_listing.xml', false);
  oReq.send();

  var entryBuffer = oReq.responseText;
  var parser = new DOMParser();
  var listing = parser.parseFromString(entryBuffer, 'text/xml');

  return listing;

})();
