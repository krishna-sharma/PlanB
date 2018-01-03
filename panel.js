// some utils
function insertIntoSortedArray(sortedArray, newNumber) {
  const indexOfLargerNumber = sortedArray.findIndex(number => number > newNumber);
  if (indexOfLargerNumber === -1)
    sortedArray.push(newNumber);
  else
    sortedArray.splice(indexOfLargerNumber, 0, newNumber);
}

function insertLogEntry(document, gridContainer, finishedRequests, finishedRequestsContents, requestHashes, requestHash, sanePreferences) {
  if (sanePreferences.logNetwork !== "yes") return;

  const presentEntryExists = document.getElementById(`hash${requestHash}`);
  if (presentEntryExists) return;

  const nextHash = requestHashes.find(number => number > requestHash) || 'nothing';
  const insertBefore = document.getElementById(`hash${nextHash}`);
  const presentEntry = finishedRequests[requestHash.toString()];

  const clickHandler = () => {
    if (sanePreferences.toggleNetwork !== "yes") return;

    const presentEntryNode = document.getElementById(`content${requestHash}`);
    if (presentEntryNode) {
      presentEntryNode.remove();
    } else {
      insertContentEntry(document, gridContainer, finishedRequestsContents, requestHash, presentEntry);
    }
  };

  const hashNode = document.createElement('div');
  hashNode.className = "item";
  hashNode.innerHTML = requestHash.toString();
  hashNode.id = `hash${requestHash}`;
  hashNode.onclick = clickHandler;
  gridContainer.insertBefore(hashNode, insertBefore);

  const methodNode = document.createElement('div');
  methodNode.className = "item";
  methodNode.innerHTML = presentEntry.request.method;
  methodNode.onclick = clickHandler;
  gridContainer.insertBefore(methodNode, insertBefore);

  const urlNode = document.createElement('div');
  urlNode.className = "item";
  const urlSegment = presentEntry.request.url.match(/.*\/(.*)/)[1] || presentEntry.request.url.match(/.*\/(.*\/)$/)[1];
  urlNode.innerHTML = urlSegment.substr(0, 100000);
  urlNode.title = presentEntry.request.url;
  urlNode.onclick = clickHandler;
  gridContainer.insertBefore(urlNode, insertBefore);

  const statusNode = document.createElement('div');
  statusNode.className = "item";
  statusNode.innerHTML = presentEntry.response.status;
  statusNode.onclick = clickHandler;
  gridContainer.insertBefore(statusNode, insertBefore);

  const timeNode = document.createElement('div');
  timeNode.className = "item";
  timeNode.innerHTML = `${Math.ceil(presentEntry.time)}ms`;
  timeNode.id = `timeNode${requestHash}`;
  timeNode.onclick = clickHandler;
  gridContainer.insertBefore(timeNode, insertBefore);
}

function insertContentEntry(document, gridContainer, finishedRequestsContents, requestHash, finishedRequest) {
  const presentEntryExists = document.getElementById(`content${requestHash}`);
  if (presentEntryExists) return;

  const insertBefore = document.getElementById(`timeNode${requestHash}`).nextSibling;
  const presentEntry = finishedRequestsContents[requestHash.toString()];

  let infoContent = "Not Available :(";
  if (presentEntry) {
    if (presentEntry.content || (presentEntry.encoding && finishedRequest.response.content.mimeType)) {
      infoContent = presentEntry.encoding !== "base64" ? presentEntry.content : (`${presentEntry.encoding} encoded ${finishedRequest.response.content.mimeType}`);
    }
  } else {
    finishedRequest.getContent(function(content, encoding) {
      finishedRequestsContents[requestHash.toString()] = {content, encoding};
      document.getElementById(`content${requestHash}`).remove();
      insertContentEntry(document, gridContainer, finishedRequestsContents, requestHash, finishedRequest);
    });
  }

  const contentNode = document.createElement('div');
  contentNode.className = "collapsible";
  contentNode.innerText = infoContent;
  contentNode.id = `content${requestHash}`;
  gridContainer.insertBefore(contentNode, insertBefore);
}

// default Preferences
const defaultPrefs = {
  preserveContent: "no",
  logNetwork: "yes",
  toggleNetwork: "yes"
};

// Create a tab in the devtools area
chrome.devtools.panels.create("PlanB", "icons/icon32.png", "panel.html", function(panel) {
  // Assuming that browser can't do more than one request per micro second.
  // requestHashes include time in milli secs followed by a 3 digit count.
  // requestTimes is for maintaining the number of requests that finished in a millisec.
  // Need to maintain requestTimes like this to accomodate overlaps of calls.
  let finishedRequests = {};
  let finishedRequestsContents = {};
  let requestHashes = [];
  let requestTimes = {};

  let sanePreferences;
  let gridContainer;
  let extPanelWindowDocument;

  panel.onShown.addListener(function (extPanelWindow) {
    extPanelWindowDocument = extPanelWindow.document;
    gridContainer = extPanelWindowDocument.getElementById('gridContainer');

    const changePreference = (event) => {
      const targetPreferenceNode = event.target;
      chrome.storage.local.set({
        [targetPreferenceNode.id.toString()]: targetPreferenceNode.checked ? "yes" : "no"
      });
    };

    sanePreferences && Object.entries(sanePreferences).forEach(([preferenceName, preferenceValue]) => {
      const preferenceNode = extPanelWindowDocument.getElementById(preferenceName);
      preferenceNode.checked = preferenceValue === "yes";
      preferenceNode.onchange = changePreference;
    });

    // log clearing...
    const clearLogs = () => {
      extPanelWindowDocument.getElementById("gridContainer").innerHTML = `
        <div class="item heading">hash</div>
        <div class="item heading">method</div>
        <div class="item heading">URL</div>
        <div class="item heading">status</div>
        <div class="item heading">time</div>
      `;
      finishedRequests = {};
      finishedRequestsContents = {};
      requestHashes = [];
      requestTimes = {};
    }
    extPanelWindowDocument.getElementById("clearLogs").onclick = clearLogs;

    requestHashes.forEach(requestHash => {
      insertLogEntry(
        extPanelWindowDocument, gridContainer, finishedRequests, finishedRequestsContents, requestHashes, requestHash, sanePreferences
      );
    });
  });

  panel.onHidden.addListener(function () {
    gridContainer = null;
    extPanelWindowDocument = null;
  });

  chrome.devtools.network.onRequestFinished.addListener(function(request) {
    if (sanePreferences.logNetwork !== "yes") {
      sanePreferences.preserveContent === "yes" && request.getContent();
    } else {
      const requestTime = request.startedDateTime.getTime();

      if (!requestTimes[requestTime.toString()])
        requestTimes[requestTime.toString()] = 1;
      else
        requestTimes[requestTime.toString()] += 1;

      const requestHash = requestTime * 1000 + requestTimes[requestTime.toString()];

      insertIntoSortedArray(requestHashes, requestHash);
      finishedRequests[requestHash.toString()] = request;

      extPanelWindowDocument && insertLogEntry(
        extPanelWindowDocument, gridContainer, finishedRequests, finishedRequestsContents, requestHashes, requestHash, sanePreferences
      );

      sanePreferences.preserveContent === "yes" && request.getContent(function(content, encoding) {
        finishedRequestsContents[requestHash.toString()] = {content, encoding};
      });
    }
  });

  // Preferences handling...
  chrome.storage.local.get(["preserveContent", "logNetwork", "toggleNetwork"], (savedPrefs) => {
    sanePreferences = {...defaultPrefs, ...savedPrefs};
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (sanePreferences && areaName === "local") {
      Object.keys(changes).forEach(preferenceName => {
        // update global variable for use when panel is hidden...
        sanePreferences[preferenceName] = changes[preferenceName].newValue;
        // if panel is visible, update in real time.
        if (extPanelWindowDocument) {
          const preferenceNode = extPanelWindowDocument.getElementById(preferenceName);
          preferenceNode.checked = sanePreferences[preferenceName] === "yes";
        }
      });
    }
  });
});
