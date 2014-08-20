"use strict";

/**
 * A controller for the AVIM Options panel.
 */
function AVIMOptionsPanel() {
// $if{Debug}
	// If true, AVIM displays a typing test suite. The variable is set at build
	// time by build.sh.
	const DEBUG = true;
// $endif{}
	
	const Cc = Components.classes;
	const Ci = Components.interfaces;
	
	const broadcasterIds = {
		disabled: "disabled-bc",
		customMethod: "custom-method-bc",
		spellOptions: "spell-options-bc",
		scriptOptions: "script-enabled-bc"
	};
	
	const paneIds = {
		general: "general-pane",
		blacklist: "blacklist-pane",
		method: "method-config-pane",
		script: "script-config-pane"
	};
	
	const prefIds = {
		enabled: "enabled-pref",
		method: "method-pref",
		spell: "spell-pref",
		ignoredIds: "ignoredids-pref",
		script: "script-enabled-pref",
		volume: "volume-pref"
	};
	
// $if{Debug}
	const testerUrl = "chrome://avim/content/test/tester.xul";
// $endif{}
	
	const ignoreButtonId = "ignore-button";
	const ignoreTextBoxId = "ignore-text";
	const idListId = "ignoredids-list";
	const removeButtonId = "remove-button";
	const resetButtonId = "reset-button";
	
	const ignoredIdsDelimiter = /\s+/;
	
	const stringBundleId = "bundle";
	
	let $ = function (id) {
		return document.getElementById(id);
	};
	
	/**
	 * Enables or disables the Ignore button, based on whether the associated
	 * textbox contains text.
	 */
	this.validateIgnoreButton = function() {
		let ignoreButton = $(ignoreButtonId);
		let ignoreTextBox = $(ignoreTextBoxId);
		if (ignoreButton && ignoreTextBox) {
			ignoreButton.disabled = !ignoreTextBox.value;
		}
	};
	
	/**
	 * Adds each space-delimited ID in the ID to Ignore textbox to the Ignored
	 * IDs list and updates the associated preference, so that the added IDs are
	 * listed in the preference too.
	 */
	this.ignoreIdsInTextBox = function() {
		let ignoreTextBox = $(ignoreTextBoxId);
		let idList = $(idListId);
		if (!ignoreTextBox || !idList) return;
		
		let ids = ignoreTextBox.value.split(ignoredIdsDelimiter);
		for (let i = 0; i < ids.length; i++) {
			let dupes = idList.getElementsByAttribute("value", ids[i]);
			if (ids[i] && !dupes.length) idList.appendItem(ids[i], ids[i]);
		}
		ignoreTextBox.value = "";
		if ($(paneIds.blacklist)) $(paneIds.blacklist).userChangedValue(idList);
	};
	
	/**
	 * Command controller for the list of ignored IDs that allows the list to
	 * behave more like a textbox to the user.
	 */
	let idListController = {
		supportsCommand: function(cmd) {
			return /* cmd == "cmd_delete" || */ cmd == "cmd_selectAll";
		},
		isCommandEnabled: function(cmd) {
			if (!$(idListId)) return false;
			
			switch (cmd) {
				//case "cmd_delete":
				//	return $(idListId).selectedCount;
				case "cmd_selectAll":
					return document.activeElement == $(idListId);
			}
			return false;
		},
		doCommand: function(cmd) {
			switch (cmd) {
				//case "cmd_delete":
				//	if (!window.optionsPanel) {
				//		window.optionsPanel.removeSelectedIds();
				//	}
				//	break;
				case "cmd_selectAll":
					if ($(idListId)) $(idListId).selectAll();
					break;
			}
		},
		onEvent: function(evt) {}
	};
	
	/**
	 * Attach a command controller to the ignored IDs list.
	 */
	this.attachIdListController = function() {
		let idList = $(idListId);
		if (!idList) return;
		idList.controllers.appendController(idListController);
	};
	
	/**
	 * Adds the IDs in the Ignore textbox to the Ignored IDs list if Enter or
	 * Return was pressed.
	 *
	 * @param keyEvent	{object}	An onKeyPress DOM event.
	 * @returns {boolean}	False if Enter or Return was pressed (and thus the
	 * 						keypress event should be canceled); true otherwise.
	 */
	this.onTextBoxKeyPress = function(keyEvent) {
		let keyCode = keyEvent.keyCode;
//		dump("AVIMOptionsPanel.onTextBoxKeyPress -- keyCode: " + keyCode + "\n");	// debug
		switch (keyCode) {
			case 13:
				this.ignoreIdsInTextBox();
				return false;
		}
		return true;
	};
	
	/**
	 * Enables or disables the Remove ID button, based on whether any rows are
	 * selected in the Ignored IDs list.
	 *
	 * @returns	{boolean}	True if the button has just been enabled; false if
	 * 						it has just been disabled.
	 */
	this.validateRemoveButton = function() {
		if (!$(paneIds.blacklist)) return false;
		let removeButton = $(removeButtonId);
		let idList = $(idListId);
		if (!removeButton || !idList) return false;
		return !(removeButton.disabled = !idList.selectedCount);
	};
	
	/**
	 * Returns an equivalent, sorted array with any duplicates removed.
	 *
	 * @param oldArray {array}	the array to normalize.
	 * @returns {array} the normalized array.
	 */
	this.normalizeArray = function(oldArray, lower) {
		let newArray = [];
		for (let i = 0; i < oldArray.length; i++) {
			let elem = oldArray[i];
			if (!elem) continue;
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
	this.updateIgnoredIds = function(ids) {
		let idList = $(idListId);
		let pref = $(prefIds.ignoredIds);
		if (!idList || !pref) return undefined;
		if (ids == undefined)
			ids = pref.value;
		
		// Clear the list.
		let numRows = idList.getRowCount();
		for (let i = numRows - 1; i >= 0; i--) idList.removeItemAt(i);
		
		ids = ids.split(ignoredIdsDelimiter);
		ids = this.normalizeArray(ids, true);
		for (let i = 0; i < ids.length; i++) idList.appendItem(ids[i], ids[i]);
		
		this.validateRemoveButton();
		this.validateResetButton();
		return ids;
	};
	
	/**
	 * Enables or disables Input Editing panel preferences.
	 */
	this.validateForEnabled = function() {
		let bc = $(broadcasterIds.disabled);
		if (!bc) return;
		bc.setAttribute("disabled", "" + !$(prefIds.enabled).value);
		
		this.validateCustomMethod();
		this.validateForSpellingEnforced();
		this.validateForScriptMonitor();
	};
	
	/**
	 * Enables or disables the button for customizing the current input method.
	 * If AVIM is enabled and the current input method has options, the button
	 * is enabled; otherwise, it is disabled.
	 */
	this.validateCustomMethod = function() {
		let bc = $(broadcasterIds.customMethod);
		let pref = $(prefIds.method);
		if (!bc || !pref) return;
		
		let enabled = $(prefIds.enabled).value;
		let auto = pref.value == 0;
		bc.setAttribute("disabled", "" + (!enabled || !auto));
	};
	
	/**
	 * Enables or disables spelling enforcement options. If AVIM is enabled and
	 * spelling is enforced, the options are enabled; otherwise, they are
	 * disabled.
	 */
	this.validateForSpellingEnforced = function() {
		let bc = $(broadcasterIds.spellOptions);
		let pref = $(prefIds.spell);
		if (!bc || !pref) return;
		
		let enabled = $(prefIds.enabled).value;
		let enforced = pref.value;
		bc.setAttribute("disabled", "" + (!enabled || !enforced));
	};
	
	/**
	 * Enables or disables script monitor options. If AVIM is enabled and the
	 * script monitor is enabled, the options are enabled; otherwise, they are
	 * disabled.
	 */
	this.validateForScriptMonitor = function() {
		let bc = $(broadcasterIds.scriptOptions);
		let pref = $(prefIds.script);
		if (!bc || !pref) return;
		
		let enabled = $(prefIds.enabled).value;
		let scriptEnabled = pref.value;
		bc.setAttribute("disabled", "" + (!enabled || !scriptEnabled));
	};
	
	this.initializeVolume = function () {
		let scale = $("volume-scale");
		if (!scale) return;
		
		scale.value = $(prefIds.volume).value;
		
		// Preview the cue. Listening for change events would result in a
		// barrage of cues while scrubbing, so listen for mouseup instead.
		scale.addEventListener("mouseup", function (evt) {
			if (window.avim) avim.playCueAfterToggle(scale.value);
		}, false);
	};
	
	/**
	 * Removes the selected IDs from the list of ignored IDs and updates the
	 * associated preference, so that the selected IDs are no longer listed in
	 * the preference, either.
	 */
	this.removeSelectedIds = function() {
		let idList = $(idListId);
		if (!idList || !idList.selectedCount) return;
		let firstSelIdx = idList.selectedIndex;
		let selItems = idList.selectedItems;
		for (let i = selItems.length - 1; i >= 0; i--) {
			idList.removeChild(selItems[i]);
			delete selItems[i];
		}
		if ($(paneIds.blacklist)) $(paneIds.blacklist).userChangedValue(idList);
		
		// Select something else in the list.
		idList.selectedIndex = firstSelIdx;
	};
	
	/**
	 * Removes the selected IDs from the list of ignored IDs if Backspace or
	 * Delete was pressed.
	 *
	 * @param keyEvent	{object}	An onKeyPress DOM event.
	 */
	this.onIdListKeyPress = function(keyEvent) {
		let keyCode = keyEvent.keyCode;
//		dump("AVIMOptionsPanel.onIdListKeyPress -- keyCode: " + keyCode + "\n");	// debug
		switch (keyCode) {
			case 8: case 46:
				this.removeSelectedIds();
//				break;
		}
	};
	
	/**
	 * Returns a space-delimited list of ignored IDs.
	 *
	 * @returns {string}	a list of ignored IDs.
	 */
	this.stringFromIgnoredIds = function() {
		let idList = $(idListId);
		if (!idList) return "";
		let ignoredIds = [];
		for (let i = 0; i < idList.getRowCount(); i++) {
			let row = idList.getItemAtIndex(i);
			ignoredIds.push(row.value);
		}
		return this.normalizeArray(ignoredIds, true).join(" ");
	};
	
	/**
	 * Enables or disables the Restore to Default button, based on whether the
	 * current ignored ID list is equivalent to the default list.
	 */
	this.validateResetButton = function() {
		let pref = $(prefIds.ignoredIds);
		let button = $(resetButtonId);
		if (!pref || !button) return;
		
		button.disabled = pref.defaultValue == pref.value;
	};
	
	/**
	 * Resets the ignored IDs list to the "factory default".
	 */
	this.resetIgnoredIds = function() {
		if (!$(paneIds.blacklist) || !$(idListId)) return;
		
		let pref = $(prefIds.ignoredIds);
		if (!pref || pref.defaultValue == pref.value) return;
		
		this.updateIgnoredIds(pref.defaultValue);
		$(paneIds.blacklist).userChangedValue($(idListId));
	};
	
	/**
	 * Opens the Blacklist dialog box (or sheet).
	 */
	this.openBlacklist = function() {
		document.documentElement.openSubDialog("./blacklist.xul",
											   "resizable=yes", null);
	};
	
	/**
	 * Opens the Customize Input Method dialog box (or sheet).
	 */
	this.openMethodConfig = function() {
		document.documentElement.openSubDialog("./methodOptions.xul", "", null);
	};
	
	/**
	 * Opens the Script Monitor dialog box (or sheet).
	 */
	this.openScriptConfig = function() {
		document.documentElement.openSubDialog("./scriptOptions.xul", "", null);
	};
	
	/**
	 * Opens the help topic for the current preferences pane in a new window.
	 */
	this.openPrefsHelp = function() {
		let stringBundle = $(stringBundleId);
		if (!stringBundle) return;
		let url = stringBundle.getString("avim-preferences.helpurl");
		if (url) window.open(url);
	};
	
// $if{Debug}
	/**
	 * Opens the test suite window.
	 */
	this.openTester = function() {
		document.documentElement.openWindow("avim:tester", testerUrl, "", null);
	};
// $endif{}
	
	/**
	 * Initializes the AVIM Options panel's controller. This method should only
	 * be called once the panel itself has finished loading.
	 */
	this.initialize = function() {
		this.validateForEnabled();
		if ($(paneIds.blacklist)) {
			this.attachIdListController();
			this.validateRemoveButton();
			this.validateResetButton();
		}
		this.initializeVolume();
	};
}
if (window && !("optionsPanel" in window)) {
	window.optionsPanel = new AVIMOptionsPanel();
}
