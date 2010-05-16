/**
 * A class that detects when Mudim is installed and enabled.
 */
function MudimMonitor() {
	const mCc = Components.classes;
	const mCi = Components.interfaces;
	
	// GUID of the Mudim extension
	const MUDIM_ID = "mudim@svol.ru";
	
	const prefs = mCc["@mozilla.org/preferences-service;1"]
		.getService(mCi.nsIPrefService);
	const prefIds = {
		avimEnabled: "extensions.avim.enabled",
		mudimMethod: "chimmudim.settings.method"
	};
	
	const stringBundleId = "avim-bundle";
	const noteValue = "mudim-note";
	
	const notificationBoxId = "addonsMsg";
	
	// Mudim itself
	var thisMonitor = this;
	if (window.Application) {
		if (Application.extensions.get) {
			this.mudim = Application.extensions.get(MUDIM_ID);
		}
		else if (Application.getExtensions) {
			Application.getExtensions(function (extensions) {
				thisMonitor.mudim = extensions.get(MUDIM_ID);
				thisMonitor.getPrefs();
			});
		}
	}
	
	var $ = function (id) {
		return document.getElementById(id);
	};
	
	/**
	 * Registers an observer so that a warning is displayed if Mudim is
	 * enabled.
	 */
	this.registerPrefs = function() {
		prefs.QueryInterface(mCi.nsIPrefBranch2);
		prefs.addObserver(prefIds.avimEnabled, this, false);
		prefs.addObserver(prefIds.mudimMethod, this, false);
		this.getPrefs();
	};
	
	/**
	 * Unregisters the preferences observer as the window is being closed.
	 */
	this.unregisterPrefs = function() {
		this.setPrefs();
		prefs.removeObserver(prefIds.avimEnabled, this);
		prefs.removeObserver(prefIds.mudimMethod, this);
	};
	
	/**
	 * Returns whether Mudim conflicts with AVIM.
	 *
	 * @returns {boolean}	true if Mudim conflicts with AVIM; false
	 * 						otherwise.
	 */
	this.conflicts = function() {
		return prefs.getBoolPref(prefIds.avimEnabled) && this.mudim &&
			this.mudim.enabled && prefs.getIntPref(prefIds.mudimMethod) != 0;
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
		var mediator = mCc["@mozilla.org/appshell/window-mediator;1"]
			.getService(mCi.nsIWindowMediator);
		var enumerator = mediator.getEnumerator("navigator:browser");
		while (enumerator.hasMoreElements()) {
			var win = enumerator.getNext();
			try {
				if (parseInt(win.Mudim.method) != 0) win.CHIM.Toggle();
			}
			catch (e) {}
		}
	};
	
	/**
	 * Displays a notification that Mudim is enabled.
	 */
	this.displayWarning = function() {
		var noteBox = $(notificationBoxId);
		if (!noteBox || noteBox.getNotificationWithValue(noteValue)) return;
		
		var stringBundle = $(stringBundleId);
		if (!stringBundle) return;
		var noteLabel = stringBundle.getString("mudim-note.label");
		var noteBtns = [{
			accessKey: stringBundle.getString("mudim-button.accesskey"),
			callback: this.disableMudim,
			label: stringBundle.getString("mudim-button.label"),
			popup: null
		}];
		noteBox.appendNotification(noteLabel, noteValue,
								   URI_NOTIFICATION_ICON_WARNING,
								   noteBox.PRIORITY_WARNING_MEDIUM,
								   noteBtns);
	};
	
	/**
	 * Hides the notification that Mudim is enabled.
	 */
	this.hideWarning = function() {
		var noteBox = $(notificationBoxId);
		if (!noteBox) return;
		var note = noteBox.getNotificationWithValue(noteValue);
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

if (window && !("mudimMonitor" in window)) {
	window.mudimMonitor = new MudimMonitor();
	addEventListener("load", function () {
		mudimMonitor.registerPrefs();
	}, false);
}
