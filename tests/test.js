"use strict";

const DESCRIPTION = "Run AVIM string manipulation tests";
const USAGE = "js24 -b -s test.js";
if (scriptArgs.length && ["-?", "--help"].indexOf(scriptArgs[0]) >= 0) {
	print(DESCRIPTION);
	print("Usage: " + USAGE);
	quit();
}

load("assert.js");
load("transformer.js");

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
