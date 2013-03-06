var MockImportHtml = (function MockGoogleListing() {

  var oReq = new XMLHttpRequest();
  oReq.responseType = 'text';
  // XXX: perform a synchronous request here
  oReq.open('get', 'mock_import.html', false);
  oReq.send();

  return oReq.responseText;
})();
