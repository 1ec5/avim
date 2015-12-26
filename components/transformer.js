/* jshint maxdepth: 6 */
/* exported NSGetModule, NSGetFactory */
"use strict";

const /* Cc = Components.classes, */
	  Ci = Components.interfaces,
	  Cu = Components.utils;

// { 0x4A373444, 0x8A2A, 0x4641, \
// 		{ 0xAD, 0xD5, 0x89, 0x7A, 0x88, 0xD0, 0x51, 0x85 }
const CLASS_ID = Components.ID("{4A373444-8A2A-4641-ADD5-897A88D05185}"),
	  CLASS_NAME = "AVIM text transformer service",
	  CONTRACT_ID = "@1ec5.org/avim/transformer;1";

let Transformation = (function () {

// Some shortcuts for brevity.
const fcc = String.fromCharCode,
	  up = String.toUpperCase;

function nan(w) {
	return isNaN(w) || w === "e";
}

function codesFromChars(chars) {
	let codes = [];
	for (let i = 0; i < chars.length; i++) {
		codes.push(chars[i].charCodeAt(0));
	}
	return codes;
}

function lowerUpper(chars) {
	return chars.toLowerCase() + chars.toUpperCase();
}

function upperLower(chars) {
	return chars.toUpperCase() + chars.toLowerCase();
}

function intersperseLowerUpper(chars) {
	let arr = [];
	for (let i = 0; i < chars.length; i++) {
		arr.push(chars[i].toLowerCase(), chars[i].toUpperCase());
	}
	return arr;
}

const alphabet = "QWERTYUIOPASDFGHJKLZXCVBNM ",
	  skey_str = lowerUpper("a\u00e2\u0103e\u00eaio\u00f4\u01a1u\u01b0y").split(""),	// aâăeêioôơuưy
	  skey2 = lowerUpper("aaaeeiooouuy").split(""),
	  skey = codesFromChars(skey_str),
	  db1 = [0x0111 /* "đ" */, 0x0110 /* "Đ" */],
	  ds1 = ["d", "D"],
	  os1 = intersperseLowerUpper("o\u01a1\u00f3\u00f2\u1ecd\u1ecf\u00f5\u1edb\u1edd\u1ee3\u1edf\u1ee1"),	// oơóòọỏõớờợởỡ
	  ob1 = intersperseLowerUpper("\u00f4\u00f4\u1ed1\u1ed3\u1ed9\u1ed5\u1ed7\u1ed1\u1ed3\u1ed9\u1ed5\u1ed7"),	// ôôốồộổỗốồộổỗ
	  mocs1 = intersperseLowerUpper("o\u00f4u\u00f3\u00f2\u1ecd\u1ecf\u00f5\u00fa\u00f9\u1ee5\u1ee7\u0169\u1ed1\u1ed3\u1ed9\u1ed5\u1ed7"),	// oôuóòọỏõúùụủũốồộổỗ
	  mocb1 = intersperseLowerUpper("\u01a1\u01a1\u01b0\u1edb\u1edd\u1ee3\u1edf\u1ee1\u1ee9\u1eeb\u1ef1\u1eed\u1eef\u1edb\u1edd\u1ee3\u1edf\u1ee1"),	// ơơướờợởỡứừựửữớờợởỡ
	  trangs1 = intersperseLowerUpper("a\u00e2\u00e1\u00e0\u1ea1\u1ea3\u00e3\u1ea5\u1ea7\u1ead\u1ea9\u1eab"),	// aâáàạảãấầậẩẫ
	  trangb1 = intersperseLowerUpper("\u0103\u0103\u1eaf\u1eb1\u1eb7\u1eb3\u1eb5\u1eaf\u1eb1\u1eb7\u1eb3\u1eb5"),	// ăăắằặẳẵắằặẳẵ
	  as1 = intersperseLowerUpper("a\u0103\u00e1\u00e0\u1ea1\u1ea3\u00e3\u1eaf\u1eb1\u1eb7\u1eb3\u1eb5"),	// aăáàạảãắằặẳẵ
	  ab1 = intersperseLowerUpper("\u00e2\u00e2\u1ea5\u1ea7\u1ead\u1ea9\u1eab\u1ea5\u1ea7\u1ead\u1ea9\u1eab"),	// ââấầậẩẫấầậẩẫ
	  es1 = intersperseLowerUpper("e\u00e9\u00e8\u1eb9\u1ebb\u1ebd"),	// eéèẹẻẽ
	  eb1 = intersperseLowerUpper("\u00ea\u1ebf\u1ec1\u1ec7\u1ec3\u1ec5"),	// êếềệểễ
	  english = "\u0110\u00c2\u0102\u01a0\u01af\u00ca\u00d4",	// ĐÂĂƠƯÊÔ
	  lowen = english.toLowerCase(),
	  arA = lowerUpper("\u00e1\u00e0\u1ea3\u00e3\u1ea1a").split(""),	// áàảãạa
	  mocrA = lowerUpper("\u00f3\u00f2\u1ecf\u00f5\u1ecdo\u00fa\u00f9\u1ee7\u0169\u1ee5u").split(""),	// óòỏõọoúùủũụu
	  erA = lowerUpper("\u00e9\u00e8\u1ebb\u1ebd\u1eb9e").split(""),	// éèẻẽẹe
	  orA = lowerUpper("\u00f3\u00f2\u1ecf\u00f5\u1ecdo").split(""),	// óòỏõọo
	  aA = lowerUpper("\u1ea5\u1ea7\u1ea9\u1eab\u1ead\u00e2").split(""),	// ấầẩẫậâ
	  oA = lowerUpper("\u1ed1\u1ed3\u1ed5\u1ed7\u1ed9\u00f4").split(""),	// ốồổỗộô
	  mocA = lowerUpper("\u1edb\u1edd\u1edf\u1ee1\u1ee3\u01a1\u1ee9\u1eeb\u1eed\u1eef\u1ef1\u01b0").split(""),	// ớờởỡợơứừửữựư
	  trangA = lowerUpper("\u1eaf\u1eb1\u1eb3\u1eb5\u1eb7\u0103").split(""),	// ắằẳẵặă
	  eA = lowerUpper("\u1ebf\u1ec1\u1ec3\u1ec5\u1ec7\u00ea").split("");	// ếềểễệê

const DAWEOFA = up(aA.join() + eA.join() + mocA.join() + trangA.join() +
				   oA.join() + english);

const bya = [db1, ab1, eb1, ob1, mocb1, trangb1],
	  sfa = [ds1, as1, es1, os1, mocs1, trangs1];

const ccA = [aA, mocA, trangA, eA, oA],
	  ccrA = [arA, mocrA, arA, erA, orA];

const methods = {
	telex: {
		DAWEO: "DAWEO", SFJRX: "SFJRX", FRX: "FRX",
		S: "S", F: "F", J: "J", R: "R", X: "X", Z: "Z", D: "D",
		them: "AOEW", moc: "W", trang: "W",
		A: "A", E: "E", O: "O"
	},
	vni: {
		DAWEO: "6789", SFJRX: "12534", FRX: "234",
		S: "1", F: "2", J: "5", R: "3", X: "4", Z: "0", D: "9",
		them: "678", moc: "7", trang: "8",
		AEO: "6", A: "6", E: "6", O: "6"
	},
	viqr: {
		DAWEO: "^+(D", SFJRX: "'`.?~", FRX: "`?~",
		S: "'", F: "`", J: ".", R: "?", X: "~", Z: "-", D: "D",
		them: "^+(", moc: "+", trang: "(",
		AEO: "^", A: "^", E: "^", O: "^"
	},
	viqrStar: {
		DAWEO: "^*(D", SFJRX: "'`.?~", FRX: "`?~",
		S: "'", F: "`", J: ".", R: "?", X: "~", Z: "-", D: "D",
		them: "^*(", moc: "*", trang: "(",
		AEO: "^", A: "^", E: "^", O: "^"
	},
};

const imposters = {
	\u01cd: "\u0102", \u01ce: "\u0103",	// Ǎǎ → Ăă
	\u0202: "\u00c2", \u0203: "\u00e2",	// Ȃȃ → Ââ
	\u00d0: "\u0110", \u00f0: "\u0111", \u0189: "\u0110", \u0256: "\u0111",	// ÐðƉɖ → ĐđĐđ
	\u0206: "\u00ca", \u0207: "\u00ea",	// Ȇȇ → Êê
	\u0131: "i",	// ı → i
	\u020e: "\u00d4", \u020f: "\u00f4",	// Ȏȏ → Ôô
};
const imposterRe = /[\u01cd\u01ce\u0202\u0203\u00d0\u00f0\u0189\u0256\u0206\u0207\u0131\u020e\u020f]/g;	// ǍǎȂȃÐðƉɖȆȇıȎȏ

/**
 * Canonicalizes the string by replacing characters that look like
 * Vietnamese characters. The returned string has the same length as the
 * passed-in string.
 */
function replaceImposters(chars) {
	return chars.replace(imposterRe, function (imposter) {
		return imposters[imposter] || imposter;
	});
}

/**
 * Returns the given word with all diacritical marks removed.
 *
 * @param w	{string}	The word with diacritical marks.
 * @returns {string}	The word without diacritical marks.
 */
function unV2(w) {
	let unW = "";
	for (let a = w.length - 1; a >= 0; a--) {
		let pos = skey.indexOf(w.charCodeAt(a));
		if (pos >= 0) unW = skey2[pos] + unW;
		else unW = w[a] + unW;
	}
	return unW;
}

function _Transformation(startValue, context) {
/* jshint -W040 */
	this.value = replaceImposters(startValue);
	this.startLength = this.value.length;
	
	this.context = {
		method: context.method,
		autoMethods: {
			telex: context.autoMethods.telex,
			vni: context.autoMethods.vni,
			viqr: context.autoMethods.viqr,
			viqrStar: context.autoMethods.viqrStar,
		},
		ckSpell: context.ckSpell,
		informal: context.informal,
		oldAccent: context.oldAccent,
		keyCode: context.keyCode,
		which: context.which,
		shiftKey: context.shiftKey,
	};
/* jshint +W040 */
}

_Transformation.prototype = {
	changed: false,
	whit: false,
	tw5: false,
	
	/**
	 * Returns whether VIQR or VIQR* is the current input method, taking into
	 * account whether they are enabled for Auto.
	 *
	 * @returns {bool}	True if VIQR or VIQR* is the current input method.
	 */
	methodIsVIQR: function () {
		if (this.context.method > 2) return true;
		return this.context.method === 0 && (this.context.autoMethods.viqr ||
											 this.context.autoMethods.viqrStar);
	},
	
	/**
	 * Replaces the substring inside the current text, starting at an index and
	 * spanning the given number of characters, with the given string.
	 *
	 * @param index	{number}	The index at which to begin replacing.
	 * @param len	{number}	The number of characters to replace.
	 * @param repl	{string}	The string to insert.
	 * @returns {number}	The distance to the right that the end of the word
	 * 						has shifted.
	 */
	splice: function (index, len, repl) {
		let val = this.value;
		this.value = val.substr(0, index) + repl + val.substr(index + len);
		return repl.length - len;
	},
	
	/**
	 * Returns whether the given word, taking into account the given dead key,
	 * is a malformed Vietnamese word.
	 *
	 * @param w	{string}	The word to check.
	 * @param k	{string}	The dead key applied to the word.
	 * @returns {boolean}	True if the word is malformed; false otherwise.
	 */
	ckspell: function (w, k) {
		if (!this.context.ckSpell) return false;
		
		let uk = up(k);
		
		// Đồng sign after a number: valid
		let num = /^([0-9]+)(d?)$/.exec(w);
		if (num) {
			// Entering the first D: valid
			if (!num[2] && uk === "D") return false;
			
			// Entering the second D: valid
			if (num[2] && uk === this.method.D) return false;
		}
		
		w = this.unV(w);
		let uw = up(w), tw = uw, uw2 = unV2(uw), twE;
		let vSConsonant = "BCD\u0110GHKLMNPQRSTVX";
		let vDConsonant = "[CKNP]H|G[HI]|NGH?|QU|T[HR]";
		if (this.context.informal) {
			vSConsonant += "F";
			vDConsonant += "|DZ";
		}
		
		// NG~: valid
		if (uw === "NG" && uk === this.method.X && this.context.informal) {
			return false;
		}
		
		// Non-Vietnamese characters: invalid
		let nonViet = "A-EGHIK-VXY\u0110";
		if (this.context.informal) nonViet += "FZ";
		if (new RegExp("[^" + nonViet + "]").test(uw2)) return true;
		
		// Final consonants with ` ? ~ tones: invalid
		if (this.method.FRX.indexOf(uk) >= 0 && /[CPT]$|CH$/.test(uw)) {
			return true;
		}
		
		// Initial non-Vietnamese consonants: invalid
		if (this.context.informal) {
			if (/^Z|[^D]Z/.test(uw)) return true;
		}
		else if (uw.indexOf("F") >= 0 || uw.indexOf("Z") >= 0) return true;
		
		// Incompatible vowels following certain consonants, partly thanks to
		// Mudim issue #16: invalid
		if (/^(?:C[IEY]|CUY|CO[AE]|G[EY]|NG[IEY]|NGH[AOUY]|Q[^U]|QU[^AEIOY])/
			.test(uw2)) { // CHY|K[AOU]|P[^H]|TRY|[NRX]Y|[NPT]HY
			return true;
		}
		if (uw2 === "QU" && (this.method.DAWEO || this.method.SFJRX)) {
			return true;
		}
		
		// Non-Vietnamese diphthongs and triphthongs: invalid
		let vowRe = /A[AE]|E[AEIY]|EU[AEIOUY]|I[IY]|^IO|[^G]IO|OOO|^OU|[^U]OU|UU.|Y[AIOY]/;
		if (vowRe.test(uw2)) return true;
		
		// Remove initial consonants.
		
		// Initial digraphs and trigraphs: valid
		let consRe = vDConsonant + "|[" + vSConsonant + "]";
		let cons = new RegExp("^(?:" + consRe + ")").exec(tw);
		if (cons && cons[0]) tw = tw.substr(cons[0].length);
		twE = tw;
		
		// Remove final consonants.
		
		// Final consonants: valid
		let endCons = /(?:[MPT]|CH?|N[GH]?)$/.exec(tw);
		if (endCons && endCons[0]) {
			tw = tw.substr(0, tw.length - endCons[0].length);
			// NH after incompatible diphthongs and triphthongs: invalid
			if (endCons[0] === "NH") {
				if (/^(?:[\u0102\u00c2\u00d4\u01a0]|I[E\u00ca]|O[\u0102E\u00ca]?|[U\u01af][AO\u01a0]?|UY[E\u00ca])$/.test(tw)) {	// /^(?:[ĂÂÔƠ]|I[EÊ]|O[ĂEÊ]?|[UƯ][AOƠ]?|UY[EÊ])$/
					return true;
				}
				if (uk === this.method.trang && (tw === "A" || tw === "OA")) {
					return true;
				}
			}
			// Disallow DCD etc., but allow words beginning in GI.
			if (!tw && cons && cons[0] !== "GI") return true;
		}
		
		// Extraneous consonants: invalid
		if (tw && new RegExp(consRe).test(tw)) return true;
		
		uw2 = unV2(tw);
		if (uw2 === "IAO") return true;
		
		// Invalid standalone diphthongs and triphthongs: invalid
		if (tw !== twE && /A[IOUY]|IA|IEU|UU|UO[UI]/.test(uw2)) return true;
		
		if (tw !== uw && uw2 === "YEU") return true;
		if (uk === this.method.AEO && /\u01af[AEO\u01a0]$/.test(tw)) return true;	// ưô /Ư[AEOƠ]$/
		
		if (this.method.them.indexOf(uk) >= 0 && !/^.UYE/.test(uw2) &&
			uk !== "E") {
			if (/A[IO]|EO|IA|O[EO]/.test(uw2)) return true;
			
			if (uk === this.method.trang) {
				if (this.method.trang !== "W" && uw2 === "UA") return true;
			}
			else if (uw2 === "OA") return true;
			
			if (uk === this.method.moc && /^(?:[EI]U|UE|UYE?)$/.test(uw2)) {
				return true;
			}
			if (uk === this.method.moc || uk === this.method.trang) {
				if (uw2 === "AU" || uw2 === "AY") return true;
			}
		}
		this.tw5 = tw;
		
		// Catch-all for words with too many interior letters
		return uw2.length > 3;
	},
	
	/**
	 * Retrieves the current text contents and cursor position.
	 * 
	 * @returns {array}	A tuple containing the word ending at the cursor
	 * 					position and the cursor position.
	 */
	mozGetText: function () {
		let pos = this.startLength;
		if (pos < 0) return false;
		
		let w = this.value.substring(0, pos);
		if (w.substr(-1) === "\\" && this.methodIsVIQR()) return ["\\", pos];
		return [w, pos];
	},
	
	start: function () {
		let method = this.context.method, dockspell = this.context.ckSpell;
		let uniA = [];
		this.D2 = "";
		
		if (method === 1 || (method === 0 && this.context.autoMethods.telex)) {
			uniA.push("DAEOWW".split("")); this.D2 += "DAWEO";
		}
		if (method === 2 || (method === 0 && this.context.autoMethods.vni)) {
			uniA.push("966678".split("")); this.D2 += "6789";
		}
		if (method === 3 || (method === 0 && this.context.autoMethods.viqr)) {
			uniA.push("D^^^+(".split("")); this.D2 += "D^+(";
		}
		if (method === 4 || (method === 0 && this.context.autoMethods.viqrStar)) {
			uniA.push("D^^^*(".split("")); this.D2 += "D^*(";
		}
		
		let w = this.mozGetText();
		if (!w) return;
		//dump(">>> start() -- w: <" + w + ">\n");								// debug
		let key = "";
		const backspace = Ci.nsIDOMKeyEvent.DOM_VK_BACK_SPACE;
		if (!this.context.keyCode || this.context.keyCode !== backspace ||
			!this.context.shiftKey) {
			key = fcc(this.context.which);
		}
		
		let noNormC = this.D2.indexOf(up(key)) >= 0;
		
		for (let i = 0; i < uniA.length; i++) {
			if (!dockspell) w = this.mozGetText();
			if (!w || this.changed) break;
			this.main(w[0], key, w[1], uniA[i], noNormC);
			w = this.mozGetText();
			if (w) this.convertCustomChars(w[0], key, w[1]);
		}
		
		if (this.D2.indexOf(up(key)) >= 0) {
			w = this.mozGetText();
			if (w) this.normC(w[0], key, w[1]);
		}
	},
	
	/**
	 * Performs simple substitutions that were not originally part of AVIM's
	 * feature set.
	 *
	 * @param word	{string}	The part of the word up to the caret.
	 * @param key	{string}	A single-character string representing the
	 * 							pressed key.
	 * @param pos	{number}	Index of the caret.
	 */
	convertCustomChars: function (word, key, pos) {
		let uw = up(word), uk = up(key);
		
		if (/^[0-9]+.$/.test(word) || word === "\u20ab") {	// ₫
			let lastChar = word.substr(-1);
			if (lastChar === "\u0111" /* đ */ && uk === this.method.D) {
				// Convert [number]đ (case-sensitive) into the đồng sign.
				this.splice(pos - 1, 1, "\u20ab");	// ₫
				this.changed = true;
			}
			else if (lastChar === "\u20ab" /* ₫ */ && uk === this.method.D) {
				// On repeat, pull the underline out from under the Đ.
				this.splice(pos - 1, 1, "d" + key);
				this.changed = true;
			}
			else if (lastChar === "\u20ab" /* ₫ */ && uk === this.method.Z) {
				// On remove, revert to a D.
				this.splice(pos - 1, 1, "d");
				this.changed = true;
			}
			return;
		}
		
		if (this.context.informal || !this.context.ckSpell) {
			if (uw === "NG" && uk === this.method.X) {
				// Convert NG to use a combining diacritic.
				this.splice(pos, 0, "\u0303");
				this.changed = true;
			}
			else if (uw === "NG\u0303" && uk === this.method.X) {
				// On repeat, pull the tilde out.
				this.splice(pos - 1, 1, key);
				this.changed = true;
			}
			else if (uw === "NG\u0303" && uk === this.method.Z) {
				// On remove, revert to a G.
				this.splice(pos - 1, 1, "");
				this.changed = true;
			}
		}
	},
	
	/**
	 * @param w	{string}	The word ending at the cursor position.
	 * @param k	{string}	The character equivalent of the pressed key.
	 */
	findC: function (w, k, sf) {
		if (this.methodIsVIQR() && w.substr(-1) === "\\") {
			return [1, k.charCodeAt(0)];
		}
		let str = "", res, cc = "", pc = "", vowA = [], s = upperLower("\u00c2\u0102\u00ca\u00d4\u01a0\u01af"), c = 0, uw = up(w), tv;	// ÂĂÊÔƠƯ
		let uc;
		for (let g = 0; g < sf.length; g++) {
			str += nan(sf[g]) ? sf[g] : fcc(sf[g]);
		}
		let uk = up(k), w2 = up(unV2(this.unV(w))), dont = ["\u01afA" /* ƯA */, "\u01afU" /* ƯU */];
		
		if (this.method.DAWEO.indexOf(uk) >= 0) {
			// Horned diphthongs and triphthongs
			if (uk === this.method.moc) {
				if (w2.indexOf("UU") >= 0 && this.tw5 !== dont[1]) {
					if (w2.substr(-2) !== "UU") return false;
					res = 2;
				}
				else if (w2.indexOf("UOU") >= 0) {
					if (w2.substr(-3) !== "UOU") return false;
					res = 2;
				}
			}
			
			if (!res) {
				for (let g = 1; g <= w.length; g++) {
					cc = w.substr(-g, 1);
					pc = up(w.substr(-g - 1, 1));
					uc = up(cc);
					if (this.tw5 === this.unV(pc + uc) &&
						dont.indexOf(this.tw5) >= 0) {
						continue;
					}
					if (str.indexOf(uc) >= 0) {
						if ((uk === this.method.moc && this.unV(uc) === "U" && up(this.unV(w.substr(-g + 1, 1))) === "A") ||
							(uk === this.method.trang && this.unV(uc) === "A" && this.unV(pc) === "U")) {
							tv = 1 + (this.unV(uc) !== "U");
							let ccc = up(w.substr(-g - tv, 1));
							if (ccc !== "Q") {
								res = g + tv - 1;
							} else if (uk === this.method.trang) {
								res = g;
							} else if (this.method.moc !== this.method.trang) {
								return false;
							}
						} else {
							res = g;
						}
						if (!this.whit || uw.indexOf("\u01af" /* Ư */) < 0 || uw.indexOf("W") < 0) {
							break;
						}
					} else if (DAWEOFA.indexOf(uc) >= 0) {
						if (uk === this.method.D) {
							if (cc === "\u0111") {	// đ
								res = [g, "d"];
							} else if (cc === "\u0110") {	// Đ
								res = [g, "D"];
							}
						} else {
							res = this.DAWEOF(cc, uk, g);
						}
						if (res) break;
					}
				}
			}
		}
		
		let tE = "";
		if (uk !== this.method.Z && this.method.DAWEO.indexOf(uk) < 0) {
			tE = this.retKC(uk, true);
		}
		if (this.method.DAWEO.indexOf(uk) < 0) {
			for (let g = 1; g <= w.length; g++) {
				cc = up(w.substr(-g, 1));
				pc = up(w.substr(-g - 1, 1));
				if (str.indexOf(cc) >= 0) {
					if (cc === "U") {
						if (pc !== "Q") {
							c++;
							vowA.push(g);
						}
					} else if (cc === "I") {
						if (pc !== "G" || c <= 0) {
							c++;
							vowA.push(g);
						}
					} else {
						c++;
						vowA.push(g);
					}
				}
				else if (uk !== this.method.Z) {
					let h = this.repSign(k).indexOf(w.charCodeAt(w.length - g));
					if (h >= 0) {
						if (this.ckspell(w, k)) return false;
						return [g, tE.charCodeAt(h % 24)];
					}
					for (h = 0; h < tE.length; h++) {
						if (tE.charCodeAt(h) === w.charCodeAt(w.length - g)) {
							return [g, skey_str[h]];
						}
					}
				}
			}
		}
		if (uk !== this.method.Z && typeof res !== "object" &&
			this.ckspell(w, k)) {
			return false;
		}
		if (this.method.DAWEO.indexOf(uk) < 0) {
			for (let g = 1; g <= w.length; g++) {
				if (uk !== this.method.Z && s.indexOf(w.substr(-g, 1)) >= 0) {
					return g;
				}
				if (tE.indexOf(w.substr(-g, 1)) >= 0) {
					let pos = tE.indexOf(w.substr(-g, 1));
					if (pos >= 0) return [g, skey_str[pos]];
				}
			}
		}
		if (res) return res;
		if (c === 1 || uk === this.method.Z) return vowA.length && vowA[0];
		else if (c === 2) {
			let upW = up(w);
			if (!this.context.oldAccent && /(?:UY|O[AE]) ?$/.test(upW)) {
				return vowA[0];
			}
			// Count final consonants.
			let cons = upW.match(/[BCDĐGHKLMNPQRSTVX]+$/);
			if (cons) {
				// Group digraphs and trigraphs.
				cons = cons[0]
					   .match(/NGH?|[CGKNPT]H|GI|QU|TR|[BCDĐGHKLMNPQRSTVX]/g);
				if (cons && cons.length < 3) return vowA[0];
			}
			return vowA[1];
		}
		else if (c === 3) return vowA[1];
		return false;
	},
	
	/**
	 * Replaces the character or characters at the given position with the given
	 * replacement character code.
	 * 
	 * @param pos	{string}	The position to start replacing from.
	 * @param c		{number}	The codepoint of the character to replace with.
	 */
	replaceChar: function (pos, c) {
		let val = this.value;
		//dump("AVIM.replaceChar -- pos: " + pos + "; original: " + val[pos] + "; repl: " + fcc(c) + "\n");	// debug
		let bb = false;
		let replaceBy;
		let wfix;
		if (!nan(c)) {
			replaceBy = fcc(c);
			wfix = up(this.unV(fcc(c)));
			this.changed = true;
		} else {
			replaceBy = c;
			if (up(c) === "O" && this.whit) {
				bb = true;
			}
		}
		let r;
		if (up(val.substr(pos - 1, 1)) === "U" && pos < this.startLength - 1 && up(val.substr(pos - 2, 1)) !== "Q") {
			if (wfix === "\u01a0" /* Ơ */ || bb) {
				r = (val.substr(pos - 1, 1) === "u") ? "\u01b0" /* ư */ : "\u01af" /* Ư */;
			}
			if (bb) {
				this.changed = true;
				replaceBy = (c === "o") ? "\u01a1" /* ơ */ : "\u01a0" /* Ơ */;
			}
		}
		if (r) {
			replaceBy = r + replaceBy;
			pos--;
		}
		this.splice(pos, 1 + !!r, replaceBy);
		this.whit = false;
	},
	
	/**
	 * @param w	{string}	The word ending at the cursor position.
	 * @param k	{string}	The character equivalent of the pressed key.
	 */
	tr: function (k, w, by, sf, i) {
		let pos = this.findC(w, k, sf);
		if (!pos) return false;
		if (pos[1]) return this.replaceChar(i - pos[0], pos[1]);
		let pC = w.substr(-pos, 1);
		for (let g = 0; g < sf.length; g++) {
			let cmp = nan(sf[g]) ? pC : pC.charCodeAt(0);
			if (cmp === sf[g]) {
				let c = nan(by[g]) ? by[g].charCodeAt(0) : by[g];
				return this.replaceChar(i - pos, c);
			}
		}
		return false;
	},
	
	/**
	 * @param w	{string}	The word ending at the cursor position.
	 * @param k	{string}	The character equivalent of the pressed key, or the
	 * 						empty string for diacritic removal.
	 */
	main: function (w, k, i, a, noNormC) {
		let uk = up(k), got = false, t = intersperseLowerUpper("daaoueo");
		let by = [], sf = [], method = this.context.method, h;
		if (method === 0) {
			if (a[0] === "9") method = 2;
			else if (a.length > 3 && a[4] === "+") method = 3;
			else if (a.length > 3 && a[4] === "*") method = 4;
			else if (a[0] === "D") method = 1;
		}
		this.method = [
			null,
			methods.telex,
			methods.vni,
			methods.viqr,
			methods.viqrStar,
		][method];
		
		// Diacritic removal
		if (k === "") {
			k = this.method.Z;
			uk = up(k);
		}
		
		if (this.method.SFJRX.indexOf(uk) >= 0) {
			this.sr(w,k,i);
			got = true;
		}
		else if (uk === this.method.Z) {
			sf = this.repSign(null);
			for (h = 0; h < english.length; h++) {
				sf.push(lowen.charCodeAt(h), english.charCodeAt(h));
			}
			by = skey.concat(skey, skey, skey, skey, t);
			got = true;
		}
		else for (h = 0; h < a.length; h++) {
			if (a[h] === uk) {
				got = true;
				by = by.concat(bya[h]);
				sf = sf.concat(sfa[h]);
			}
		}
		if (uk === this.method.moc) this.whit = true;
		if (got) return this.DAWEOZ(k, w, by, sf, i, uk);
		if (noNormC) return "";
		return this.normC(w, k, i);
	},
	
	DAWEOZ: function (k, w, by, sf, i, uk) {
		if (this.method.DAWEO.indexOf(uk) < 0 &&
			this.method.Z.indexOf(uk) < 0) {
			return false;
		}
		return this.tr(k, w, by, sf, i);
	},
	
	/**
	 * @param w	{string}	The word ending at the cursor position.
	 * @param k	{string}	The character equivalent of the pressed key, or the
	 * 						empty string for diacritic removal.
	 */
	normC: function (w, k, i) {
		if (k === "") k = this.method.Z;
		if (k[0] === " ") return "";
		let uk = up(k);
		if (alphabet.indexOf(uk) < 0 && this.D2.indexOf(uk) < 0) return w;
		let u = this.repSign(null);
		for (let j = 1; j <= w.length; j++) {
			let h = u.indexOf(w.charCodeAt(w.length - j));
			if (h < 0) continue;
			
			let fS = this.method.X;
			if (h <= 23) fS = this.method.S;
			else if (h <= 47) fS = this.method.F;
			else if (h <= 71) fS = this.method.J;
			else if (h <= 95) fS = this.method.R;
			
			let c = skey[h % 24];
			let sp = this.startLength;
			let end = this.startLength;
			let pos = sp;
			w = this.unV(w);
			if (!this.changed) {
				w += k;
				pos += k.length;
//				this.value = this.value.substr(0, sp) + k +
//					this.value.substr(this.startLength);
				this.splice(sp, end - sp, k);
				this.changed = true;
			}
			
			if (!this.ckspell(w, fS)) {
				this.replaceChar(i - j, c);
				this.main(w, fS, pos, [this.method.D], false);
			}
		}
		return "";
	},
	
	DAWEOF: function (cc, k, g) {
		let kA = [this.method.A, this.method.moc, this.method.trang,
				  this.method.E, this.method.O];
		for (let i = 0; i < kA.length; i++) {
			if (k !== kA[i]) continue;
			
			let posCC = ccA[i].indexOf(cc);
			if (posCC < 0) continue;
			
			let repl = ccrA[i][posCC];
			return repl ? [g, repl] : false;
		}
		return false;
	},
	
	/**
	 * Returns an array of characters corresponding to the following characters
	 * with the given dead key applied:
	 * 	a â ă e ê i o ô ơ u ư y A Â Ă E Ê I O Ô Ơ U Ư Y
	 *
	 * @param k			{string}	The dead key to apply to each character.
	 * @param giveChars	{string}	True if the characters themselves should be
	 * 								returned; false if they should be converted
	 * 								to character codes.
	 * @returns {string}	A string of accented characters.
	 * 			{object}	An array of character codes.
	 */
	retKC: function (k, giveChars) {
		let chars = "";
		switch (k) {
			case this.method.S: chars = lowerUpper("\u00e1\u1ea5\u1eaf\u00e9\u1ebf\u00ed\u00f3\u1ed1\u1edb\u00fa\u1ee9\u00fd"); break;	// áấắéếíóốớúứý
			case this.method.F: chars = lowerUpper("\u00e0\u1ea7\u1eb1\u00e8\u1ec1\u00ec\u00f2\u1ed3\u1edd\u00f9\u1eeb\u1ef3"); break;	// àầằèềìòồờùừỳ
			case this.method.J: chars = lowerUpper("\u1ea1\u1ead\u1eb7\u1eb9\u1ec7\u1ecb\u1ecd\u1ed9\u1ee3\u1ee5\u1ef1\u1ef5"); break;	// ạậặẹệịọộợụựỵ
			case this.method.R: chars = lowerUpper("\u1ea3\u1ea9\u1eb3\u1ebb\u1ec3\u1ec9\u1ecf\u1ed5\u1edf\u1ee7\u1eed\u1ef7"); break;	// ảẩẳẻểỉỏổởủửỷ
			case this.method.X: chars = lowerUpper("\u00e3\u1eab\u1eb5\u1ebd\u1ec5\u0129\u00f5\u1ed7\u1ee1\u0169\u1eef\u1ef9");	// ãẫẵẽễĩõỗỡũữỹ
		}
		return giveChars ? chars : codesFromChars(chars);
	},
	
	/**
	 * Returns the given word with tone marks removed.
	 *
	 * @param w	{string}	The word with tone marks.
	 * @returns {string}	The word without tone marks.
	 */
	unV: function (w) {
		let u = this.repSign(null);
		let unW = "";
		for (let a = w.length - 1; a >= 0; a--) {
			let pos = u.indexOf(w.charCodeAt(a));
			if (pos >= 0) unW = skey_str[pos % 24] + unW;
			else unW = w[a] + unW;
		}
		return unW;
	},
	
	repSign: function (k) {
		let u = [];
		for (let a = 0; a < 5; a++) {
			if (!k || this.method.SFJRX[a] !== up(k)) {
				u = u.concat(this.retKC(this.method.SFJRX[a]));
			}
		}
		return u;
	},
	
	/**
	 * @param w	{string}	The word ending at the cursor position.
	 * @param k	{string}	The character equivalent of the pressed key.
	 */
	sr: function (w, k, i) {
		let pos = this.findC(w, k, skey_str);
		if (!pos) return;
		if (pos[1]) this.replaceChar(i - pos[0], pos[1]);
		else this.replaceChar(i - pos, this.retUni(w, k, pos));
	},
	
	/**
	 * @param w	{string}	The word ending at the cursor position.
	 * @param k	{string}	The character equivalent of the pressed key.
	 */
	retUni: function (w, k, pos) {
		let uC, lC;
		let idx = skey_str.indexOf(w.substr(-pos, 1));
		if (idx < 0) return false;
		if (idx < 12) {
			lC = idx; uC = idx + 12;
		}
		else {
			lC = idx - 12; uC = idx;
		}
		let t = w.substr(-pos, 1);
		let u = this.retKC(up(k));
		if (t !== up(t)) return u[lC];
		return u[uC];
	},
};

return _Transformation;

})();

/**
 * @class AVIMTransformerService
 *
 * Business logic for transforming strings in ways specific to the Vietnamese
 * language.
 *
 * @base nsISupports
 */
function AVIMTransformerService() {
	this.wrappedJSObject = this;
}

AVIMTransformerService.prototype = {
	QueryInterface: function (iid) {
		if (iid.equals(Ci.nsISupports)) return this;
		throw Components.results.NS_ERROR_NO_INTERFACE;
	},
	
	/**
	 * Applies the information in the context object to a prefix string. The
	 * context should include relevant preferences from AVIMConfig, as well as
	 * KeyEvent.charCode, KeyEvent.which, and KeyEvent.shiftKey.
	 */
	applyKey: function (prefix, context) {
		let result = {
			oldValue: prefix,
		};
		if (!prefix) return result;
		
		let xform = new Transformation(prefix, context);
		try {
			xform.start();
			result.value = xform.value;
			result.changed = xform.changed;
		}
		catch(exc) {
// $if{Debug}
			// Log an error to the Browser Console.
			Cu.reportError(exc);
// $endif{}
		}
		finally {
			xform = null;
			return result;
		}
	},
};

// Factory
let AVIMTransformerServiceFactory = {
	singleton: null,
	createInstance: function (outer, iid) {
		if (outer) throw Components.results.NS_ERROR_NO_AGGREGATION;
		if (!this.singleton) this.singleton = new AVIMTransformerService();
		return this.singleton.QueryInterface(iid);
	},
};

let AVIMTransformerServiceModule = {
	registerSelf: function (compMgr, fileSpec, location, type) {
		compMgr = compMgr.QueryInterface(Ci.nsIComponentRegistrar);
		compMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME, CONTRACT_ID,
										fileSpec, location, type);
	},
	
	unregisterSelf: function (compMgr, location, type) {
		compMgr = compMgr.QueryInterface(Ci.nsIComponentRegistrar);
		compMgr.unregisterFactoryLocation(CLASS_ID, location);        
	},
	
	getClassObject: function (compMgr, cid, iid) {
		if (!iid.equals(Components.interfaces.nsIFactory)) {
			throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
		}
	  
		if (cid.equals(CLASS_ID)) return AVIMTransformerServiceFactory;
	  
		throw Components.results.NS_ERROR_NO_INTERFACE;
	},
	
	canUnload: function (compMgr) {
		return true;
	},
};

function NSGetModule(compMgr, fileSpec) {
	return AVIMTransformerServiceModule;
}

function NSGetFactory(cid) {
	let cidStr = cid.toString();
/* jshint -W116 */
	if (cidStr == CLASS_ID) return AVIMTransformerServiceFactory;
/* jshint +W116 */
	throw Components.results.NS_ERROR_FACTORY_NOT_REGISTERED;
}
