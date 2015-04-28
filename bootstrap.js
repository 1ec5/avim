/* global Services, ADDON_INSTALL, ADDON_ENABLE, APP_SHUTDOWN */
/* exported startup, shutdown, install, uninstall */
"use strict";

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

// https://developer.mozilla.org/en-US/Add-ons/How_to_convert_an_overlay_extension_to_restartless#Step_4.3A_Manually_handle_default_preferences
///// Unicode getCharPref
//function getUCharPref(prefName, branch) {
//	branch = branch ? branch : Services.prefs;
//	return branch.getComplexValue(prefName, Ci.nsISupportsString).data;
//}
/// Unicode setCharPref
function setUCharPref(prefName, text, branch) {
	var string = Cc["@mozilla.org/supports-string;1"]
		.createInstance(Ci.nsISupportsString);
	string.data = text;
	branch = branch ? branch : Services.prefs;
	branch.setComplexValue(prefName, Ci.nsISupportsString, string);
}
//function getGenericPref(branch, prefName) {
//	switch (branch.getPrefType(prefName)) {
//		default:
//		case 0:   return undefined;                      // PREF_INVALID
//		case 32:  return getUCharPref(prefName,branch);  // PREF_STRING
//		case 64:  return branch.getIntPref(prefName);    // PREF_INT
//		case 128: return branch.getBoolPref(prefName);   // PREF_BOOL
//	}
//}
function setGenericPref(branch, prefName, prefValue) {
	switch (typeof prefValue) {
		case "string":
			setUCharPref(prefName, prefValue, branch);
			break;
		case "number":
			branch.setIntPref(prefName, prefValue);
			break;
		case "boolean":
			branch.setBoolPref(prefName, prefValue);
			break;
	}
}
function setDefaultPref(prefName, prefValue) {
	var defaultBranch = Services.prefs.getDefaultBranch(null);
	setGenericPref(defaultBranch, prefName, prefValue);
}

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
	if ("loadSubScriptWithOptions" in Services.scriptloader) {
		let options = {
			charset: "UTF-8",
// $if{Debug}
			ignoreCache: true,
// $endif{}
		};
		if (target) options.target = target;
		Services.scriptloader.loadSubScriptWithOptions(uri, options);
	}
	else Services.scriptloader.loadSubScript(uri, target, "UTF-8");
}

const ffxID = "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}";
const flockID = "{a463f10c-3994-11da-9945-000d60ca027b}";

function hasMacBrowserOverlay() {
	return Services.appinfo.OS === "Darwin" &&
		(Services.appinfo.ID === ffxID || Services.appinfo.ID === flockID);
}

function loadOverlay(win) {
    const xulTypes = ["text/xul", "application/vnd.mozilla.xul+xml"];
    let doc = win.document;
    if (!win || !doc.location || doc.location.protocol !== "chrome:" ||
        !doc.contentType || xulTypes.indexOf(doc.contentType) < 0) {
        return;
    }
    
    loadSubScript("chrome://avim/content/avim.js", win);
    loadSubScript("chrome://avim/content/frame.js", win);
	
	if (doc.location.href.match(/^chrome:\/\/avim\/content\//) &&
		hasMacBrowserOverlay()) {
		doc.loadOverlay("chrome://browser/content/macBrowserOverlay.xul", null);
		
		let winUtils = win.getInterface(Ci.nsIDOMWindowUtils);
		let styleUri = Services.io.newURI("chrome://browser/skin/preferences/preferences.css",
										  null, null);
		winUtils.loadSheet(styleUri, winUtils.AUTHOR_SHEET);
	}
}

function onWindowOpen(win, topic, data) {
    if (win.frameElement) return;
    win.addEventListener("DOMContentLoaded", function doLoadOverlay(evt) {
        win.removeEventListener(evt.type, doLoadOverlay, true);
		loadOverlay(win);
	}, true);
}

function onAddonsOpen(win, topic, data) {
	loadSubScript("chrome://avim/content/addonsOverlay.js", win || {});
}

const resProtocol = Services.io.getProtocolHandler("resource")
    .QueryInterface(Ci.nsIResProtocolHandler);

const styleSvc = Cc["@mozilla.org/content/style-sheet-service;1"]
	.getService(Ci.nsIStyleSheetService);
const styleUri = Services.io.newURI("chrome://avim/content/skin/avim.css",
									null, null);

function startup(data, reason) {
	let aliasFile = Cc["@mozilla.org/file/local;1"]
		.createInstance(Ci.nsILocalFile);
	aliasFile.initWithPath(data.resourceURI.path + "components");
	let aliasURI = Services.io.newFileURI(aliasFile);
	resProtocol.setSubstitution("avim-components", aliasURI);
	
	aliasFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
	aliasFile.initWithPath(data.resourceURI.path + "defaults/preferences");
	aliasURI = Services.io.newFileURI(aliasFile);
	resProtocol.setSubstitution("avim-preferences", aliasURI);
    
    loadSubScript("resource://avim-preferences/avim.js", {
        pref: setDefaultPref,
    });
    
	styleSvc.loadAndRegisterSheet(styleUri, styleSvc.AUTHOR_SHEET);
    
    let wins = Services.ww.getWindowEnumerator();
    while (wins.hasMoreElements()) {
        loadOverlay(wins.getNext().QueryInterface(Ci.nsIDOMWindow));
    }
    Services.ww.registerNotification(onWindowOpen);
	Services.obs.addObserver(onAddonsOpen, "EM-loaded", false);
	
	if (reason === ADDON_INSTALL || reason === ADDON_ENABLE) {
		let topWindow = Services.wm.getMostRecentWindow(null);
		if (topWindow) {
			topWindow.avim.playCueAfterToggle();
			topWindow.avim.showTogglePopup(true);
		}
	}
}

function shutdown(data, reason) {
    if (reason === APP_SHUTDOWN) return;
	
	Services.obs.removeObserver(onAddonsOpen, "EM-loaded");
	Services.ww.unregisterNotification(onWindowOpen);
	let wins = Services.ww.getWindowEnumerator();
    while (wins.hasMoreElements()) {
        let win = wins.getNext().QueryInterface(Ci.nsIDOMWindow);
        win.dispatchEvent(new Event("AVIM:shutdown"));
    }
	
	styleSvc.unregisterSheet(styleUri, styleSvc.AUTHOR_SHEET);
	
    Services.obs.notifyObservers(null, "chrome-flush-caches", null);
    
    resProtocol.setSubstitution("avim-components", null);
	resProtocol.setSubstitution("avim-preferences", null);
}

function install(data, reason) {
}

function uninstall(data, reason) {
}
