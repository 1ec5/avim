"use strict";

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

// { 0x4A373444, 0x8A2A, 0x4641, \
// 		{ 0xAD, 0xD5, 0x89, 0x7A, 0x88, 0xD0, 0x51, 0x85 }
const CLASS_ID = Components.ID("{4A373444-8A2A-4641-ADD5-897A88D05185}");
const CLASS_NAME = "AVIM text transformer service";
const CONTRACT_ID = "@1ec5.org/avim/transformer;1";

function Transformation(startValue, context) {
	this.context = context;
	this.startValue = this.value = startValue;
	this.selectionStart = this.selectionEnd = this.value.length;
	this.setSelectionRange = function (start, end) {
		this.selectionStart = start;
		this.selectionEnd = end;
	};
	
	function nan(w) {
		return isNaN(w) || w == 'e';
	}
	
	let codesFromChars = function (chars) {
		let codes = [];
		for (let i = 0; i < chars.length; i++) {
			codes.push(chars[i].charCodeAt(0));
		}
		return codes;
	}
	
	/**
	 * Returns whether VIQR or VIQR* is the current input method, taking into
	 * account whether they are enabled for Auto.
	 *
	 * @returns {bool}	True if VIQR or VIQR* is the current input method.
	 */
	function methodIsVIQR() {
		if (context.method > 2) return true;
		return context.method == 0 && (context.autoMethods.viqr ||
									   context.autoMethods.viqrStar);
	}
	
	function lowerUpper(chars) {
		return (chars.toLowerCase() + chars.toUpperCase());
	}
	
	function upperLower(chars) {
		return (chars.toUpperCase() + chars.toLowerCase());
	}
	
	function intersperseLowerUpper(chars) {
		let arr = [];
		for (let i = 0; i < chars.length; i++) {
			arr.push(chars[i].toLowerCase(), chars[i].toUpperCase());
		}
		return arr;
	}
	
	const alphabet = "QWERTYUIOPASDFGHJKLZXCVBNM ";
	const skey_str = lowerUpper("a\u00e2\u0103e\u00eaio\u00f4\u01a1u\u01b0y").split("");	// aâăeêioôơuưy
	const skey2 = lowerUpper("aaaeeiooouuy").split("");
	const skey = codesFromChars(skey_str);
	const db1 = [0x0111 /* "đ" */, 0x0110 /* "Đ" */];
	const ds1 = ['d','D'];
	const os1 = intersperseLowerUpper("o\u01a1\u00f3\u00f2\u1ecd\u1ecf\u00f5\u1edb\u1edd\u1ee3\u1edf\u1ee1");	// oơóòọỏõớờợởỡ
	const ob1 = intersperseLowerUpper("\u00f4\u00f4\u1ed1\u1ed3\u1ed9\u1ed5\u1ed7\u1ed1\u1ed3\u1ed9\u1ed5\u1ed7");	// ôôốồộổỗốồộổỗ
	const mocs1 = intersperseLowerUpper("o\u00f4u\u00f3\u00f2\u1ecd\u1ecf\u00f5\u00fa\u00f9\u1ee5\u1ee7\u0169\u1ed1\u1ed3\u1ed9\u1ed5\u1ed7");	// oôuóòọỏõúùụủũốồộổỗ
	const mocb1 = intersperseLowerUpper("\u01a1\u01a1\u01b0\u1edb\u1edd\u1ee3\u1edf\u1ee1\u1ee9\u1eeb\u1ef1\u1eed\u1eef\u1edb\u1edd\u1ee3\u1edf\u1ee1");	// ơơướờợởỡứừựửữớờợởỡ
	const trangs1 = intersperseLowerUpper("a\u00e2\u00e1\u00e0\u1ea1\u1ea3\u00e3\u1ea5\u1ea7\u1ead\u1ea9\u1eab");	// aâáàạảãấầậẩẫ
	const trangb1 = intersperseLowerUpper("\u0103\u0103\u1eaf\u1eb1\u1eb7\u1eb3\u1eb5\u1eaf\u1eb1\u1eb7\u1eb3\u1eb5");	// ăăắằặẳẵắằặẳẵ
	const as1 = intersperseLowerUpper("a\u0103\u00e1\u00e0\u1ea1\u1ea3\u00e3\u1eaf\u1eb1\u1eb7\u1eb3\u1eb5\u1ebf\u1ec1\u1ec7\u1ec3\u1ec5");	// aăáàạảãắằặẳẵếềệểễ
	const ab1 = intersperseLowerUpper("\u00e2\u00e2\u1ea5\u1ea7\u1ead\u1ea9\u1eab\u1ea5\u1ea7\u1ead\u1ea9\u1eab\u00e9\u00e8\u1eb9\u1ebb\u1ebd");	// ââấầậẩẫấầậẩẫéèẹẻẽ
	const es1 = intersperseLowerUpper("e\u00e9\u00e8\u1eb9\u1ebb\u1ebd");	// eéèẹẻẽ
	const eb1 = intersperseLowerUpper("\u00ea\u1ebf\u1ec1\u1ec7\u1ec3\u1ec5");	// êếềệểễ
	const english = "\u0110\u00c2\u0102\u01a0\u01af\u00ca\u00d4";	// ĐÂĂƠƯÊÔ
	const lowen = english.toLowerCase();
	const arA = lowerUpper("\u00e1\u00e0\u1ea3\u00e3\u1ea1a").split("");	// áàảãạa
	const mocrA = lowerUpper("\u00f3\u00f2\u1ecf\u00f5\u1ecdo\u00fa\u00f9\u1ee7\u0169\u1ee5u").split("");	// óòỏõọoúùủũụu
	const erA = lowerUpper("\u00e9\u00e8\u1ebb\u1ebd\u1eb9e").split("");	// éèẻẽẹe
	const orA = lowerUpper("\u00f3\u00f2\u1ecf\u00f5\u1ecdo").split("");	// óòỏõọo
	const aA = lowerUpper("\u1ea5\u1ea7\u1ea9\u1eab\u1ead\u00e2").split("");	// ấầẩẫậâ
	const oA = lowerUpper("\u1ed1\u1ed3\u1ed5\u1ed7\u1ed9\u00f4").split("");	// ốồổỗộô
	const mocA = lowerUpper("\u1edb\u1edd\u1edf\u1ee1\u1ee3\u01a1\u1ee9\u1eeb\u1eed\u1eef\u1ef1\u01b0").split("");	// ớờởỡợơứừửữựư
	const trangA = lowerUpper("\u1eaf\u1eb1\u1eb3\u1eb5\u1eb7\u0103").split("");	// ắằẳẵặă
	const eA = lowerUpper("\u1ebf\u1ec1\u1ec3\u1ec5\u1ec7\u00ea").split("");	// ếềểễệê
	
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
		}
	};
	
	// Some shortcuts for brevity.
	let fcc = String.fromCharCode;
	let up = String.toUpperCase;
	
	this.changed = false;
	this.specialChange = false;
	this.kl = 0;
	this.range = null;
	this.whit = false;
	
	/**
	 * Returns the string contents of the given textbox, optionally starting and
	 * ending with the given range. If no range is given, the entire string
	 * contents are returned.
	 *
	 * @param el	{object}	The textbox's DOM node.
	 * @param start	{number}	The return value's starting index within the
	 *							entire content string.
	 * @param len	{number}	The length of the substring to return.
	 * @returns {string}	The textbox's string contents.
	 */
	let text = function(el, start, len) {
		let val = el.value;
		if (start) val = val.substr(start);
		if (len) val = val.substr(0, len);
		return val;
	};
	
	/**
	 * Replaces the substring inside the given textbox, starting at an index and
	 * spanning the given number of characters, with the given string.
	 *
	 * @param el	{object}	The textbox's DOM node.
	 * @param index	{number}	The index at which to begin replacing.
	 * @param len	{number}	The number of characters to replace.
	 * @param repl	{string}	The string to insert.
	 * @returns {number}	The distance to the right that the end of the word
	 * 						has shifted.
	 */
	this.splice = function(el, index, len, repl) {
		let val = el.value;
		el.value = val.substr(0, index) + repl + val.substr(index + len);
		return repl.length - len;
	};
	
	/**
	 * Returns the current position of the cursor in the given textbox.
	 *
	 * @param obj	{object}	The DOM element representing the current
	 * 							textbox.
	 * @returns {number}	The current cursor position, or -1 if the cursor
	 * 						cannot be found.
	 */
	this.getCursorPosition = function(obj) {
		let data = text(obj);
		if (!data || !data.length) return -1;
		return obj.selectionStart;
	}
	
	/**
	 * Returns whether the given word, taking into account the given dead key,
	 * is a malformed Vietnamese word.
	 *
	 * @param w	{string}	The word to check.
	 * @param k	{string}	The dead key applied to the word.
	 * @returns {boolean}	True if the word is malformed; false otherwise.
	 */
	this.ckspell = function(w, k) {
		if (!context.ckSpell) return false;
		
		let uk = up(k);
		
		// Đồng sign after a number: valid
		let num = /^([0-9]+)(d?)$/.exec(w);
		let isVni = context.method == 2 ||
			(context.method == 0 && context.autoMethods.vni);
		if (num) {
			// Entering the first D: valid
			if (!num[2] && uk == "D") return false;
			
			// Entering the second D: valid
			if (num[2] && uk == this.method.D) return false;
		}
		
		w = this.unV(w);
		let uw = up(w), tw = uw, uw2 = this.unV2(uw), twE;
		let vSConsonant = "BCD\u0110GHKLMNPQRSTVX";
		let vDConsonant = "[CKNP]H|G[HI]|NGH?|QU|T[HR]";
		if (context.informal) {
			vSConsonant += "F";
			vDConsonant += "|DZ";
		}
		
		// NG~: valid
		if (uw == "NG" && uk == this.method.X && context.informal) {
			return false;
		}
		
		// Non-Vietnamese characters: invalid
		let nonViet = "A-EGHIK-VXY\u0110";
		if (context.informal) nonViet += "FZ";
		if (new RegExp("[^" + nonViet + "]").test(uw2)) return true;
		
		// Final consonants with ` ? ~ tones: invalid
		if (this.method.FRX.indexOf(uk) >= 0 && /[CPT]$|CH$/.test(uw)) {
			return true;
		}
		
		// Initial non-Vietnamese consonants: invalid
		if (context.informal) {
			if (/^Z|[^D]Z/.test(uw)) return true;
		}
		else if (uw.indexOf("F") >= 0 || uw.indexOf("Z") >= 0) return true;
		
		// Incompatible vowels following certain consonants, partly thanks to
		// Mudim issue #16: invalid
		if (/^(?:C[IEY]|CUY|CO[AE]|G[EY]|NG[IEY]|NGH[AOUY]|Q[^U]|QU[^AEIOY])/
			.test(uw2)) { // CHY|K[AOU]|P[^H]|TRY|[NRX]Y|[NPT]HY
			return true;
		}
		if (uw2 == "QU" && (this.method.DAWEO || this.method.SFJRX)) {
			return true;
		}
		
		// Non-Vietnamese diphthongs and triphthongs: invalid
		let vowRe = /A[AE]|E[AEIY]|I[IY]|^IO|[^G]IO|OOO|^OU|[^U]OU|UU.|Y[AIOY]/;
		if (vowRe.test(uw2)) return true;
		
		// Remove initial consonants.
		
		// Initial digraphs and trigraphs: valid
		let consRe = vDConsonant + "|[" + vSConsonant + "]";
		let cons = new RegExp("^(?:" + consRe + ")").exec(tw);
		if (cons && cons[0]) tw = tw.substr(cons[0].length);
		twE=tw;
		
		// Remove final consonants.
		
		// Final consonants: valid
		let endCons = /(?:[MPT]|CH?|N[GH]?)$/.exec(tw);
		if (endCons && endCons[0]) {
			tw = tw.substr(0, tw.length - endCons[0].length);
			// NH after incompatible diphthongs and triphthongs: invalid
			if (endCons[0] == "NH") {
				if (/^(?:[\u0102\u00c2\u00d4\u01a0]|I[E\u00ca]|O[\u0102E\u00ca]?|[U\u01af][AO\u01a0]?|UY[E\u00ca])$/.test(tw)) {	// /^(?:[ĂÂÔƠ]|I[EÊ]|O[ĂEÊ]?|[UƯ][AOƠ]?|UY[EÊ])$/
					return true;
				}
				if (uk == this.method.trang && (tw == "A" || tw == "OA")) {
					return true;
				}
			}
			// Disallow DCD etc., but allow words beginning in GI.
			if (!tw && cons && cons[0] != "GI") return true;
		}
		
		// Extraneous consonants: invalid
		if (tw && new RegExp(consRe).test(tw)) return true;
		
		uw2 = this.unV2(tw);
		if (uw2 == "IAO") return true;
		
		// Invalid standalone diphthongs and triphthongs: invalid
		if (tw != twE && /A[IOUY]|IA|IEU|UU|UO[UI]/.test(uw2)) return true;
		
		if (tw != uw && uw2 == "YEU") return true;
		if (uk == this.method.AEO && /\u01af[AEO\u01a0]$/.test(tw)) return true;	// ưô /Ư[AEOƠ]$/
		
		if (this.method.them.indexOf(uk) >= 0 && !/^.UYE/.test(uw2) &&
			uk != "E") {
			if (/A[IO]|EO|IA|O[EO]/.test(uw2)) return true;
			
			if (uk == this.method.trang) {
				if (this.method.trang != "W" && uw2 == "UA") return true;
			}
			else if (uw2 == "OA") return true;
			
			if (uk == this.method.moc && /^(?:[EI]U|UE|UYE?)$/.test(uw2)) {
				return true;
			}
			if (uk == this.method.moc || uk == this.method.trang) {
				if (uw2 == "AU" || uw2 == "AY") return true;
			}
		}
		this.tw5 = tw;
		
		// Catch-all for words with too many interior letters
		return uw2.length > 3;
	};
	
	/**
	 * Retrieves the relevant state from the given textbox.
	 * 
	 * @param obj		{object}	The DOM element representing the current
	 * 								textbox.
	 * @returns {array}	A tuple containing the word ending at the cursor
	 * 					position and the cursor position.
	 */
	this.mozGetText = function(obj) {
		let pos = this.getCursorPosition(obj);
		if (pos < 0) return false;
		if (obj.selectionStart != obj.selectionEnd) return ["", pos];
		
		let data = text(obj);
		let w = data.substring(0, pos);
		if (w.substr(-1) == "\\" && methodIsVIQR()) return ["\\", pos];
		return [w, pos];
	};
	
	this.start = function() {
		// TODO: Transformation is referencing itself -- leak!
		let obj = this;															// debug
		let method = context.method, dockspell = context.ckSpell;
		this.oc=obj;
		let uniA = [];
		this.D2 = "";
		
		if (method == 1 || (method == 0 && context.autoMethods.telex)) {
			uniA.push("DAEOWW".split("")); this.D2 += "DAWEO";
		}
		if (method == 2 || (method == 0 && context.autoMethods.vni)) {
			uniA.push("966678".split("")); this.D2 += "6789";
		}
		if (method == 3 || (method == 0 && context.autoMethods.viqr)) {
			uniA.push("D^^^+(".split("")); this.D2 += "D^+(";
		}
		if (method == 4 || (method == 0 && context.autoMethods.viqrStar)) {
			uniA.push("D^^^*(".split("")); this.D2 += "D^*(";
		}
		
		let w = this.mozGetText(obj);
		if (!w) return;
		//dump(">>> start() -- w: <" + w + ">\n");								// debug
		let key = "";
		const backspace = Ci.nsIDOMKeyEvent.DOM_VK_BACK_SPACE;
		if (!context.keyCode || context.keyCode != backspace ||
			!context.shiftKey) {
			key = fcc(context.which);
		}
		
		let noNormC = this.D2.indexOf(up(key)) >= 0;
		
		for (let i = 0; i < uniA.length; i++) {
			if (!dockspell) w = this.mozGetText(obj);
			if (!w || this.changed) break;
			this.main(w[0], key, w[1], uniA[i], noNormC);
			w = this.mozGetText(obj);
			if (w) this.convertCustomChars(w[0], key, w[1]);
		}
		
		if (this.D2.indexOf(up(key)) >= 0) {
			w = this.mozGetText(obj);
			if (w) this.normC(w[0], key, w[1]);
		}
	};
	
	/**
	 * Performs simple substitutions that were not originally part of AVIM's
	 * feature set.
	 *
	 * @param word	{string}	The part of the word up to the caret.
	 * @param key	{string}	A single-character string representing the
	 * 							pressed key.
	 * @param pos	{number}	Index of the caret.
	 */
	this.convertCustomChars = function(word, key, pos) {
		let uw = up(word), uk = up(key);
		
		if (/^[0-9]+.$/.test(word)) {
			let lastChar = word.substr(-1);
			if (lastChar == "\u0111" /* đ */ && uk == this.method.D) {
				// Convert [number]đ (case-sensitive) into the đồng sign.
				this.splice(this.oc, pos - 1, 1, "\u20ab");	// ₫
				this.changed = true;
			}
			else if (lastChar == "\u20ab" /* ₫ */ && uk == this.method.D) {
				// On repeat, pull the underline out from under the Đ.
				this.splice(this.oc, pos - 1, 1, "d" + key);
				this.changed = true;
			}
			else if (lastChar == "\u20ab" /* ₫ */ && uk == this.method.Z) {
				// On remove, revert to a D.
				this.splice(this.oc, pos - 1, 1, "d");
				this.changed = true;
			}
			return;
		}
		
		if (context.informal || !context.ckSpell) {
			if (uw == "NG" && uk == this.method.X) {
				// Convert NG to use a combining diacritic.
				this.splice(this.oc, pos, 0, "\u0303");
				this.changed = true;
			}
			else if (uw == "NG\u0303" && uk == this.method.X) {
				// On repeat, pull the tilde out.
				this.splice(this.oc, pos - 1, 1, key);
				this.changed = true;
			}
			else if (uw == "NG\u0303" && uk == this.method.Z) {
				// On remove, revert to a G.
				this.splice(this.oc, pos - 1, 1, "");
				this.changed = true;
			}
		}
	};
	
	const DAWEOFA = up(aA.join() + eA.join() + mocA.join() + trangA.join() +
					   oA.join() + english);
	/**
	 * @param w	{string}	The word ending at the cursor position.
	 * @param k	{string}	The character equivalent of the pressed key.
	 */
	this.findC = function(w, k, sf) {
		let method = context.method;
		if (methodIsVIQR() && w.substr(-1) == "\\") {
			return [1, k.charCodeAt(0)];
		}
		let str = "", res, cc = "", pc = "", vowA = [], s = upperLower("\u00c2\u0102\u00ca\u00d4\u01a0\u01af"), c = 0, dn = false, uw = up(w), tv, g;	// ÂĂÊÔƠƯ
		let h, uc;
		for (let g = 0; g < sf.length; g++) {
			str += nan(sf[g]) ? sf[g] : fcc(sf[g]);
		}
		let uk = up(k), w2 = up(this.unV2(this.unV(w))), dont = ["\u01afA" /* ƯA */, "\u01afU" /* ƯU */];
		
		if (this.method.DAWEO.indexOf(uk) >= 0) {
			// Horned diphthongs and triphthongs
			if (uk == this.method.moc) {
				if (w2.indexOf("UU") >= 0 && this.tw5 && this.tw5 != dont[1]) {
					if (w2.substr(-2) != "UU") return false;
					res = 2;
				}
				else if (w2.indexOf("UOU") >= 0) {
					if (w2.substr(-3) != "UOU") return false;
					res = 2;
				}
			}
			
			if (!res) {
				for (let g = 1; g <= w.length; g++) {
					cc = w.substr(-g, 1);
					pc = up(w.substr(-g - 1, 1));
					uc = up(cc);
					if (this.tw5 && this.tw5 == this.unV(pc + uc) &&
						dont.indexOf(this.tw5) >= 0) {
						continue;
					}
					if (str.indexOf(uc) >= 0) {
						if ((uk == this.method.moc && this.unV(uc) == "U" && up(this.unV(w.substr(-g + 1, 1))) == "A") ||
							(uk == this.method.trang && this.unV(uc) == "A" && this.unV(pc) == "U")) {
							tv = 1 + (this.unV(uc) != "U");
							let ccc = up(w.substr(-g - tv, 1));
							if(ccc != "Q") {
								res = g + tv - 1;
							} else if(uk == this.method.trang) {
								res = g;
							} else if(this.method.moc != this.method.trang) {
								return false;
							}
						} else {
							res = g;
						}
						if(!this.whit || (uw.indexOf("\u01af" /* Ư */) < 0) || (uw.indexOf("W") < 0)) {
							break;
						}
					} else if(DAWEOFA.indexOf(uc) >= 0) {
						if(uk == this.method.D) {
							if(cc == "\u0111") {	// đ
								res = [g, 'd'];
							} else if(cc == "\u0110") {	// Đ
								res = [g, 'D'];
							}
						} else {
							res = this.DAWEOF(cc, uk, g);
						}
						if(res) break;
					}
				}
			}
		}
		
		let tE = "", tEC;
		if (uk != this.method.Z && this.method.DAWEO.indexOf(uk) < 0) {
			tE = this.retKC(uk, true);
		}
		if (this.method.DAWEO.indexOf(uk) < 0) for (let g = 1; g <= w.length; g++) {
			cc = up(w.substr(-g, 1));
			pc = up(w.substr(-g - 1, 1));
			if(str.indexOf(cc) >= 0) {
				if(cc == 'U') {
					if(pc != 'Q') {
						c++;
						vowA.push(g);
					}
				} else if(cc == 'I') {
					if((pc != 'G') || (c <= 0)) {
						c++;
						vowA.push(g);
					}
				} else {
					c++;
					vowA.push(g);
				}
			}
			else if (uk != this.method.Z) {
				let h = this.repSign(k).indexOf(w.charCodeAt(w.length - g));
				if (h >= 0) {
					if (this.ckspell(w, k)) return false;
					return [g, tE.charCodeAt(h % 24)];
				}
				for (let h = 0; h < tE.length; h++) {
					if(tE.charCodeAt(h) == w.charCodeAt(w.length - g)) {
						return [g, skey_str[h]];
					}
				}
			}
		}
		if (uk != this.method.Z && typeof(res) != 'object' &&
			this.ckspell(w, k)) {
			return false;
		}
		if (this.method.DAWEO.indexOf(uk) < 0) {
			for (let g = 1; g <= w.length; g++) {
				if (uk != this.method.Z && s.indexOf(w.substr(-g, 1)) >= 0) {
					return g;
				}
				if (tE.indexOf(w.substr(-g, 1)) >= 0) {
					let pos = tE.indexOf(w.substr(-g, 1));
					if (pos >= 0) return [g, skey_str[pos]];
				}
			}
		}
		if (res) return res;
		if (c == 1 || uk == this.method.Z) return vowA[0];
		else if (c == 2) {
			let upW = up(w);
			if (!context.oldAccent && /(?:UY|O[AE]) ?$/.test(upW)) {
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
		else if (c == 3) return vowA[1];
		return false;
	};
	
	/**
	 * Replaces the character or characters at the given position with the given
	 * replacement character code.
	 * 
	 * @param o		{object}	The DOM element representing the current
	 * 							textbox.
	 * @param pos	{string}	The position to start replacing from.
	 * @param c		{number}	The codepoint of the character to replace with.
	 */
	this.replaceChar = function(o, pos, c) {
		//dump("AVIM.replaceChar -- pos: " + pos + "; original: " + text(o, pos, 1) + "; repl: " + fcc(c) + "\n");	// debug
		let bb = false;
		let replaceBy;
		let wfix;
		if(!nan(c)) {
			replaceBy = fcc(c), wfix = up(this.unV(fcc(c)));
			this.changed = true;
		} else {
			replaceBy = c;
			if((up(c) == "O") && this.whit) {
				bb=true;
			}
		}
		let savePos = o.selectionStart, sst = o.scrollTop, r;
		if (up(text(o, pos - 1, 1)) == 'U' && pos < savePos - 1 && up(text(o, pos - 2, 1)) != 'Q') {
			if (wfix == "\u01a0" /* Ơ */ || bb) {
				r = (text(o, pos - 1, 1) == 'u') ? "\u01b0" /* ư */ : "\u01af" /* Ư */;
			}
			if (bb) {
				this.changed = true;
				replaceBy = (c == "o") ? "\u01a1" /* ơ */ : "\u01a0" /* Ơ */;
			}
		}
		if (r) {
			replaceBy = r + replaceBy;
			pos--;
		}
		this.splice(o, pos, 1 + !!r, replaceBy);
		o.setSelectionRange(savePos, savePos);
		o.scrollTop = sst;
		this.whit = false;
	};
	
	/**
	 * @param w	{string}	The word ending at the cursor position.
	 * @param k	{string}	The character equivalent of the pressed key.
	 */
	this.tr = function(k, w, by, sf, i) {
		let pos = this.findC(w, k, sf);
		if (!pos) return false;
		if (pos[1]) return this.replaceChar(this.oc, i - pos[0], pos[1]);
		let pC = w.substr(-pos, 1);
		for (let g = 0; g < sf.length; g++) {
			let cmp = nan(sf[g]) ? pC : pC.charCodeAt(0);
			if (cmp == sf[g]) {
				let c = nan(by[g]) ? by[g].charCodeAt(0) : by[g];
				return this.replaceChar(this.oc, i - pos, c);
			}
		}
		return false;
	};
	
	const bya = [db1, ab1, eb1, ob1, mocb1, trangb1];
	const sfa = [ds1, as1, es1, os1, mocs1, trangs1];
	/**
	 * @param w	{string}	The word ending at the cursor position.
	 * @param k	{string}	The character equivalent of the pressed key, or the
	 * 						empty string for diacritic removal.
	 */
	this.main = function(w, k, i, a, noNormC) {
		let uk = up(k), got = false, t = intersperseLowerUpper("daaoueo");
		let by = [], sf = [], method = context.method, h, g;
		if (method == 0) {
			if (a[0] == "9") method = 2;
			else if (a[4] == "+") method = 3;
			else if (a[4] == "*") method = 4;
			else if (a[0] == "D") method = 1;
		}
		switch (method) {
			case 1: this.method = methods.telex; break;
			case 2: this.method = methods.vni; break;
			case 3: this.method = methods.viqr; break;
			case 4: this.method = methods.viqrStar; // break;
		}
		
		// Diacritic removal
		if (k == "") {
			k = this.method.Z;
			uk = up(k);
		}
		
		if (this.method.SFJRX.indexOf(uk) >= 0) {
			this.sr(w,k,i);
			got=true;
		}
		else if (uk == this.method.Z) {
			sf = this.repSign(null);
			for(h = 0; h < english.length; h++) {
				sf.push(lowen.charCodeAt(h), english.charCodeAt(h));
			}
			by = skey.concat(skey, skey, skey, skey, t);
			got = true;
		}
		else for (h = 0; h < a.length; h++) {
			if (a[h] == uk) {
				got = true;
				by = by.concat(bya[h]);
				sf = sf.concat(sfa[h]);
			}
		}
		if (uk == this.method.moc) this.whit = true;
		if (got) return this.DAWEOZ(k, w, by, sf, i, uk);
		if (noNormC) return "";
		return this.normC(w, k, i);
	};
	
	this.DAWEOZ = function(k, w, by, sf, i, uk) {
		if (this.method.DAWEO.indexOf(uk) < 0 &&
			this.method.Z.indexOf(uk) < 0) {
			return false;
		}
		return this.tr(k, w, by, sf, i);
	};
	
	/**
	 * @param w	{string}	The word ending at the cursor position.
	 * @param k	{string}	The character equivalent of the pressed key, or the
	 * 						empty string for diacritic removal.
	 */
	this.normC = function(w, k, i) {
		if (k == "") k = this.method.Z;
		if (k[0] == " ") return "";
		let uk = up(k);
		if (alphabet.indexOf(uk) < 0 && this.D2.indexOf(uk) < 0) return w;
		let u = this.repSign(null);
		for(let j = 1; j <= w.length; j++) {
			let h = u.indexOf(w.charCodeAt(w.length - j));
			if (h < 0) continue;
			
			let fS = this.method.X;
			if (h <= 23) fS = this.method.S;
			else if (h <= 47) fS = this.method.F;
			else if (h <= 71) fS = this.method.J;
			else if (h <= 95) fS = this.method.R;
			
			let c = skey[h % 24];
			let sp = this.oc.selectionStart;
			let end = this.oc.selectionEnd;
			let pos = sp;
			w = this.unV(w);
			if(!this.changed) {
				w += k;
				let sst = this.oc.scrollTop;
				pos += k.length;
//				this.oc.value = this.oc.value.substr(0, sp) + k +
//					this.oc.value.substr(this.oc.selectionEnd);
				this.splice(this.oc, sp, end - sp, k);
				this.changed = true;
				this.oc.scrollTop = sst;
			}
			
			// Anything else
			else this.oc.setSelectionRange(pos, pos);
			
			if(!this.ckspell(w, fS)) {
				this.replaceChar(this.oc, i - j, c);
				this.main(w, fS, pos, [this.method.D], false);
			}
		}
		return "";
	};
	
	const ccA = [aA, mocA, trangA, eA, oA], ccrA = [arA, mocrA, arA, erA, orA];
	this.DAWEOF = function(cc, k, g) {
		let kA = [this.method.A, this.method.moc, this.method.trang,
				  this.method.E, this.method.O];
		for (let i = 0; i < kA.length; i++) {
			if (k != kA[i]) continue;
			
			let posCC = ccA[i].indexOf(cc);
			if (posCC < 0) continue;
			
			let repl = ccrA[i][posCC];
			return repl ? [g, repl] : false;
		}
		return false;
	};
	
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
	this.retKC = function(k, giveChars) {
		let chars = "";
		switch (k) {
			case this.method.S: chars = lowerUpper("\u00e1\u1ea5\u1eaf\u00e9\u1ebf\u00ed\u00f3\u1ed1\u1edb\u00fa\u1ee9\u00fd"); break;	// áấắéếíóốớúứý
			case this.method.F: chars = lowerUpper("\u00e0\u1ea7\u1eb1\u00e8\u1ec1\u00ec\u00f2\u1ed3\u1edd\u00f9\u1eeb\u1ef3"); break;	// àầằèềìòồờùừỳ
			case this.method.J: chars = lowerUpper("\u1ea1\u1ead\u1eb7\u1eb9\u1ec7\u1ecb\u1ecd\u1ed9\u1ee3\u1ee5\u1ef1\u1ef5"); break;	// ạậặẹệịọộợụựỵ
			case this.method.R: chars = lowerUpper("\u1ea3\u1ea9\u1eb3\u1ebb\u1ec3\u1ec9\u1ecf\u1ed5\u1edf\u1ee7\u1eed\u1ef7"); break;	// ảẩẳẻểỉỏổởủửỷ
			case this.method.X: chars = lowerUpper("\u00e3\u1eab\u1eb5\u1ebd\u1ec5\u0129\u00f5\u1ed7\u1ee1\u0169\u1eef\u1ef9");	// ãẫẵẽễĩõỗỡũữỹ
		}
		return giveChars ? chars : codesFromChars(chars);
	};
	
	/**
	 * Returns the given word with tone marks removed.
	 *
	 * @param w	{string}	The word with tone marks.
	 * @returns {string}	The word without tone marks.
	 */
	this.unV = function(w) {
		let u = this.repSign(null);
		let unW = "";
		for (let a = w.length - 1; a >= 0; a--) {
			let pos = u.indexOf(w.charCodeAt(a));
			if (pos >= 0) unW = skey_str[pos % 24] + unW;
			else unW = w[a] + unW;
		}
		return unW;
	};
	
	/**
	 * Returns the given word with all diacritical marks removed.
	 *
	 * @param w	{string}	The word with diacritical marks.
	 * @returns {string}	The word without diacritical marks.
	 */
	this.unV2 = function(w) {
		let unW = "";
		for (let a = w.length - 1; a >= 0; a--) {
			let pos = skey.indexOf(w.charCodeAt(a));
			if (pos >= 0) unW = skey2[pos] + unW;
			else unW = w[a] + unW;
		}
		return unW;
	};
	
	this.repSign = function(k) {
		let u = [];
		for (let a = 0; a < 5; a++) {
			if (!k || this.method.SFJRX[a] != up(k)) {
				u = u.concat(this.retKC(this.method.SFJRX[a]));
			}
		}
		return u;
	};
	
	/**
	 * @param w	{string}	The word ending at the cursor position.
	 * @param k	{string}	The character equivalent of the pressed key.
	 */
	this.sr = function(w, k, i) {
		let pos = this.findC(w, k, skey_str);
		if (!pos) return;
		if (pos[1]) this.replaceChar(this.oc, i - pos[0], pos[1]);
		else this.replaceChar(this.oc, i - pos, this.retUni(w, k, pos));
	};
	
	/**
	 * @param w	{string}	The word ending at the cursor position.
	 * @param k	{string}	The character equivalent of the pressed key.
	 */
	this.retUni = function(w, k, pos) {
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
		if (t != up(t)) return u[lC];
		return u[uC];
	};
}

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
	
	applyKey: function (prefix, context) {
		let xform = new Transformation(prefix, context);
		try {
			xform.start();
			return {
				value: xform.value,
				changed: xform.changed,
			};
		} catch(exc) {
// $if{Debug}
			Cu.reportError(exc);
			return {};
// $endif{}
		}
	},
}

// Factory
let AVIMTransformerServiceFactory = {
	singleton: null,
	createInstance: function (outer, iid) {
		if (outer) throw Components.results.NS_ERROR_NO_AGGREGATION;
		if (!this.singleton) this.singleton = new AVIMTransformerService();
		return this.singleton.QueryInterface(iid);
	},
};

var AVIMTransformerServiceModule = {
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
	if (cidStr == CLASS_ID) return AVIMTransformerServiceFactory;
	throw Components.results.NS_ERROR_FACTORY_NOT_REGISTERED;
};
