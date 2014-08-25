"use strict";

load("assert.js");

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
	return result && result.value;
}

let prefs = {
	method: 3 /* VIQR */,
	ckSpell: true,
	informal: false,
	oldAccent: true,
};

assert.equal(applyKey("bo", "^", prefs), "bô");
assert.equal(applyKey("bô", ".", prefs), "bộ");
assert.equal(applyKey("gõ", "-", prefs), "go");

let status = assert.errors.length ? 1 : 0;
assert.flush();
quit(status);
