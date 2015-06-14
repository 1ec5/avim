/* global scriptArgs, quit, load, okApplyKey, assert, -status */
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

okApplyKey(prefs, "Viet", "^", "Viêt");
okApplyKey(prefs, "Viêt", ".", "Việt");

okApplyKey(prefs, "truong", "+", "trương");
okApplyKey(prefs, "trương", "`", "trường");

okApplyKey(prefs, "to", "'", "tó");
okApplyKey(prefs, "tó", "a", "tóa");
okApplyKey(prefs, "tóa", "n", "toán");

okApplyKey(prefs, "truơng", "`", "trường");
//okApplyKey(prefs, "trưong", "`", "trường");	// #79

okApplyKey(prefs, "ma", "'", "má");
okApplyKey(prefs, "má", "`", "mà");
okApplyKey(prefs, "mà", "?", "mả");
okApplyKey(prefs, "mả", "~", "mã");
okApplyKey(prefs, "mã", ".", "mạ");

okApplyKey(prefs, "chở", "-", "chơ");
okApplyKey(prefs, "chơ", "-", "cho");

okApplyKey(prefs, "Đúng\\", ".", "Đúng.");

okApplyKey(prefs, "Sai", ".", "Sại");
okApplyKey(prefs, "Sại", ".", "Sai.");

okApplyKey(prefs, "1d", "d", "1₫");
okApplyKey(prefs, "1₫", "d", "1dd");
okApplyKey(prefs, "₫", "d", "dd");	// #92
okApplyKey(prefs, "1₫", "-", "1d");
okApplyKey(prefs, "₫", "-", "d");	// #92

okApplyKey(prefs, "gya", ".", "gya.");

okApplyKey(prefs, "D", "D", "Đ");
okApplyKey(prefs, "D", "d", "Đ");
okApplyKey(prefs, "d", "D", "đ");
okApplyKey(prefs, "Đ", "D", "DD");
okApplyKey(prefs, "Đ", "d", "Dd");
okApplyKey(prefs, "đ", "D", "dD");

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
okApplyKey(prefs, "bế", "^", "bé^");	// #13
okApplyKey(prefs, "bố", "^", "bó^");	// #13
//okApplyKey(prefs, "kilômet", "'", "kilômét");	// #14
okApplyKey(prefs, "cúu", "+", "cứu");	// #70
//okApplyKey(prefs, "coong", "^", "côông");	// #82

okApplyKey(prefs, "tong", "+", "tơng");	// UniKey #32
okApplyKey(prefs, "Đ", "D", "DD");	// UniKey #38

okApplyKey(prefs, "khuya", "'", "khuya'");
okApplyKey(prefs, "khuyu", "?", "khuỷu");
okApplyKey(prefs, "queo", ".", "quẹo");
okApplyKey(prefs, "queue", ".", "queue.");	// #94

okApplyKey(prefs, "Ðınh", "`", "Đình");	// #34
okApplyKey(prefs, "ı", ".", "ị");	// #137
//okApplyKey(prefs, "A\u0300", "'", "Á");	// #138

prefs = {
	method: 3 /* VIQR */,
	ckSpell: false,
	informal: false,
	oldAccent: true,
};

okApplyKey(prefs, "Ng", "~", "Ng̃");
okApplyKey(prefs, "ng", "~", "ng̃");	// ce59e67eadca
//okApplyKey(prefs, "Ng̃", "u", "Ngũ");	// #12

okApplyKey(prefs, "gya", ".", "gỵa");

prefs = {
	method: 1 /* Telex */,
	ckSpell: true,
	informal: false,
	oldAccent: false,
};

okApplyKey(prefs, "bế", "e", "bée");	// #13

okApplyKey(prefs, "cy", "s", "cys");	// Mudim #16
//okApplyKey(prefs, "ka", "a", "kaa");	// Mudim #16
//okApplyKey(prefs, "ko", "o", "koo");	// Mudim #16
//okApplyKey(prefs, "ko", "w", "kow");	// Mudim #16
//okApplyKey(prefs, "ku", "w", "kuw");	// Mudim #16
okApplyKey(prefs, "ty", "r", "tỷ");	// Mudim #16
okApplyKey(prefs, "coa", "f", "coaf");	// Mudim #16
okApplyKey(prefs, "coe", "f", "coef");	// Mudim #16
okApplyKey(prefs, "cuy", "f", "cuyf");	// Mudim #16
okApplyKey(prefs, "ty", "r", "tỷ");	// Mudim #16
okApplyKey(prefs, "kiu", "s", "kíu");	// UniKey #23
okApplyKey(prefs, "ki", "s", "kí");	// UniKey #23

// https://chrome.google.com/webstore/detail/opgbbffpdglhkpglnlkiclakjlpiedoh/reviews
okApplyKey(prefs, "đuơc", "j", "được");

okApplyKey(prefs, "qu", "w", "quw");	// kimkha/avim-chrome#10

prefs = {
	method: 2 /* VNI */,
	ckSpell: true,
	informal: false,
	oldAccent: false,
};

// https://chrome.google.com/webstore/detail/opgbbffpdglhkpglnlkiclakjlpiedoh/reviews
okApplyKey(prefs, "truờn", "g", "trường");

let status = assert.errors.length ? 1 : 0;
assert.flush();
quit(status);
