/* global URI_NOTIFICATION_ICON_WARNING */
"use strict";

(function () {
/**
 * A class that detects when Mudim and Typing Vietnamese are installed and
 * enabled.
 */
function ExtensionMonitor() {
	const Cc = Components.classes;
	const Ci = Components.interfaces;
	
	//* GUID of the Mudim extension
	const MUDIM_ID = "mudim@svol.ru";
	//* GUID of the Typing Vietnamese extension
	const TV_ID = "{8ceb40cd-658d-4b1d-9366-59b64c17abbd}";
	
	const avimPrefs = Cc["@mozilla.org/preferences-service;1"]
		.getService(Ci.nsIPrefService).getBranch("extensions.avim.");
	const mudimPrefs = Cc["@mozilla.org/preferences-service;1"]
		.getService(Ci.nsIPrefService).getBranch("chimmudim.");
	const mudimPrefs2 = Cc["@mozilla.org/preferences-service;1"]
		.getService(Ci.nsIPrefService).getBranch("mudimffxextensions.mudim.");
	const avimEnabledId = "enabled";
	const mudimMethodId = "settings.method";
	const tvBtnIds = [
		"action-button--" + TV_ID.match(/{(.+)}/)[1] + "-en-vn-on-off", // 2.0.1.1
		"typing-vietnamse-1", // 1.1.1
	];
	
	const stringBundleId = "avim-bundle";
	
	const notificationBoxId = "addonsMsg";
	
	// Mudim itself
	let thisMonitor = this;
	if (window.Application) {
		if (Application.extensions && Application.extensions.get) {
			this.mudim = Application.extensions.get(MUDIM_ID);
			this.tv = Application.extensions.get(TV_ID);
		}
		else if (Application.getExtensions) {
			Application.getExtensions(function (extensions) {
				thisMonitor.mudim = extensions.get(MUDIM_ID);
				thisMonitor.tv = extensions.get(TV_ID);
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
		if ("nsIPrefBranch2" in Ci) {
			avimPrefs.QueryInterface(Ci.nsIPrefBranch2);
			mudimPrefs.QueryInterface(Ci.nsIPrefBranch2);
			mudimPrefs2.QueryInterface(Ci.nsIPrefBranch2);
		} else {
			avimPrefs.QueryInterface(Ci.nsIPrefBranch);
			mudimPrefs.QueryInterface(Ci.nsIPrefBranch);
			mudimPrefs2.QueryInterface(Ci.nsIPrefBranch);
		}
		avimPrefs.addObserver(avimEnabledId, this, false);
		mudimPrefs.addObserver(mudimMethodId, this, false);
		mudimPrefs2.addObserver(mudimMethodId, this, false);
		this.addTVObserver();
		this.getPrefs();
	};
	
	/**
	 * Unregisters the preferences observer as the window is being closed.
	 */
	this.unregisterPrefs = function() {
		avimPrefs.removeObserver(avimEnabledId, this);
		mudimPrefs.removeObserver(mudimMethodId, this);
		mudimPrefs2.removeObserver(mudimMethodId, this);
		this.removeTVObserver();
	};
	
	/**
	 * Returns the browser window that contains the Add-on Manager that this
	 * overlay is overlaying.
	 */
	function getBrowserWindow() {
		return Cc["@mozilla.org/appshell/window-mediator;1"]
			.getService(Ci.nsIWindowMediator)
			.getMostRecentWindow("navigator:browser");
	}
	
	/**
	 * Returns the Typing Vietnamese extension's toolbar button.
	 */
	this.getTVButton = function() {
		let browserWin = getBrowserWindow();
		if (!browserWin || !this.tv || !this.tv.enabled) return null;
		let btn;
		for (let i = 0; !btn && i < tvBtnIds.length; i++) {
			btn = browserWin.document.getElementById(tvBtnIds[i]);
		}
		return btn;
	};
	
	/**
	 * Returns the extensions that conflict with AVIM.
	 *
	 * @returns {object}	An object mapping the name of an extension to
	 * 						whether that extension conflicts with AVIM.
	 */
	this.getConflicts = function() {
		let avimEnabled = avimPrefs.getBoolPref(avimEnabledId);
		let tvBtn = this.getTVButton();
		return {
			mudim: avimEnabled && this.mudim && this.mudim.enabled &&
				(mudimPrefs.getIntPref(mudimMethodId) ||
				 mudimPrefs2.getIntPref(mudimMethodId)),
			"typing-vietnamese": avimEnabled && tvBtn &&
				tvBtn.tooltipText.match(/\bon$/i),
		};
	};
	
	/**
	 * Disables the Mudim extension, because it may interfere with AVIM's
	 * operation. This method supports versions 0.3 (r14) and above.
	 */
	this.disableMudim = function () {
		// Mudim doesn't observe preference changes, so have to manually update
		// all the windows instead of simply setting Mudim's method preference
		// to 0 (off).
		let mediator = Cc["@mozilla.org/appshell/window-mediator;1"]
			.getService(Ci.nsIWindowMediator);
		let enumerator = mediator.getEnumerator("navigator:browser");
		while (enumerator.hasMoreElements()) {
			let win = enumerator.getNext();
			try {
				if (parseInt(win.Mudim.method) !== 0) win.CHIM.Toggle();
			}
			catch (e) {}
		}
		mudimPrefs.setIntPref(mudimMethodId, 0);
		mudimPrefs2.setIntPref(mudimMethodId, 0);
	};
	
	/**
	 * Disables the Typing Vietnamese extension, because it may interfere with
	 * AVIM's operation. This method is known to support versions 1.1.1 and
	 * above.
	 */
	this.disableTV = function () {
		let tvBtn = this.getTVButton();
		if (tvBtn) tvBtn.doCommand();
		this.getPrefs();
	};
	
	/**
	 * Disables an extension that may interfere with AVIM's operation.
	 *
	 * @param note	{object}	the <notification> element whose button
	 * 							triggered the call to this method.
	 * @param desc	{string}	the button's description.
	 */
	function disableExtension (note, desc) {
		switch (note.value) {
			case "mudim-note": return thisMonitor.disableMudim();
			case "typing-vietnamese-note": return thisMonitor.disableTV();
		}
	}
	
	function getNotificationBox() {
		if ($(notificationBoxId)) return $(notificationBoxId);
		
		let browserWin = getBrowserWindow();
		return browserWin && browserWin.gBrowser &&
			browserWin.gBrowser.getNotificationBox();
	}
	
	/**
	 * Displays a notification that a conflicting extension is enabled.
	 */
	this.displayWarning = function (extName) {
		let noteBox = getNotificationBox();
		let noteValue = extName + "-note";
		if (!noteBox || noteBox.getNotificationWithValue(noteValue)) return;
		
		let stringBundle = $(stringBundleId);
		if (!stringBundle) return;
		
		let extLbl = stringBundle.getString(extName + ".label");
		let noteLabel = stringBundle.getFormattedString("ext-monitor-note.label",
														[extLbl]);
		let noteBtns = [{
			accessKey: stringBundle.getString("ext-monitor-button.accesskey"),
			callback: disableExtension,
			label: stringBundle.getFormattedString("ext-monitor-button.label",
												   [extLbl]),
			popup: null,
		}];
		let icon = "URI_NOTIFICATION_ICON_WARNING" in window &&
			URI_NOTIFICATION_ICON_WARNING;
		noteBox.appendNotification(noteLabel, noteValue, icon,
								   noteBox.PRIORITY_WARNING_MEDIUM,
								   noteBtns);
	};
	
	/**
	 * Hides the notification that a conflicting extension is enabled.
	 */
	this.hideWarning = function (extName) {
		let noteBox = getNotificationBox();
		if (!noteBox) return;
		let noteValue = extName + "-note";
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
		let conflicts = this.getConflicts();
		for (let extName in conflicts) {
			if (conflicts.propertyIsEnumerable(extName)) {
				if (conflicts[extName]) this.displayWarning(extName);
				else this.hideWarning(extName);
			}
		}
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
		if (topic !== "nsPref:changed") return;
		this.getPrefs(data);
	};
	
	this.addTVObserver = function () {
		let tvBtn = this.getTVButton();
		if (!tvBtn) return;
		let browserWin = getBrowserWindow();
		if (!browserWin || !("MutationObserver" in browserWin)) return;
		
		this.tvObserver = new browserWin.MutationObserver(function (records) {
			thisMonitor.getPrefs();
		});
		this.tvObserver.observe(tvBtn, {
			attributes: true,
		});
	};
	
	this.removeTVObserver = function () {
		if (this.tvObserver) this.tvObserver.disconnect();
	};
}

let mudimMonitor = new ExtensionMonitor();
addEventListener("load", function load() {
	removeEventListener("load", load, false);
	mudimMonitor.registerPrefs();
}, false);
addEventListener("unload", function unload() {
	removeEventListener("unload", unload, false);
	mudimMonitor.unregisterPrefs();
}, false);
})();
