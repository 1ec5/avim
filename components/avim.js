// XPCOM component to attach AVIM onto every XUL window and dialog box
// Inspired by the userChrome.js extension by Simon Bünzli
// <http://mozilla.zeniko.ch/userchrome.js.html>

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

const Cc = Components.classes;
const Ci = Components.interfaces;

/**
 * @class	Registers a service upon startup that loads the AVIM overlay into
 * 			every XUL window and dialog box.
 */
function AVIM() {
	this.wrappedJSObject = this;
}

// XPCOM registration
AVIM.prototype = {
	classDescription: "AVIM JavaScript XPCOM component",
	// { 0xee7dd176, 0xa684, 0x4dc0,
	// 		{ 0x86, 0x13, 0x62, 0xdd, 0xae, 0xf5, 0x37, 0x8f } }
	classID: Components.ID("{ee7dd176-a684-4dc0-8613-62ddaef5378f}"),
	contractID: "@1ec5.org/avim;1",
	
	// Register AVIM as a service that runs at application startup.
	_xpcom_categories: [{category: "app-startup", service: true}],
	
	QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver,
										   Ci.nsIDOMEventListener])
};

// nsIObserver implementation

/**
 * Attaches the AVIM overlay to each window when it loads.
 * 
 * @param subject	{object}	the window that loaded.
 * @param topic		{string}	the type of event that occurred.
 * @param data		{string}	
 */
AVIM.prototype.observe = function (subject, topic, data) {
	const xreSvc = Cc["@mozilla.org/xre/app-info;1"]
		.getService(Ci.nsIXULRuntime);
	if (xreSvc.inSafeMode) return;
	
	const observerSvc = Cc["@mozilla.org/observer-service;1"]
		.getService(Ci.nsIObserverService);
	switch (topic) {
		case "app-startup":
			observerSvc.addObserver(this, "domwindowopened", false);
			break;
		case "domwindowopened":
			this.overlayObs = new AVIMOverlayObserver(subject);
			subject.addEventListener("load", this, true);
//			break;
	}
};

// nsIDOMEventListener implementation

/**
 * Returns the chrome: URL of the overlay that corresponds to the window at the
 * given URL.
 *
 * @param windowUrl	{string}	URL of the window that the overlay will be
 * 								applied to.
 * @returns {string}	URL of the overlay to apply.
 */
AVIM.prototype.getOverlayUrl = function (windowUrl) {
//	var ID = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo).ID;
	var urls = {
		// SeaMonkey
		"chrome://navigator/content/navigator.xul":
			"chrome://avim/content/navigatorOverlay.xul",
		"chrome://editor/content/editor.xul":
			"chrome://avim/content/composerOverlay.xul",
		
		// Prism
		"chrome://webrunner/content/webrunner.xul":
			"chrome://avim/content/prismOverlay.xul",
		
		// Komodo and Komodo Edit
		"chrome://komodo/content/komodo.xul":
			"chrome://avim/content/komodoOverlay.xul",
		
		// BlueGriffon
		"chrome://bluegriffon/content/bluegriffon.xul":
			"chrome://avim/content/blueGriffonOverlay.xul"
	};
	return urls[windowUrl] || "chrome://avim/content/generalOverlay.xul";
}

/**
 * Loads the AVIM overlay onto the window.
 *
 * @param event	{object}	an onload event.
 */
AVIM.prototype.handleEvent = function (event) {
	var document = event.originalTarget;
	if (document.location && document.location.protocol == "chrome:") {
		document.loadOverlay(this.getOverlayUrl(document.location),
							 this.overlayObs);
	}
};

/**
 * @class	Listens for a notification that the AVIM XUL overlay has been merged
 * 			with the window.
 */
function AVIMOverlayObserver(aWindow) {
	this.window = aWindow;
}

/**
 * Forces an update of the window's UI.
 * 
 * @param subject	{object}	the URI of the merged overlay.
 * @param topic		{string}	the type of event that occurred; only
 * 								"xul-overlay-merged" is observed.
 * @param data		{string}	
 */
AVIMOverlayObserver.prototype.observe = function (subject, topic, data) {
	if (topic == "xul-overlay-merged") this.window.avim.updateUI();
}

function NSGetModule(compMgr, fileSpec) {
	return XPCOMUtils.generateModule([AVIM]);
}
