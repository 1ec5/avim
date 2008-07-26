/**
 * A controller for the AVIM Options panel.
 */
function AVIMOptionsPanel() {
	const MUDIM_ID = "mudim@svol.ru";
	
	this.broadcasters = {
		disabled: "disabled-bc",
		spellOptions: "spell-options-bc"
	};
	
	this.notificationBoxId = "general-note";
	
	this.tabBoxId = "general-tabbox";
	this.tabsId = "general-tabs";
	
	this.ignoreTextBoxId = "ignore-text";
	this.ignoreButtonId = "ignore-button";
	this.idListId = "ignoredids-list";
	this.removeButtonId = "remove-button";
	
	this.ignoredIdsDelimiter = /\s+/;
	this.macTabBoxMargin = 4 + "px";
	
	const isMac = Components.classes["@mozilla.org/xre/app-info;1"]
							.getService(Components.interfaces.nsIXULRuntime).OS
				  == "Darwin";
	
	// Root for AVIM preferences
	var prefs = Components.classes["@mozilla.org/preferences-service;1"]
						  .getService(Components.interfaces.nsIPrefService)
						  .getBranch("extensions.avim.");
	
	/**
	 * Enables or disables the Ignore button, based on whether the associated
	 * textbox contains text.
	 */
	this.validateIgnoreButton = function() {
		var ignoreButton = document.getElementById(this.ignoreButtonId);
		var ignoreTextBox = document.getElementById(this.ignoreTextBoxId);
		ignoreButton.disabled = !ignoreTextBox.value;
	};
	
	/**
	 * Adds each space-delimited ID in the ID to Ignore textbox to the Ignored
	 * IDs list and updates the associated preference, so that the added IDs are
	 * listed in the preference too.
	 */
	this.ignoreIdsInTextBox = function() {
		var ignoreTextBox = document.getElementById(this.ignoreTextBoxId);
		var idList = document.getElementById(this.idListId);
		var ids = ignoreTextBox.value.split(this.ignoredIdsDelimiter);
		for (var i = 0; i < ids.length; i++) {
			var dupes = idList.getElementsByAttribute("value", ids[i]);
			if (ids[i] && !dupes.length) idList.appendItem(ids[i], ids[i]);
		}
		if (document.documentElement.instantApply) this.setPrefs();
		ignoreTextBox.value = "";
	};
	
	/**
	 * Enables or disables the Remove ID buton, based on whether any rows are
	 * selected in the Ignored IDs list.
	 */
	this.validateRemoveButton = function() {
		var removeButton = document.getElementById(this.removeButtonId);
		var idList = document.getElementById(this.idListId);
//		dump("First row: " + idList.getItemAtIndex(0).value + ".\n");								// debug
		removeButton.disabled = !idList.selectedCount;
	};
	
	/**
	 * Returns an equivalent, sorted array with any duplicates removed.
	 *
	 * @param oldArray {array}	the array to normalize.
	 * @returns {array} the normalized array.
	 */
	this.normalizeArray = function(oldArray, lower) {
		var newArray = [];
		for (var i = 0; i < oldArray.length; i++) {
			var elem = oldArray[i];
			if (lower) elem = elem.toLowerCase();
			if (newArray.indexOf(elem) < 0) newArray.push(elem);
		}
		newArray.sort();
		return newArray;
	};
	
	/**
	 * Updates the Ignored Textboxes panel's current state to reflect the stored
	 * preferences.
	 */
	this.updateIgnoredIds = function() {
		// Clear the list.
		var idList = document.getElementById(this.idListId);
		var items = [];
		for (var i = 0; i < idList.getRowCount(); i++) {
			items.push(idList.getItemAtIndex(i));
		}
		for (var i = 0; i < items.length; i++) {
			idList.removeChild(items[i]);
//			idList.removeItemAt(idList.getIndexOfItem(items[i]));
		}
		
		// Repopulate the list.
		var ignoredIds = prefs.getCharPref("ignoredFieldIds");
		ignoredIds = ignoredIds.split(this.ignoredIdsDelimiter);
		ignoredIds = this.normalizeArray(ignoredIds, true);
//		dump("Got ignoredIds: " + ignoredIds.join(",") + ".\n");				// debug
		for (var i = 0; i < ignoredIds.length; i++) {
			idList.appendItem(ignoredIds[i], ignoredIds[i]);
		}
		
		this.validateRemoveButton();
	};
	
	/**
	 * Enables or disables Input Editing panel preferences, and displays or
	 * hides the Mudim conflict warning based on whether there is a conflict.
	 */
	this.validateForEnabled = function() {
		var bc = document.getElementById(this.broadcasters.disabled);
		bc.setAttribute("disabled", "" + !prefs.getBoolPref("enabled"));
		
		if (this.mudimMonitor.conflicts()) this.mudimMonitor.displayWarning();
		else this.mudimMonitor.hideWarning();
		
		this.validateForSpellingEnforced();
	};
	
	/**
	 * Enables or disables spelling enforcement options. If AVIM is enabled and
	 * spelling is enforced, the options are enabled; otherwise, they are
	 * disabled.
	 */
	this.validateForSpellingEnforced = function() {
		var bc = document.getElementById(this.broadcasters.spellOptions);
		var enabled = prefs.getBoolPref("enabled");
		var enforced = prefs.getBoolPref("ignoreMalformed");
		bc.setAttribute("disabled", "" + (!enabled || !enforced));
	};
	
	/**
	 * Updates the panel's current state to reflect the stored preferences.
	 *
	 * @param changedPref	{string}	the name of the preference that changed.
	 */
	this.getPrefs = function(changedPref) {
		var specificPref = true;
		switch (changedPref) {
			default:
				// Fall through when changedPref isn't defined, which happens at
				// startup, when we want to get all the preferences.
				specificPref = false;
			case "enabled":
				var bc = document.getElementById(this.broadcasters.disabled);
				bc.setAttribute("disabled", "" + !prefs.getBoolPref("enabled"));
				this.validateForEnabled();
				if (specificPref) break;
			case "ignoreMalformed":
				this.validateForSpellingEnforced();
				if (specificPref) break;
			case "ignoredFieldIds":
				this.updateIgnoredIds();
//				if (specificPref) break;
		}
	};
	
	/**
	 * Removes the selected IDs from the list of ignored IDs and updates the
	 * associated preference, so that the selected IDs are no longer listed in
	 * the preference, either.
	 */
	this.removeSelectedIds = function() {
		var idList = document.getElementById(this.idListId);
		var sel_items = [];
		for (var i = 0; i < idList.selectedCount; i++) {
			var row = idList.getSelectedItem(i);
//			dump("Removing row at " + i + ": " + row + "\n");					// debug
			sel_items.push(row);
		}
		for (var i = 0; i < sel_items.length; i++) {
			idList.removeChild(sel_items[i]);
//			idList.removeItemAt(idList.getIndexOfItem(sel_items[i]));
		}
		if (document.documentElement.instantApply) this.setPrefs();
//		this.validateRemoveButton();
	};
	
	/**
	 * Registers an observer so that the Ignored Textboxes panel reflects the
	 * latest IDs in the preferences system.
	 */
	this.registerPrefs = function() {
		prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		prefs.addObserver("", this, false);
		this.getPrefs();
	};
	
	/**
	 * Responds to changes to complex AVIM preferences, namely the
	 * ignoredFieldIds preference.
	 *
	 * @param subject
	 * @param topic		{string}	the type of event that occurred.
	 * @param data		{string}	the name of the preference that changed.
	 */
	this.observe = function(subject, topic, data) {
		if (topic != "nsPref:changed") return;
		this.getPrefs(data);
	};
	
	/**
	 * Updates the stored preferences to reflect the panel's current state.
	 */
	this.setPrefs = function() {
		var idList = document.getElementById(this.idListId);
		var ignoredIds = [];
		for (var i = 0; i < idList.getRowCount(); i++) {
			var row = idList.getItemAtIndex(i);
			ignoredIds.push(row.value);
		}
		ignoredIds = this.normalizeArray(ignoredIds, true);
		prefs.setCharPref("ignoredFieldIds", ignoredIds.join(" "));
//		dump("Set ignoredIds: " + ignoredIds.join(",") + ".\n");				// debug
	};
	
	/**
	 * Unregisters the preferences observer as the window is being closed.
	 */
	this.unregisterPrefs = function() {
		this.setPrefs();
		prefs.removeObserver("", this);
	};
	
	/**
	 * Tweaks the styling on the tab box on the Mac, to work around some bugs in
	 * the default stylesheet.
	 */
	this.fixTabBoxStyle = function() {
		var tabBox = document.getElementById(this.tabBoxId);
		var margin = this.macTabBoxMargin;
		tabBox.style.marginLeft = tabBox.style.marginRight = margin;
		
		var tabs = document.getElementById(this.tabsId);
		tabs.style.position = "relative";
	};
	
	/**
	 * Tweaks the styling on <description> elements in the Ignored Textboxes
	 * tab, so that the panel doesn't get cut off at the bottom.
	 */
	this.fixDescriptionStyle = function() {
		var tabBox = document.getElementById(this.tabBoxId);
		var descs = tabBox.getElementsByTagName("description");
		for (var i = 0; i < descs.length; i++) {
			var style = getComputedStyle(descs[i], null);
			var lineHeightValue = style.getPropertyCSSValue("line-height");
			var lineHeight = lineHeightValue.getFloatValue(5 /* px */);
//			dump("Expanding " + descs[i] + " from " + descs[i].style.height +
//				 " to " + lineHeight + "\n");									// debug
			var lineCount = descs[i].getAttribute("linecount");
			descs[i].style.height = lineCount * lineHeight + "px";
		}
	};
	
	/**
	 * Initializes the AVIM Options panel's controller. This method should only
	 * be called once the panel itself has finished loading.
	 */
	this.initialize = function() {
		this.mudimMonitor = new MudimMonitor(prefs, this.notificationBoxId);
		this.mudimMonitor.registerPrefs();
		
		this.registerPrefs();
		this.validateRemoveButton();
		
		if (isMac) this.fixTabBoxStyle();
		this.fixDescriptionStyle();
	};
	
	/**
	 * Unitializes the AVIM Options panel's controller. This method should be
	 * called when the panel is being unloaded.
	 */
	this.finalize = function() {
		this.unregisterPrefs();
	};
	
	/**
	 * An inner class that detects when Mudim is installed and enabled.
	 */
	function MudimMonitor(avimPrefs, notificationBoxId) {
		this.avimPrefs = avimPrefs;
		this.notificationBoxId = notificationBoxId;
		
		this.stringBundleId = "bundle";
		this.noteValue = "mudim-note";
		
		// Mudim itself
		if (window.Application) {
			this.mudim = Application.extensions.get(MUDIM_ID);
		}
		
		// Root for Mudim preferences
		var mPrefs = Components.classes["@mozilla.org/preferences-service;1"]
							   .getService(Components.interfaces.nsIPrefService)
							   .getBranch("chimmudim.settings.");
		
		/**
		 * Registers an observer so that a warning is displayed if Mudim is
		 * enabled.
		 */
		this.registerPrefs = function() {
			mPrefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
			mPrefs.addObserver("", this, false);
			this.getPrefs();
		};
		
		/**
		 * Unregisters the preferences observer as the window is being closed.
		 */
		this.unregisterPrefs = function() {
			this.setPrefs();
			mPrefs.removeObserver("", this);
		};
		
		/**
		 * Returns whether Mudim conflicts with AVIM.
		 *
		 * @returns {boolean}	true if Mudim conflicts with AVIM; false
		 * 						otherwise.
		 */
		this.conflicts = function() {
			var avimEnabled = this.avimPrefs.getBoolPref("enabled");
			return avimEnabled && this.mudim && this.mudim.enabled &&
				mPrefs.getIntPref("method") != 0;
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
			var mediator =
				Components.classes["@mozilla.org/appshell/window-mediator;1"]
					.getService(Components.interfaces.nsIWindowMediator);
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
			var noteBox = document.getElementById(this.notificationBoxId);
			if (noteBox.getNotificationWithValue(this.noteValue)) return;
			
			var stringBundle = document.getElementById(this.stringBundleId);
			var noteLabel = stringBundle.getString("mudim-note.label");
			var noteBtns = [{
				accessKey: stringBundle.getString("mudim-button.accesskey"),
				callback: this.disableMudim,
				label: stringBundle.getString("mudim-button.label"),
				popup: null
			}];
			noteBox.appendNotification(noteLabel, this.noteValue,
									   URI_NOTIFICATION_ICON_WARNING,
									   noteBox.PRIORITY_WARNING_MEDIUM,
									   noteBtns);
		};
		
		/**
		 * Hides the notification that Mudim is enabled.
		 */
		this.hideWarning = function() {
			var noteBox = document.getElementById(this.notificationBoxId);
			var note = noteBox.getNotificationWithValue(this.noteValue);
			if (note) noteBox.removeNotification(note);
		};
		
		/**
		 * Updates the panel's current state to reflect the stored preferences.
		 *
		 * @param changedPref	{string}	the name of the preference that
		 * 									changed.
		 */
		this.getPrefs = function(changedPref) {
			if (!changedPref || changedPref == "method") {
				if (this.conflicts()) this.displayWarning();
				else this.hideWarning();
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
			if (topic != "nsPref:changed") return;
			this.getPrefs(data);
		};
	}
}
var options;
if (!options) {
	options = new AVIMOptionsPanel();
	window.addEventListener("load", function (e) {
		options.initialize();
	}, false);
	window.addEventListener("unload", function (e) {
		options.finalize();
	}, false);
}
