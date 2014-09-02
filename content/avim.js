"use strict";

/**
 * Default preferences. Be sure to update defaults/preferences/avim.js to
 * reflect any changes to the default preferences. Initially, this variable
 * should only contain objects whose properties will be modified later on.
 */
let AVIMConfig = {autoMethods: {}, disabledScripts: {}};

function AVIM()	{
	const Cc = Components.classes;
	const Ci = Components.interfaces;
	const Cu = Components.utils;
	
	const PREF_VERSION = 1;
	
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
	const panelBroadcasterId = "avim-status-bc";
	
	const iCloudHostname = "www.icloud.com";
	const GDocsHostname = "docs.google.com";
	const ZohoHostname = "docs.zoho.com";
	
	// Include characters from major scripts that separate words with a space.
	const wordChars =
		"\u0400-\u052f\u2de0-\u2dff\ua640-\ua69f" +	// Cyrillic
		"\u0370-\u03ff\u1f00-\u1fff" +	// Greek
		"A-Za-zÀ-ÖØ-öø-\u02af\u1d00-\u1dbf\u1e00-\u1eff\u2c60-\u2c7f" +
			"\ua720-\ua7ff\uab30-\uab6f\ufb00-\ufb4f" +	// Latin
		"\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff" +	// Arabic
		"\u0590-\u05ff\ufb1d-\ufb40" +	// Hebrew
		"\u0900-\u097f\u1cd0-\u1cff" +	// Devanagari
		"\u02b0-\u02ff" +	// spacing modifier letters
		"0-9" +	// numerals
		"₫\u0303" +	// miscellaneous Vietnamese characters
		"’";	// word-inner punctuation not found in Vietnamese
	const wordRe = new RegExp("[" + wordChars + "]*$");
	
	const $ = function (id) {
		return document.getElementById(id);
	};
	
	/**
	 * Returns the given value clamped to a minimum and maximum, inclusive.
	 */
	function clamp(x, min, max) {
		return Math.min(Math.max(x, min), max);
	}
	
	/**
	 * Returns the JavaScript string literal representing the given string.
	 */
	function quoteJS(str) {
		return "\"" + str.replace(/\\/g, "\\\\").replace(/[\b]/g, "\\b")
						 .replace(/\f/g, "\\f").replace(/\n/g, "\\n")
						 .replace(/\r/g, "\\r").replace(/\t/g, "\\t")
						 .replace(/\v/g, "\\v").replace(/"/g, "\\\"") + "\"";
	}
	
	/**
	 * Returns whether VIQR or VIQR* is the current input method, taking into
	 * account whether they are enabled for Auto.
	 *
	 * @returns {bool}	True if VIQR or VIQR* is the current input method.
	 */
	function methodIsVIQR() {
		if (AVIMConfig.method > 2) return true;
		return AVIMConfig.method == 0 && (AVIMConfig.autoMethods.viqr ||
										  AVIMConfig.autoMethods.viqrStar);
	}
	
	/**
	 * Returns the last word in the given string.
	 *
	 * If VIQR is the current input method, this function may return “\”.
	 */
	function lastWordInString(str) {
		if (!str) return "";
		if (str.substr(-1) === "\\" && methodIsVIQR()) return "\\";
		let match = wordRe.exec(str);
		return match && match[0];
	}
	
	const subscriptLoader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
		.getService(Ci.mozIJSSubScriptLoader);
	
	/**
	 * A wrapper around a transparent (i.e., Xray-less) Components.utils.Sandbox
	 * that restricts property access by type.
	 *
	 * @param principal	{object}	The security principal, also used as the
	 * 								prototype object.
	 */
	function Sandbox(principal) {
		let sandbox = new Cu.Sandbox(principal, {
			sandboxName: "avim",
			sandboxPrototype: principal,
			wantXrays: false,
		});
		if (!sandbox) throw "No sandbox to evaluate in.";
		
		const jsVersion = "1.7";
		const evalInBox = Cu.evalInSandbox;
		
		/**
		 * Evaluates a statement in the given sandbox and returns a string.
		 */
		this.evalString = function (text) {
			return evalInBox("(" + text + ")+''", sandbox, jsVersion);
		};
		
		/**
		 * Evaluates a statement in the given sandbox and returns a Boolean.
		 */
		this.evalBoolean = function (text) {
			return evalInBox("!!(" + text + ")", sandbox, jsVersion);
		};
		
		/**
		 * Evaluates a statement in the given sandbox and returns an integer.
		 */
		this.evalInt = function (text) {
			return parseInt(evalInBox("(" + text + ")+0", sandbox, jsVersion),
							0);
		};
		
		///**
		// * Evaluates a statement in the given sandbox and returns a floating
		// * point number.
		// */
		//this.evalFloat = function (text) {
		//	return parseFloat(evalInBox("(" + text + ")+0", sandbox, jsVersion));
		//};
		
		/**
		 * Evaluates a statement in the given sandbox without returning
		 * anything.
		 */
		this.evalFunctionCall = function (text) {
			evalInBox(text, sandbox, jsVersion);
		};
		
		/**
		 * Assigns the evaluated result of a single JavaScript statement to the
		 * given property on the sandbox. The property does not become visible
		 * to the webpage.
		 *
		 * @returns True if the statement evaluates to a defined value.
		 */
		this.createObjectAlias = function (name, text) {
			sandbox[name] = evalInBox("(" + text + ")||undefined", sandbox,
									  jsVersion);
			return sandbox[name] !== undefined;
		};
		
		/**
		 * Imports a function into the sandbox with the given name.
		 */
		this.importFunction = function (fn, name) {
			sandbox.importFunction(fn, name);
		};
		
		/**
		 * Injects a script with the given URI into the sandbox.
		 * 
		 * @see http://dxr.mozilla.org/mozilla-central/source/addon-sdk/source/lib/sdk/content/sandbox.js (importScripts())
		 */
		this.injectScript = function (uri) {
			subscriptLoader.loadSubScript(uri, sandbox, "UTF-8");
		};
	}
	
	/**
	 * Proxy for a specialized editor to appear as an ordinary HTML text field
	 * control to the rest of the AVIM codebase.
	 */
	function TextControlProxy() {
		this.type = "text";
	}
	
	/**
	 * @see https://developer.mozilla.org/en/DOM/Input.setSelectionRange
	 */
	TextControlProxy.prototype.setSelectionRange = function(start, end) {
		this.selectionStart = start;
		this.selectionEnd = end;
	};
	
	/**
	 * Proxy for a Ymacs editor to pose as an ordinary HTML <textarea>.
	 * 
	 * @param sandbox	{object}	JavaScript sandbox in the current page's
	 * 								context.
	 */
	function YmacsProxy(sandbox) {
		sandbox.createObjectAlias("$buffer", "ymacs.getActiveBuffer()");
		if (sandbox.evalBoolean("$buffer.transientMarker&&" +
								"$buffer.caretMarker.position!==" +
								"$buffer.transientMarker.position")) {
			throw "Non-empty selection";
		}
		let oldSelection = {
			row: sandbox.evalInt("$buffer.caretMarker.rowcol.row"),
			column: sandbox.evalInt("$buffer.caretMarker.rowcol.col"),
		};
		this.selectionStart = this.selectionEnd = oldSelection.column;
		
		this.oldLine = sandbox.evalString("$buffer.getLine(" +
										   oldSelection.row + ")");
		let word = lastWordInString(this.oldLine.substr(0, oldSelection.column));
		this.value = word;
		
		/**
		 * Updates the Ymacs editor represented by this proxy to reflect any
		 * changes made to the proxy.
		 * 
		 * @returns {boolean}	True if anything was changed; false otherwise.
		 */
		this.commit = function() {
			if (word == this.value) return false;
			
			let linePos = sandbox.evalInt("$buffer._rowColToPosition(" +
										  oldSelection.row + ",0)");
			let line = this.oldLine.substr(0, oldSelection.column - word.length) +
				this.value + this.oldLine.substr(oldSelection.column);
			let pos = linePos + oldSelection.column + line.length -
				this.oldLine.length;
			sandbox.evalFunctionCall("$buffer._replaceLine(" +
									 oldSelection.row + "," + quoteJS(line) +
									 ")");
			sandbox.evalFunctionCall("$buffer.redrawDirtyLines()");
			sandbox.evalFunctionCall("$buffer.caretMarker.setPosition(" + pos +
									 ")");
			//let after = sandbox.evalString("$buffer.getLine(" +
			//							   oldSelection.row + ")");
			
			return true;
		};
	};
	YmacsProxy.prototype = new TextControlProxy();
	
	/**
	 * Returns the current position of the cursor in the given SciMoz plugin
	 * object.
	 *
	 * @param scintilla	{object}	The plugin's <xul:scintilla> tag.
	 * @param selId	{number}		The selection range number. By default, this
	 *								parameter is 0 (for the main selection).
	 * @param lineNum {number}		The line number of a line within a
	 *								rectangular selection. Omit if the selection
	 *								is non-rectangular.
	 * @returns {number}	The current cursor position, or -1 if the cursor
	 * 						cannot be found.
	 */
	function sciMozGetCursorPosition(scintilla, selId, lineNum) {
		if ((selId || 0) >= scintilla.selections) return -1;
		
		// Rectangular selection
		if (lineNum != undefined) {
			let caretPos = scintilla.getSelectionNCaret(0);
			let colNum = scintilla.getColumn(caretPos);
			let anchorPos = scintilla.getSelectionNAnchor(0);
			if (colNum != scintilla.getColumn(anchorPos)) return -1;
			
			let linePos = scintilla.positionFromLine(lineNum);
			caretPos = scintilla.findColumn(lineNum, colNum);
			return scintilla.charPosAtPosition(caretPos) -
				scintilla.charPosAtPosition(linePos);
		}
		
		let caretPos = scintilla.getSelectionNCaret(selId || 0);
		if (caretPos != scintilla.getSelectionNAnchor(selId || 0)) return -1;
		lineNum = scintilla.lineFromPosition(caretPos);
		let linePos = scintilla.positionFromLine(lineNum);
		return scintilla.charPosAtPosition(caretPos) -
			scintilla.charPosAtPosition(linePos);
	};
	
	/**
	 * Retrieves the current line from the SciMoz plugin.
	 *
	 * @param el	{object}	The plugin's <xul:scintilla> tag.
	 * @param selId	{number}	The selection range number. By default, this
	 * 							parameter is 0 (for the main selection).
	 * @param lineNum {number}	The line number of a line within a rectangular
	 *							selection. Omit if the selection is
	 *							non-rectangular.
	 * @returns {string}	The text of the current line.
	 */
	function sciMozGetLine(scintilla, selId, lineNum) {
		if ((selId || 0) >= scintilla.selections) return -1;
		
		// Non-rectangular selection
		if (lineNum == undefined) {
			let caretPos = scintilla.getSelectionNCaret(selId || 0);
			lineNum = scintilla.lineFromPosition(caretPos);
		}
		
		let startPos = scintilla.positionFromLine(lineNum);
		let endPos = scintilla.getLineEndPosition(lineNum);
		return scintilla.getTextRange(startPos, endPos);
	};
	
	/**
	 * Proxy for a SciMoz plugin object posing as an ordinary HTML <input>
	 * element.
	 *
	 * @param elt		{object}	The <xul:scintilla> tag.
	 * @param selId		{number}	The selection range number. By default, this
	 * 								parameter is 0 (for the main selection).
	 * @param lineNum	{number}	The line number of a line within a
	 *								rectangular selection. Omit if the selection
	 *								is non-rectangular.
	 */
	function SciMozProxy(elt, selId, lineNum) {
		if ((selId || 0) >= elt.selections) return;
		
		this.elt = elt;
//		dump("---SciMozProxy---\n");											// debug
		
		// Save the current selection.
		let selectionIsRectangle = elt.selectionMode == elt.SC_SEL_RECTANGLE ||
			elt.selectionMode == elt.SC_SEL_THIN;
		if (selectionIsRectangle) {
			this.oldSelectionStart = {
				line: elt.lineFromPosition(elt.rectangularSelectionAnchor),
				col: elt.getColumn(elt.getSelectionNAnchor(0))
			};
			this.oldSelectionEnd = {
				line: elt.lineFromPosition(elt.rectangularSelectionCaret),
				col: elt.getColumn(elt.getSelectionNCaret(0))
			};
		}
		else {
			this.oldSelectionStart = elt.getSelectionNAnchor(selId);
			this.oldSelectionEnd = elt.getSelectionNCaret(selId);
		}
		
		this.selectionStart = sciMozGetCursorPosition(elt, selId, lineNum);
		this.selectionEnd = this.selectionStart;
//		dump("\tselectionStart: " + this.selectionStart + "\n");				// debug
		if (this.selectionStart < 0) return;
		this.oldLine = sciMozGetLine(elt, selId, lineNum)
		let word = lastWordInString(this.oldLine.substr(0, this.selectionStart));
		this.value = word;
//		dump("\t<" + this.value + ">\n");										// debug
		
		/**
		 * Reselects the rectangular region that was selected prior to being
		 * edited through this proxy.
		 * 
		 * @param colChange	{number}	Number of columns to the right to shift
		 *								the caret by.
		 */
		this.reselectRectangle = function(colChange) {
			elt.clearSelections();
			
			colChange = colChange || 0;
			let anchor = elt.findColumn(this.oldSelectionStart.line,
										this.oldSelectionStart.col + colChange);
			let caret = elt.findColumn(this.oldSelectionEnd.line,
									   this.oldSelectionEnd.col + colChange);
			
			elt.rectangularSelectionAnchor = anchor;
			elt.rectangularSelectionCaret = caret;
//			dump(">>> Selected " + this.oldSelectionStart.line + ":" +
//				 this.oldSelectionStart.col + "-" +
//				 this.oldSelectionEnd.line + ":" +
//				 this.oldSelectionEnd.col + "\n");	// debug
		};
		
		/**
		 * Updates the represented editor to reflect any changes to this proxy.
		 * 
		 * @param beginUndoGroup	{boolean}	True to begin a new undo group.
		 * @returns {boolean}	True if the text changed.
		 */
		this.commit = function() {
			if (this.value == word) return false;
			
			// Select the word up to the cursor.
			if (!selectionIsRectangle) {
				lineNum = elt.lineFromPosition(elt.getSelectionNStart(selId));
			}
			let linePos = elt.positionFromLine(lineNum);
//			dump(">>> Line " + lineNum + ", position " + linePos + "\n");		// debug
			if (selectionIsRectangle) elt.clearSelections();
			let startPos = elt.positionAtChar(linePos,
											  this.selectionStart - word.length);
			elt.setSelectionNStart(selId, startPos);
			let endPos = elt.positionAtChar(linePos, this.selectionStart);
			elt.setSelectionNEnd(selId, endPos);
//			dump(">>> Selected " + elt.selectionStart + "-" + elt.selectionEnd + "\n");	// debug
			
			// Replace the selected word.
//			dump(">>> Replacing '" + elt.selText + "' with '" + this.value + "'.\n");	// debug
			// TODO: This will trample on any other selections.
			elt.replaceSel(this.value);
			
			// Reset the selection.
			if (selectionIsRectangle) {
				// If we're on the last line of the selection, move the caret.
				let colChange = 0;
				if (lineNum == Math.max(this.oldSelectionStart.line,
										this.oldSelectionEnd.line)) {
					colChange = this.value.length - word.length;
				}
				
				this.reselectRectangle(colChange);
			}
			else {
				let colChange = this.value.length - word.length;
				let caretPos = elt.positionAtChar(linePos, this.selectionStart +
														   colChange);
				elt.setSelectionNStart(selId, caretPos);
				elt.setSelectionNEnd(selId, caretPos);
//				dump(">>> After: " + elt.getSelectionNStart(selId) + "-" +
//					 elt.getSelectionNEnd(selId) + "\n");							// debug
			}
//			dump("\t<" + sciMozGetLine(elt, selId) + ">\n");	// debug
			
			return true;
		};
	};
	SciMozProxy.prototype = new TextControlProxy();
	
	/*
	 * Proxy for a Google Kix editor to pose as an ordinary HTML <textarea>.
	 * 
	 * @param evt	{object}	The keyPress event.
	 */
	function KixProxy(evt) {
		if (evt.keyCode == evt.DOM_VK_BACK_SPACE && !evt.shiftKey) {
			throw "Backspace.";
		}
		
		let doc = evt.originalTarget.ownerDocument;
		if (!doc || !doc.body) throw "No document body to copy from.";
		
		let winUtils = QueryInterface(Ci.nsIInterfaceRequestor)
			.getInterface(Ci.nsIDOMWindowUtils);
		if (!winUtils || !("sendKeyEvent" in winUtils &&
						   "sendCompositionEvent" in winUtils &&
						   "sendContentCommandEvent" in winUtils)) {
			// Parts of the API are only available starting in Gecko 1.9 or 2.0.
			throw "Can't issue native events."
		}
		
		let frame = doc.defaultView.frameElement;
		if (!frame) throw "Not in iframe.";
		let frameDoc = frame.ownerDocument;
		
		const overlaySelector = ".kix-selection-overlay,.sketchy-text-selection-overlay";
		//const presItemType = "http://schema.org/CreativeWork/PresentationObject";
		const drawingItemType = "http://schema.org/CreativeWork/DrawingObject";
		
		/**
		 * Returns whether text is currently selected in the editor, as
		 * indicated by the presence of a selection rectangle overlay.
		 */
		this.hasSelection = function() {
			return frameDoc.querySelectorAll(overlaySelector).length;
		};
		
		const tablePropsSel = "[role='menuitem'][aria-disabled='false'] " +
			"[aria-label^='Table properties']";
		const altTextSel = "[role='menuitem'][aria-disabled='false'] " +
			"[aria-label^='Alt text']";
		
		/**
		 * Returns whether the caret is currently in a table.
		 *
		 * The caret is in a table if the Table | Table Properties menu item is
		 * enabled.
		 *
		 * @returns {boolean}	True if the caret is in a table; false
		 * 						otherwise.
		 */
		this.isInTable = function() {
			return frameDoc.querySelector(tablePropsSel);
		};
		
		/**
		 * Returns whether a resizable (i.e., non-text) object is selected.
		 */
		this.isObjectSelected = function () {
			return frameDoc.querySelector(altTextSel);
		};
		
		/**
		 * Generates a key event that selects the previous word or optionally to
		 * to beginning of the line.
		 *
		 * Mozilla observes the following platform-specific bindings for
		 * cmd_selectWordPrevious:
		 * 	/content/xbl/builtin/unix/platformHTMLBindings.xml	VK_LEFT	control,shift
		 * 	/content/xbl/builtin/mac/platformHTMLBindings.xml	VK_LEFT	alt,shift
		 * 	/content/xbl/builtin/emacs/platformHTMLBindings.xml	VK_LEFT	control,shift
		 * 	/content/xbl/builtin/win/platformHTMLBindings.xml	VK_LEFT	control,shift
		 * and for cmd_selectBeginLine:
		 * 	/content/xbl/builtin/unix/platformHTMLBindings.xml	VK_HOME	shift
		 * 	/content/xbl/builtin/mac/platformHTMLBindings.xml	VK_LEFT	accel,shift
		 * 	/content/xbl/builtin/emacs/platformHTMLBindings.xml	VK_HOME	shift
		 * 	/content/xbl/builtin/win/platformHTMLBindings.xml	VK_HOME	shift
		 *
		 * @param toLineStart	{boolean}	True to extend the selection to the
		 * 									start of the line; false otherwise.
		 */
		this.selectPrecedingWord = function(toLineStart) {
//			dump("KixProxy.selectPrecedingWord()\n");							// debug
			let key = (isMac || !toLineStart) ?
				KeyEvent.DOM_VK_LEFT : KeyEvent.DOM_VK_HOME;
			let modifiers = (isMac || toLineStart) ?
				Event.SHIFT_MASK : (Event.CONTROL_MASK | Event.SHIFT_MASK);
			if (isMac) {
				modifiers |= toLineStart ? Event.META_MASK : Event.ALT_MASK;
			}
			winUtils.sendKeyEvent("keypress", key, 0, modifiers);
		};
		
		const board = Cc["@mozilla.org/widget/clipboard;1"]
			.getService(Ci.nsIClipboard);
		
		/**
		 * Returns the contents of the clipboard.
		 */
		this.getClipboardData = function () {
			if (!board.hasDataMatchingFlavors(["text/unicode"], 1,
											  board.kGlobalClipboard)) {
				return false;
			}
			let xfer = Cc["@mozilla.org/widget/transferable;1"]
				.createInstance(Ci.nsITransferable);
			// TODO: Use the text/html flavor to retain formatting.
			xfer.addDataFlavor("text/unicode");
			board.getData(xfer, board.kGlobalClipboard);
			return xfer;
		};
		
		/**
		 * Returns the text contents of the clipboard.
		 */
		this.getClipboardText = function() {
			let xfer = this.getClipboardData();
			if (!xfer) return "";
			
			// https://developer.mozilla.org/en/Using_the_Clipboard
			let str = new Object(), len = new Object();
			try {
				xfer.getTransferData("text/unicode", str, len);
			}
			catch (exc) {
				// At the beginning of a new line (but not the beginning of the
				// document), the previous line break has been selected.
				return "\n";
			}
			str = str && str.value.QueryInterface(Ci.nsISupportsString);
			// text/unicode is apparently stored as UTF-16.
			str = str && str.data.substring(0, len.value / 2);
			// BOM can occur at the beginning of the document.
			return str != "\ufeff" && str;
		};
		
		/**
		 * Generates a right-arrow key event that returns the selection to where
		 * it was before KixProxy started modifying it.
		 */
		this.revertSelection = function() {
//			dump("KixProxy.revertSelection()\n");								// debug
			winUtils.sendKeyEvent("keypress", KeyEvent.DOM_VK_RIGHT, 0, 0);
		};
		
		/**
		 * Generates a shift-right-arrow key event that removes the leftmost
		 * character from the selection.
		 */
		this.trimLeftSelection = function() {
			winUtils.sendKeyEvent("keypress", KeyEvent.DOM_VK_RIGHT, 0,
								  Event.SHIFT_MASK);
		};
		
		/**
		 * Copies and retrieves the selected text. Callers are responsible for
		 * reverting the clipboard contents.
		 *
		 * @throws {string}	when there was no selection, or the selection was
		 * 					nothing but spaces, in which case the selection is
		 * 					reverted.
		 */
		this.getSelectedText = function(isInTable) {
			// Clear the clipboard.
			board.setData(Cc["@mozilla.org/widget/transferable;1"]
							.createInstance(Ci.nsITransferable),
						  null, board.kGlobalClipboard);
			
			// Copy the word.
			winUtils.sendContentCommandEvent("copy");
			
			// Retrieve the text from the clipboard.
			let value = this.getClipboardText();
			if (!value) {
				// Objects may not be copied as text, but they may be selected.
				if (this.hasSelection()) this.revertSelection();
				return "";
			}
			// Probably the beginning of a line (or the line has just spaces).
			if (!value.trim()) {
				this.revertSelection();
				return "";
			}
			return value;
		};
		
		// Abort if there is a selection. The selection rectangle is an overlay
		// element that can be identified by its (platform-specific) class.
		if (this.hasSelection()) throw "Non-empty selection.";
		
		// Select the previous word.
		let wasInTable = this.isInTable();
//		if (wasInTable) dump("KixProxy -- Caret in table.\n");					// debug
		this.selectPrecedingWord(wasInTable);
		if ((!wasInTable && this.isInTable()) ||
			(frame.ownerDocument.body.getAttribute("itemtype") != drawingItemType &&
			 this.isObjectSelected())) {
			// The selection now lies in the table, so the caret was right after
			// the table.
			this.trimLeftSelection();
			throw "Right after table or resizable object.";
		}
		if (this.hasSelection() > 1) {
//			dump("KixProxy -- More than one line selected.\n");					// debug
			// A horizontal line may have been included in the selection, or the
			// word spans more than one line.
			this.revertSelection();
			// There will only be one word in this selection.
			this.selectPrecedingWord(true);
		}
		
		// Get the selected text.
		let value = this.getSelectedText();
		if (wasInTable && value) {
			//dump("KixProxy -- Reselecting text in table.\n");					// debug
			// Unselect the text, unless the cell and selection are empty.
			this.revertSelection();
			// Reselect the text, this time just the preceding word.
			this.selectPrecedingWord(false);
			value = this.getSelectedText();
		}
		if (!value) throw "No text.";
//		dump("KixProxy -- value: <" + value + ">\n");							// debug
		
		this.value = this.oldValue = value;
		this.selectionStart = this.selectionEnd = this.value.length;
		
		/**
		 * Updates the Kix editor represented by this proxy to reflect any
		 * changes made to the proxy.
		 * 
		 * @returns {boolean}	True if anything was changed; false otherwise.
		 */
		this.commit = function() {
//			dump("KixProxy.commit -- value: <" + this.value + ">; oldValue: <" + this.oldValue + ">\n");	// debug
			if (this.value == this.oldValue) {
				if (this.value) this.revertSelection();
				return false;
			}
			
			let xfer = Cc["@mozilla.org/widget/transferable;1"]
				.createInstance(Ci.nsITransferable);
			// TODO: Use the text/html flavor to retain formatting.
			xfer.addDataFlavor("text/unicode");
			var cStr = Cc["@mozilla.org/supports-string;1"]
				.createInstance(Ci.nsISupportsString);
			cStr.data = this.value;
			xfer.setTransferData("text/unicode", cStr, this.value.length * 2);
			
			// Paste the updated string into the editor.
			// In Kix 3790525131, which sends events to
			// "docs-texteventtarget-iframe", wrapping the paste operation in a
			// composition prevents the selection from flashing.
			// In Kix 3491395419, "kix-clipboard-iframe" inserts a newline after
			// the composition ends, breaking editing.
			//let compose =
			//	!frame.classList.contains("kix-clipboard-iframe") &&
			//	frame.ownerDocument.body.getAttribute("itemtype") != presItemType;
			//if (compose) winUtils.sendCompositionEvent("compositionstart", "", "");
			setTimeout(function () {
				winUtils.sendContentCommandEvent("pasteTransferable", xfer);
			}, 0);
			//if (compose) winUtils.sendCompositionEvent("compositionend", "", "");
			
			return true;
		};
	};
	KixProxy.prototype = new TextControlProxy();
	
	/**
	 * Proxy for the Pages editor to pose as an ordinary HTML <textarea>.
	 * 
	 * @param sandbox	{object}	JavaScript sandbox in the current page's
	 * 								context.
	 */
	function CacTrangProxy(sandbox) {
		if (!sandbox.createObjectAlias("$selection",
									   "GSAUI.selectionController.topSelection[0]")) {
			throw "No selection";
		}
		if (!sandbox.evalBoolean("$selection instanceof GSWP.TextSelection")) {
			throw "Non-text selection";
		}
		if (!sandbox.evalBoolean("$selection.isInsertionPoint()")) {
			throw "Non-empty selection";
		}
		
		if (!sandbox.createObjectAlias("$storage", "$selection.getTextStorage()")) {
			throw "No text storage";
		}
		
		let selectionStart =
			sandbox.evalInt("$selection.getNormalizedRange().location");
		
		let beforeString = sandbox.evalString("$storage.getSubstring(0," +
											  selectionStart + ")");
		let word = this.value = lastWordInString(beforeString);
		if (!word || !word.length) throw "No word";
		let wordStart = selectionStart - word.length;
		
		this.selectionStart = this.selectionEnd = this.value.length;
		
		//dump("\tselection: " + selectionStart + " back to " + wordStart + "\n");	// debug
		//dump("\t<" + word + ">\n");
		
		/**
		 * Updates the editor represented by this proxy to reflect any changes
		 * made to the proxy.
		 * 
		 * @returns {boolean}	True if anything was changed; false otherwise.
		 */
		this.commit = function() {
			if (this.value == word) return false;
			
			//dump(">>> Replacing <" + word + "> with <" + this.value + ">\n");	// debug
			
			sandbox.createObjectAlias("$editor",
									  "GSK.DocumentViewController.currentController." +
									  "canvasViewController.getEditorController()." +
									  "getMostSpecificCurrentEditorOfClass(GSD.Editor)");
			sandbox.createObjectAlias("$wordSelection",
									  "GSWP.TextSelection.createWithStartAndStopAndCaretAffinityAndLeadingEdge(" +
									  "$storage," + wordStart + "," + selectionStart + ",null,null)");
			sandbox.createObjectAlias("$cmd", "$editor._createReplaceTextCommand(" +
									  "$wordSelection," + quoteJS(this.value) +
									  ")");
			sandbox.evalFunctionCall("$editor._executeCommand($cmd)");
			
			return true;
		};
	};
	CacTrangProxy.prototype = new TextControlProxy();
	
	/**
	 * Proxy for the Zoho Writer editor to pose as an ordinary HTML <textarea>.
	 * 
	 * @param sandbox	{object}	JavaScript sandbox in the current page's
	 * 								context.
	 */
	function ZWriteProxy(sandbox) {
		if (!sandbox.createObjectAlias("$cursor", "editor.doc.cursor")) {
			throw "No cursor";
		}
		if (!sandbox.evalBoolean("$cursor.isCollapsed()")) {
			throw "Non-empty selection";
		}
		
		//* One-based
		let selectionStart = sandbox.evalInt("$cursor.getWord().getStart()");
		//* One-based
		let selectionEnd = sandbox.evalInt("$cursor.getEnd()");
		
		let word = sandbox.evalString("editor.doc.getContent(" + selectionStart +
									  "," + selectionEnd + ")");
		if (!word || !word.length) throw "No word";
		this.value = word;
		
		//dump(">>> ZWriteProxy -- word: " + word + "\n");							// debug
		
		/**
		 * Updates the editor represented by this proxy to reflect any changes
		 * made to the proxy.
		 * 
		 * @returns {boolean}	True if anything was changed; false otherwise.
		 */
		this.commit = function() {
			if (this.value == word) return false;
			
			//dump(">>> ZWriteProxy -- Replacing <" + word + "> with <" + this.value + ">\n");	// debug
			
			sandbox.evalFunctionCall("Selection.deleteContents(" + selectionStart +
									 "," + selectionEnd + ")");
			sandbox.evalFunctionCall("$cursor.insert(editor.doc.createElement(" +
									 "NODE_TYPE.TEXT," + quoteJS(this.value) +
									 "),{})");
			sandbox.evalFunctionCall("Op.sendMsg()");
			return true;
		};
	};
	ZWriteProxy.prototype = new TextControlProxy();
	
	/**
	 * Proxy for the Zoho Show editor to pose as an ordinary HTML <textarea>.
	 * 
	 * @param sandbox	{object}	JavaScript sandbox in the current page's
	 * 								context.
	 */
	function ZShowProxy(sandbox) {
		if (!sandbox.createObjectAlias("$editor", "ShapeEditor.text.editor")) {
			throw "No text editor";
		}
		if (sandbox.evalBoolean("$editor.cursor.getIndex().si!==" +
								"$editor.cursor.getIndex().ei")) {
			throw "Non-empty selection";
		}
		
		sandbox.createObjectAlias("$fromTo", "$editor._getFromTo()");
		let wholeWord = sandbox.evalString("$fromTo.to.element.word.data().text");
		// Yes, charCount() is -1-based!
		let selectionStart = sandbox.evalInt("$fromTo.to.element.charCount") + 1;
		if (selectionStart > wholeWord.length) throw "Starting a new word";
		let word = wholeWord.substr(0, selectionStart);
		if (!word || !word.length) throw "No word";
		this.value = word;
		
		//dump(">>> ZWriteProxy -- word: " + word + "; selectionStart: " + selectionStart + "\n");	// debug
		
		/**
		 * Updates the editor represented by this proxy to reflect any changes
		 * made to the proxy.
		 * 
		 * @returns {boolean}	True if anything was changed; false otherwise.
		 */
		this.commit = function() {
			if (this.value == word) return false;
			
			//dump(">>> ZWriteProxy -- Replacing <" + word + "> with <" + this.value + ">\n");	// debug
			
			sandbox.evalFunctionCall("$editor.backspace();".repeat(selectionStart));
			sandbox.evalFunctionCall("$editor.addText(" + quoteJS(this.value) +
									 ")");
			
			return true;
		};
	};
	ZShowProxy.prototype = new TextControlProxy();
	
	/**
	 * Returns the nsIEditor (or subclass) instance associated with the given
	 * XUL or HTML element.
	 *
	 * @param el	{object}	The XUL or HTML element.
	 * @returns	{object}	The associated nsIEditor instance.
	 */
	function getEditor(el) {
		if (!el) return undefined;
		if (el.editor) return el.editor;
		try {
			return el.QueryInterface(Ci.nsIDOMNSEditableElement).editor;
		}
		catch (e) {}
		try {
			return el.QueryInterface(Ci.nsIEditor).editor;
		}
		catch (e) {}
		try {
			// http://osdir.com/ml/mozilla.devel.editor/2004-10/msg00017.html
			let webNavigation = el.QueryInterface(Ci.nsIInterfaceRequestor)
				.getInterface(Ci.nsIWebNavigation);
			let editingSession = webNavigation
				.QueryInterface(Ci.nsIInterfaceRequestor)
				.getInterface(Ci.nsIEditingSession);
			return editingSession.getEditorForWindow(el);
		}
		catch (e) {}
//		dump("AVIM.getEditor -- couldn't get editor: " + e + "\n");		// debug
		return undefined;
	}
	
	const xformer = Cc["@1ec5.org/avim/transformer;1"].getService().wrappedJSObject;
	function applyKey(word, evt) {
		return xformer.applyKey(word, {
			method: AVIMConfig.method,
			autoMethods: AVIMConfig.autoMethods,
			ckSpell: AVIMConfig.ckSpell,
			informal: AVIMConfig.informal,
			oldAccent: AVIMConfig.oldAccent,
			keyCode: evt.keyCode,
			which: evt.which,
			shiftKey: evt.shiftKey,
		});
	}
	
	/**
	 * Transaction that replaces a particular substring in a text node, keeping
	 * the caret at the end of the modified word for user convenience. Based on
	 * <http://weblogs.mozillazine.org/weirdal/archives/txMgr_transition.txt>.
	 *
	 * @param outer	{object}	A DOM node able to modify the selection range.
	 * @param node	{object}	The DOM text node to be modified.
	 * @param pos	{number}	The zero-based index from which to begin
	 * 							replacing characters.
	 * @param len	{number}	The number of characters to replace.
	 * @param repl	{string}	The replacement string.
	 * @implements Components.interfaces.nsITransaction
	 * @implements Components.interfaces.nsISupports
	 */
	function SpliceTxn(outer, node, pos, len, repl) {
		//* @type Boolean
		this.isTransient = false;
		
		let editor = getEditor(outer);
		let sel = editor && editor.selection;
		this.startOffset = sel && sel.anchorOffset;
		
		/**
		 * Shift the selection to the right by the given number of characters.
		 *
		 * @param numChars	{number}	The number of characters to shift.
		 */
		this.shiftSelection = function(numChars) {
			let editor = getEditor(outer);
			let sel = editor && editor.selection;
			sel.collapse(node, this.startOffset + numChars);
		};
		
		/**
		 * Replaces a substring in the text node with the given substitution.
		 */
		this.doTransaction = this.redoTransaction = function() {
			this.orig = node.substringData(pos, len);
			node.replaceData(pos, len, repl);
			this.shiftSelection(repl.length - len);
		};
		
		/**
		 * Replaces the previously inserted substitution with the original
		 * string.
		 */
		this.undoTransaction = function() {
			node.replaceData(pos, repl.length, this.orig);
			this.shiftSelection(0);
		};
		
		/**
		 * Always fails to merge this transaction into the given transaction.
		 *
		 * @returns {boolean}	False always.
		 */
		this.merge = function(aTransaction) {
			return false;
		};
		
		/**
		 * Returns whether this class implements the interface with the given
		 * IID.
		 *
		 * @param {number}	iid	The unique IID of the interface.
		 * @returns {boolean}	True if this class implements the interface;
		 * 						false otherwise.
		 */
		this.QueryInterface = function(iid) {
			if (iid == Ci.nsITransaction || iid == Ci.nsISupports) return this;
			return null;
		};
	}
	
	/**
	 * Edits the word before the caret according to the given key press event.
	 *
	 * @param outer	{object}	The DOM node being edited.
	 * @param evt	{Event}		The key press event.
	 * @returns {object}	The results of applying the event to the word.
	 */
	function splice(outer, evt) {
		let result = {};
		let editor = getEditor(outer);
		let sel = editor && editor.selection;
		if (!sel || sel.rangeCount != 1 || !sel.isCollapsed) return result;
		let node = sel.anchorNode;
		// In Midas, clicking the end of the line takes the selection out of any
		// text node into the document at large. (#69) When an element is
		// selected, anchorOffset is the number of child nodes preceding the
		// selection.
		if (node == editor.rootElement && sel.anchorOffset) {
			node = node.childNodes[sel.anchorOffset - 1];
			if (node.data) sel.collapse(node, node.data.length);
		}
		if (!sel.anchorOffset || !node.data) return result;
		
		let word = lastWordInString(node.substringData(0, sel.anchorOffset));
		if (word) result = applyKey(word, evt);
//		dump("AVIM.splice -- editor: " + editor + "; old word: " + word + "; new word: " + result.value + "\n");	// debug
		
		// Carry out the transaction.
		if (editor.beginTransaction) editor.beginTransaction();
		try {
			if ("value" in result && result.value != word) {
				let txn = new SpliceTxn(outer, node,
										sel.anchorOffset - word.length,
										word.length, result.value);
				editor.doTransaction(txn);
			}
		}
		finally {
			// If we don't put this line in a finally clause, an error carrying
			// out the transaction will render the application inoperable.
			if (editor.endTransaction) editor.endTransaction();
		}
		
		//// Coalesce the transaction with an existing one.
		//// Assuming transactions are batched at most one level deep.
		//let stack = editor.transactionManager.getUndoList();
		//let txnIndex = stack.numItems - 1;
		//let prev = stack.getItem(txnIndex);
		//let childStack;
		//if (!prev) {
		//	childStack = stack.getChildListForItem(txnIndex);
		//	dump("AVIM.splice() -- childStack.numItems: " + childStack.getNumChildrenForItem(txnIndex) + "\n");	// debug
		//	child = childStack.getItem(childStack.numItems - 1);
		//}
		//prev.merge(txn);
		//// Clean up refcounted transactions.
		//txn = stack = prev = childStack = child = null;
		
		return result;
	};
	
	let isMac = window.navigator.platform == "MacPPC" ||
		window.navigator.platform == "MacIntel";
	
	this.prefsRegistered = false;
	
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
	
	this.onCue = this.offCue = null;
	
	/**
	 * Plays a sound to alert the user that AVIM's settings have changed, in
	 * case all the UI is hidden.
	 */
	this.playCueAfterToggle = function (volume) {
		let enabled = AVIMConfig.onOff;
		if (this.onCue) this.onCue.pause();
		if (this.offCue) this.offCue.pause();
		
		if (volume === undefined) volume = AVIMConfig.volume;
		volume = clamp(volume / 100, 0, 1);
		
		if (enabled && !this.onCue) {
			this.onCue = new Audio("chrome://avim/content/on.wav");
			this.onCue.volume = volume;
			this.onCue.autoplay = true;
		}
		else if (!enabled && !this.offCue) {
			this.offCue = new Audio("chrome://avim/content/off.wav");
			this.offCue.volume = volume;
			this.offCue.autoplay = true;
		}
		else {
			let cue = enabled ? this.onCue : this.offCue;
			cue.volume = volume;
			cue.currentTime = 0;
			cue.play();
		}
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
		
		let method = AVIMConfig.method;
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
	
	function setCheckedState(elt, checked) {
		if (!elt) return;
		if (checked) elt.setAttribute("checked", "true");
		else elt.removeAttribute("checked");
	}
	
	/**
	 * Updates the XUL menus and status bar panel to reflect AVIM's current
	 * state.
	 */
	this.updateUI = function() {
		// Enabled/disabled
		let enabledBcId = $(broadcasterIds.enabled);
		if (enabledBcId) {
			setCheckedState(enabledBcId, AVIMConfig.onOff);
			$("avim-status-enabled").setAttribute("avim-accel", isMac ? "mac" : "");
		}
		
		// Disable methods and options if AVIM is disabled
		for each (let cmdId in commandIds) {
			if (!$(cmdId)) continue;
			$(cmdId).setAttribute("disabled", "" + !AVIMConfig.onOff);
		}
		
		// Method
		for each (let bcId in broadcasterIds.methods) {
			if (!$(bcId)) continue;
			$(bcId).removeAttribute("checked");
			$(bcId).removeAttribute("key");
		}
		let selBc = $(broadcasterIds.methods[AVIMConfig.method]);
		if (selBc) setCheckedState(selBc, true);
		
		// Options
		let spellBc = $(broadcasterIds.spell);
		if (spellBc) setCheckedState(spellBc, AVIMConfig.ckSpell);
		let oldBc = $(broadcasterIds.oldAccents);
		if (oldBc) setCheckedState(oldBc, AVIMConfig.oldAccent);
		
		// Status bar panel and toolbar button
		let panelBc = $(panelBroadcasterId);
		if (!panelBc) return;
		panelBc.setAttribute("label", selBc.getAttribute("label"));
		panelBc.setAttribute("avim-inputmethod", "" + AVIMConfig.method);
		panelBc.setAttribute("avim-disabled", "" + !AVIMConfig.onOff);
		// Ignored by toolbar button.
		panelBc.setAttribute("avim-hidden", "" + !AVIMConfig.statusBarPanel);
	};
	
	/**
	 * Populates the given XUL menu popup with the contents of its parent
	 * element’s context menu popup.
	 */
	this.buildPopup = function (popup) {
		this.updateUI();
		
		let mainPopupId = popup.getAttribute("avim-popupsource");
		let mainPopup = $(mainPopupId);
		if (!mainPopup) return;
		
		let items = [];
		for (let item = mainPopup.firstChild; item; item = item.nextSibling) {
			let clone = item.cloneNode(false);
			if (clone.id) clone.id += "-dynamic";
			items.push(clone);
		}
		if (!items.length) return;
		
		items[0].setAttribute("default", "true");
		
		while (popup.firstChild) popup.removeChild(popup.firstChild);
		for (let i = 0; i < items.length; i++) {
			popup.appendChild(items[i]);
		}
	};
	
	/**
	 * Fires a fake onInput event from the given element. If preventDefault() is
	 * called on the onKeyPress event, most textboxes will not respond
	 * appropriately to AVIM's changes (autocomplete, in-page find, `oninput`
	 * attribute, etc.) unless this method is called.
	 *
	 * @param outer	{object}	A DOM node representing the textbox element.
	 * @param inner	{object}	A DOM node representing the anonymous element.
	 */
	function updateContainer(outer, inner) {
		if (!inner) return;
		if (inner.ownerDocument &&
			(inner.ownerDocument.location.hostname === iCloudHostname ||
			 inner.ownerDocument.location.hostname === GDocsHostname)) {
			return; // #36
		}
		let inputEvent = document.createEvent("Events");
		inputEvent.initEvent("input", true, true);
		if (inner.dispatchEvent) inner.dispatchEvent(inputEvent);
		
		// Autocomplete textboxes for Toolkit
		if (outer && outer.form) {
			let controller = Cc["@mozilla.org/autocomplete/controller;1"]
				.getService(Ci.nsIAutoCompleteController);
			controller.handleEndComposition();
		}
	}
	
	/**
	 * Returns whether AVIM should ignore the given element.
	 *
	 * @param el	{object}	A DOM node representing a textbox element.
	 * @returns {boolean}	True if the element should be ignored; false
	 * 						otherwise.
	 */
	function findIgnore(el) {
		if (!el || !el.getAttribute) return true;
		let id = el.id || el.getAttribute("id");
		if (id && id.toLowerCase &&
			AVIMConfig.exclude.indexOf(id.toLowerCase()) >= 0) {
			return true;
		}
		let name = el.name || el.getAttribute("name");
		if (name && name.toLowerCase &&
			AVIMConfig.exclude.indexOf(name.toLowerCase()) >= 0) {
			return true;
		}
		
		// Honor "ime-mode: disabled" in CSS.
		let win = el.ownerDocument && el.ownerDocument.defaultView;
		if (!win || !win.getComputedStyle) return false;
		let mode = win.getComputedStyle(el, null).getPropertyValue("ime-mode");
		return mode == "disabled";
	}
	
	/**
	 * Handles key presses for WYSIWYG HTML documents (editable through
	 * Mozilla's Midas component).
	 */
	this.ifMoz = function(evt) {
		let elt = evt.originalTarget;
		let win = new XPCNativeWrapper(elt.ownerDocument.defaultView);
		if (findIgnore(elt)) return false;
		if (win.frameElement && findIgnore(win.frameElement)) return false;
		
		let result = splice(win, evt);
		if (result.changed) {
			evt.stopPropagation();
			evt.preventDefault();
			updateContainer(null, elt.ownerDocument.documentElement);
			// A bit of a hack to prevent textboxes from scrolling to the
			// beginning.
			if ("goDoCommand" in window) {
				goDoCommand("cmd_charPrevious");
				goDoCommand("cmd_charNext");
			}
			return false;
		}
		return true;
	};
	
	/**
	 * Returns whether the given key code should be ignored by AVIM.
	 *
	 * @param code	{number}	Virtual key code.
	 * @returns {boolean}	True if AVIM is to ignore the keypress; false
	 * 						otherwise.
	 */
	function checkCode(code) {
		return !AVIMConfig.onOff ||
			(code < KeyEvent.DOM_VK_INSERT &&
			 code != KeyEvent.DOM_VK_BACK_SPACE &&
			 code != KeyEvent.DOM_VK_PRINT &&
			 /* code != KeyEvent.DOM_VK_SPACE && */
			 code != KeyEvent.DOM_VK_RIGHT && code != KeyEvent.DOM_VK_DOWN &&
			 code != KeyEvent.DOM_VK_EXECUTE) ||
			code == KeyEvent.DOM_VK_SCROLL_LOCK;
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
	this.handleKeyPress = function(evt) {
		// https://developer.mozilla.org/en/HTML/Element/input
		// Supported <input> types are: text, search, password (if .passwords),
		// url (if "url" or "urlbar" in .ignoredFieldIds), and email (if
		// "e-mail" or "email" in .ignoredFieldIds).
		const htmlTypes = ["search", "text", "textarea"];
		
		let elt = evt.originalTarget;
//		dump("AVIM.handleKeyPress -- target: " + elt.tagName + "; code: " + evt.which + "\n");	// debug
		if (findIgnore(evt.target) || !elt.type) return false;
		let isHTML = htmlTypes.indexOf(elt.type) >= 0 ||
			(elt.type == "password" && AVIMConfig.passwords) ||
			(elt.type == "url" && (AVIMConfig.exclude.indexOf("url") < 0 ||
								  AVIMConfig.exclude.indexOf("urlbar") < 0)) ||
			(elt.type == "email" && (AVIMConfig.exclude.indexOf("email") < 0 ||
									AVIMConfig.exclude.indexOf("e-mail") < 0));
		if (!isHTML || elt.selectionStart != elt.selectionEnd) return false;
		
		let result = splice(elt, evt);
		if (result.changed) {
			evt.preventDefault();
			updateContainer(elt, elt);
			// A bit of a hack to prevent textboxes from scrolling to the
			// beginning.
			if ("goDoCommand" in window) {
				goDoCommand("cmd_charPrevious");
				goDoCommand("cmd_charNext");
			}
			return false;
		}
		return true;
	};
	
	/**
	 * Handles key presses in the SciMoz plugin. This function is triggered as
	 * soon as the key goes up.
	 *
	 * @param e		{object}	The keypress event.
	 * @param el	{object}	The DOM element node that represents the SciMoz
	 * 							plugin. Defaults to the given event's original
	 * 							target.
	 * @returns {boolean}	True if AVIM plans to modify the input; false
	 * 						otherwise.
	 */
	this.handleSciMoz = function(e, el) {
		if (!el) el = e.originalTarget;
//		dump("AVIM.handleSciMoz -- target: " + el + "; type: " + el.type + "; code: " + e.which + "\n");	// debug
		if (findIgnore(e.target)) return false;
//		dump("xul:scintilla:\n" + [prop for (prop in el)] + "\n");				// debug
//		el.setSelectionNStart(0, 8);											// debug
//		dump(">>> scimoz.getSelectionNStart: " + el.selections ? el.getSelectionNStart(0) : "" + "\n");					// debug
		
		let anyChanged = false;
		el.beginUndoAction();
		try {
			// Fake a native textbox and keypress event for each selection.
			let firstSel = 0;
			let numSel = el.selections;
			
			// Komodo only seems to support one selection at a time, but it does
			// support rectangular selection.
			let selectionIsRectangle = el.selectionMode == el.SC_SEL_RECTANGLE ||
				el.selectionMode == el.SC_SEL_THIN;
			if (selectionIsRectangle) {
				let startLine = el.lineFromPosition(el.rectangularSelectionAnchor);
				let endLine = el.lineFromPosition(el.rectangularSelectionCaret);
				firstSel = Math.min(startLine, endLine);
				numSel = Math.abs(endLine - startLine) + 1;
//				dump(">>> Rectangular selection, lines " + firstSel + "-" +
//					 (firstSel + numSel) + "\n");	// debug
			}
			
			let proxy;
			for (let i = firstSel; i < firstSel + numSel; i++) {
				if (selectionIsRectangle) proxy = new SciMozProxy(el, 0, i);
				else proxy = new SciMozProxy(el, i);
				if (!proxy) continue;
				
				let result = proxy.value && applyKey(proxy.value, e);
				
				if (result) {
					if (result.value) proxy.value = result.value;
					if (result.changed) anyChanged = true;
				}
				if (proxy.commit) proxy.commit();
				proxy = null;
			}
		}
		catch (exc) {
// $if{Debug}
			throw exc;
// $endif{}
		}
		finally {
			el.endUndoAction();
		}
		
		if (anyChanged) {
			e.handled = true;
			e.stopPropagation();
			updateContainer(el, el);
			return false;
		}
		return true;
	};
	
	/**
	 * Returns a parseable string representing the given KeyEvent.
	 *
	 * The returned string must be wrapped in quoteJS() before being passed into
	 * a Sandbox.
	 */
	function keyEventString(evt) {
		return [evt.keyCode, evt.which, evt.shiftKey].join(",");
	}
	
	/**
	 * Returns the result of applyKey() as an array, due to security
	 * restrictions on passing objects.
	 */
	function safeApplyKey(word, evtProxy) {
		let result = applyKey(word, evtProxy);
		return [result.value, result.changed];
	}
	
	/**
	 * Handles key presses in the Ace editor. This function is triggered as soon
	 * soon as the key goes up.
	 *
	 * @param evt	{object}	The keypress event.
	 * @returns {boolean}	True if AVIM plans to modify the input; false
	 * 						otherwise.
	 */
	this.handleAce = function(evt) {
//		dump("AVIM.handleAce\n");												// debug
		let elt = evt.originalTarget.parentNode;
		// <pre class="ace-editor">
		if (!("classList" in elt && elt.classList.contains("ace_editor") &&
			  elt.classList.contains("ace_focus")) || !document.querySelector) {
			return false;
		}
		if (findIgnore(evt.target)) return false;
		
//		dump("---AceProxy---\n");												// debug
		let sandbox = new Sandbox(elt.ownerDocument.defaultView);
		sandbox.createObjectAlias("_avim_evtInfo", "[" + keyEventString(evt) + "]");
		sandbox.createObjectAlias("_avim_textChanged", "false");
		sandbox.importFunction(lastWordInString, "_avim_lastWordInString");
		sandbox.importFunction(safeApplyKey, "_avim_applyKey");
		
		sandbox.injectScript("chrome://avim/content/editors/ace.js");
		
		let changed = sandbox.evalBoolean("_avim_textChanged");
		if (changed) {
			evt.handled = true;
			evt.stopPropagation();
			evt.preventDefault();
			updateContainer(elt, elt);
		}
		return true;
	};
	
	/**
	 * Handles key presses in the Ymacs editor. This function is
	 * triggered as soon soon as the key goes up.
	 *
	 * @param evt	{object}	The keypress event.
	 * @returns {boolean}	True if AVIM plans to modify the input; false
	 * 						otherwise.
	 */
	this.handleYmacs = function(evt) {
		let elt = evt.originalTarget;
		
		let win = elt.ownerDocument.defaultView;
		let sandbox = new Sandbox(win);
		try {
			if (!sandbox.evalBoolean("'YMACS_SRC_PATH'in window&&" +
									 "'ymacs'in window")) {
				return false;
			}
		}
		catch (exc) {
			return false;
		}
		
//		dump("AVIM.handleYmacs\n");												// debug
		
		// Fake a native textbox.
		let proxy = new YmacsProxy(sandbox);
		
		let result = proxy.value && applyKey(proxy.value, evt);
		if (result && result.value) proxy.value = result.value;
		
		proxy.commit();
		proxy = null;
		sandbox = null;
		
		if (result && result.changed) {
			evt.handled = true;
			evt.stopPropagation();
			evt.preventDefault();
			updateContainer(elt, elt);
		}
		return true;
	};
	
	// Silverlight applets
	
	/**
	 * Returns whether AVIM should ignore the element with the given name.
	 *
	 * @param name	{object}	The XAML TextBox element’s name.
	 * @returns {boolean}	True if the element should be ignored; false
	 * 						otherwise.
	 */
	function slightFindIgnore(name) {
		return name.toLowerCase &&
			AVIMConfig.exclude.indexOf(name.toLowerCase()) >= 0;
	}
	
	/**
	 * Attaches AVIM to the given Silverlight applet.
	 *
	 * @param plugin	{object}	An <object> element.
	 */
	function registerSlight(plugin) {
		plugin.setAttribute("data-avim-registering", "true");
		try {
			let sandbox = new Sandbox(plugin.ownerDocument.defaultView);
			sandbox.importFunction(slightFindIgnore, "_avim_findIgnore");
			sandbox.importFunction(lastWordInString, "_avim_lastWordInString");
			sandbox.importFunction(safeApplyKey, "_avim_applyKey");
			
			sandbox.injectScript("chrome://avim/content/editors/slight.js");
		}
		catch (exc) {
// $if{Debug}
			dump(">>> registerSlight -- " + exc + "\n");
			throw exc;
// $endif{}
		}
		plugin.removeAttribute("data-avim-registering");
	}
	
	/**
	 * Attaches AVIM to Silverlight applets whenever their containers load.
	 */
	this.registerSlights = function() {
		let appcontent = $("appcontent");   // browser
		if (!appcontent || !document.querySelectorAll) return;
		
		const slightMimeTypes = ["application/x-silverlight-1",
								 "application/x-silverlight-2",
								 "application/ag-plugin"];
		
		// This is the same event that gPluginHandler listens for to show and
		// hide Click-to-Play.
		appcontent.addEventListener("PluginInstantiated", function (evt) {
			let plugin = evt.originalTarget;
			if (plugin instanceof Ci.nsIObjectLoadingContent &&
				slightMimeTypes.indexOf(plugin.actualType) >= 0) {
				registerSlight(plugin);
			}
		}, true);
	};
	
	/**
	 * Handles key presses in the Kix editor. This function is triggered as soon
	 * soon as the key goes up.
	 *
	 * @param evt	{object}	The keypress event.
	 * @returns {boolean}	True if AVIM plans to modify the input; false
	 * 						otherwise.
	 */
	this.handleKix = function(evt) {
		let elt = evt.originalTarget;
		let frame = elt.ownerDocument.defaultView.frameElement;
		if (!frame || !("classList" in frame) ||
			!(frame.classList.contains("docs-texteventtarget-iframe") ||
			  frame.classList.contains("kix-clipboard-iframe")) ||
			!document.querySelector) {
			return false;
		}
		
//		dump("AVIM.handleKix\n");												// debug
		
		// Get the existing clipboard data in as many formats as the application
		// would likely recognize. Unfortunately, everything else will be lost.
		// TODO: Implement nsIClipboardDragDropHooks to override the clipboard,
		// to avoid dropping any clipboard data.
		const board = Cc["@mozilla.org/widget/clipboard;1"]
			.getService(Ci.nsIClipboard);
		let xfer = Cc["@mozilla.org/widget/transferable;1"]
			.createInstance(Ci.nsITransferable);
		let flavors = [
			// /widget/public/nsITransferable.idl
			"text/plain",				// kTextMime
			"text/unicode",				// kUnicodeMime
			"text/x-moz-text-internal",	// kMozTextInternal
			"text/html",				// kHTMLMime
			//"AOLMAIL",					// kAOLMailMime
			"image/png",				// kPNGImageMime
			"image/jpg",				// kJPEGImageMime
			"image/gif",				// kGIFImageMime
			"application/x-moz-file",	// kFileMime
			// Registering "text/x-moz-url" and its variants cause the
			// application to crash.
			//"text/x-moz-url",			// kURLMime
			//"text/x-moz-url-data",		// kURLDataMime
			//"text/x-moz-url-desc",		// kURLDescriptionMime
			//"text/x-moz-url-priv",		// kURLPrivateMime
			"application/x-moz-nativeimage",// kNativeImageMime
			"application/x-moz-nativehtml",	// kNativeHTMLMime
			
			// /widget/src/xpwidgets/nsClipboardPrivacyHandler.cpp
			"application/x-moz-private-browsing"	// NS_MOZ_DATA_FROM_PRIVATEBROWSING
		];
		for (let i = 0; i < flavors.length; i++) xfer.addDataFlavor(flavors[i]);
		board.getData(xfer, board.kGlobalClipboard);
		
		let result = {};
		try {
			// Fake a native textbox.
			let proxy = new KixProxy(evt);
			
			result = proxy.value && applyKey(proxy.value, evt);
			if (result && result.value) proxy.value = result.value;
			
			proxy.commit();
			proxy = null;
		}
		finally {
			// Revert the clipboard to the preexisting contents.
			board.setData(xfer, null, board.kGlobalClipboard);
			
			// Clear the clipboard.
			//let xfer = Cc["@mozilla.org/widget/transferable;1"]
			//	.createInstance(Ci.nsITransferable);
			//let board = Cc["@mozilla.org/widget/clipboard;1"]
			//	.getService(Ci.nsIClipboard);
			//board.setData(xfer, null, board.kGlobalClipboard);
			//board.emptyClipboard(board.kGlobalClipboard);
		}
		
		if (result && result.changed) {
			evt.handled = true;
			evt.stopPropagation();
			evt.preventDefault();
		}
		return true;
	};
	
	/**
	 * Handles key presses in Pages. This function is triggered as soon soon as
	 * the key goes up.
	 *
	 * @param evt	{object}	The keypress event.
	 * @returns {boolean}	True if AVIM plans to modify the input; false
	 * 						otherwise.
	 */
	this.handleCacTrang = function(evt) {
		let elt = evt.originalTarget;
		
		let win = elt.ownerDocument.defaultView;
		let sandbox = new Sandbox(win);
		try {
			if (!sandbox.evalBoolean("'GSAUI'in window&&" + "'GSF'in window")) {
				return false;
			}
		}
		catch (exc) {
			return false;
		}
		
		//dump(">>> AVIM.handleCacTrang\n");												// debug
		
		// Fake a native textbox.
		let proxy = new CacTrangProxy(sandbox);
		
		let result = proxy.value && applyKey(proxy.value, evt);
		if (result && result.value) proxy.value = result.value;
		
		proxy.commit();
		proxy = null;
		sandbox = null;
		
		if (result && result.changed) {
			evt.handled = true;
			evt.stopPropagation();
			evt.preventDefault();
		}
		return true;
	};
	
	/**
	 * Handles key presses in Zoho Writer. This function is triggered as soon as
	 * the key goes up.
	 *
	 * @param evt	{object}	The keypress event.
	 * @returns {boolean}	True if AVIM plans to modify the input; false
	 * 						otherwise.
	 */
	this.handleZoho = function(evt) {
		let elt = evt.originalTarget;
		
		let win = elt.ownerDocument.defaultView;
		let sandbox = new Sandbox(win);
		let proxyCls;
		try {
			// Zoho Writer
			if (sandbox.evalBoolean("'editor'in window")) {
				proxyCls = ZWriteProxy;
				//dump(">>> AVIM.handleZoho -- ZWriteProxy\n");					// debug
			}
		}
		catch (exc) {}
		try {
			// Zoho Show
			if (sandbox.evalBoolean("'ShapeEditor'in window")) {
				proxyCls = ZShowProxy;
				//dump(">>> AVIM.handleZoho -- ZShowProxy\n");					// debug
			}
		}
		catch (exc) {}
		if (!proxyCls) return false;
		
		// Fake a native textbox.
		let proxy = new proxyCls(sandbox);
		
		let result = proxy.value && applyKey(proxy.value, evt);
		if (result && result.value) proxy.value = result.value;
		
		proxy.commit();
		proxy = null;
		sandbox = null;
		
		if (result && result.changed) {
			evt.handled = true;
			evt.stopPropagation();
			evt.preventDefault();
		}
		return true;
	};
	
	// Integration with Mozilla preferences service
	
	// Root for AVIM preferences
	const prefs = Cc["@mozilla.org/preferences-service;1"]
		.getService(Ci.nsIPrefService).getBranch("extensions.avim.");
	
	/**
	 * Registers an observer so that AVIM automatically reflects changes to its
	 * preferences.
	 */
	this.registerPrefs = function() {
		if (this.prefsRegistered) return;
		this.prefsRegistered = true;
		prefs.QueryInterface(Ci.nsIPrefBranch2);
		prefs.addObserver("", this, false);
		this.getPrefs();
	};
	
	/**
	 * Unregisters the preferences observer as the window is being closed.
	 */
	this.unregisterPrefs = function() {
		this.prefsRegistered = false;
		prefs.removeObserver("", this);
	};
	
	/**
	 * Responds to changes to AVIM preferences.
	 *
	 * @param subject	{object}	the nsIPrefBranch containing the preference.
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
		let boolPrefs = {
			// Basic options
			enabled: AVIMConfig.onOff,
			ignoreMalformed: AVIMConfig.ckSpell,
			oldAccents: AVIMConfig.oldAccent,
			statusBarPanel: AVIMConfig.statusBarPanel,
			
			// Advanced options
			informal: AVIMConfig.informal,
			passwords: AVIMConfig.passwords,
			
			// Auto input method configuration
			"auto.telex": AVIMConfig.autoMethods.telex,
			"auto.vni": AVIMConfig.autoMethods.vni,
			"auto.viqr": AVIMConfig.autoMethods.viqr,
			"auto.viqrStar": AVIMConfig.autoMethods.viqrStar,
			
			// Script monitor
			"scriptMonitor.enabled": AVIMConfig.disabledScripts.enabled,
			"scriptMonitor.avim": AVIMConfig.disabledScripts.AVIM,
			"scriptMonitor.chim": AVIMConfig.disabledScripts.CHIM,
			"scriptMonitor.google": AVIMConfig.disabledScripts.Google,
			"scriptMonitor.mudim": AVIMConfig.disabledScripts.Mudim,
			"scriptMonitor.mViet": AVIMConfig.disabledScripts.MViet,
			"scriptMonitor.vietImeW": AVIMConfig.disabledScripts.VietIMEW,
			"scriptMonitor.vietTyping": AVIMConfig.disabledScripts.VietTyping,
			"scriptMonitor.vietUni": AVIMConfig.disabledScripts.VietUni,
			"scriptMonitor.vinova": AVIMConfig.disabledScripts.Vinova
		};
		if (changedPref) {
			if (changedPref in boolPrefs) {
				prefs.setBoolPref(changedPref, !!boolPrefs[changedPref]);
			}
		}
		else {
			for (let pref in boolPrefs) {
				prefs.setBoolPref(pref, !!boolPrefs[pref]);
			}
		}
		
		// Integer preferences
		if (!changedPref || changedPref == "prefVersion") {
			prefs.setIntPref("prefVersion", AVIMConfig.prefVersion);
		}
		if (!changedPref || changedPref == "method") {
			prefs.setIntPref("method", AVIMConfig.method);
		}
		if (!changedPref || changedPref == "volume") {
			prefs.setIntPref("volume",
							 Math.round(clamp(AVIMConfig.volume, 0, 100)));
		}
		
		// Custom string preferences
		if (!changedPref || changedPref == "ignoredFieldIds") {
			let ids = Cc["@mozilla.org/supports-string;1"]
				.createInstance(Ci.nsISupportsString);
			ids.data = AVIMConfig.exclude.join(" ").toLowerCase();
			prefs.setComplexValue("ignoredFieldIds", Ci.nsISupportsString, ids);
		}
	};
	
	/**
	 * Updates AVIM's current state to reflect the stored preferences.
	 *
	 * @param changedPref	{string}	the name of the preference that changed.
	 */
	this.getPrefs = function(changedPref) {
//		dump("Changed pref: " + changedPref + "\n");							// debug
		let specificPref = true;
		switch (changedPref) {
			default:
				// Fall through when changedPref isn't defined, which happens at
				// startup, when we want to get all the preferences.
				specificPref = false;
			
			case "prefVersion":
				AVIMConfig.prefVersion = prefs.getIntPref("prefVersion");
				if (specificPref) break;
			
			// Basic options
			case "enabled":
				AVIMConfig.onOff = prefs.getBoolPref("enabled");
				if (specificPref) break;
			case "method":
				AVIMConfig.method = prefs.getIntPref("method");
				// In case someone enters an invalid method ID in about:config
				let method = AVIMConfig.method;
				if (method < 0 || method >= broadcasterIds.methods.length) {
					Cc["@mozilla.org/preferences-service;1"]
						.getService(Ci.nsIPrefService)
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
			case "volume":
				AVIMConfig.volume = prefs.getIntPref("volume");
				if (specificPref) break;
			case "passwords":
				AVIMConfig.passwords = prefs.getBoolPref("passwords");
				if (specificPref) break;
			case "ignoredFieldIds":
				let ids = prefs.getComplexValue("ignoredFieldIds",
												Ci.nsISupportsString).data;
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
			case "scriptMonitor.google":
				AVIMConfig.disabledScripts.Google =
					prefs.getBoolPref("scriptMonitor.google");
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
	
	/**
	 * Given a HTML document node, disables any Vietnamese JavaScript input
	 * method editors (IMEs) embedded in the document that may cause conflicts.
	 * If AVIM is disabled, this method does nothing.
	 *
	 * @param doc {object}	An HTML document node.
	 */
	this.disableOthers = function(doc) {
		if (!AVIMConfig.onOff || !AVIMConfig.disabledScripts.enabled) return;
		
		// Avoid disabling other IME extensions.
		if (doc.location.protocol == "chrome:") return;
		
		// Since wrappedJSObject is only safe in Firefox 3 and above, sandbox
		// all operations on it.
		let winWrapper = new XPCNativeWrapper(doc.defaultView);
		let win = winWrapper.wrappedJSObject;
		if (win === undefined || win === null || win === window) return;
		
		// Create a sandbox to execute the code in.
//		dump("inner sandbox URL: " + doc.location.href + "\n");				// debug
		let sandbox = new Sandbox(doc.defaultView);
		let disabledScriptNames = [AVIMConfig.disabledScripts[name] && name
								   for (name in AVIMConfig.disabledScripts)];
		sandbox.createObjectAlias("disabledScripts",
								  quoteJS(disabledScriptNames.join("|")));
		sandbox.injectScript("chrome://avim/content/disabler.js");
		
		sandbox = null;
	};
	
	this.numCtrlPresses = 0;
	this.isWaitingForCtrlKeyUp = false;
	
	/**
	 * Starts listening for Ctrl press events to track the toggling key binding.
	 */
	this.startListeningForCtrl = function () {
		//dump(">>> Start listening with " + this.numCtrlPresses + " key press(es)\n");	// debug
		this.isWaitingForCtrlKeyUp = true;
		if (!this.numCtrlPresses) {
			addEventListener("keyup", this.onKeyUp, true);
			addEventListener("mousedown", this.stopListeningForCtrl, true);
			addEventListener("mouseup", this.stopListeningForCtrl, true);
		}
	};
	
	/**
	 * Stops listening for Ctrl press events and resets the Ctrl key counter.
	 */
	this.stopListeningForCtrl = function () {
		//dump(">>> Stop listening with " + avim.numCtrlPresses + " key press(es)\n");	// debug
		avim.isWaitingForCtrlKeyUp = false;
		avim.numCtrlPresses = 0;
		removeEventListener("keyup", avim.onKeyUp, true);
		removeEventListener("mousedown", avim.stopListeningForCtrl, true);
		removeEventListener("mouseup", avim.stopListeningForCtrl, true);
		return false;
	};
	
	/**
	 * First responder for keydown events.
	 *
	 * @param e {object}	The generated event.
	 */
	this.onKeyDown = function (e) {
		//dump("AVIM.onKeyDown -- code: " + String.fromCharCode(e.which) + " #" + e.which +
		//	 "; target: " + e.target.nodeName + "." + e.target.className + "#" + e.target.id +
		//	 "; originalTarget: " + e.originalTarget.nodeName + "." + e.originalTarget.className + "#" + e.originalTarget.id + "\n");			// debug
		if (e.which == e.DOM_VK_CONTROL && e.ctrlKey && !e.metaKey &&
			!e.altKey && !e.shiftKey) {
			this.startListeningForCtrl();
			return false;
		}
		this.stopListeningForCtrl();
		
		if (e.ctrlKey || e.metaKey || e.altKey || checkCode(e.which)) {
			return false;
		}
		let doc = e.target.ownerDocument;
		if (doc.defaultView == window) doc = e.originalTarget.ownerDocument;
		this.disableOthers(doc);
		
		return false;
	};
	
	/**
	 * First responder for keypress events.
	 *
	 * @param e	{object}	The generated event.
	 * @returns {boolean}	True if AVIM modified the textbox as a result of the
	 * 						keypress.
	 */
	this.onKeyPress = function(e) {
		//dump("AVIM.onKeyPress -- code: " + String.fromCharCode(e.which) + " #" + e.which +
		//	 "; target: " + e.target.nodeName + "." + e.target.className + "#" + e.target.id +
		//	 "; originalTarget: " + e.originalTarget.nodeName + "." + e.originalTarget.className + "#" + e.originalTarget.id + "\n");			// debug
		this.stopListeningForCtrl();
		if (e.ctrlKey || e.metaKey || e.altKey || checkCode(e.which)) {
			return false;
		}
		
		let target = e.target;
		let origTarget = e.originalTarget;
		let doc = target.ownerDocument;
		if (doc.defaultView == window) doc = origTarget.ownerDocument;
		
		// SciMoz plugin
		let koManager = window.ko && ko.views && ko.views.manager;
		let koView = koManager && koManager.currentView;
		let scintilla = koView && koView.scintilla;
		if (scintilla && scintilla.inputField &&
			origTarget == scintilla.inputField.inputField) {
			return this.handleSciMoz(e, ko.views.manager.currentView.scimoz);
		}
		
		// Specialized Web editors
		let tagName = origTarget.localName.toLowerCase();
		try {
			// iCloud Pages
			if (doc.location.hostname === iCloudHostname &&
				origTarget.isContentEditable) {
				return this.handleCacTrang(e);
			}
			
			// Google Kix
			if (doc.defaultView.frameElement && doc.defaultView.parent &&
				doc.defaultView.parent.location.hostname === GDocsHostname &&
				origTarget.isContentEditable) {
				return this.handleKix(e);
			}
			
			// Zoho Writer
			if (doc.location.hostname === ZohoHostname &&
				origTarget.isContentEditable) {
				return this.handleZoho(e);
			}
			
			// Ymacs
			if ((tagName == "html" || tagName == "body") &&
				this.handleYmacs(e)) {
				return true;
			}
			
			// ACE editor
			if (tagName == "textarea" && this.handleAce(e)) return true;
		}
		catch (exc) {
// $if{Debug}
			dump(">>> AVIM.onKeyPress -- error on line " + exc.lineNumber +
				 ": " + exc + "\n" + exc.stack + "\n");
// $endif{}
			// Instead of returning here, try to handle it as a normal textbox.
//			return false;
		}
		
		// Rich text editors
		let wysiwyg =
			(doc.designMode && doc.designMode.toLowerCase() == "on") ||
			(target.contentEditable &&
			 target.contentEditable.toLowerCase() == "true");
		if (wysiwyg) return this.ifMoz(e);
		
		// Plain text editors
		return this.handleKeyPress(e);
	};
	
	/**
	 * First responder for keyup events.
	 *
	 * @param e {object}	The generated event.
	 */
	this.onKeyUp = function (e) {
		//dump("AVIM.onKeyUp -- code: " + String.fromCharCode(e.which) + " #" + e.which +
		//	 "; target: " + e.target.nodeName + "." + e.target.className + "#" + e.target.id +
		//	 "; originalTarget: " + e.originalTarget.nodeName + "." + e.originalTarget.className + "#" + e.originalTarget.id + "\n");			// debug
		if (avim && avim.isWaitingForCtrlKeyUp) {
			avim.isWaitingForCtrlKeyUp = false;
			if (e.which == e.DOM_VK_CONTROL && !e.ctrlKey && !e.metaKey &&
				!e.altKey && !e.shiftKey) {
				if (++avim.numCtrlPresses > 1) {
					avim.stopListeningForCtrl();
					avim.toggle(true);
					avim.playCueAfterToggle();
				}
			}
			else avim.stopListeningForCtrl();
		}
		return false;
	};
	
	// IME and DiMENSiON extension
	if (window && "getIMEStatus" in window) {
		let getStatus = getIMEStatus;
		getIMEStatus = function() {
			try {
				return AVIMConfig.onOff || getStatus();
			}
			catch (e) {
				return AVIMConfig.onOff;
			}
		}
	}
	
	/**
	 * Installs the toolbar button with the given ID into the given
	 * toolbar, if it is not already present in the document.
	 *
	 * @param {string} toolbarId The ID of the toolbar to install to.
	 * @param {string} id The ID of the button to install.
	 * @param {string} afterId The ID of the element to insert after. @optional
	 *
	 * <https://developer.mozilla.org/en-US/Add-ons/Code_snippets/Toolbar#Adding_button_by_default>
	 */
	function installToolbarButton(toolbarId, id, afterId) {
		if (!$(id)) {
			let toolbar = $(toolbarId);
			let target = $(toolbarId + "-customization-target") || toolbar;
			
			// If no afterId is given, then append the item to the toolbar
			let before = null;
			if (afterId) {
				let elem = $(afterId);
				if (elem && elem.parentNode == target) {
					before = elem.nextElementSibling;
				}
			}
			
			target.insertItem(id, before);
			toolbar.setAttribute("currentset", toolbar.currentSet);
			document.persist(toolbar.id, "currentset");
			
//			if (toolbarId == "addon-bar") toolbar.collapsed = false;
		}
	}
	
	this.doFirstRun = function () {
		if (AVIMConfig.prefVersion < PREF_VERSION && $("PanelUI-menu-button")) {
			installToolbarButton("nav-bar", "avim-tb");
			AVIMConfig.prefVersion = PREF_VERSION;
			this.setPrefs("prefVersion");
		}
	}
};

(function () {
	if ("avim" in window || window.frameElement) return;
	
	let avim = new AVIM();
	if (!avim) return;
	addEventListener("load", function load(evt) {
		removeEventListener("load", load, false);
		if ("avim" in evt.target.defaultView) return;
		
		evt.target.defaultView.avim = avim;
		avim.registerPrefs();
		avim.updateUI();
		avim.registerSlights();
		avim.doFirstRun();
		
		addEventListener("keydown", function (evt) {
			avim.onKeyDown(evt);
		}, true);
		addEventListener("keypress", function (evt) {
			avim.onKeyPress(evt);
		}, true);
		addEventListener("unload", function unload(evt) {
			removeEventListener("unload", unload, false);
			avim.unregisterPrefs();
		}, false);
	}, false);
})();
