/* global load, AVIMTransformerService, assert, -Components, -dump */
/* exported Components, dump, okApplyKey */
"use strict";

// Global objects required by transformer.js
let Components = {
	classes: null,
	interfaces: {
		nsIDOMKeyEvent: {
			DOM_VK_BACK_SPACE: 0x08,
		},
	},
	utils: {
		reportError: function (exc) {
			print(exc);
			print(exc.stack);
		},
	},
	ID: function () {},
};
let dump = print;

load("../components/transformer.js");

let xformer = new AVIMTransformerService();

function applyKey(word, keyChar, prefs) {
	//print("Applying " + keyChar + " to " + word);								// debug
	let result = xformer.applyKey(word, {
		method: prefs.method,
		autoMethods: {
			telex: prefs.autoMethods && prefs.autoMethods.telex,
			vni: prefs.autoMethods && prefs.autoMethods.vni,
			viqr: prefs.autoMethods && prefs.autoMethods.viqr,
			viqrStar: prefs.autoMethods && prefs.autoMethods.viqrStar,
		},
		ckSpell: prefs.ckSpell,
		informal: prefs.informal,
		oldAccent: prefs.oldAccent,
		which: keyChar.charCodeAt(0),
	});
	if (result && !result.changed && result.value) result.value += keyChar;
	return result && result.value;
}

function okApplyKey(prefs, word, keyChar, expected) {
	assert.equal(applyKey(word, keyChar, prefs), expected,
				 "Applying " + keyChar + " to " + word);
}
