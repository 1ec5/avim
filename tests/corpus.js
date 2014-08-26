"use strict";

/*
 * Usage: js24 -b -s corpus.js /path/to/corpus.txt
 */

load("assert.js");
load("transformer.js");

let prefs = {
	method: 3 /* VIQR */,
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
	const width = 80;
	let length = Math.round(pct * (width - 2));
	let bar = length ? "=".repeat(length - 1) + ">" : "";
	return "[" + bar + " ".repeat(width - 2 - length) + "]";
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
		if (cur.toLowerCase() == "d") {
			if (i && cur.toLowerCase() == viqrWord[i - 1].toLowerCase()) {
				accents.push(cur);
				circumVowels.push(null);
			}
			else letters.push(cur);
		}
		// "+" should already be duplicated if necessary.
		else if (cur == "+" && accents.indexOf("+") >= 0) continue;
		else if ("'`?~.^+(d".indexOf(cur) >= 0) {
			accents.push(cur);
			circumVowels.push((i && cur == "^") ? viqrWord[i - 1] : null);
		}
		else letters.push(cur);
	}
	
	// Convert word to given method.
	if (method != "viqr") {
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

let src = read(scriptArgs[0]);
let words = src.split(/\s+/);

for (let i = 0; i < words.length; i++) {
	if (i % Math.round(words.length / 80) == 0) {
		putstr("\r" + progressBar(i / words.length));
	}
	if (!words[i]) continue;
	let keys = prepareWord(words[i], methodNames[prefs.method]);
	assert.equal(applyKeys(keys), words[i], keys);
}
putstr("\r");

let status = assert.errors.length ? 1 : 0;
assert.flush();
quit(status);