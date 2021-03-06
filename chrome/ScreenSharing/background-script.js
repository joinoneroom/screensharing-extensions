﻿// this background script is used to invoke desktopCapture API
// to capture screen-MediaStream.

var session = ['screen', 'window'];

chrome.runtime.onConnect.addListener(function (port) {

  port.onMessage.addListener(function(message) {
    if(message && message.method == 'getSourceId') {
      getSourceID(message.payload.requestId);
    }
  });

  function getSourceID(requestId) {
    
	// as related in https://code.google.com/p/chromium/issues/detail?id=413602 and https://code.google.com/p/chromium/issues/detail?id=425344 :
	// a frame/iframe requesting screen sharing from a different origin than the parent window
	// will receive the InvalidStateError when using the getUserMedia function.
	// the solution its to change the tab.url property to the same as of the requesting iframe. Its works without iframe as well.
	// requires Chrome 40+
	
	var tab = port.sender.tab;
	tab.url = port.sender.url;
	
	chrome.desktopCapture.chooseDesktopMedia(session, tab, function(sourceId) {
      
	  console.log('sourceId', sourceId);
            
      // "sourceId" will be empty if permission is denied
      if(!sourceId || !sourceId.length) {
        return port.postMessage({ method: 'permissionDenied', payload: { requestId: requestId }});
      }
            
      // "ok" button is clicked; share "sourceId" with the
      // content-script which will forward it to the webpage
      port.postMessage({ method: 'sourceId', payload: { requestId: requestId, sourceId: sourceId } });
    });
  }

});

// for first time load to prevent requiring page refresh
// https://github.com/otalk/getScreenMedia/pull/9/files
chrome.runtime.onMessageExternal.addListener(function (message, sender, callback) {
  switch(message.type) {
    case 'getScreen':
      var pending = chrome.desktopCapture.chooseDesktopMedia(message.options || ['screen', 'window'],
       sender.tab, function (streamid) {
        // communicate this string to the app so it can call getUserMedia with it
        message.type = 'gotScreen';
        message.sourceId = streamid;
        callback(message);
        return false;
      });
      return true; // retain callback for chooseDesktopMedia result
    case 'cancelGetScreen':
      chrome.desktopCapture.cancelChooseDesktopMedia(message.request);
      message.type = 'canceledGetScreen';
      callback(message);
      return false; //dispose callback
  }
});
