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
	if (result && !result.changed && result.value) result.value += keyChar;
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

assert.equal(applyKey("dt", "d", prefs), "dtd");	// d44df2bae6c2
assert.equal(applyKey("zi", "`", prefs), "zi`");	// cdf616a8ce81
assert.equal(applyKey("qi", "'", prefs), "qi'");	// Mudim #16
assert.equal(applyKey("ka", "'", prefs), "ká");	// Mudim #16, 7459b5d33ee8, 91e3cca3ebdb
assert.equal(applyKey("ko", "'", prefs), "kó");	// Mudim #16, 7459b5d33ee8, 91e3cca3ebdb
assert.equal(applyKey("ku", "'", prefs), "kú");	// Mudim #16, 7459b5d33ee8, 91e3cca3ebdb
assert.equal(applyKey("XOA", "'", prefs), "XÓA");	// 91e3cca3ebdb
assert.equal(applyKey("gin", "`", prefs), "gìn");	// 91e3cca3ebdb, c927d74748fa
assert.equal(applyKey("ô", "^", prefs), "o^");	// 441e8cf7aacd
assert.equal(applyKey("Ng", "~", prefs), "Ng~");	// ce59e67eadca

assert.equal(applyKey("trắng", "(", prefs), "tráng(");
//assert.equal(applyKey("bế", "^", prefs), "bé^");	// #13
//assert.equal(applyKey("kilômet", "'", prefs), "kilômét");	// #14

prefs = {
	method: 3 /* VIQR */,
	ckSpell: false,
	informal: false,
	oldAccent: true,
};

assert.equal(applyKey("Ng", "~", prefs), "Ng̃");
assert.equal(applyKey("ng", "~", prefs), "ng̃");	// ce59e67eadca
//assert.equal(applyKey("Ng̃", "u", prefs), "Ngũ");	// #12

let status = assert.errors.length ? 1 : 0;
assert.flush();
quit(status);
