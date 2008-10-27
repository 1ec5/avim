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
	
	QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver])
};

// nsIObserver implementation

/**
 * Returns the chrome: URL of the overlay that corresponds to the window at the
 * given URL.
 *
 * @param windowUrl	{string}	URL of the window that the overlay will be
 * 								applied to.
 * @returns {string}	URL of the overlay to apply.
 */
AVIM.getOverlayUrl = function (windowUrl) {
	var id = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo).ID;
//	var isFf = id == "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}";
	var isSm = id == "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}";
	
	switch (windowUrl) {
		// Sunbird
		case "chrome://sunbird/content/calendar.xul":
			return "chrome://avim/content/calendarOverlay.xul";
		// SeaMonkey Composer
		case "chrome://editor/content/editor.xul":
			return "chrome://avim/content/composerOverlay.xul";
		// Prism
		case "chrome://webrunner/content/webrunner.xul":
			return "chrome://avim/content/prismOverlay.xul";
		// Komodo and Komodo Edit
		case "chrome://komodo/content/komodo.xul":
			return "chrome://avim/content/komodoOverlay.xul";
		// BlueGriffon
		case "chrome://bluegriffon/content/bluegriffon.xul":
			return "chrome://avim/content/blueGriffonOverlay.xul";
		default:
			if (isSm) return "chrome://avim/content/navigatorOverlay.xul";
			return "chrome://avim/content/generalOverlay.xul";
	}
};

/**
 * Loads the AVIM overlay onto the given window.
 *
 * @param window	{object}	the window onto which AVIM should be attached.
 */
AVIM.prototype.onWindowOpen = function (window) {
	var handleEvent = function (event) {
		var document = event.originalTarget;
		if (document.location && document.location.protocol == "chrome:") {
			document.loadOverlay(AVIM.getOverlayUrl(document.location.href),
								 new AVIMOverlayObserver(window));
		}
		window.removeEventListener("DOMContentLoaded", handleEvent, true);
	};
	window.addEventListener("DOMContentLoaded", handleEvent, true);
};

/**
 * Listens for window load events.
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
			this.onWindowOpen(subject);
//			break;
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
};

function NSGetModule(compMgr, fileSpec) {
	return XPCOMUtils.generateModule([AVIM]);
}
