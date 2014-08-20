"use strict";

(function () {
/**
 * A class that detects when Mudim is installed and enabled.
 */
function MudimMonitor() {
	const Cc = Components.classes;
	const Ci = Components.interfaces;
	
	// GUID of the Mudim extension
	const MUDIM_ID = "mudim@svol.ru";
	
	const avimPrefs = Cc["@mozilla.org/preferences-service;1"]
		.getService(Ci.nsIPrefService).getBranch("extensions.avim.");
	const mudimPrefs = Cc["@mozilla.org/preferences-service;1"]
		.getService(Ci.nsIPrefService).getBranch("chimmudim.");
	const avimEnabledId = "enabled";
	const mudimMethodId = "settings.method";
	
	const stringBundleId = "avim-bundle";
	const noteValue = "mudim-note";
	
	const notificationBoxId = "addonsMsg";
	
	// Mudim itself
	let thisMonitor = this;
	if (window.Application) {
		if (Application.extensions && Application.extensions.get) {
			this.mudim = Application.extensions.get(MUDIM_ID);
		}
		else if (Application.getExtensions) {
			Application.getExtensions(function (extensions) {
				thisMonitor.mudim = extensions.get(MUDIM_ID);
				thisMonitor.getPrefs();
			});
		}
	}
	
	let $ = function (id) {
		return document.getElementById(id);
	};
	
	/**
	 * Registers an observer so that a warning is displayed if Mudim is
	 * enabled.
	 */
	this.registerPrefs = function() {
		avimPrefs.QueryInterface(Ci.nsIPrefBranch2);
		mudimPrefs.QueryInterface(Ci.nsIPrefBranch2);
		avimPrefs.addObserver(avimEnabledId, this, false);
		mudimPrefs.addObserver(mudimMethodId, this, false);
		this.getPrefs();
	};
	
	/**
	 * Unregisters the preferences observer as the window is being closed.
	 */
	this.unregisterPrefs = function() {
		this.setPrefs();
		avimPrefs.removeObserver(avimEnabledId, this);
		mudimPrefs.removeObserver(mudimMethodId, this);
	};
	
	/**
	 * Returns whether Mudim conflicts with AVIM.
	 *
	 * @returns {boolean}	true if Mudim conflicts with AVIM; false
	 * 						otherwise.
	 */
	this.conflicts = function() {
		return avimPrefs.getBoolPref(avimEnabledId) && this.mudim &&
			this.mudim.enabled && mudimPrefs.getIntPref(mudimMethodId);
	};
	
	/**
	 * Disables the Mudim extension, because it may interfere with AVIM's
	 * operation. Unfortunately, we can't just set Mudim's method preference
	 * to 0 (off), because Mudim doesn't observe preference changes. This
	 * method supports versions 0.3 (r14) and above.
	 *
	 * @param note	{object}	the <notification> element whose button
	 * 							triggered the call to this method.
	 * @param desc	{string}	the button's description.
	 */
	this.disableMudim = function(note, desc) {
		let mediator = Cc["@mozilla.org/appshell/window-mediator;1"]
			.getService(Ci.nsIWindowMediator);
		let enumerator = mediator.getEnumerator("navigator:browser");
		while (enumerator.hasMoreElements()) {
			let win = enumerator.getNext();
			try {
				if (parseInt(win.Mudim.method) != 0) win.CHIM.Toggle();
			}
			catch (e) {}
		}
	};
	
	function getNotificationBox() {
		if ($(notificationBoxId)) return $(notificationBoxId);
		
		let browserWin = Cc["@mozilla.org/appshell/window-mediator;1"]
			.getService(Ci.nsIWindowMediator)
			.getMostRecentWindow("navigator:browser");
		return browserWin && browserWin.gBrowser &&
			browserWin.gBrowser.getNotificationBox();
	}
	
	/**
	 * Displays a notification that Mudim is enabled.
	 */
	this.displayWarning = function() {
		let noteBox = getNotificationBox();
		if (!noteBox || noteBox.getNotificationWithValue(noteValue)) return;
		
		let stringBundle = $(stringBundleId);
		if (!stringBundle) return;
		
		let noteLabel = stringBundle.getString("mudim-note.label");
		let noteBtns = [{
			accessKey: stringBundle.getString("mudim-button.accesskey"),
			callback: this.disableMudim,
			label: stringBundle.getString("mudim-button.label"),
			popup: null
		}];
		let icon = "URI_NOTIFICATION_ICON_WARNING" in window &&
			URI_NOTIFICATION_ICON_WARNING;
		noteBox.appendNotification(noteLabel, noteValue, icon,
								   noteBox.PRIORITY_WARNING_MEDIUM,
								   noteBtns);
	};
	
	/**
	 * Hides the notification that Mudim is enabled.
	 */
	this.hideWarning = function() {
		let noteBox = getNotificationBox();
		if (!noteBox) return;
		let note = noteBox.getNotificationWithValue(noteValue);
		if (note) noteBox.removeNotification(note);
	};
	
	/**
	 * Updates the panel's current state to reflect the stored preferences.
	 *
	 * @param changedPref	{string}	the name of the preference that
	 * 									changed.
	 */
	this.getPrefs = function(changedPref) {
		if (this.conflicts()) this.displayWarning();
		else this.hideWarning();
	};
	
	/**
	 * Responds to changes to Mudim preferences, namely the method
	 * preference.
	 *
	 * @param subject
	 * @param topic		{string}	the type of event that occurred.
	 * @param data		{string}	the name of the preference that changed.
	 */
	this.observe = function(subject, topic, data) {
		if (topic != "nsPref:changed") return;
		this.getPrefs(data);
	};
}

let mudimMonitor = new MudimMonitor();
addEventListener("load", function () {
	mudimMonitor.registerPrefs();
}, false);
addEventListener("unload", function () {
	mudimMonitor.unregisterPrefs();
}, false);
})();
