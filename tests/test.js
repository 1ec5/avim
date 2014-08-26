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

let prefs = {
	method: 3 /* VIQR */,
	ckSpell: true,
	informal: false,
	oldAccent: true,
};

okApplyKey(prefs, "bo", "^", "bô");
okApplyKey(prefs, "bô", ".", "bộ");
okApplyKey(prefs, "gõ", "-", "go");

okApplyKey(prefs, "dt", "d", "dtd");	// d44df2bae6c2
okApplyKey(prefs, "zi", "`", "zi`");	// cdf616a8ce81
okApplyKey(prefs, "qi", "'", "qi'");	// Mudim #16
okApplyKey(prefs, "ka", "'", "ká");	// Mudim #16, 7459b5d33ee8, 91e3cca3ebdb
okApplyKey(prefs, "ko", "'", "kó");	// Mudim #16, 7459b5d33ee8, 91e3cca3ebdb
okApplyKey(prefs, "ku", "'", "kú");	// Mudim #16, 7459b5d33ee8, 91e3cca3ebdb
okApplyKey(prefs, "XOA", "'", "XÓA");	// 91e3cca3ebdb
okApplyKey(prefs, "gin", "`", "gìn");	// 91e3cca3ebdb, c927d74748fa
okApplyKey(prefs, "ô", "^", "o^");	// 441e8cf7aacd
okApplyKey(prefs, "Ng", "~", "Ng~");	// ce59e67eadca

okApplyKey(prefs, "trắng", "(", "tráng(");
//okApplyKey(prefs, "bế", "^", "bé^");	// #13
okApplyKey(prefs, "bố", "^", "bó^");	// #13
//okApplyKey(prefs, "kilômet", "'", "kilômét");	// #14

prefs = {
	method: 3 /* VIQR */,
	ckSpell: false,
	informal: false,
	oldAccent: true,
};

okApplyKey(prefs, "Ng", "~", "Ng̃");
okApplyKey(prefs, "ng", "~", "ng̃");	// ce59e67eadca
//okApplyKey(prefs, "Ng̃", "u", "Ngũ");	// #12

let prefs = {
	method: 1 /* Telex */,
	ckSpell: true,
	informal: false,
	oldAccent: true,
};

okApplyKey(prefs, "bế", "e", "bée");	// #13

let status = assert.errors.length ? 1 : 0;
assert.flush();
quit(status);
