// this content-script plays role of medium to publish/subscribe messages from webpage to the background script

var extensionID = chrome.runtime.id;

var prefix = 'com.tokbox.screenSharing.' + extensionID;

// this port connects with background script
var port = chrome.runtime.connect();

var response = function(method, payload) {
  var res = { payload: payload, from: 'extension' };
  res[prefix] = method;
  return res;
}

// if background script sent a message
port.onMessage.addListener(function (message) {
  if(message && message.method === 'permissionDenied') {
    window.postMessage(response('permissionDenied', message.payload), '*');
  } else if (message && message.method === 'sourceId') {
    window.postMessage(response('sourceId', message.payload), '*');
  }
});

// this event handler watches for messages sent from the webpage
// it receives those messages and forwards to background script
window.addEventListener('message', function (event) {

  if (event.source != window) {
    return;
  }

  if(!(event.data != null && typeof event.data === 'object' && event.data[prefix]
    && event.data.payload != null && typeof event.data.payload === 'object')) {
    return;
  }

  if(event.data.from !== 'jsapi') {
    return;
  }

  var method = event.data[prefix],
      payload = event.data.payload;

  if(!payload.requestId) {
    console.warn('Message to screen sharing extesnion does not have a requestId for replies.');
    return;
  }

  if(method === 'isExtensionInstalled') {
    return window.postMessage(response('extensionLoaded', payload), '*');
  }

  if(method === 'getSourceId') {
    return port.postMessage({ method: 'getSourceId', payload: payload });
  }
});

// inform browser that you're available!
window.postMessage(response('extensionLoaded'), '*');


// for first time load to prevent requiring page refresh
// This is for AFTER the first time load. If the extension is NOT yet installed
// then this session storage variable will NOT be set and is only set AFTER
// successful installation. But if it IS already installed, we need this for
// calling the background script chrome.runtime.sendMessage call.
// https://github.com/otalk/getScreenMedia/pull/9/files
sessionStorage.oneroomScreensharingOpentokExtensionId = chrome.runtime.id;
