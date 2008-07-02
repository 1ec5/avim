/**
 * A controller for the AVIM Options panel.
 */
function AVIMOptionsPanel() {
	this.broadcasters = {
		disabled: "disabled-bc"
	}
	
	this.tabBoxId = "general-tabbox";
	this.tabsId = "general-tabs";
	
	this.ignoreTextBoxId = "ignore-text";
	this.ignoreButtonId = "ignore-button";
	this.idListId = "ignoredids-list";
	this.removeButtonId = "remove-button";
	
	this.ignoredIdsDelimiter = /\s+/;
	this.macTabBoxMargin = 4 + "px";
	
	var isMac = navigator.platform == "MacIntel" ||
		navigator.platform == "MacPPC";
	
	// Root for AVIM preferences
	this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
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
	this.normalizeArray = function(oldArray) {
		var newArray = [];
		for (var i = 0; i < oldArray.length; i++) {
			if (newArray.indexOf(oldArray[i]) < 0) newArray.push(oldArray[i]);
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
		var ignoredIds = this.prefs.getCharPref("ignoredFieldIds");
		ignoredIds = ignoredIds.split(this.ignoredIdsDelimiter);
		ignoredIds = this.normalizeArray(ignoredIds);
//		dump("Got ignoredIds: " + ignoredIds.join(",") + ".\n");				// debug
		for (var i = 0; i < ignoredIds.length; i++) {
			idList.appendItem(ignoredIds[i], ignoredIds[i]);
		}
		
		this.validateRemoveButton();
	};
	
	/**
	 * Updates the panel's current state to reflect the stored preferences.
	 *
	 * @param changedPref	{string}	the name of the preference that changed.
	 */
	this.getPrefs = function(changedPref) {
		if (!changedPref || changedPref == "enabled") {
			var bc = document.getElementById(this.broadcasters.disabled);
			bc.setAttribute("disabled",
							"" + !this.prefs.getBoolPref("enabled"));
		}
		if (!changedPref || changedPref == "ignoredFieldIds") {
			this.updateIgnoredIds();
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
		this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this.prefs.addObserver("", this, false);
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
		ignoredIds = this.normalizeArray(ignoredIds);
		this.prefs.setCharPref("ignoredFieldIds", ignoredIds.join(" "));
//		dump("Set ignoredIds: " + ignoredIds.join(",") + ".\n");				// debug
	};
	
	/**
	 * Unregisters the preferences observer as the window is being closed.
	 */
	this.unregisterPrefs = function() {
		this.setPrefs();
		this.prefs.removeObserver("", this);
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
	}
	
	/**
	 * Initializes the AVIM Options panel's controller. This method should only
	 * be called once the panel itself has finished loading.
	 */
	this.initialize = function() {
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
