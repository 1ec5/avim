/* global load, applyKey, scriptArgs, read, quit, putstr, assert, -status */
"use strict";

const DESCRIPTION = "Test AVIM against a wordlist";
const USAGE = "js24 -b -s corpus.js /path/to/corpus.txt -w /path/to/whitelist.txt";

load("assert.js");
load("transformer.js");

const screenWidth = 80;
let prefs = {
	ckSpell: true,
	informal: false,
	oldAccent: true,
};

const sequences = {
	"a": "a", "á": "a'", "à": "a`", "ã": "a~", "ả": "a?", "ạ": "a.",
	"â": "a^", "ấ": "a^'", "ầ": "a^`", "ẫ": "a^~", "ẩ": "a^?", "ậ": "a^.",
	"ă": "a(", "ắ": "a('", "ằ": "a(`", "ẵ": "a(~", "ẳ": "a(?", "ặ": "a(.",
	"b": "b", "c": "c", "d": "d", "đ": "dd",
	"e": "e", "é": "e'", "è": "e`", "ẽ": "e~", "ẻ": "e?", "ẹ": "e.",
	"ê": "e^", "ế": "e^'", "ề": "e^`", "ễ": "e^~", "ể": "e^?", "ệ": "e^.",
	"f": "f", "g": "g", "h": "h",
	"i": "i", "í": "i'", "ì": "i`", "ĩ": "i~", "ỉ": "i?", "ị": "i.",
	"j": "j", "k": "k", "l": "l", "m": "m", "n": "n",
	"o": "o", "ó": "o'", "ò": "o`", "õ": "o~", "ỏ": "o?", "ọ": "o.",
	"ô": "o^", "ố": "o^'", "ồ": "o^`", "ỗ": "o^~", "ổ": "o^?", "ộ": "o^.",
	"ơ": "o+", "ớ": "o+'", "ờ": "o+`", "ỡ": "o+~", "ở": "o+?", "ợ": "o+.",
	"p": "p", "q": "q", "r": "r", "s": "s", "t": "t",
	"u": "u", "ú": "u'", "ù": "u`", "ũ": "u~", "ủ": "u?", "ụ": "u.",
	"ư": "u+", "ứ": "u+'", "ừ": "u+`", "ữ": "u+~", "ử": "u+?", "ự": "u+.",
	"v": "v", "w": "w", "x": "x",
	"y": "y", "ý": "y'", "ỳ": "y`", "ỹ": "y~", "ỷ": "y?", "ỵ": "y.",
	"z": "z"
};

const methodNames = ["auto", "telex", "vni", "viqr", "viqrStar"];

/**
 * Map VIQR keystrokes to those of other input methods. Functions expect a
 * "previous character" parameter.
 */
const methodMap = {
	telex: {
		"'": "s", "`": "f", "?": "r", "~": "x", ".": "j",
		"^": function(base) {
			return base;
		},
		"+": "w", "(": "w"
	},
	vni: {
		"'": "1", "`": "2", "?": "3", "~": "4", ".": "5",
		"^": "6", "+": "7", "(": "8", "d": "9"
	},
	viqr: {},
	viqrStar: {"+": "*"}
};

function progressBar(pct) {
	let length = Math.round(pct * (screenWidth - 2));
	let bar = length ? "=".repeat(length - 1) + ">" : "";
	return "[" + bar + " ".repeat(screenWidth - 2 - length) + "]";
}

/**
 * Prepares the given word for entry.
 *
 * @param word		{string}	The Unicode-encoded word to normalize.
 * @param method	{string}	The name of the currently activated input
 * 								method.
 * @returns {string}	The transformed word.
 */
function prepareWord(word, method) {
	// Convert word to VIQR.
	let viqrWord = "";
	for (let i = 0; i < word.length; i++) {
		let chr = word[i];
		viqrWord += sequences[chr] || chr;
	}
	
	// Separate base letters from diacritics.
	let letters = [];
	let accents = [];
	let circumVowels = [];
	for (let i = 0; i < viqrWord.length; i++) {
		let cur = viqrWord[i];
		// Special-case "d" because it can also appear by itself.
		if (cur.toLowerCase() === "d") {
			if (i && cur.toLowerCase() === viqrWord[i - 1].toLowerCase()) {
				accents.push(cur);
				circumVowels.push(null);
			}
			else letters.push(cur);
		}
		// "+" should already be duplicated if necessary.
		else if (cur === "+" && accents.indexOf("+") >= 0) continue;
		else if ("'`?~.^+(d".indexOf(cur) >= 0) {
			accents.push(cur);
			circumVowels.push((i && cur === "^") ? viqrWord[i - 1] : null);
		}
		else {
			if (method === "telex" && letters.length &&
				letters[letters.length - 1].toLowerCase() === cur.toLowerCase() &&
				"aeo".indexOf(cur.toLowerCase()) >= 0) {
				letters.push(cur);
			}
			letters.push(cur);
		}
	}
	
	// Convert word to given method.
	if (method !== "viqr") {
		let transAccents = [];
		for (let i = 0; i < accents.length; i++) {
			let trans = methodMap[method][accents[i]];
			if (trans instanceof Function) trans = trans(circumVowels[i]);
			transAccents.push(trans || accents[i]);
		}
		accents = transAccents;
	}
	
	return letters.join("") + accents.join("");
}

/**
 * Constructs the given word key by key and compares the results against the
 * original word.
 *
 * @param word	{string}	The Unicode-encoded goal word.
 * @param keys	{string}	The keystrokes to press.
 */
function applyKeys(keys) {
	let word = keys[0];
	for (let i = 1; i < keys.length && word; i++) {
		word = applyKey(word, keys[i], prefs);
	}
	return word;
}

let words = [];
let okWords = new Set();
for (let i = 0; i < scriptArgs.length; i++) {
	let arg = scriptArgs[i];
	if (!arg || ["-?", "--help"].indexOf(arg) >= 0) continue;
	
	if (arg === '-w' && ++i < scriptArgs.length) {
		let src = read(scriptArgs[i]);
		for (let word of src ? src.split(/\s+/) : []) okWords.add(word);
	}
	else {
		let src = read(arg);
		if (src) Array.prototype.push.apply(words, src.split(/\s+/));
	}
}

if (!words.length) {
	print(DESCRIPTION);
	print("Usage: " + USAGE);
	quit();
}

let finishedTests = 0;
let totalTests = (methodNames.length - 1) * (words.length - okWords.size);
for (let i = 1; i < methodNames.length; i++) {
	prefs.method = i;
	for (let j = 0; j < words.length; j++) {
		if (++finishedTests % Math.round(totalTests / screenWidth) === 0) {
			putstr("\r" + progressBar(finishedTests / totalTests));
		}
		let word = words[j];
		if (!word || okWords.has(word)) continue;
		let keys = prepareWord(word, methodNames[prefs.method]);
		assert.equal(applyKeys(keys), word, keys);
	}
}
putstr("\r");

let status = assert.errors.length ? 1 : 0;
assert.flush();
quit(status);
