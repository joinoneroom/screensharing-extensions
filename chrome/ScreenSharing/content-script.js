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

var installedNodeId = 'oneroom-screensharing-opentok-extension-is-installed';
var isInstalledNode = document.getElementById(installedNodeId);
// Only mess with the page if we found the element that we expect. We do this,
// because the easiest way to make a development-friendly version of this
// extension is to allow it to run on localhost and ngrok.com domains, but we do
// not want to mess with pages that are not expecting this extension to run on.
if (isInstalledNode) {
  var affirmativeNode = document.createElement('div');
  affirmativeNode.setAttribute('data-type', 'chrome');
  isInstalledNode.appendChild(affirmativeNode);
}
