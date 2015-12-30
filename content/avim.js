/* global messageManager, avim, getIMEStatus:true */
"use strict";

/**
 * Default preferences. Be sure to update defaults/preferences/avim.js to
 * reflect any changes to the default preferences. Initially, this variable
 * should only contain objects whose properties will be modified later on.
 */
let AVIMConfig = {autoMethods: {}, disabledScripts: {}};

function AVIM()	{
	const Cc = Components.classes;
	const Ci = Components.interfaces;
//	const Cu = Components.utils;
	const CC = Components.Constructor;
	
	const PREF_VERSION = 1;
	
	// IDs of user interface elements
	const commandIds = {
		method: "avim-method-cmd",
		prevMethod: "avim-prev-method-cmd",
		nextMethod: "avim-next-method-cmd",
		spell: "avim-spell-cmd",
		oldAccents: "avim-oldaccents-cmd"
	};
	const broadcasterIds = {
		enabled: "avim-enabled-bc",
		methods: ["avim-auto-bc", "avim-telex-bc", "avim-vni-bc",
				  "avim-viqr-bc", "avim-viqr-star-bc"],
		spell: "avim-spell-bc",
		oldAccents: "avim-oldaccents-bc"
	};
	const panelBroadcasterId = "avim-status-bc";
	
	const $ = function (id) {
		return document.getElementById(id);
	};
	
	/**
	 * Returns the given value clamped to a minimum and maximum, inclusive.
	 */
	function clamp(x, min, max) {
		return Math.min(Math.max(x, min), max);
	}
	
	const nsSupportsString = CC("@mozilla.org/supports-string;1",
								"nsISupportsString");
	
	/**
	 * A wrapper around nsISupportsString.
	 */
	function makeSupportsString(value) {
		let cStr = nsSupportsString();
		cStr.data = value;
		return cStr;
	}
	
	const isMac = navigator.platform === "MacPPC" ||
		navigator.platform === "MacIntel";
	
	this.prefsRegistered = false;
	
	/**
	 * Enables or disables AVIM and updates the stored preferences.
	 *
	 * @param enabled	{boolean}	true to enable AVIM; false to disable it.
	 */
	this.setEnabled = function(enabled) {
		AVIMConfig.onOff = enabled;
		this.setPrefs("enabled");
	};
	
	/**
	 * Enables AVIM if currently disabled; disables AVIM otherwise.
	 */
	this.toggle = function() {
		this.setEnabled(!AVIMConfig.onOff);
	};
	
	this.onCue = this.offCue = null;
	this.popupFadeTimer = 0;
	
	/**
	 * Plays a sound to alert the user that AVIM's settings have changed, in
	 * case all the UI is hidden.
	 */
	this.playCueAfterToggle = function (volume) {
		let enabled = AVIMConfig.onOff;
		if (this.onCue) this.onCue.pause();
		if (this.offCue) this.offCue.pause();
		
		if (volume === undefined) volume = AVIMConfig.volume;
		volume = clamp(volume / 100, 0, 1);
		
		// Display a popup next to the application menu if AVIM’s toolbar button
		// isn’t visible.
		let tb = $("avim-tb");
		let tbAreaType = tb && tb.getAttribute("cui-areatype");
		let panel = $("avim-toggle-panel");
		let appMenuTbItem = $("PanelUI-menu-button");
		if (panel && appMenuTbItem && tbAreaType !== "toolbar") {
			let bc = $(broadcasterIds.methods[AVIMConfig.method]);
			let methodName = bc.getAttribute("label");
			let lbl = $("avim-toggle-label");
			lbl.value = methodName;
			lbl.setAttribute("avim-disabled", "" + !enabled);
			panel.openPopup(appMenuTbItem, "bottomcenter topright", 0, 0, false,
							false);
			clearTimeout(this.popupFadeTimer);
			this.popupFadeTimer = setTimeout(function () {
				$("avim-toggle-panel").hidePopup(true);
			}, 2000 /* ms */);
			if (!panel.onpopuphiding) {
				panel.onpopuphiding = function (/* evt */) {
					if (this.popupFadeTimer) clearTimeout(this.popupFadeTimer);
					this.popupFadeTimer = 0;
				};
			}
		}
		
		if (enabled && !this.onCue) {
			this.onCue = new Audio("chrome://avim/content/on.wav");
			this.onCue.volume = volume;
			this.onCue.autoplay = true;
		}
		else if (!enabled && !this.offCue) {
			this.offCue = new Audio("chrome://avim/content/off.wav");
			this.offCue.volume = volume;
			this.offCue.autoplay = true;
		}
		else {
			let cue = enabled ? this.onCue : this.offCue;
			cue.volume = volume;
			cue.currentTime = 0;
			cue.play();
		}
	};
	
	/**
	 * Sets the input method to the method with the given ID and updates the
	 * stored preferences. If the given method ID is -1, the method is not
	 * changed and AVIM is instead disabled.
	 *
	 * @param m	{number}	the ID of the method to enable, or -1 to diable
	 * 						AVIM.
	 */
	this.setMethod = function(m) {
		if (m === -1) AVIMConfig.onOff = false;
		else {
			AVIMConfig.onOff = true;
			AVIMConfig.method = m;
		}
		this.setPrefs("method");
	};
	
	/**
	 * Sets the input method to the one with the given distance away from the
	 * currently enabled input method. For instance, a distance of 1 selects the
	 * next input method, while a distance of -1 selects the previous one.
	 *
	 * @param distance {number}	the distance from the currently selected input
	 * 							method to the input method to select.
	 */
	this.cycleMethod = function(distance) {
		AVIMConfig.onOff = true;
		
		let method = AVIMConfig.method;
		method += distance;
		if (method < 0) method += broadcasterIds.methods.length;
		method %= broadcasterIds.methods.length;
		AVIMConfig.method = method;
		
		this.setPrefs("method");
	};
	
	/**
	 * Enables or disables old-style placement of diacritical marks over
	 * diphthongs and updates the stored preferences.
	 *
	 * @param enabled	{boolean}	true to use old-style diacritics; false to
	 * 								use new-style diacritics.
	 */
	this.setDauCu = function(enabled) {
		AVIMConfig.oldAccent = enabled;
		this.setPrefs("oldAccents");
	};
	
	/**
	 * Enables old-style diacritical marks if currently disabled; disables them
	 * otherwise.
	 */
	this.toggleDauCu = function() {
		this.setDauCu(!AVIMConfig.oldAccent);
	};
	
	/**
	 * Enables or disables spelling enforcement and updates the stored
	 * preferences. If enabled, diacritical marks are not placed over words that
	 * do not conform to Vietnamese spelling rules and are instead treated as
	 * literals.
	 *
	 * @param enabled	{boolean}	true to enforce spelling; false otherwise.
	 */
	this.setSpell = function(enabled) {
		AVIMConfig.ckSpell = enabled;
		this.setPrefs("ignoreMalformed");
	};
	
	/**
	 * Enables spelling enforcement if currently disabled; disables it
	 * otherwise.
	 */
	this.toggleSpell = function() {
		this.setSpell(!AVIMConfig.ckSpell);
	};
	
	/**
	 * Displays or hides the status bar panel and updates the stored
	 * preferences.
	 *
	 * @param shown	{boolean}	true to display the status bar panel; false to
	 * 							hide it.
	 */
	this.setStatusPanel = function(shown) {
		AVIMConfig.statusBarPanel = shown;
		this.setPrefs("statusBarPanel");
	};
	
	/**
	 * Sends a text event to the relevant frame script.
	 *
	 * @param txtEvt	{String}	Name of the text event.
	 */
	this.sendTextEvent = function (txtEvt) {
		let win = document.commandDispatcher.focusedWindow;
		let elt = document.commandDispatcher.focusedElement;
		if ((elt && elt.localName !== "browser") || win !== window) {
			this.doTextCommand(txtEvt);
		}
		else if ("gMultiProcessBrowser" in window && "messageManager" in elt) {
			elt.messageManager.sendAsyncMessage("AVIM:" + txtEvt);
		}
	};
	
	function setCheckedState(elt, checked) {
		if (!elt) return;
		if (checked) elt.setAttribute("checked", "true");
		else elt.removeAttribute("checked");
	}
	
	/**
	 * Updates the XUL menus and status bar panel to reflect AVIM's current
	 * state.
	 */
	this.updateUI = function() {
		// Enabled/disabled
		let enabledBcId = $(broadcasterIds.enabled);
		if (enabledBcId) {
			setCheckedState(enabledBcId, AVIMConfig.onOff);
			if (isMac) {
				let inlineKey = $("avim-enabled-key-inline");
				inlineKey.setAttribute("keytext", "\u2303\u2303");
			}
		}
		
		// Disable methods and options if AVIM is disabled
		for (let k in commandIds) {
			if (commandIds.propertyIsEnumerable(k)) {
				let cmd = commandIds[k] && $(commandIds[k]);
				if (cmd) {
					cmd.setAttribute("disabled", "" + !AVIMConfig.onOff);
				}
			}
		}
		
		// Method
		for (let i = 0; i < broadcasterIds.methods.length; i++) {
			let bc = $(broadcasterIds.methods[i]);
			if (bc) {
				bc.removeAttribute("checked");
				bc.removeAttribute("key");
			}
		}
		let selBc = $(broadcasterIds.methods[AVIMConfig.method]);
		if (selBc) setCheckedState(selBc, true);
		
		// Options
		let spellBc = $(broadcasterIds.spell);
		if (spellBc) setCheckedState(spellBc, AVIMConfig.ckSpell);
		let oldBc = $(broadcasterIds.oldAccents);
		if (oldBc) setCheckedState(oldBc, AVIMConfig.oldAccent);
		
		// Status bar panel and toolbar button
		let panelBc = $(panelBroadcasterId);
		if (!panelBc) return;
		panelBc.setAttribute("label", selBc.getAttribute("label"));
		panelBc.setAttribute("avim-inputmethod", "" + AVIMConfig.method);
		panelBc.setAttribute("avim-disabled", "" + !AVIMConfig.onOff);
		// Ignored by toolbar button.
		panelBc.setAttribute("avim-hidden", "" + !AVIMConfig.statusBarPanel);
	};
	
	/**
	 * Populates the given XUL menu popup with the contents of its parent
	 * element’s context menu popup.
	 */
	this.buildPopup = function (popup) {
		this.updateUI();
		
		let mainPopupId = popup.getAttribute("avim-popupsource");
		let mainPopup = $(mainPopupId);
		if (!mainPopup) return;
		
		let items = [];
		for (let item = mainPopup.firstChild; item; item = item.nextSibling) {
			let clone = item.cloneNode(false);
			if (clone.id) clone.id += "-dynamic";
			items.push(clone);
		}
		if (!items.length) return;
		
		items[0].setAttribute("default", "true");
		
		while (popup.firstChild) popup.removeChild(popup.firstChild);
		for (let i = 0; i < items.length; i++) {
			popup.appendChild(items[i]);
		}
	};
	
	// Integration with Mozilla preferences service
	
	// Root for AVIM preferences
	const prefs = Cc["@mozilla.org/preferences-service;1"]
		.getService(Ci.nsIPrefService).getBranch("extensions.avim.");
	
	/**
	 * Registers an observer so that AVIM automatically reflects changes to its
	 * preferences.
	 */
	this.registerPrefs = function() {
		if (this.prefsRegistered) return;
		this.prefsRegistered = true;
		prefs.QueryInterface(Ci.nsIPrefBranch2);
		prefs.addObserver("", this, false);
		this.getPrefs();
	};
	
	/**
	 * Unregisters the preferences observer as the window is being closed.
	 */
	this.unregisterPrefs = function() {
		this.prefsRegistered = false;
		prefs.removeObserver("", this);
	};
	
	/**
	 * Responds to changes to AVIM preferences.
	 *
	 * @param subject	{object}	the nsIPrefBranch containing the preference.
	 * @param topic		{string}	the type of event that occurred.
	 * @param data		{string}	the name of the preference that changed.
	 */
	this.observe = function(subject, topic, data) {
		if (topic !== "nsPref:changed") return;
		this.getPrefs(data);
		this.updateUI();
		
		if ("gMultiProcessBrowser" in window && window.gMultiProcessBrowser) {
			messageManager.broadcastAsyncMessage("AVIM:prefschanged", AVIMConfig);
		}
	};
	
	/**
	 * Updates the stored preferences to reflect AVIM's current state.
	 */
	this.setPrefs = function(changedPref) {
		// Boolean preferences
		let boolPrefs = {
			// Basic options
			enabled: AVIMConfig.onOff,
			ignoreMalformed: AVIMConfig.ckSpell,
			oldAccents: AVIMConfig.oldAccent,
			statusBarPanel: AVIMConfig.statusBarPanel,
			
			// Advanced options
			informal: AVIMConfig.informal,
			passwords: AVIMConfig.passwords,
			
			// Auto input method configuration
			"auto.telex": AVIMConfig.autoMethods.telex,
			"auto.vni": AVIMConfig.autoMethods.vni,
			"auto.viqr": AVIMConfig.autoMethods.viqr,
			"auto.viqrStar": AVIMConfig.autoMethods.viqrStar,
			
			// Script monitor
			"scriptMonitor.enabled": AVIMConfig.disabledScripts.enabled,
			"scriptMonitor.avim": AVIMConfig.disabledScripts.AVIM,
			"scriptMonitor.chim": AVIMConfig.disabledScripts.CHIM,
			"scriptMonitor.google": AVIMConfig.disabledScripts.Google,
			"scriptMonitor.mudim": AVIMConfig.disabledScripts.Mudim,
			"scriptMonitor.mViet": AVIMConfig.disabledScripts.MViet,
			"scriptMonitor.vietImeW": AVIMConfig.disabledScripts.VietIMEW,
			"scriptMonitor.vietTyping": AVIMConfig.disabledScripts.VietTyping,
			"scriptMonitor.vietUni": AVIMConfig.disabledScripts.VietUni,
			"scriptMonitor.vinova": AVIMConfig.disabledScripts.Vinova
		};
		if (changedPref) {
			if (changedPref in boolPrefs) {
				prefs.setBoolPref(changedPref, !!boolPrefs[changedPref]);
			}
		}
		else {
			for (let pref in boolPrefs) {
				if (boolPrefs.propertyIsEnumerable(pref)) {
					prefs.setBoolPref(pref, !!boolPrefs[pref]);
				}
			}
		}
		
		// Integer preferences
		if (!changedPref || changedPref === "prefVersion") {
			prefs.setIntPref("prefVersion", AVIMConfig.prefVersion);
		}
		if (!changedPref || changedPref === "method") {
			prefs.setIntPref("method", AVIMConfig.method);
		}
		if (!changedPref || changedPref === "volume") {
			prefs.setIntPref("volume",
							 Math.round(clamp(AVIMConfig.volume, 0, 100)));
		}
		
		// Custom string preferences
		if (!changedPref || changedPref === "ignoredFieldIds") {
			let ids = AVIMConfig.exclude.join(" ").toLowerCase();
			prefs.setComplexValue("ignoredFieldIds", Ci.nsISupportsString,
								  makeSupportsString(ids));
		}
	};
	
	/**
	 * Updates AVIM's current state to reflect the stored preferences.
	 *
	 * @param changedPref	{string}	the name of the preference that changed.
	 */
	this.getPrefs = function(changedPref) {
//		dump("Changed pref: " + changedPref + "\n");							// debug
		let specificPref = true;
/* jshint -W086 */
		switch (changedPref) {
			default:
				// Fall through when changedPref isn't defined, which happens at
				// startup, when we want to get all the preferences.
				specificPref = false;
			
			case "prefVersion":
				AVIMConfig.prefVersion = prefs.getIntPref("prefVersion");
				if (specificPref) break;
			
			// Basic options
			case "enabled":
				AVIMConfig.onOff = prefs.getBoolPref("enabled");
				if (specificPref) break;
			case "method":
				AVIMConfig.method = prefs.getIntPref("method");
				// In case someone enters an invalid method ID in about:config
				let method = AVIMConfig.method;
				if (method < 0 || method >= broadcasterIds.methods.length) {
					Cc["@mozilla.org/preferences-service;1"]
						.getService(Ci.nsIPrefService)
						.getDefaultBranch("extensions.avim.")
						.clearUserPref("method");
					AVIMConfig.method = prefs.getIntPref("method");
				}
				if (specificPref) break;
			case "ignoreMalformed":
				AVIMConfig.ckSpell = prefs.getBoolPref("ignoreMalformed");
				if (specificPref) break;
			case "oldAccents":
				AVIMConfig.oldAccent = prefs.getBoolPref("oldAccents");
				if (specificPref) break;
			case "statusBarPanel":
				AVIMConfig.statusBarPanel = prefs.getBoolPref("statusBarPanel");
				if (specificPref) break;
			
			// Advanced options
			case "informal":
				AVIMConfig.informal = prefs.getBoolPref("informal");
				if (specificPref) break;
			case "volume":
				AVIMConfig.volume = prefs.getIntPref("volume");
				if (specificPref) break;
			case "passwords":
				AVIMConfig.passwords = prefs.getBoolPref("passwords");
				if (specificPref) break;
			case "ignoredFieldIds":
				let ids = prefs.getComplexValue("ignoredFieldIds",
												Ci.nsISupportsString).data;
				AVIMConfig.exclude = ids.toLowerCase().split(/\s+/);
				if (specificPref) break;
			
			// Auto input method configuration
			case "auto.telex":
				AVIMConfig.autoMethods.telex = prefs.getBoolPref("auto.telex");
				if (specificPref) break;
			case "auto.vni":
				AVIMConfig.autoMethods.vni = prefs.getBoolPref("auto.vni");
				if (specificPref) break;
			case "auto.viqr":
				AVIMConfig.autoMethods.viqr = prefs.getBoolPref("auto.viqr");
				if (specificPref) break;
			case "auto.viqrStar":
				AVIMConfig.autoMethods.viqrStar =
					prefs.getBoolPref("auto.viqrStar");
				if (specificPref) break;
			
			// Script monitor
			case "scriptMonitor.enabled":
				AVIMConfig.disabledScripts.enabled =
					prefs.getBoolPref("scriptMonitor.enabled");
				if (specificPref) break;
			case "scriptMonitor.avim":
				AVIMConfig.disabledScripts.AVIM =
					prefs.getBoolPref("scriptMonitor.avim");
				if (specificPref) break;
			case "scriptMonitor.chim":
				AVIMConfig.disabledScripts.CHIM =
					prefs.getBoolPref("scriptMonitor.chim");
				if (specificPref) break;
			case "scriptMonitor.google":
				AVIMConfig.disabledScripts.Google =
					prefs.getBoolPref("scriptMonitor.google");
				if (specificPref) break;
			case "scriptMonitor.mudim":
				AVIMConfig.disabledScripts.Mudim =
					prefs.getBoolPref("scriptMonitor.mudim");
				if (specificPref) break;
			case "scriptMonitor.mViet":
				AVIMConfig.disabledScripts.MViet =
					prefs.getBoolPref("scriptMonitor.mViet");
				if (specificPref) break;
			case "scriptMonitor.vietImeW":
				AVIMConfig.disabledScripts.VietIMEW =
					prefs.getBoolPref("scriptMonitor.vietImeW");
				if (specificPref) break;
			case "scriptMonitor.vietTyping":
				AVIMConfig.disabledScripts.VietTyping =
					prefs.getBoolPref("scriptMonitor.vietTyping");
				if (specificPref) break;
			case "scriptMonitor.vietUni":
				AVIMConfig.disabledScripts.VietUni =
					prefs.getBoolPref("scriptMonitor.vietUni");
				if (specificPref) break;
			case "scriptMonitor.vinova":
				AVIMConfig.disabledScripts.Vinova =
					prefs.getBoolPref("scriptMonitor.vinova");
//				if (specificPref) break;
		}
/* jshint +W086 */
	};
	
	this.numCtrlPresses = 0;
	this.isWaitingForCtrlKeyUp = false;
	this.ctrlStartDate = null;
	
	/**
	 * Starts listening for Ctrl press events to track the toggling key binding.
	 */
	this.startListeningForCtrl = function () {
		//dump(">>> Start listening with " + this.numCtrlPresses + " key press(es)\n");	// debug
		this.isWaitingForCtrlKeyUp = true;
		if (!this.numCtrlPresses) {
			addEventListener("keyup", this.onKeyUp, true);
			addEventListener("mousedown", this.stopListeningForCtrl, true);
			addEventListener("mouseup", this.stopListeningForCtrl, true);
		}
	};
	
	/**
	 * Stops listening for Ctrl press events and resets the Ctrl key counter.
	 */
	this.stopListeningForCtrl = function () {
		//dump(">>> Stop listening with " + avim.numCtrlPresses + " key press(es)\n");	// debug
		avim.isWaitingForCtrlKeyUp = false;
		avim.numCtrlPresses = 0;
		avim.ctrlStartDate = null;
		removeEventListener("keyup", avim.onKeyUp, true);
		removeEventListener("mousedown", avim.stopListeningForCtrl, true);
		removeEventListener("mouseup", avim.stopListeningForCtrl, true);
		return false;
	};
	
	/**
	 * First responder for keydown events.
	 *
	 * @param e {object}	The generated event.
	 */
	this.onKeyDown = function (e) {
		//dump("AVIM.onKeyDown -- code: " + String.fromCharCode(e.which) + " #" + e.which +
		//	 "; target: " + e.target.nodeName + "." + e.target.className + "#" + e.target.id +
		//	 "; originalTarget: " + e.originalTarget.nodeName + "." + e.originalTarget.className + "#" + e.originalTarget.id + "\n");			// debug
		if (e.which === e.DOM_VK_CONTROL && e.ctrlKey && !e.metaKey &&
			!e.altKey && !e.shiftKey &&
			!(this.numCtrlPresses && this.ctrlStartDate &&
			  // GetDoubleClickTime() on Windows: ?–5 s, default 500 ms
			  // +[NSEvent doubleClickInterval] on OS X: 150 ms–5 s, default 500 ms
			  new Date() - this.ctrlStartDate > 1000 /* ms */)) {
			this.startListeningForCtrl();
		}
		else this.stopListeningForCtrl();
		
		return false;
	};
	
	/**
	 * First responder for keypress events.
	 *
	 * @param e	{object}	The generated event.
	 * @returns {boolean}	True if AVIM modified the textbox as a result of the
	 * 						keypress.
	 */
	this.onKeyPress = function(/* e */) {
		//dump("AVIM.onKeyPress -- code: " + String.fromCharCode(e.which) + " #" + e.which +
		//	 "; target: " + e.target.nodeName + "." + e.target.className + "#" + e.target.id +
		//	 "; originalTarget: " + e.originalTarget.nodeName + "." + e.originalTarget.className + "#" + e.originalTarget.id + "\n");			// debug
		this.stopListeningForCtrl();
		return false;
	};
	
	/**
	 * First responder for keyup events.
	 *
	 * @param e {object}	The generated event.
	 */
	this.onKeyUp = function (e) {
		//dump("AVIM.onKeyUp -- code: " + String.fromCharCode(e.which) + " #" + e.which +
		//	 "; target: " + e.target.nodeName + "." + e.target.className + "#" + e.target.id +
		//	 "; originalTarget: " + e.originalTarget.nodeName + "." + e.originalTarget.className + "#" + e.originalTarget.id + "\n");			// debug
		if (avim && avim.isWaitingForCtrlKeyUp) {
			avim.isWaitingForCtrlKeyUp = false;
			if (!avim.ctrlStartDate) avim.ctrlStartDate = new Date();
			if (e.which === e.DOM_VK_CONTROL && !e.ctrlKey && !e.metaKey &&
				!e.altKey && !e.shiftKey) {
				if (++avim.numCtrlPresses > 1) {
					avim.stopListeningForCtrl();
					avim.toggle(true);
					avim.playCueAfterToggle();
				}
			}
			else avim.stopListeningForCtrl();
		}
		return false;
	};
	
	const xformer = Cc["@1ec5.org/avim/transformer;1"].getService().wrappedJSObject;
	
	/**
	 * First responder for keypress messages from frame scripts.
	 */
	this.onFrameKeyPress = function (msg) {
		let evt = msg.data.evt;
		let result = xformer.applyKey(msg.data.prefix, {
			method: AVIMConfig.method,
			autoMethods: AVIMConfig.autoMethods,
			ckSpell: AVIMConfig.ckSpell,
			informal: AVIMConfig.informal,
			oldAccent: AVIMConfig.oldAccent,
			keyCode: evt.keyCode,
			which: evt.which,
			shiftKey: evt.shiftKey,
		});
		return result;
	};
	
	/**
	 * Responds to messages from frame scripts that are ready for preferences.
	 */
	this.onFrameReadyForPrefs = function (/* msg */) {
		return AVIMConfig;
	};
	
	// IME and DiMENSiON extension
	if ("getIMEStatus" in window) {
		let getStatus = getIMEStatus;
		getIMEStatus = function() {
			try {
				return AVIMConfig.onOff || getStatus();
			}
			catch (e) {
				return AVIMConfig.onOff;
			}
		};
	}
	
	/**
	 * Installs the toolbar button with the given ID into the given
	 * toolbar, if it is not already present in the document.
	 *
	 * @param {string} toolbarId The ID of the toolbar to install to.
	 * @param {string} id The ID of the button to install.
	 * @param {string} afterId The ID of the element to insert after. @optional
	 *
	 * <https://developer.mozilla.org/en-US/Add-ons/Code_snippets/Toolbar#Adding_button_by_default>
	 */
	function installToolbarButton(toolbarId, id, afterId) {
		if (!$(id)) {
			let toolbar = $(toolbarId);
			let target = $(toolbarId + "-customization-target") || toolbar;
			
			// If no afterId is given, then append the item to the toolbar
			let before = null;
			if (afterId) {
				let elem = $(afterId);
				if (elem && elem.parentNode === target) {
					before = elem.nextElementSibling;
				}
			}
			
			target.insertItem(id, before);
			toolbar.setAttribute("currentset", toolbar.currentSet);
			document.persist(toolbar.id, "currentset");
			
//			if (toolbarId == "addon-bar") toolbar.collapsed = false;
		}
	}
	
	this.doFirstRun = function () {
		if (AVIMConfig.prefVersion < PREF_VERSION && $("PanelUI-menu-button")) {
			installToolbarButton("nav-bar", "avim-tb");
			AVIMConfig.prefVersion = PREF_VERSION;
			this.setPrefs("prefVersion");
		}
	};
}

(function (win) {

if ("avim" in win || win.frameElement) return;

win.avim = new AVIM();
addEventListener("load", function load(/* evt */) {
	removeEventListener("load", load, false);
	
	avim.registerPrefs();
	avim.updateUI();
	avim.doFirstRun();
	
	addEventListener("keydown", function (evt) {
		avim.onKeyDown(evt);
	}, true);
	addEventListener("keypress", function (evt) {
		avim.onKeyPress(evt);
	}, true);
	
	if ("gMultiProcessBrowser" in win && win.gMultiProcessBrowser) {
		messageManager.loadFrameScript("chrome://avim/content/frame.js", true);
		messageManager.addMessageListener("AVIM:readyforprefs",
										  avim.onFrameReadyForPrefs);
		messageManager.addMessageListener("AVIM:keypress", avim.onFrameKeyPress);
	}
	
	addEventListener("unload", function unload(/* evt */) {
		removeEventListener("unload", unload, false);
		messageManager.removeMessageListener("AVIM:keypress",
											 avim.onFrameKeyPress);
		avim.unregisterPrefs();
	}, false);
}, false);

})(window);
