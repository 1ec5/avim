/**
 * Default preferences. Be sure to update defaults/preferences/avim.js to
 * reflect any changes to the default preferences. Initially, this variable
 * should only contain objects whose properties will be modified later on.
 */
var AVIMConfig = {autoMethods: {}, disabledScripts: {}};

function AVIM()	{
	// IDs of user interface elements
	const commandIds = {
		method: "avim-method-cmd",
		prevMethod: "avim-prev-method-cmd",
		nextMethod: "avim-next-method-cmd",
		spell: "avim-spell-cmd",
		oldAccents: "avim-oldaccents-cmd"
	};
	const broadcasterIds = {
		enabled: "avim-enabled-bc",
		methods: ["avim-auto-bc", "avim-telex-bc", "avim-vni-bc",
				  "avim-viqr-bc", "avim-viqr-star-bc"],
		spell: "avim-spell-bc",
		oldAccents: "avim-oldaccents-bc"
	};
	const panelId = "avim-status";
	
	// Local functions that don't require access to AVIM's fields.
	
	var fcc = String.fromCharCode;
	var up = String.toUpperCase;
	
	var codesFromChars = function(chars) {
		var codes = [];
		for (var i = 0; i < chars.length; i++) {
			codes.push(chars[i].charCodeAt(0));
		}
		return codes;
	};
	
	var $ = function (id) {
		return document.getElementById(id);
	};
	
	var nan = function(w) {
		return isNaN(w) || w == 'e';
	};
	
	/**
	 * Returns the nsIEditor (or subclass) instance associated with the given
	 * XUL or HTML element.
	 *
	 * @param el	{object}	The XUL or HTML element.
	 * @returns	{object}	The associated nsIEditor instance.
	 */
	var getEditor = function(el) {
		if (el.editor) return el.editor;
		try {
			const nsee = Components.interfaces.nsIDOMNSEditableElement;
			return el.QueryInterface(nsee).editor;
//				iface = Components.interfaces.nsIPlaintextEditor;
//				editor = editableEl.QueryInterface(iface);
		}
		catch (e) {}
		try {
			const ed = Components.interfaces.nsIEditor;
			return el.QueryInterface(ed).editor;
		}
		catch (e) {}
//		dump("AVIM.keyPressHandler -- couldn't get editor: " + e + "\n");		// debug
		return undefined;
	};
	
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
	var text = function(el, start, len) {
		var val = el.value;
		if (start) val = val.substr(start);
		if (len) val = val.substr(0, len);
		return val;
	};
	
	/**
	 * Replaces the substring inside the given textbox, starting at an index and
	 * spanning the given number of characters, with the given string.
	 *
	 * @param el		{object}	The textbox's DOM node.
	 * @param index		{number}	The index at which to begin replacing.
	 * @param len		{number}	The number of characters to replace.
	 * @param newStr	{string}	The string to insert.
	 */
	var splice = function(el, index, len, newStr) {
//		var editor = getEditor(el);
//		dump("AVIM.splice -- editor: " + editor + "; newStr: " + newStr + "\n");	// debug
//		if (editor && editor.insertText) {
//			var selStart = el.selectionStart;
//			el.setSelectionRange(index, index + len);
//			editor.insertText(newStr);
//			el.setSelectionRange(selStart + newStr.length - len);
//			return;
//		}
		var val = el.value;
		el.value = val.substr(0, index) + newStr + val.substr(index + len);
	};
	
	const alphabet = "QWERTYUIOPASDFGHJKLZXCVBNM ";
	const skey_str = "aâăeêioôơuưyAÂĂEÊIOÔƠUƯY".split("");
	const skey2 = "aaaeeiooouuyAAAEEIOOOUUY".split('');
	const skey = codesFromChars(skey_str);
	const db1 = codesFromChars(["đ", "Đ"]);
	const ds1 = ['d','D'];
	const os1 = "oOơƠóÓòÒọỌỏỎõÕớỚờỜợỢởỞỡỠ".split("");
	const ob1 = "ôÔôÔốỐồỒộỘổỔỗỖốỐồỒộỘổỔỗỖ".split("");
	const mocs1 = "oOôÔuUóÓòÒọỌỏỎõÕúÚùÙụỤủỦũŨốỐồỒộỘổỔỗỖ".split("");
	const mocb1 = "ơƠơƠưƯớỚờỜợỢởỞỡỠứỨừỪựỰửỬữỮớỚờỜợỢởỞỡỠ".split("");
	const trangs1 = "aAâÂáÁàÀạẠảẢãÃấẤầẦậẬẩẨẫẪ".split("");
	const trangb1 = "ăĂăĂắẮằẰặẶẳẲẵẴắẮằẰặẶẳẲẵẴ".split("");
	const as1 = "aAăĂáÁàÀạẠảẢãÃắẮằẰặẶẳẲẵẴếẾềỀệỆểỂễỄ".split("");
	const ab1 = "âÂâÂấẤầẦậẬẩẨẫẪấẤầẦậẬẩẨẫẪéÉèÈẹẸẻẺẽẼ".split("");
	const es1 = "eEéÉèÈẹẸẻẺẽẼ".split("");
	const eb1 = "êÊếẾềỀệỆểỂễỄ".split("");
	const english = "ĐÂĂƠƯÊÔ";
	const lowen = "đâăơưêô";
	const arA = "áàảãạaÁÀẢÃẠA".split('');
	const mocrA = "óòỏõọoúùủũụuÓÒỎÕỌOÚÙỦŨỤU".split('');
	const erA = "éèẻẽẹeÉÈẺẼẸE".split('');
	const orA = "óòỏõọoÓÒỎÕỌO".split('');
	const aA = "ấầẩẫậâẤẦẨẪẬÂ".split('');
	const oA = "ốồổỗộôỐỒỔỖỘÔ".split('');
	const mocA = "ớờởỡợơứừửữựưỚỜỞỠỢƠỨỪỬỮỰƯ".split('');
	const trangA = "ắằẳẵặăẮẰẲẴẶĂ".split('');
	const eA = "ếềểễệêẾỀỂỄỆÊ".split('');
	
	this.attached = [];
	this.changed = false;
	this.specialChange = false;
	this.kl = 0;
	this.range = null;
	this.whit = false;
	
	/**
	 * Returns whether the given word, taking into account the given dead key,
	 * is a malformed Vietnamese word.
	 *
	 * @param w	{string}	The word to check.
	 * @param k	{string}	The dead key applied to the word.
	 * @returns {boolean}	True if the word is malformed; false otherwise.
	 */
	this.ckspell = function(w, k) {
		if (!AVIMConfig.ckSpell) return false;
		w = this.unV(w);
		var uw = up(w), tw = uw;
		var uk = up(k), twE, uw2 = this.unV2(uw);
		
		var vSConsonant = "BCDGHKLMNPQRSTVX";
		var vDConsonant = "[CKNP]H|G[HI]|NGH?|QU|T[HR]";
		if (AVIMConfig.informal) {
			vSConsonant += "F";
			vDConsonant += "|DZ";
		}
		
		// Final consonants with ` ? ~ tones: invalid
		if (this.FRX.indexOf(uk) >= 0 && /[CPT]$|CH$/.test(uw)) return true;
		
		// Initial non-Vietnamese consonants: invalid
		var nonViet = "[JW0-9" + (AVIMConfig.informal ? "]|^Z|[^D]Z" : "FZ]");
		if (new RegExp(nonViet).test(uw)) return true;
		
		// Incompatible vowels following certain consonants, partly thanks to
		// Mudim issue #16: invalid
		if (/^(?:C[IEY]|CUY|CO[AE]|G[EY]|NG[IEY]|NGH[AOUY]|Q[^U]|QU[^AEIOY])/
			.test(uw2)) { // CHY|K[AOU]|P[^H]|TRY|[NRX]Y|[NPT]HY
			return true;
		}
		if (uw2 == "QU" && (this.DAWEO || this.SFJRX)) return true;
		
		// Non-Vietnamese diphthongs and triphthongs: invalid
		var vowRe = /A[AE]|E[AEIY]|I[IY]|^IO|[^G]IO|OOO|^OU|[^U]OU|UU.|Y[AIOY]/;
		if (vowRe.test(uw2)) return true;
		
		// Remove initial consonants.
		
		// Initial digraphs and trigraphs: valid
		var consRe = vDConsonant + "|[" + vSConsonant + "]";
		var cons = new RegExp("^(?:" + consRe + ")").exec(tw);
		if (cons && cons[0]) tw = tw.substr(cons[0].length);
		twE=tw;
		
		// Remove final consonants.
		
		// Final consonants: valid
		var endCons = /(?:[MPT]|CH?|N[GH]?)$/.exec(tw);
		if (endCons && endCons[0]) {
			tw = tw.substr(0, tw.length - endCons[0].length);
			// NH after incompatible diphthongs and triphthongs: invalid
			if (endCons[0] == "NH") {
				if (/^(?:[ĂÂÔƠ]|I[EÊ]|O[ĂEÊ]?|[UƯ][AOƠ]?|UY[EÊ])$/.test(tw)) {
					return true;
				}
				if (uk == this.trang && (tw == "A" || tw == "OA")) return true;
			}
			// Disallow DCD etc.
			if (!tw) return true;
		}
		
		// Extraneous consonants: invalid
		if (tw && new RegExp(consRe).test(tw)) return true;
		
		uw2 = this.unV2(tw);
		if (uw2 == "IAO") return true;
		
		// Invalid standalone diphthongs and triphthongs: invalid
		if (tw != twE && /A[IOUY]|IA|IEU|UU|UO[UI]/.test(uw2)) return true;
		
		if (tw != uw && uw2 == "YEU") return true;
		if (uk != this.moc && (tw == "UU" || tw == "UOU")) return true;
		
		if (this.them.indexOf(uk) >= 0 && !/^.UYE/.test(uw2) && uk != "E") {
			if (/A[IO]|EO|IA|O[EO]/.test(uw2)) return true;
			
			if (uk == this.trang) {
				if (this.trang != "W" && uw2 == "UA") return true;
			}
			else if (uw2 == "OA") return true;
			
			if (uk == this.moc && /^(?:[EI]U|UE|UYE?)$/.test(uw2)) return true;
			if (uk == this.moc || uk == this.trang) {
				if (uw2 == "AU" || uw2 == "AY") return true;
			}
		}
		this.tw5 = tw;
		
		// Catch-all for words with too many interior letters
		return /$[Đđ]?....+/.test(uw2);
	};
	
	/**
	 * Enables or disables AVIM and updates the stored preferences.
	 *
	 * @param enabled	{boolean}	true to enable AVIM; false to disable it.
	 */
	this.setEnabled = function(enabled) {
		AVIMConfig.onOff = enabled;
		this.setPrefs("enabled");
	};
	
	/**
	 * Enables AVIM if currently disabled; disables AVIM otherwise.
	 */
	this.toggle = function() {
		this.setEnabled(!AVIMConfig.onOff);
	};
	
	/**
	 * Sets the input method to the method with the given ID and updates the
	 * stored preferences. If the given method ID is -1, the method is not
	 * changed and AVIM is instead disabled.
	 *
	 * @param m	{number}	the ID of the method to enable, or -1 to diable
	 * 						AVIM.
	 */
	this.setMethod = function(m) {
		if (m == -1) AVIMConfig.onOff = false;
		else {
			AVIMConfig.onOff = true;
			AVIMConfig.method = m;
		}
		this.setPrefs("method");
	};
	
	/**
	 * Sets the input method to the one with the given distance away from the
	 * currently enabled input method. For instance, a distance of 1 selects the
	 * next input method, while a distance of -1 selects the previous one.
	 *
	 * @param distance {number}	the distance from the currently selected input
	 * 							method to the input method to select.
	 */
	this.cycleMethod = function(distance) {
		AVIMConfig.onOff = true;
		
		var method = AVIMConfig.method;
		method += distance;
		if (method < 0) method += broadcasterIds.methods.length;
		method %= broadcasterIds.methods.length;
		AVIMConfig.method = method;
		
		this.setPrefs("method");
	};
	
	/**
	 * Enables or disables old-style placement of diacritical marks over
	 * diphthongs and updates the stored preferences.
	 *
	 * @param enabled	{boolean}	true to use old-style diacritics; false to
	 * 								use new-style diacritics.
	 */
	this.setDauCu = function(enabled) {
		AVIMConfig.oldAccent = enabled;
		this.setPrefs("oldAccents");
	};
	
	/**
	 * Enables old-style diacritical marks if currently disabled; disables them
	 * otherwise.
	 */
	this.toggleDauCu = function() {
		this.setDauCu(!AVIMConfig.oldAccent);
	};
	
	/**
	 * Enables or disables spelling enforcement and updates the stored
	 * preferences. If enabled, diacritical marks are not placed over words that
	 * do not conform to Vietnamese spelling rules and are instead treated as
	 * literals.
	 *
	 * @param enabled	{boolean}	true to enforce spelling; false otherwise.
	 */
	this.setSpell = function(enabled) {
		AVIMConfig.ckSpell = enabled;
		this.setPrefs("ignoreMalformed");
	};
	
	/**
	 * Enables spelling enforcement if currently disabled; disables it
	 * otherwise.
	 */
	this.toggleSpell = function() {
		this.setSpell(!AVIMConfig.ckSpell);
	};
	
	/**
	 * Displays or hides the status bar panel and updates the stored
	 * preferences.
	 *
	 * @param shown	{boolean}	true to display the status bar panel; false to
	 * 							hide it.
	 */
	this.setStatusPanel = function(shown) {
		AVIMConfig.statusBarPanel = shown;
		this.setPrefs("statusBarPanel");
	}
	
	/**
	 * Displays the status bar panel if currently hidden; hides it otherwise.
	 */
	this.toggleStatusPanel = function() {
		this.setStatusPanel(!AVIMConfig.statusBarPanel);
	};
	
	/**
	 * Updates the XUL menus and status bar panel to reflect AVIM's current
	 * state.
	 */
	this.updateUI = function() {
		// Enabled/disabled
		var enabledBcId = $(broadcasterIds.enabled);
		if (enabledBcId) {
			enabledBcId.setAttribute("checked", "" + AVIMConfig.onOff);
		}
		
		// Disable methods and options if AVIM is disabled
		for each (var cmdId in commandIds) {
			if (!$(cmdId)) continue;
			$(cmdId).setAttribute("disabled", "" + !AVIMConfig.onOff);
		}
		
		// Method
		for each (var bcId in broadcasterIds.methods) {
			if (!$(bcId)) continue;
			$(bcId).removeAttribute("checked");
			$(bcId).removeAttribute("key");
		}
		var selBc = $(broadcasterIds.methods[AVIMConfig.method]);
		if (selBc) selBc.setAttribute("checked", "true");
		
		// Options
		var spellBc = $(broadcasterIds.spell);
		if (spellBc) spellBc.setAttribute("checked", "" + AVIMConfig.ckSpell);
		var oldBc = $(broadcasterIds.oldAccents);
		if (oldBc) oldBc.setAttribute("checked", "" + AVIMConfig.oldAccent);
		
		// Status bar panel
		var panel = $(panelId);
		if (!panel) return;
		if (AVIMConfig.onOff) {
			panel.setAttribute("label", selBc.getAttribute("label"));
		}
		else panel.setAttribute("label", panel.getAttribute("disabledLabel"));
		panel.style.display =
			AVIMConfig.statusBarPanel ? "-moz-box" : "none";
	};
	
	this.mozGetText = function(obj) {
		var pos;
		var v = (obj.data) ? obj.data : text(obj);
		if (!v || !v.length) return false;
		if (obj.data) pos = obj.pos;
		else {
			if (!obj.setSelectionRange) return false;
			pos = obj.selectionStart;
		}
		if (obj.selectionStart != obj.selectionEnd) return ["", pos];
		
		var w = v.substring(0, pos);
		w = /[^ \r\n\t\xa0#,;.:_()<>+\-*\/=?!"$%{}[\]'`~|^@&“”‘’\xab\xbb‹›–—…−×÷°″′]*$/.exec(w);
		return [w ? w[0] : "", pos];
	};
	
	this.start = function(obj, key) {
		var w = "", method = AVIMConfig.method, dockspell = AVIMConfig.ckSpell;
		this.oc=obj;
		var uniA = [];
		this.D2 = "";
		
		if (method == 1 || (method == 0 && AVIMConfig.autoMethods.telex)) {
			uniA.push("DAEOWW".split("")); this.D2 += "DAWEO";
		}
		if (method == 2 || (method == 0 && AVIMConfig.autoMethods.vni)) {
			uniA.push("966678".split("")); this.D2 += "6789";
		}
		if (method == 3 || (method == 0 && AVIMConfig.autoMethods.viqr)) {
			uniA.push("D^^^+(".split("")); this.D2 += "D^+(";
		}
		if (method == 4 || (method == 0 && AVIMConfig.autoMethods.viqrStar)) {
			uniA.push("D^^^*(".split("")); this.D2 += "D^*(";
		}
		
		key = fcc(key.which);
		w = this.mozGetText(obj);
		if (!w || obj.sel) return;
		var noNormC = this.D2.indexOf(up(key)) >= 0;
		
		for (var i = 0; i < uniA.length; i++) {
			if (!dockspell) w = this.mozGetText(obj);
			if (!w || this.changed) break;
			this.main(w[0], key, w[1], uniA[i], noNormC);
		}
		
		if (this.D2.indexOf(up(key)) >= 0) {
			w = this.mozGetText(obj);
			if (w) this.normC(w[0], key, w[1]);
		}
	};
	
	const DAWEOFA = up(aA.join() + eA.join() + mocA.join() + trangA.join() +
					   oA.join() + english);
	this.findC = function(w, k, sf) {
		var method = AVIMConfig.method;
		if ((method == 3 || method == 4) && w.substr(-1) == "\\") {
			return [1, k.charCodeAt(0)];
		}
		var str = "", res, cc = "", pc = "", vowA = [], s = "ÂĂÊÔƠƯêâăơôư", c = 0, dn = false, uw = up(w), tv, g;
		var h, uc;
		for (var g = 0; g < sf.length; g++) {
			str += nan(sf[g]) ? sf[g] : fcc(sf[g]);
		}
		var uk = up(k), w2 = up(this.unV2(this.unV(w))), dont = "ƯA,ƯU".split(',');
		
		if (this.DAWEO.indexOf(uk) >= 0) {
			// Horned diphthongs and triphthongs
			if (uk == this.moc) {
				if (w2.indexOf("UU") >= 0 && this.tw5 != dont[1]) {
					if (w2.substr(-2) != "UU") return false;
					res = 2;
				}
				else if (w2.indexOf("UOU") >= 0) {
					if (w2.substr(-3) != "UOU") return false;
					res = 2;
				}
			}
			
			if (!res) {
				for (var g = 1; g <= w.length; g++) {
					cc = w.substr(-g, 1);
					pc = up(w.substr(-g - 1, 1));
					uc = up(cc);
					if (this.tw5 == this.unV(pc + uc) &&
						dont.indexOf(this.tw5) >= 0) {
						continue;
					}
					if (str.indexOf(uc) >= 0) {
						if ((uk == this.moc && this.unV(uc) == "U" && up(this.unV(w.substr(-g + 1, 1))) == "A") ||
							(uk == this.trang && this.unV(uc) == "A" && this.unV(pc) == "U")) {
							tv = 1 + (this.unV(uc) != "U");
							var ccc = up(w.substr(-g - tv, 1));
							if(ccc != "Q") {
								res = g + tv - 1;
							} else if(uk == this.trang) {
								res = g;
							} else if(this.moc != this.trang) {
								return false;
							}
						} else {
							res = g;
						}
						if(!this.whit || (uw.indexOf("Ư") < 0) || (uw.indexOf("W") < 0)) {
							break;
						}
					} else if(DAWEOFA.indexOf(uc) >= 0) {
						if(uk == this.D) {
							if(cc == "đ") {
								res = [g, 'd'];
							} else if(cc == "Đ") {
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
		
		var tE = "", tEC;
		if (uk != this.Z && this.DAWEO.indexOf(uk) < 0) {
			tE = this.retKC(uk, true);
		}
		if (this.DAWEO.indexOf(uk) < 0) for (var g = 1; g <= w.length; g++) {
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
			else if (uk != this.Z) {
				var h = this.repSign(k).indexOf(w.charCodeAt(w.length - g));
				if (h >= 0) {
					if (this.ckspell(w, k)) return false;
					return [g, tE.charCodeAt(h % 24)];
				}
				for (var h = 0; h < tE.length; h++) {
					if(tE.charCodeAt(h) == w.charCodeAt(w.length - g)) {
						return [g, skey_str[h]];
					}
				}
			}
		}
		if(uk != this.Z && typeof(res) != 'object' && this.ckspell(w, k)) {
			return false;
		}
		if (this.DAWEO.indexOf(uk) < 0) {
			for (var g = 1; g <= w.length; g++) {
				if (uk != this.Z && s.indexOf(w.substr(-g, 1)) >= 0) return g;
				if (tE.indexOf(w.substr(-g, 1)) >= 0) {
					var pos = tE.indexOf(w.substr(-g, 1));
					if (pos >= 0) return [g, skey_str[pos]];
				}
			}
		}
		if (res) return res;
		if (c == 1 || uk == this.Z) return vowA[0];
		else if (c == 2) {
			var upW = up(w);
			if (!AVIMConfig.oldAccent && /(?:UY|O[AE]) ?$/.test(upW)) {
				return vowA[0];
			}
			// Count final consonants.
			var cons = upW.match(/[BCDĐGHKLMNPQRSTVX]+$/);
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
	
	this.replaceChar = function(o, pos, c) {
		var bb = false;
		if(!nan(c)) {
			var replaceBy = fcc(c), wfix = up(this.unV(fcc(c)));
			this.changed = true;
		} else {
			var replaceBy = c;
			if((up(c) == "O") && this.whit) {
				bb=true;
			}
		}
		if(!o.data) {
			var savePos = o.selectionStart, sst = o.scrollTop, r;
			if (up(text(o, pos - 1, 1)) == 'U' && pos < savePos - 1 && up(text(o, pos - 2, 1)) != 'Q') {
				if (wfix == "Ơ" || bb) {
					r = (text(o, pos - 1, 1) == 'u') ? "ư" : "Ư";
				}
				if (bb) {
					this.changed = true;
					replaceBy = (c == "o") ? "ơ" : "Ơ";
				}
			}
			if (r) {
				replaceBy = r + replaceBy;
				pos--;
			}
			splice(o, pos, 1 + !!r, replaceBy);
			o.setSelectionRange(savePos, savePos);
			o.scrollTop = sst;
		} else {
			var r;
			if ((up(o.data.substr(pos - 1, 1)) == 'U') && (pos < o.pos - 1)) {
				if (wfix == "Ơ" || bb) {
					r = (o.data.substr(pos - 1, 1) == 'u') ? "ư" : "Ư";
				}
				if (bb) {
					this.changed = true;
					replaceBy = (c == "o") ? "ơ" : "Ơ";
				}
			}
			o.deleteData(pos, 1);
			o.insertData(pos, replaceBy);
			if(r) {
				o.deleteData(pos - 1, 1);
				o.insertData(pos - 1, r);
			}
		}
		this.whit = false;
	};
	
	this.tr = function(k, w, by, sf, i) {
		var pos = this.findC(w, k, sf);
		if (!pos) return false;
		if (pos[1]) return this.replaceChar(this.oc, i - pos[0], pos[1]);
		var pC = w.substr(-pos, 1);
		for (var g = 0; g < sf.length; g++) {
			var cmp = nan(sf[g]) ? pC : pC.charCodeAt(0);
			if (cmp == sf[g]) {
				var c = nan(by[g]) ? by[g].charCodeAt(0) : by[g];
				return this.replaceChar(this.oc, i - pos, c);
			}
		}
		return false;
	};
	
	const bya = [db1, ab1, eb1, ob1, mocb1, trangb1];
	const sfa = [ds1, as1, es1, os1, mocs1, trangs1];
	this.main = function(w, k, i, a, noNormC) {
		var uk = up(k), got = false, t = "dDaAaAoOuUeEoO".split("");
		var by = [], sf = [], method = AVIMConfig.method, h, g;
		if (method == 0) {
			if (a[0] == "9") method = 2;
			else if (a[4] == "+") method = 3;
			else if (a[4] == "*") method = 4;
			else if (a[0] == "D") method = 1;
		}
		switch (method) {
			case 1:
				this.SFJRX = "SFJRX"; this.DAWEO = "DAWEO";
				this.S = 'S'; this.F = 'F'; this.J = 'J'; this.R = 'R';
				this.X = 'X'; this.Z = 'Z'; this.D = 'D'; this.FRX = "FRX";
				this.them = "AOEW"; this.trang = "W"; this.moc = "W";
				this.A = "A"; this.E = "E"; this.O = "O";
				break;
			case 2:
				this.DAWEO = "6789"; this.SFJRX = "12534";
				this.S = "1"; this.F = "2"; this.J = "5"; this.R = "3";
				this.X = "4"; this.Z = "0"; this.D = "9"; this.FRX = "234";
				this.AEO = "6"; this.moc = "7"; this.trang = "8";
				this.them = "678"; this.A = "6"; this.E = "6"; this.O = "6";
				break;
			case 3:
				this.DAWEO = "^+(D"; this.SFJRX = "'`.?~";
				this.S = "'"; this.F = "`"; this.J = "."; this.R = "?";
				this.X = "~"; this.Z = "-"; this.D = "D"; this.FRX = "`?~";
				this.AEO = "^"; this.moc = "+"; this.trang = "(";
				this.them = "^+("; this.A = "^"; this.E = "^"; this.O = "^";
				break;
			case 4:
				this.DAWEO = "^*(D"; this.SFJRX = "'`.?~";
				this.S = "'"; this.F = "`"; this.J = "."; this.R = "?";
				this.X = "~"; this.Z = "-"; this.D = "D"; this.FRX = "`?~";
				this.AEO = "^"; this.moc = "*"; this.trang = "(";
				this.them = "^*("; this.A = "^"; this.E = "^"; this.O = "^";
//				break;
		}
		
		if(this.SFJRX.indexOf(uk) >= 0) {
			this.sr(w,k,i);
			got=true;
		}
		else if (uk == this.Z) {
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
		if (uk == this.moc) this.whit = true;
		if (got) return this.DAWEOZ(k, w, by, sf, i, uk);
		if (noNormC) return "";
		return this.normC(w, k, i);
	};
	
	this.DAWEOZ = function(k, w, by, sf, i, uk) {
		if (this.DAWEO.indexOf(uk) < 0 && this.Z.indexOf(uk) < 0) return false;
		return this.tr(k, w, by, sf, i);
	};
	
	this.normC = function(w, k, i) {
		if (k[0] == " ") return "";
		var uk = up(k);
		if (alphabet.indexOf(uk) < 0 && this.D2.indexOf(uk) < 0) return w;
		var u = this.repSign(null);
		for(var j = 1; j <= w.length; j++) {
			var h = u.indexOf(w.charCodeAt(w.length - j));
			if (h < 0) continue;
			
			var fS;
			if (h <= 23) fS = this.S;
			else if (h <= 47) fS = this.F;
			else if (h <= 71) fS = this.J;
			else if (h <= 95) fS = this.R;
			else fS = this.X;
			
			var c = skey[h % 24];
			var sp = pos = this.oc.selectionStart;
			w = this.unV(w);
			if(!this.changed) {
				w += k;
				var sst = this.oc.scrollTop;
				pos += k.length;
				if(!this.oc.data) {
//					this.oc.value = this.oc.value.substr(0, sp) + k +
//						this.oc.value.substr(this.oc.selectionEnd);
					splice(this.oc, sp, this.oc.selectionEnd - sp, k);
					this.changed = true;
					this.oc.scrollTop = sst;
				} else {
					this.oc.insertData(this.oc.pos, k);
					this.range.setEnd(this.oc, ++this.oc.pos);
					this.specialChange = true;
				}
			}
			if(!this.oc.data) this.oc.setSelectionRange(pos, pos);
			if(!this.ckspell(w, fS)) {
				this.replaceChar(this.oc, i - j, c);
				if(!this.oc.data) this.main(w, fS, pos, [this.D], false);
				else {
					var ww = this.mozGetText(this.oc);
					this.main(ww[0], fS, ww[1], [this.D], false);
				}
			}
		}
		return "";
	};
	
	const ccA = [aA, mocA, trangA, eA, oA], ccrA = [arA, mocrA, arA, erA, orA];
	this.DAWEOF = function(cc, k, g) {
		var kA = [this.A, this.moc, this.trang, this.E, this.O];
		for (var i = 0; i < kA.length; i++) {
			if (k != kA[i]) continue;
			
			var posCC = ccA[i].indexOf(cc);
			if (posCC < 0) continue;
			
			var repl = ccrA[i][posCC];
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
		var chars = "";
		switch (k) {
			case this.S: chars = "áấắéếíóốớúứýÁẤẮÉẾÍÓỐỚÚỨÝ"; break;
			case this.F: chars = "àầằèềìòồờùừỳÀẦẰÈỀÌÒỒỜÙỪỲ"; break;
			case this.J: chars = "ạậặẹệịọộợụựỵẠẬẶẸỆỊỌỘỢỤỰỴ"; break;
			case this.R: chars = "ảẩẳẻểỉỏổởủửỷẢẨẲẺỂỈỎỔỞỦỬỶ"; break;
			case this.X: chars = "ãẫẵẽễĩõỗỡũữỹÃẪẴẼỄĨÕỖỠŨỮỸ";
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
		var u = this.repSign(null);
		var unW = "";
		for (var a = w.length - 1; a >= 0; a--) {
			var pos = u.indexOf(w.charCodeAt(a));
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
		var unW = "";
		for (var a = w.length - 1; a >= 0; a--) {
			var pos = skey.indexOf(w.charCodeAt(a));
			if (pos >= 0) unW = skey2[pos] + unW;
			else unW = w[a] + unW;
		}
		return unW;
	};
	
	this.repSign = function(k) {
		var u = [];
		for (var a = 0; a < 5; a++) {
			if (!k || this.SFJRX[a] != up(k)) {
				u = u.concat(this.retKC(this.SFJRX[a]));
			}
		}
		return u;
	};
	
	this.sr = function(w, k, i) {
		var pos = this.findC(w, k, skey_str);
		if (!pos) return;
		if (pos[1]) this.replaceChar(this.oc, i - pos[0], pos[1]);
		else this.replaceChar(this.oc, i - pos, this.retUni(w, k, pos));
	};
	
	this.retUni = function(w, k, pos) {
		var uC, lC;
		var idx = skey_str.indexOf(w.substr(-pos, 1));
		if (idx < 0) return false;
		if (idx < 12) {
			lC = idx; uC = idx + 12;
		}
		else {
			lC = idx - 12; uC = idx;
		}
		var t = w.substr(-pos, 1);
		var u = this.retKC(up(k));
		if (t != up(t)) return u[lC];
		return u[uC];
	};
	
	this.ifInit = function(w) {
		var sel = w.getSelection();
		this.range = sel ? sel.getRangeAt(0) : document.createRange();
	};
	
	/**
	 * Handles key presses for WYSIWYG HTML documents (editable through
	 * Mozilla's Midas component).
	 */
	this.ifMoz = function(e) {
		var code = e.which;
		var doc = e.originalTarget.ownerDocument;
		var target = doc.documentElement;
		var cwiWrapper = new XPCNativeWrapper(doc.defaultView);
		var cwi = cwiWrapper.wrappedJSObject;
		if(e.ctrlKey || e.metaKey || e.altKey) return;
		if (this.findIgnore(target)) return;
		if (cwi.frameElement && this.findIgnore(cwi.frameElement)) return;
		this.ifInit(cwi);
		var node = this.range.endContainer, newPos;
		this.sk = fcc(code);
		this.saveStr = "";
		if(this.checkCode(code) || !this.range.startOffset || (typeof(node.data) == 'undefined')) return;
		node.sel = false;
		if(node.data) {
			this.saveStr = node.data.substr(this.range.endOffset);
			if(this.range.startOffset != this.range.endOffset) {
				node.sel=true;
			}
			node.deleteData(this.range.startOffset, node.data.length);
		}
		this.range.setEnd(node, this.range.endOffset);
		this.range.setStart(node, 0);
		if(!node.data) return;
		node.value = node.data;
		node.pos = node.data.length;
		node.which = code;
		var editor = getEditor(cwi.frameElement);
//		dump("AVIM.ifMoz -- editor: " + editor + "\n");				// debug
		if (editor && editor.beginTransaction) editor.beginTransaction();
		try {
			this.start(node, e);
			node.insertData(node.data.length, this.saveStr);
			newPos = node.data.length - this.saveStr.length + this.kl;
			this.range.setEnd(node, newPos);
			this.range.setStart(node, newPos);
			this.kl = 0;
			if(this.specialChange) {
				this.specialChange = false;
				this.changed = false;
				node.deleteData(node.pos - 1, 1);
			}
		}
		catch (exc) {
			throw exc;
		}
		finally {
			// If we don't put this line in a finally clause, an error in
			// start() will render the application inoperable.
			if (editor && editor.endTransaction) editor.endTransaction();
		}
		if(this.changed) {
			this.changed = false;
			e.preventDefault();
		}
	};
	
	this.checkCode = function(code) {
		return !AVIMConfig.onOff || (code < 45 && code != 42 && code != 32 &&
									 code != 39 && code != 40 && code != 43) ||
			code == 145 || code == 255;
	};
	
	/**
	 * Returns whether AVIM should ignore the given element.
	 *
	 * @param el	{object}	A DOM node representing a textbox element.
	 * @returns {boolean}	True if the element should be ignored; false
	 * 						otherwise.
	 */
	this.findIgnore=function(el) {
		if (!el || !el.getAttribute) return true;
		var id = el.id || el.getAttribute("id");
		if (!id || !id.toLowerCase) return false;
		return AVIMConfig.exclude.indexOf(id.toLowerCase()) >= 0;
	}
	
	/**
	 * Update specialized XUL textboxes that typically rely on keypress events
	 * to change state. Examples include autocomplete textboxes and the Find
	 * Toolbar.
	 * 
	 * @param e	{object}	the key press event.
	 */
	this.updateContainer = function(e) {
		var xulTarget = e.target.textbox || e.target;
		var xblTarget = e.originalTarget;
		
		// Autocomplete textboxes for Toolkit
		if (xulTarget.type == "autocomplete" && xulTarget.controller) {
			xulTarget.controller.handleText(true);
		}
		
		// Find Toolbar for Toolkit
		if (xulTarget._find) xulTarget._find();
		
		// Subject bar in Thunderbird
		if (window.SetComposeWindowTitle) SetComposeWindowTitle();
		
		// Autocomplete textboxes in Gecko
//		var popup = document.getElementById("PopupAutoComplete");
//		if (popup && popup.popupOpen && popup.openAutocompletePopup) {
//			popup.openAutocompletePopup(popup.input, xulTarget);
//		}
	}
	
	/**
	 * Handles key presses in the current window. This function is triggered as
	 * soon as the key goes up. If the key press's target is a XUL element, this
	 * function finds the anonymous XBL child that actually handles text input,
	 * as necessary.
	 *
	 * @param e	{object}	the key press event.
	 * @returns {boolean}	true if AVIM plans to modify the input; false
	 * 						otherwise.
	 */
	this.keyPressHandler = function(e) {
		var el = e.originalTarget || e.target, code = e.which;
//		dump("AVIM.keyPressHandler -- target: " + el.tagName + "; code: " + code + "\n");	// debug
		if (e.ctrlKey || e.metaKey || e.altKey) return false;
		if (this.findIgnore(e.target)) return false;
		var isHTML = el.type == "textarea" || el.type == "text";
		if(!isHTML || this.checkCode(code)) return false;
		this.sk = fcc(code);
		var editor = getEditor(el);
//		dump("AVIM.keyPressHandler -- editor: " + editor + "\n");				// debug
		if (editor && editor.beginTransaction) editor.beginTransaction();
		try {
			this.start(el, e);
		}
		catch (exc) {
			throw exc;
		}
		finally {
			// If we don't put this line in a finally clause, an error in
			// start() will render Firefox inoperable.
			if (editor && editor.endTransaction) editor.endTransaction();
		}
		if (this.changed) {
			this.changed=false;
			e.preventDefault();
			// A bit of a hack to prevent single-line textboxes from scrolling
			// to the beginning of the line.
			if (window.goDoCommand && el.type != "textarea") {
				goDoCommand("cmd_charPrevious");
				goDoCommand("cmd_charNext");
			}
			this.updateContainer(e);
			return false;
		}
		return true;
	};

	// Integration with Mozilla preferences service
	
	// Root for AVIM preferences
	const prefs = Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService)
		.getBranch("extensions.avim.");
	
	/**
	 * Registers an observer so that AVIM automatically reflects changes to its
	 * preferences.
	 */
	this.registerPrefs = function() {
		prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		prefs.addObserver("", this, false);
		this.getPrefs();
	};
	
	/**
	 * Unregisters the preferences observer as the window is being closed.
	 */
	this.unregisterPrefs = function() {
		prefs.removeObserver("", this);
	};
	
	/**
	 * Responds to changes to AVIM preferences.
	 *
	 * @param subject
	 * @param topic		{string}	the type of event that occurred.
	 * @param data		{string}	the name of the preference that changed.
	 */
	this.observe = function(subject, topic, data) {
		if (topic != "nsPref:changed") return;
		this.getPrefs(data);
		this.updateUI();
	};
	
	/**
	 * Updates the stored preferences to reflect AVIM's current state.
	 */
	this.setPrefs = function(changedPref) {
		// Boolean preferences
		var boolPrefs = {
			// Basic options
			enabled: AVIMConfig.onOff,
			ignoreMalformed: AVIMConfig.ckSpell,
			oldAccents: AVIMConfig.oldAccent,
			statusBarPanel: AVIMConfig.statusBarPanel,
			
			// Advanced options
			informal: AVIMConfig.informal,
			
			// Auto input method configuration
			"auto.telex": AVIMConfig.autoMethods.telex,
			"auto.vni": AVIMConfig.autoMethods.vni,
			"auto.viqr": AVIMConfig.autoMethods.viqr,
			"auto.viqrStar": AVIMConfig.autoMethods.viqrStar,
			
			// Script monitor
			"scriptMonitor.enabled": AVIMConfig.disabledScripts.enabled,
			"scriptMonitor.avim": AVIMConfig.disabledScripts.AVIM,
			"scriptMonitor.chim": AVIMConfig.disabledScripts.CHIM,
			"scriptMonitor.mudim": AVIMConfig.disabledScripts.Mudim,
			"scriptMonitor.mViet": AVIMConfig.disabledScripts.MViet,
			"scriptMonitor.vietImeW": AVIMConfig.disabledScripts.VietIMEW,
			"scriptMonitor.vietTyping": AVIMConfig.disabledScripts.VietTyping,
			"scriptMonitor.vietUni": AVIMConfig.disabledScripts.VietUni,
			"scriptMonitor.vinova": AVIMConfig.disabledScripts.Vinova
		};
		if (changedPref && changedPref in boolPrefs) {
			prefs.setBoolPref(changedPref, !!boolPrefs[changedPref]);
		}
		else for (var pref in boolPrefs) {
			prefs.setBoolPref(pref, !!boolPrefs[pref]);
		}
		
		// Integer preferences
		if (!changedPref || changedPref == "method") {
			prefs.setIntPref("method", AVIMConfig.method);
		}
		
		// Custom string preferences
		if (!changedPref || changedPref == "ignoredFieldIds") {
			var ids = AVIMConfig.exclude.join(" ").toLowerCase();
			prefs.setCharPref("ignoredFieldIds", ids);
		}
	};
	
	/**
	 * Updates AVIM's current state to reflect the stored preferences.
	 *
	 * @param changedPref	{string}	the name of the preference that changed.
	 */
	this.getPrefs = function(changedPref) {
//		dump("Changed pref: " + changedPref + "\n");							// debug
		var specificPref = true;
		switch (changedPref) {
			default:
				// Fall through when changedPref isn't defined, which happens at
				// startup, when we want to get all the preferences.
				specificPref = false;
			
			// Basic options
			case "enabled":
				AVIMConfig.onOff = prefs.getBoolPref("enabled");
				if (specificPref) break;
			case "method":
				AVIMConfig.method = prefs.getIntPref("method");
				// In case someone enters an invalid method ID in about:config
				var method = AVIMConfig.method;
				if (method < 0 || method >= broadcasterIds.methods.length) {
					Components.classes["@mozilla.org/preferences-service;1"]
						.getService(Components.interfaces.nsIPrefService)
						.getDefaultBranch("extensions.avim.")
						.clearUserPref("method");
					AVIMConfig.method = prefs.getIntPref("method");
				}
				if (specificPref) break;
			case "ignoreMalformed":
				AVIMConfig.ckSpell = prefs.getBoolPref("ignoreMalformed");
				if (specificPref) break;
			case "oldAccents":
				AVIMConfig.oldAccent = prefs.getBoolPref("oldAccents");
				if (specificPref) break;
			case "statusBarPanel":
				AVIMConfig.statusBarPanel = prefs.getBoolPref("statusBarPanel");
				if (specificPref) break;
			
			// Advanced options
			case "informal":
				AVIMConfig.informal = prefs.getBoolPref("informal");
				if (specificPref) break;
			case "ignoredFieldIds":
				var ids = prefs.getCharPref("ignoredFieldIds");
				AVIMConfig.exclude = ids.toLowerCase().split(/\s+/);
				if (specificPref) break;
			
			// Auto input method configuration
			case "auto.telex":
				AVIMConfig.autoMethods.telex = prefs.getBoolPref("auto.telex");
				if (specificPref) break;
			case "auto.vni":
				AVIMConfig.autoMethods.vni = prefs.getBoolPref("auto.vni");
				if (specificPref) break;
			case "auto.viqr":
				AVIMConfig.autoMethods.viqr = prefs.getBoolPref("auto.viqr");
				if (specificPref) break;
			case "auto.viqrStar":
				AVIMConfig.autoMethods.viqrStar =
					prefs.getBoolPref("auto.viqrStar");
				if (specificPref) break;
			
			// Script monitor
			case "scriptMonitor.enabled":
				AVIMConfig.disabledScripts.enabled =
					prefs.getBoolPref("scriptMonitor.enabled");
				if (specificPref) break;
			case "scriptMonitor.avim":
				AVIMConfig.disabledScripts.AVIM =
					prefs.getBoolPref("scriptMonitor.avim");
				if (specificPref) break;
			case "scriptMonitor.chim":
				AVIMConfig.disabledScripts.CHIM =
					prefs.getBoolPref("scriptMonitor.chim");
				if (specificPref) break;
			case "scriptMonitor.mudim":
				AVIMConfig.disabledScripts.Mudim =
					prefs.getBoolPref("scriptMonitor.mudim");
				if (specificPref) break;
			case "scriptMonitor.mViet":
				AVIMConfig.disabledScripts.MViet =
					prefs.getBoolPref("scriptMonitor.mViet");
				if (specificPref) break;
			case "scriptMonitor.vietImeW":
				AVIMConfig.disabledScripts.VietIMEW =
					prefs.getBoolPref("scriptMonitor.vietImeW");
				if (specificPref) break;
			case "scriptMonitor.vietTyping":
				AVIMConfig.disabledScripts.VietTyping =
					prefs.getBoolPref("scriptMonitor.vietTyping");
				if (specificPref) break;
			case "scriptMonitor.vietUni":
				AVIMConfig.disabledScripts.VietUni =
					prefs.getBoolPref("scriptMonitor.vietUni");
				if (specificPref) break;
			case "scriptMonitor.vinova":
				AVIMConfig.disabledScripts.Vinova =
					prefs.getBoolPref("scriptMonitor.vinova");
//				if (specificPref) break;
		}
	};
	
	// Script monitor
	
	// Markers and disablers for embedded Vietnamese IMEs
	var disablers = {
		// For each of these disablers, we don't need a sanity check for an
		// object or member that served as a marker for the IME. Also,
		// everything is wrapped in a try...cach block, so we don't need sanity
		// checks if the disabler can halt on error without failing to reach
		// independent statements.
		
		AVIM: function(win, AVIMObj) {
			if (!AVIMConfig.disabledScripts.AVIM) return;
			AVIMObj.setMethod(-1);
		},
		CHIM: function(win, CHIM) {
			if (!AVIMConfig.disabledScripts.CHIM) return;
			if (parseInt(CHIM.method) == 0) return;
			CHIM.SetMethod(0);
		},
		HIM: function(win) {
			if (!AVIMConfig.disabledScripts.AVIM) return;
			if ("setMethod" in win) win.setMethod(-1);
			win.on_off = 0;
		},
		Mudim: function(win, Mudim) {
			if (!AVIMConfig.disabledScripts.Mudim) return;
			if (parseInt(Mudim.method) == 0) return;
			if ("Toggle" in Mudim) Mudim.Toggle();
			else win.CHIM.Toggle();
		},
		MViet: function(win) {
			if (!AVIMConfig.disabledScripts.MViet) return;
			if (typeof(win.MVOff) == "boolean" && win.MVOff) return;
			if ("MVietOnOffButton" in win) win.MVietOnOffButton();
			else if ("button" in win) win.button(0);
		},
		VietIMEW: function(win) {
			if (!AVIMConfig.disabledScripts.VietIMEW) return;
			if (!("VietIME" in win)) return;
			for (var memName in win) {
				var mem = win[memName];
				if (mem.setTelexMode != undefined &&
					mem.setNormalMode != undefined) {
					mem.setNormalMode();
					break;
				}
			}
		},
		VietTyping: function(win) {
			if (!AVIMConfig.disabledScripts.VietTyping) return;
			if ("changeMode" in win) win.changeMode(-1);
			else win.ON_OFF = 0;
		},
		VietUni: function(win) {
			if (!AVIMConfig.disabledScripts.VietUni) return;
			win.setTypingMode();
		},
		Vinova: function(win, vinova) {
			if (!AVIMConfig.disabledScripts.Vinova) return;
			vinova.reset(true);
		},
		XaLo: function(win, marker) {
			if (!AVIMConfig.disabledScripts.AVIM) return;
			if (win._e_ && win.document.getElementsByClassName("vk").length) {
				win._e_(null, 0);
			}
		},
		xvnkb: function(win) {
			if (!AVIMConfig.disabledScripts.CHIM) return;
			if (parseInt(win.vnMethod) == 0) return;
			win.VKSetMethod(0);
		}
	};
	var markers = {
		// HIM and AVIM since at least version 1.13 (build 20050810)
		DAWEOF: disablers.HIM,
		// VietTyping, various versions
		UNIZZ: disablers.VietTyping,
		// VietUni, including vietuni8.js (2001-10-19) and version 14.0 by Tran
		// Kien Duc (2004-01-07)
		telexingVietUC: disablers.VietUni,
		// Mudim since version 0.3 (r2)
		Mudim: disablers.Mudim,
		// MViet 12 AC
		evBX: disablers.MViet,
		// MViet 14 RTE
		MVietOnOffButton: disablers.MViet,
		// CHIM since version 0.9.3
		CHIM: disablers.CHIM,
		// CHIM (xvnkb.js) versions 0.8-0.9.2 and BIM 0.00.01-0.0.3
		vnMethod: disablers.xvnkb,
		// HIM since at least version 1.1 (build 20050430)
		DAWEO: disablers.HIM,
		// HIM since version 1.0
		findCharToChange: disablers.HIM,
		// AVIM after build 20071102
		AVIMObj: disablers.AVIM,
		// Vinova (2008-05-23)
		vinova: disablers.Vinova,
		// VietIMEW
		GetVnVowelIndex: disablers.VietIMEW,
		// XaLộ (vn.xalo.client.vnk)
		_xalo_ga: disablers.XaLo
	};
	
	/**
	 * Given a context and marker, disables the Vietnamese JavaScript input
	 * method editor (IME) with that marker.
	 *
	 * @param win		{object}	A JavaScript window object.
	 * @param marker	{object}	A JavaScript object (possibly a function)
	 * 								that indicates the presence of the IME.
	 * @returns {boolean}	True if the disabler ran without errors (possibly
	 * 						without effect); false if errors were raised.
	 */
	this.disableOther = function(win, marker) {
		try {
			var disabler = markers[marker];
			disabler(win, win[marker]);
			return true;
		}
		catch (e) {
			return false;
		}
	};
	
	/**
	 * Given a HTML document node, disables any Vietnamese JavaScript input
	 * method editors (IMEs) embedded in the document that may cause conflicts.
	 * If AVIM is disabled, this method does nothing.
	 *
	 * @param doc {object}	An HTML document node.
	 */
	this.disableOthers = function(doc) {
		if (!AVIMConfig.onOff || !AVIMConfig.disabledScripts.enabled) return;
		
		// Using wrappedJSObject is only safe in Firefox 3 and above.
		var winWrapper = new XPCNativeWrapper(doc.defaultView);
		var win = winWrapper.wrappedJSObject;
		if (!win || win == window) return;
		
		for (var marker in markers) {
			if (!(marker in win)) continue;
			if (this.disableOther(win, marker)) return;
		}
		
		// MViet 14 RTE
		if (!AVIMConfig.disabledScripts.MViet) return;
		if (win.frameElement) win = win.parent;
		var marker = "MVietOnOffButton";
		if (marker in win) disablers.MViet(win);
	};
	
	/**
	 * First responder for keypress events.
	 *
	 * @param e	{object}	The generated event.
	 * @returns {boolean}	True if AVIM modified the textbox as a result of the
	 * 						keypress.
	 */
	this.onKeyPress = function(e) {
//		dump("keyPressHandler -- code: " + e.which + "\n");						// debug
//		dump("keyPressHandler -- target: " + e.target.nodeName + "; id: " + e.target.id + "; originalTarget: " + e.originalTarget + "\n");	// debug
		var target = e.target;
		var doc = target.ownerDocument;
		this.disableOthers(doc);
		
		// Handle key press either in WYSIWYG mode or normal mode.
		var wysiwyg =
			(doc.designMode && doc.designMode.toLowerCase() == "on") ||
			(target.contentEditable &&
			 target.contentEditable.toLowerCase() == "true");
		if (wysiwyg) return this.ifMoz(e);
		
		return this.keyPressHandler(e);
	};
};

if (!window.avim && !window.frameElement) {
	window.avim = new AVIM();
	avim.registerPrefs();
	addEventListener("load", function () {
		avim.updateUI();
	}, false);
	addEventListener("unload", function () {
		avim.unregisterPrefs();
	}, false);
	addEventListener("keypress", function (e) {
		avim.onKeyPress(e);
	}, true);
}
