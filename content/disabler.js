"use strict";

(function () {

// A table mapping the names of disablers to the names of the preferences that
// determine whether the disablers are enabled. If the two names match, they can
// can be omitted from this table. Confusing, huh?
const disablerAliases = {
	HIM: "AVIM",
	xvnkb: "CHIM"
};

// Markers and disablers for embedded Vietnamese IMEs
const disablers = {
	// For each of these disablers, we don't need a sanity check for an object
	// or member that served as a marker for the IME. Also, everything is
	// wrapped in a try...catch block, so we don't need sanity checks if the
	// disabler can halt on error without failing to reach independent
	// statements.
	
	AVIM: function(marker) {
		marker.setMethod(-1);
	},
	Google: function(marker) {
		if (!("elements" in marker && "keyboard" in marker.elements)) return;
		
		// Try the Virtual Keyboard API first.
		if ("Keyboard" in marker.elements.keyboard) {
			marker.elements.keyboard.Keyboard.prototype.setVisible(false);
			return;
		}
		
		// Try closing the Virtual Keyboard itself if it's open.
		let kb = document.getElementsByClassName("vk-t-btn-o")[0];
		if (kb) kb.click();
		
		// Deselect the Input tools button in the Google Docs toolbar.
		let toggle = document.getElementById("inputToolsToggleButton");
		if (toggle && toggle.getAttribute("aria-pressed") === "true") {
			let downEvt = document.createEvent("MouseEvents");
			downEvt.initMouseEvent("mousedown", true /* canBubble */,
								   true /* cancelable */, window, 0 /* detail */,
								   0 /* screenX */, 0 /* screenY */,
								   0 /* clientX */, 0 /* clientY */,
								   false /* ctrlKey */, false /* altKey */,
								   false /* shiftKey */, false /* metaKey */,
								   0 /* button */, null /* relatedTarget */);
			toggle.dispatchEvent(downEvt);
			let upEvt = document.createEvent("MouseEvents");
			upEvt.initMouseEvent("mouseup", true /* canBubble */,
								 true /* cancelable */, window, 0 /* detail */,
								 0 /* screenX */, 0 /* screenY */,
								 0 /* clientX */, 0 /* clientY */,
								 false /* ctrlKey */, false /* altKey */,
								 false /* shiftKey */, false /* metaKey */,
								 0 /* button */, null /* relatedTarget */);
			toggle.dispatchEvent(upEvt);
		}
	},
	CHIM: function(marker) {
		if (parseInt(marker.method)) marker.SetMethod(0);
	},
	HIM: function(marker, win) {
		win = win || window;
		if ("setMethod" in win) win.setMethod(-1);
		win.on_off = 0;
	},
	Mudim: function(marker) {
		if (parseInt(marker.method) == 0) return;
		if ("Toggle" in marker) marker.Toggle();
		else CHIM.Toggle();
	},
	MViet: function(marker, win) {
		win = win || window;
		if (win.MVOff === true) return;
		if ("MVietOnOffButton" in win &&
			win.MVietOnOffButton instanceof Function) {
			win.MVietOnOffButton();
		}
		else if ("button" in win) win.button(0);
	},
	VietIMEW: function() {
		if (!("VietIME" in window)) return;
		for (let memName in window) {
			let mem = window[memName];
			if ("setTelexMode" in mem && "setNormalMode" in mem) {
				mem.setNormalMode();
				break;
			}
		}
	},
	VietTyping: function() {
		if ("changeMode" in window) changeMode(-1);
		else ON_OFF = 0;
	},
	VietUni: function() {
		if ("setTypingMode" in window) setTypingMode();
		else if ("setMethod" in window) setMethod(0);
	},
	Vinova: function(marker) {
		marker.reset(true);
	},
	XaLo: function() {
		if (_e_ && document.getElementsByClassName("vk").length) {
			_e_(null, 0);
		}
	},
	xvnkb: function() {
		if (parseInt(vnMethod) != 0) VKSetMethod(0);
	}
};
const markers = {
	// HIM and AVIM since at least version 1.13 (build 20050810)
	DAWEOF: "HIM",
	// VietTyping, various versions
	UNIZZ: "VietTyping",
	// VietUni, including vietuni8.js (2001-10-19) and version 14.0 by Tran
	// Kien Duc (2004-01-07)
	telexingVietUC: "VietUni",
	// Mudim since version 0.3 (r2)
	Mudim: "Mudim",
	// MViet 12 AC
	evBX: "MViet",
	// MViet 14 RTE
	MVietOnOffButton: "MViet",
	// CHIM since version 0.9.3
	CHIM: "CHIM",
	// CHIM (xvnkb.js) versions 0.8-0.9.2 and BIM 0.00.01-0.0.3
	vnMethod: "xvnkb",
	// HIM since at least version 1.1 (build 20050430)
	DAWEO: "HIM",
	// HIM since version 1.0
	findCharToChange: "HIM",
	// AVIM after build 20071102
	AVIMObj: "AVIM",
	// Vinova (2008-05-23)
	vinova: "Vinova",
	// VietIMEW
	GetVnVowelIndex: "VietIMEW",
	// VietUni 1.7 by nthachus (2008-10-16)
	CVietUni: "VietUni",
	// XaLộ (vn.xalo.client.vnk)
	_xalo_ga: "XaLo",
	// Google (google.com.vn) and Google Virtual Keyboard API 1.0
	google: "Google"
};
//const frameMarkers = ["MVietOnOffButton", "DAWEOF"];

/**
 * Disables the Vietnamese JavaScript input method editor (IME) with the given
 * marker.
 *
 * @param marker		{string}	Name of a JavaScript object (possibly a
 *									function) that indicates the presence of the
 *									IME.
 * @returns {boolean}	True if the disabler ran without errors (possibly
 * 						without effect); false if errors were raised.
 */
function disableOther(marker) {
	// Don't bother disabling the script if the preference is disabled.
	let disablerName = markers[marker];
	if (disabledScripts.split("|").indexOf(disablerAliases[disablerName] ||
										   disablerName) < 0) {
		return false;
	}
	
	try {
		// Get the disabling code.
		let disabler = disablers[disablerName];
		if (!disabler) return false;
		
		// Try to disable the IME in the current document.
		let hasMarker = false;
		let parentHasMarker = false;
		try {
			hasMarker = marker in window;
			// Some IMEs are applied to rich textareas in iframes.
			parentHasMarker = window.frameElement && marker in window.parent;
		}
		catch (exc) {}
		if (hasMarker) disabler(window[marker]);
		if (parentHasMarker) disabler(window.parent[marker]);
		return hasMarker || parentHasMarker;
	}
	catch (exc) {
// $if{Debug}
		dump(">>> Script monitor -- marker: " + marker + "; error on line " +
			 exc.lineNumber + ": " + exc + "\n" + exc.stack + "\n");
// $endif{}
		return false;
	}
}

for (let marker in markers) {
	if (disableOther(marker)) return;
}

})();
