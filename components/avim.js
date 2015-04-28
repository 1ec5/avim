// XPCOM component to attach AVIM onto every XUL window and dialog box
// Inspired by the userChrome.js extension by Simon Bünzli
// <http://mozilla.zeniko.ch/userchrome.js.html>
/* exported NSGetModule, NSGetFactory */
"use strict";

const gCc = Components.classes;
const gCi = Components.interfaces;

const CLASS_NAME = "AVIM JavaScript XPCOM component";
// { 0xee7dd176, 0xa684, 0x4dc0,
// 		{ 0x86, 0x13, 0x62, 0xdd, 0xae, 0xf5, 0x37, 0x8f } }
const CLASS_ID = Components.ID("{ee7dd176-a684-4dc0-8613-62ddaef5378f}");
const CONTRACT_ID = "@1ec5.org/avim;1";

/**
 * @class AVIMOverlayObserver
 *
 * Listens for a notification that the AVIM XUL overlay has been merged with the
 * window.
 *
 * @base nsIObserver
 */
function AVIMOverlayObserver(aWindow) {
	this.window = aWindow;
}

/**
 * Forces an update of the window's UI.
 * 
 * @param subject	{object}	the URI of the merged overlay.
 * @param topic		{string}	the type of event that occurred; only
 * 								"xul-overlay-merged" and "sb-overlay-load" are
 * 								observed.
 * @param data		{string}	
 */
AVIMOverlayObserver.prototype.observe = function (subject, topic, data) {
	if (topic !== "xul-overlay-merged" && topic !== "sb-overlay-load") return;
	if (!this.window) return;
	
	// Force AVIM's status bar panel to display the current input method.
	if (!this.window.avim) return;
	this.window.avim.registerPrefs();
	this.window.avim.updateUI();
};

/**
 * @class AVIM
 *
 * Registers a service upon startup that loads the AVIM overlay into every XUL
 * window and dialog box.
 *
 * @base nsIObserver
 * @base nsISupports
 */
function AVIM() {
	this.wrappedJSObject = this;
	this.didObserveStartup = false;
}

AVIM.prototype.QueryInterface = function(iid) {
	if (iid.equals(gCi.nsIObserver) || iid.equals(gCi.nsISupports)) return this;
	throw Components.results.NS_ERROR_NO_INTERFACE;
};

/**
 * Returns the chrome: URL of the overlay that corresponds to the window at the
 * given URL.
 *
 * @param windowUrl	{string}	URL of the window that the overlay will be
 * 								applied to.
 * @returns {string}	URL of the overlay to apply.
 */
AVIM.getOverlayUrl = function (windowUrl) {
//	let id =
//		gCc["@mozilla.org/xre/app-info;1"].getService(gCi.nsIXULAppInfo).ID;
	
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
		case "chrome://bluegriffon/content/xul/bluegriffon.xul":
			return "chrome://avim/content/blueGriffonOverlay.xul";
		// Spicebird
		case "chrome://collab/content/collab.xul":
			return "chrome://avim/content/collabOverlay.xul";
		default:
			return "chrome://avim/content/generalOverlay.xul";
	}
};

const subscriptLoader = gCc["@mozilla.org/moz/jssubscript-loader;1"]
	.getService(gCi.mozIJSSubScriptLoader);

/**
 * Loads a script at the given URI.
 *
 * @param uri		{string}	Location of the script.
 * @param target	{object}	A collection of properties to expose to the
 * 								script as its globals.
 * 
 * @see http://dxr.mozilla.org/mozilla-central/source/addon-sdk/source/lib/sdk/content/sandbox.js (importScripts())
 */
function loadSubScript(uri, target) {
	if ("loadSubScriptWithOptions" in subscriptLoader) {
		let options = {
			charset: "UTF-8",
// $if{Debug}
			ignoreCache: true,
// $endif{}
		};
		if (target) options.target = target;
		subscriptLoader.loadSubScriptWithOptions(uri, options);
	}
	else subscriptLoader.loadSubScript(uri, target, "UTF-8");
}

const appInfoSvc = gCc["@mozilla.org/xre/app-info;1"]
	.getService(gCi.nsIXULAppInfo);
const ffxID = "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}";
const flockID = "{a463f10c-3994-11da-9945-000d60ca027b}";

function hasMacBrowserOverlay() {
	return appInfoSvc.OS === "Darwin" &&
		((appInfoSvc.ID === ffxID && parseFloat(appInfoSvc.version) >= 3) ||
		 appInfoSvc.ID === flockID);
}

const ioSvc = gCc["@mozilla.org/network/io-service;1"]
	.getService(gCi.nsIIOService);

/**
 * Loads the AVIM overlay onto the given window.
 *
 * @param window	{object}	the window onto which AVIM should be attached.
 */
AVIM.prototype.onWindowOpen = function (win) {
	if (win.frameElement) return;
	win.addEventListener("DOMContentLoaded", function handleEvent(event) {
		window.removeEventListener("DOMContentLoaded", handleEvent, true);
		const xulTypes = ["text/xul", "application/vnd.mozilla.xul+xml"];
		let doc = event.originalTarget;
		if (!win || !doc.location || doc.location.protocol !== "chrome:" ||
			!doc.contentType || xulTypes.indexOf(doc.contentType) < 0) {
			return;
		}
		
		loadSubScript("chrome://avim/content/avim.js", win);
		loadSubScript("chrome://avim/content/frame.js", win);
		
		if (doc.location.href === "chrome://mozapps/content/extensions/extensions.xul") {
			loadSubScript("chrome://avim/content/addonsOverlay.xul", win);
		}
		if (doc.location.href.match(/^chrome:\/\/avim\/content\//) &&
			hasMacBrowserOverlay()) {
			doc.loadOverlay("chrome://browser/content/macBrowserOverlay.xul", null);
			
			let winUtils = win.getInterface(Ci.nsIDOMWindowUtils);
			let styleUri = ioSvc.newURI("chrome://browser/skin/preferences/preferences.css",
										null, null);
			winUtils.loadSheet(styleUri, winUtils.AUTHOR_SHEET);
		}
	}, true);
};

const styleSvc = gCc["@mozilla.org/content/style-sheet-service;1"]
	.getService(gCi.nsIStyleSheetService);
const styleUri = ioSvc.newURI("chrome://avim/content/skin/avim.css", null, null);

/**
 * Listens for window load events.
 * 
 * @param subject	{object}	the window that loaded.
 * @param topic		{string}	the type of event that occurred.
 * @param data		{string}	
 */
AVIM.prototype.observe = function (subject, topic, data) {
	const xreSvc = gCc["@mozilla.org/xre/app-info;1"]
		.getService(gCi.nsIXULRuntime);
	if (xreSvc.inSafeMode) return;
	
	const observerSvc = gCc["@mozilla.org/observer-service;1"]
		.getService(gCi.nsIObserverService);
/* jshint -W086 */
	switch (topic) {
		case "profile-after-change":
			if (this.didObserveStartup) break;
			// Otherwise, fall through.
		case "app-startup":
			observerSvc.addObserver(this, "domwindowopened", false);
			observerSvc.addObserver(this, "quit-application", false);
			this.didObserveStartup = true;
			styleSvc.loadAndRegisterSheet(styleUri, styleSvc.AUTHOR_SHEET);
			break;
		case "quit-application":
			observerSvc.removeObserver(this, "domwindowopened", false);
			observerSvc.addObserver(this, "quit-application", false);
			break;
		case "domwindowopened":
			this.onWindowOpen(subject);
//			break;
	}
/* jshint +W086 */
};

/**
 * @class AVIMFactory
 *
 * Factory class for creating an instance of the AVIM XPCOM component.
 */
let AVIMFactory = {
	createInstance: function(outer, iid) {
		if (outer) throw Components.results.NS_ERROR_NO_AGGREGATION;
		return new AVIM().QueryInterface(iid);
	}
};

/**
 * @class AVIMModule
 *
 * Module that registers the AVIM XPCOM component.
 * 
 * @base nsIModule
 */
let AVIMModule = {
	registerSelf: function(compMgr, fileSpec, loc, type) {
		compMgr = compMgr.QueryInterface(gCi.nsIComponentRegistrar);
		compMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME, CONTRACT_ID,
										fileSpec, loc, type);
		
		// Register the module for app-startup notifications.
		let catMgr = gCc["@mozilla.org/categorymanager;1"]
			.getService(gCi.nsICategoryManager);
		try {
			catMgr.addCategoryEntry("app-startup", CLASS_NAME,
									"service," + CONTRACT_ID, true, true);
		}
		catch (exc) {
			catMgr.addCategoryEntry("profile-after-change", CLASS_NAME,
									"service," + CONTRACT_ID, true, true);
		}
	},
	
	unregisterSelf: function(compMgr, loc, type) {
		compMgr = compMgr.QueryInterface(gCi.nsIComponentRegistrar);
		compMgr.unregisterFactoryLocation(CLASS_ID, loc);
		
		// Unregister the module from app-startup notifications.
		let catMgr = gCc["@mozilla.org/categorymanager;1"]
			.getService(gCi.nsICategoryManager);
		try {
			catMgr.addCategoryEntry("app-startup", CLASS_NAME, true);
		}
		catch (exc) {
			catMgr.addCategoryEntry("profile-after-change", CLASS_NAME, true);
		}
	},
	
	getClassObject: function(compMgr, cid, iid) {
		if (!iid.equals(gCi.nsIFactory)) {
			throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
		}
		if (cid.equals(CLASS_ID)) return AVIMFactory;
		throw Components.results.NS_ERROR_NO_INTERFACE;
	},
	
	canUnload: function(compMgr) {
		return true;
	}
};

function NSGetModule(compMgr, fileSpec) {
	return AVIMModule;
}

function NSGetFactory(cid) {
	let cidStr = cid.toString();
/* jshint -W116 */
	if (cidStr == CLASS_ID) return AVIMFactory;
/* jshint +W116 */
	throw Components.results.NS_ERROR_FACTORY_NOT_REGISTERED;
}
