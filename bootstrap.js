/* global Services, APP_SHUTDOWN */
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

let styleUri = Services.io.newURI("chrome://avim/content/skin/avim.css",
                                  null, null);

function loadOverlay(win) {
    const xulTypes = ["text/xul", "application/vnd.mozilla.xul+xml"];
    let winUtils = win.getInterface(Ci.nsIDOMWindowUtils);
    let doc = win.document;
    if (!doc.location ||
        doc.location.protocol !== "chrome:" || !doc.contentType ||
        xulTypes.indexOf(doc.contentType) < 0) {
        return;
    }
    
    winUtils.loadSheet(styleUri, winUtils.AUTHOR_SHEET);
    
    loadSubScript("chrome://avim/content/avim.js", win || {});
    loadSubScript("chrome://avim/content/frame.js", win || {});
}

function loadOverlays(win, topic, data) {
    if (win.frameElement) return;
	let winUtils = win.getInterface(Ci.nsIDOMWindowUtils);
    win.addEventListener("DOMContentLoaded", function doLoadOverlay(evt) {
        win.removeEventListener(evt.type, doLoadOverlay, true);
        loadOverlay(win);
    }, true);
	win.addEventListener("AVIM:shutdown", function unloadOverlay(evt) {
		win.removeEventListener(evt.type, unloadOverlay, false);
        winUtils.removeSheet(styleUri, winUtils.AUTHOR_SHEET);
	}, false);
}

const resProtocol = Services.io.getProtocolHandler("resource")
    .QueryInterface(Ci.nsIResProtocolHandler);

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
    
    let wins = Services.ww.getWindowEnumerator();
    while (wins.hasMoreElements()) {
        loadOverlay(wins.getNext().QueryInterface(Ci.nsIDOMWindow));
    }
    Services.ww.registerNotification(loadOverlays);
}

function shutdown(data, reason) {
    if (reason === APP_SHUTDOWN) return;
    
	Services.ww.unregisterNotification(loadOverlays);
	let wins = Services.ww.getWindowEnumerator();
    while (wins.hasMoreElements()) {
        let win = wins.getNext().QueryInterface(Ci.nsIDOMWindow);
        win.dispatchEvent(new Event("AVIM:shutdown"));
    }
    Services.obs.notifyObservers(null, "chrome-flush-caches", null);
    
    resProtocol.setSubstitution("avim-components", null);
	resProtocol.setSubstitution("avim-preferences", null);
}

function install(data, reason) {
}

function uninstall(data, reason) {
}
