/* exported startup, shutdown, install, uninstall */
"use strict";

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

// https://developer.mozilla.org/en-US/Add-ons/How_to_convert_an_overlay_extension_to_restartless#Step_4.3A_Manually_handle_default_preferences
function getGenericPref(branch, prefName) {
	switch (branch.getPrefType(prefName)) {
		default:
		case 0:   return undefined;                      // PREF_INVALID
		case 32:  return getUCharPref(prefName,branch);  // PREF_STRING
		case 64:  return branch.getIntPref(prefName);    // PREF_INT
		case 128: return branch.getBoolPref(prefName);   // PREF_BOOL
	}
}
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
/// Unicode getCharPref
function getUCharPref(prefName, branch) {
	branch = branch ? branch : Services.prefs;
	return branch.getComplexValue(prefName, Ci.nsISupportsString).data;
}
/// Unicode setCharPref
function setUCharPref(prefName, text, branch) {
	var string = Cc["@mozilla.org/supports-string;1"]
		.createInstance(Ci.nsISupportsString);
	string.data = text;
	branch = branch ? branch : Services.prefs;
	branch.setComplexValue(prefName, Ci.nsISupportsString, string);
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

function loadOverlays(win, topic, data) {
	let winUtils = win.getInterface(Ci.nsIDOMWindowUtils);
    let styleUri = Services.io.newURI("chrome://avim/content/skin/avim.css",
                                      null, null);
    
    win.addEventListener("DOMContentLoaded", function loadOverlay(evt) {
		win.removeEventListener("DOMContentLoaded", loadOverlay, true);
        const xulTypes = ["text/xul", "application/vnd.mozilla.xul+xml"];
        let doc = evt.originalTarget;
        if (win.frameElement || !doc.location ||
            doc.location.protocol !== "chrome:" || !doc.contentType ||
            xulTypes.indexOf(doc.contentType) < 0) {
            return;
        }
        
        winUtils.loadSheet(styleUri, winUtils.AUTHOR_SHEET);
        
		loadSubScript("chrome://avim/content/avim.js", win || {});
        loadSubScript("chrome://avim/content/frame.js", win || {});
        win.avim.buildUI();
	}, true);
	win.addEventListener("AVIM:shutdown", function unloadOverlay(evt) {
		win.removeEventListener("AVIM:shutdown", unloadOverlay);
		win.messageManager.removeMessageListener("AVIM:keypress",
												 win.avim.onFrameKeyPress);
		win.avim.unregisterPrefs();
        
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
    
    Services.ww.registerNotification(loadOverlays);
}

function shutdown(data, reason) {
    if (reason === APP_SHUTDOWN) return;
    
	Services.ww.unregisterNotification(loadOverlays);
	Services.obs.notifyObservers("AVIM:shutdown");
    Services.obs.notifyObservers(null, "chrome-flush-caches", null);
    
    resProtocol.setSubstitution("avim-components", null);
	resProtocol.setSubstitution("avim-preferences", null);
}

function install(data, reason) {
}

function uninstall(data, reason) {
}
