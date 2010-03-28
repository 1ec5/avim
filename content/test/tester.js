/**
 * A controller for the AVIM test suite window.
 */
function AVIMTester() {
	const inputFileBoxId = "input-file";
	const inputTextBoxId = "input-textbox";
	
//	const moveBackCheckId = "moveback-check";
	
	const progressBarId = "run-progress";
	
	const resultsTreeId = "results-tree";
	const resultsColIds = ["results-word-col", "results-input-col",
						   "results-output-col", "results-result-col"];
	
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
	
	this.results = [];
	
	/**
	 * Returns the textual source of the specified file.
	 *
	 * @returns {string}	The textual soruce of the specified file.
	 */
	this.getInputSource = function() {
		var inputFileBox = document.getElementById(inputFileBoxId);
		var fileList = inputFileBox.files;
		var src = "";
		for (var i = 0; i < fileList.length; i++) {
			src += fileList[i].getAsText("") + "\n";
		}
		return src;
	};
	
	/**
	 * Returns the name of the currently activated input method. This method may
	 * be somewhat expensive, since it must access Mozilla's preference service.
	 *
	 * @returns {string} Name of the currently activated input method.
	 */
	this.getMethodName = function() {
		var prefs = Components.classes["@mozilla.org/preferences-service;1"]
							  .getService(Components.interfaces.nsIPrefService)
							  .getBranch("extensions.avim.");
		var method = prefs.getIntPref("method");
		var methodName = methodNames[method];
		if (methodName != "auto") return methodName;
		
		var autoMethods = [prefs.getBoolPref("auto.telex"),
						   prefs.getBoolPref("auto.vni"),
						   prefs.getBoolPref("auto.viqr"),
						   prefs.getBoolPref("auto.viqrStar")];
		
		method = autoMethods.indexOf(true) + 1;
		return methodNames[method];
	};
	
	/**
	 * Prepares the given word for entry into the hidden textbox.
	 *
	 * @param word		{string}	The Unicode-encoded word to normalize.
	 * @param method	{string}	The name of the currently activated input
	 * 								method.
	 * @returns {string}	The transformed word.
	 */
	this.prepareWord = function(word, method) {
		// Convert word to VIQR.
		var viqrWord = "";
		for (var i = 0; i < word.length; i++) {
			var chr = word[i];
			viqrWord += sequences[chr] || chr;
		}
		
		// Separate base letters from diacritics.
		var letters = [];
		var accents = [];
		var circumVowels = [];
		for (var i = 0; i < viqrWord.length; i++) {
			var cur = viqrWord[i];
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
			var transAccents = [];
			for (var i = 0; i < accents.length; i++) {
				var trans = methodMap[method][accents[i]];
				if (trans instanceof Function) trans = trans(circumVowels[i]);
				transAccents.push(trans || accents[i]);
			}
			accents = transAccents;
		}
		
//		for (var i = 0; i < viqrWord.length; i++) {
//			var base = viqrWord[i];
//			letters += base;
//			
//			if ("adeiouy".indexOf(base.toLowerCase()) < 0) continue;
//			var next;
//			while ((next = viqrWord[i + 1]) &&
//				   "'`?~.^+(d".indexOf(next.toLowerCase()) >= 0) {
//				var trans = methodMap[method][next];
//				if (trans instanceof Function) trans = trans(base);
//				accents += trans || next;
//				i++;
//			}
//		}
		
		return letters.join("") + accents.join("");
	};
	
	/**
	 * Automatically types the given word into the hidden text box and compares
	 * the results against the original word.
	 *
	 * @param word	{string}	The Unicode-encoded goal word.
	 * @param keys	{string}	The keystrokes to press.
	 */
	this.testWord = function(word, keys) {
		var inputTextBox = document.getElementById(inputTextBoxId);
		
		for (var i = 0; i < keys.length; i++) {
			var e = document.createEvent("KeyEvents");
			e.initKeyEvent("keypress", true, true, null, false, false, false,
						   false, 0, keys.charCodeAt(i));
			inputTextBox.dispatchEvent(e);
		}
		
		var tree = document.getElementById(resultsTreeId);
		var doesMatch = inputTextBox.value == word;
		this.results.push([word, keys, inputTextBox.value, doesMatch]);
		var numResults = this.results.length;
		tree.treeBoxObject.rowCountChanged(numResults - 1, 1);
		tree.treeBoxObject.scrollByPages(1);
		
		inputTextBox.value = "";
		return doesMatch;
	};
	
	/**
	 * Runs the test suite.
	 */
	this.runTests = function() {
		var inputTextBox = document.getElementById(inputTextBoxId);
		inputTextBox.focus();
		
		var tree = document.getElementById(resultsTreeId);
		var numRemoved = this.results.length;
		this.results = [];
		tree.treeBoxObject.rowCountChanged(0, -numRemoved);
		
		var progressBar = document.getElementById(progressBarId);
		progressBar.value = 0;
		progressBar.mode = "determined";
		
		var src = this.getInputSource();
		var words = src.split(/\s+/);
		
		var method = this.getMethodName();
//		var moveBackCheck = document.getElementById(moveBackCheckId);
//		var moveBack = moveBackCheck.checked;
		
		for (var i = 0; i < words.length; i++) {
			if (!words[i]) continue;
			var keys = this.prepareWord(words[i], method);
			this.testWord(words[i], keys);
			progressBar.value = i / words.length;
		}
		
		tree.focus();
		return true;
	};
	
	/**
	 * Initializes the results tree.
	 */
	this.initResultTree = function() {
		var controller = this;
		const iface = Components.interfaces.nsIAtomService;
		var atomService = Components.classes["@mozilla.org/atom-service;1"]
									.getService(iface);
		var view = {
			rowCount: function () {
				return controller.results.length;
			},
			getCellText: function (row, column) {
				var rowData = controller.results[row];
				if (!rowData) return null;
				var cellData = rowData[column.index];
				if (column.index == 3) return cellData ? "Passed" : "Failed";
				return rowData[column.index];
			},
			setTree: function (treebox) {
				this.treebox = treebox;
			},
			isContainer: function (row) {
				return false;
			},
			isSeparator: function (row) {
				return false;
			},
			isSorted: function () {
				return false;
			},
			getLevel: function (row) {
				return 0;
			},
			getImageSrc: function (row, col) {
				return null;
			},
			getRowProperties: function (row, props) {},
			getCellProperties: function (row, col, props) {
				if (col.index != 3) return;
				var propName = controller.results[row][3] ? "pass" : "fail";
				props.AppendElement(atomService.getAtom(propName));
			},
			getColumnProperties: function (colId, col, props) {}
		};
		var tree = document.getElementById(resultsTreeId);
		tree.view = view;
	};
	
	/**
	 * Attachs AVIM to the hidden textbox.
	 */
	this.attachKeyPressHandler = function() {
		var inputTextBox = document.getElementById(inputTextBoxId);
		if (!inputTextBox) return;
		inputTextBox.addEventListener("keypress", avim.onKeyPress, true);
	};
	
	/**
	 * Initializes the window controller.
	 */
	this.init = function() {
		this.initResultTree();
//		this.attachKeyPressHandler();
	};
}

if (window && !("tester" in window)) {
	window.tester = new AVIMTester();
	addEventListener("load", function (e) {
		tester.init();
	}, false);
}
