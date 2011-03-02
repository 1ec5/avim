
/**
 * Default preferences. Be sure to update defaults/preferences/avim.js to
 * reflect any changes to the default preferences. Initially, this variable
 * should only contain objects whose properties will be modified later on.
 */
var AVIMConfig = {autoMethods: {}, disabledScripts: {}};

function AVIM()	{
	const Cc = Components.classes;
	const Ci = Components.interfaces;
	const Cu = Components.utils;
	
	this.methods = {
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
	
	const sciMozType = "application/x-scimoz-plugin";
	const slightTypeRe = /application\/(?:x-silverlight.*|ag-plugin)/;
	
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
	
	var $ = function(id) {
		return document.getElementById(id);
	};
	
	var nan = function(w) {
		return isNaN(w) || w == 'e';
	};
	
	/**
	 * Proxy for a specialized editor to appear as an ordinary HTML text field
	 * control to the rest of the AVIM codebase.
	 */
	function TextControlProxy() {}
	
	/**
	 * Proxy for an external toolkit's key events to appear as ordinary DOM key
	 * events to the rest of the AVIM codebase.
	 */
	function TextEventProxy() {}
	
	/**
	 * Proxy for an Ace editor, to encapsulate the oft-renamed
	 * Bespin/Skywriter/Ace API while posing as an ordinary HTML <textarea>.
	 * 
	 * @param sandbox	{object}	JavaScript sandbox in the current page's
	 * 								context. The editor's `env` variable should
	 * 								be defined on the sandbox.
	 */
	function AceProxy(sandbox) {
		this.type = "text";
		
		if (Cu.evalInSandbox("!env.document.selection.isEmpty()", sandbox)) {
			throw "Non-empty selection";
		}
		var selLeadJS = "env.document.selection.selectionLead";
		this.oldSelectionStart =
			{row: Cu.evalInSandbox(selLeadJS + ".row+0", sandbox),
			 column: Cu.evalInSandbox(selLeadJS + ".column+0", sandbox)};
		this.selectionStart = this.selectionEnd = this.oldSelectionStart.column;
		
		this.oldValue = Cu.evalInSandbox("env.document.getLine(" +
										 this.oldSelectionStart.row + ")+''",
										 sandbox);
		this.value = this.oldValue;
		
//		dump("\tselection: " + this.oldSelectionStart.row + ":" + this.oldSelectionStart.column + "\n");	// debug
//		dump("\t<" + this.oldValue + ">");
		
		/**
		 * Updates the Ace editor represented by this proxy to reflect any
		 * changes made to the proxy.
		 * 
		 * @returns {boolean}	True if anything was changed; false otherwise.
		 */
		this.commit = function() {
			if (this.value == this.oldValue) return false;
			
//			dump("Replacing <" + env.document.doc.$lines[this.oldSelectionStart.row].substring(0, 10) + "> ");	// debug
			
			var valueJS = "\"" + this.value.replace('"', "\\\"", "g") + "\"";
			Cu.evalInSandbox("env.document.doc.removeInLine(" +
							 this.oldSelectionStart.row + ",0," +
							 this.oldValue.length + ")", sandbox);
			Cu.evalInSandbox("env.document.doc.insert(" +
							 "env.document.selection.selectionLead," + valueJS +
							 ")", sandbox);
//			dump("with <" + env.document.doc.$lines[this.oldSelectionStart.row] + ">\n");	// debug
			var selectionStart = this.oldSelectionStart;
			selectionStart.column += this.value.length - this.oldValue.length;
			try {
				Cu.evalInSandbox("env.editor.moveCursorToPosition({row:" +
								 selectionStart.row + ",column:" +
								 selectionStart.column + "})", sandbox);
			}
			catch (exc) {
				Cu.evalInSandbox("env.document.selection.moveCursorToPosition" +
								 "({row:" + selectionStart.row + ",column:" +
								 selectionStart.column + "})", sandbox);
			}
//			dump("selection: " + env.document.selection.selectionLead.row + ":" +
//				 env.document.selection.selectionLead.column + "\n");			// debug
			
			return true;
		};
	};
	AceProxy.prototype = new TextControlProxy();
	
	/**
	 * Proxy for a Silverlight input control, to reduce back-and-forth between
	 * JavaScript and Silverlight. This object supports TextBox controls only.
	 *
	 * @param ctl	{object}	The XAML control represented by the proxy.
	 */
	function SlightCtlProxy(ctl) {
		this.ctl = ctl;
		this.type = ctl.getHost().type;
		if ("text" in ctl) this.value = this.oldValue = ctl.text;
//		else if ("password" in ctl) this.value = ctl.password;
		else throw "Not a TextBox control";
		this.selectionStart = this.oldSelectionStart = ctl.selectionStart;
		this.selectionEnd = ctl.selectionStart + ctl.selectionLength;
		
		/**
		 * Updates the Silverlight control represented by this proxy to reflect
		 * any changes made to the proxy.
		 */
		this.commit = function() {
//			if (this.value == this.oldValue) return;
			
			var tooLong = "maxLength" in this.ctl &&
				this.ctl.maxLength && this.value.length > this.ctl.maxLength;
			if ("text" in this.ctl && !tooLong) this.ctl.text = this.value;
//			else if ("password" in this.ctl) this.ctl.password = this.value;
			this.ctl.selectionStart = this.selectionStart;
			this.ctl.selectionLength = this.selectionEnd - this.selectionStart;
		};
	};
	SlightCtlProxy.prototype = new TextControlProxy();
	
	/**
	 * Returns the Gecko-compatible virtual key code for the given Silverlight
	 * virtual key code.
	 *
	 * @param	charCode	{number}	Silverlight virtual key code.
	 * @param	shiftKey	{boolean}	True if the Shift key is held down;
	 * 									false otherwise.
	 * @returns	A Gecko-compatible virtual key code, or 0xff (255) if no virtual
	 * 			key is applicable.
	 *
	 * @see		http://msdn.microsoft.com/en-us/library/bb979636%28VS.95%29.aspx
	 */
	var virtualKeyFromSlight = function(charCode, shiftKey) {
		if (charCode > 19 && charCode < 30) {	// number row
			if (shiftKey) return 0xff;
			else charCode += 28;
		}
		else if (charCode > 29 && charCode < 56) {	// alphabetic
			charCode += 35;
			if (!shiftKey) charCode += 32;
		}
		return charCode;
	};
	
	/**
	 * Proxy for a Silverlight KeyboardEventArgs object posing as a DOM Event
	 * object.
	 *
	 * @param evt		{object}	The Silverlight keydown event.
	 * @param charCode	{number}	A virtual key code from the plugin host.
	 */
	function SlightEvtProxy(evt, charCode) {
		this.evt = evt;
		this.target = evt.source;
		this.shiftKey = evt.shift;
		this.ctrlKey = evt.ctrl;
		this.charCode = charCode || virtualKeyFromSlight(evt.key, evt.shift);
		this.which = this.charCode;
//		dump("SlightEvtProxy -- " + this.which + " = '" + fcc(this.which) + "'\n");			// debug
	};
	SlightEvtProxy.prototype = new TextEventProxy();
	
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
			var caretPos = scintilla.getSelectionNCaret(0);
			var colNum = scintilla.getColumn(caretPos);
			var anchorPos = scintilla.getSelectionNAnchor(0);
			if (colNum != scintilla.getColumn(anchorPos)) return -1;
			
			var linePos = scintilla.positionFromLine(lineNum);
			caretPos = scintilla.findColumn(lineNum, colNum);
			return scintilla.charPosAtPosition(caretPos) -
				scintilla.charPosAtPosition(linePos);
		}
		
		var caretPos = scintilla.getSelectionNCaret(selId || 0);
		if (caretPos != scintilla.getSelectionNAnchor(selId || 0)) return -1;
		lineNum = scintilla.lineFromPosition(caretPos);
		var linePos = scintilla.positionFromLine(lineNum);
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
			var caretPos = scintilla.getSelectionNCaret(selId || 0);
			lineNum = scintilla.lineFromPosition(caretPos);
		}
		
		var startPos = scintilla.positionFromLine(lineNum);
		var endPos = scintilla.getLineEndPosition(lineNum);
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
		this.type = "text";
//		dump("---SciMozProxy---\n");											// debug
		
		// Save the current selection.
		var selectionIsRectangle = elt.selectionMode == elt.SC_SEL_RECTANGLE ||
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
		this.value = this.oldValue = sciMozGetLine(elt, selId, lineNum);
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
			var anchor = elt.findColumn(this.oldSelectionStart.line,
										this.oldSelectionStart.col + colChange);
			var caret = elt.findColumn(this.oldSelectionEnd.line,
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
			if (this.value == this.oldValue) return false;
			
			// Select the entire line, up to the cursor.
			if (!selectionIsRectangle) {
				lineNum = elt.lineFromPosition(elt.getSelectionNStart(selId));
			}
			var linePos = elt.positionFromLine(lineNum);
//			dump(">>> Line " + lineNum + ", position " + linePos + "\n");		// debug
			if (selectionIsRectangle) elt.clearSelections();
			elt.setSelectionNStart(selId, linePos);
			elt.setSelectionNEnd(selId, elt.getLineEndPosition(lineNum));
//			dump(">>> Selected " + elt.selectionStart + "-" + elt.selectionEnd + "\n");	// debug
			
			// Replace the line's contents.
//			dump(">>> Replacing '" + elt.selText + "' with '" + this.value + "'.\n");	// debug
			// TODO: This will trample on any other selections.
			elt.replaceSel(this.value);
			
			// Reset the selection.
			if (selectionIsRectangle) {
				// If we're on the last line of the selection, move the caret.
				var colChange = 0;
				if (lineNum == Math.max(this.oldSelectionStart.line,
										this.oldSelectionEnd.line)) {
					colChange = this.value.length - this.oldValue.length;
				}
				
				this.reselectRectangle(colChange);
			}
			else {
				var colChange = this.value.length - this.oldValue.length;
				var startPos = elt.positionAtChar(linePos, this.selectionStart +
														   colChange);
				elt.setSelectionNStart(selId, startPos);
				var endPos = elt.positionAtChar(linePos, this.selectionEnd +
														 colChange);
				elt.setSelectionNEnd(selId, endPos);
//				dump(">>> After: " + elt.getSelectionNStart(selId) + "-" +
//					 elt.getSelectionNEnd(selId) + "\n");							// debug
			}
//			dump("\t<" + sciMozGetLine(elt, selId) + ">\n");	// debug
			
			return true;
		};
	};
	SciMozProxy.prototype = new TextControlProxy();
	
	/**
	 * Proxy for a SlideKit TextLayer object posing as an ordinary HTML <input>
	 * element.
	 * 
	 * @param sandbox	{object}	JavaScript sandbox in the current page's
	 * 								context. The window and the editor's
	 * 								`textLayer` variable should be defined on
	 * 								the sandbox.
	 */
	function SkitProxy(sandbox) {
		/**
		 * Returns the result of an Objective-J call in the sandbox's context.
		 *
		 * @param type		{string}	Expected return type, as would be
		 * 								returned by `typeof msgSend(...)`.
		 * @param target	{string}	Sandboxed object to send the message to.
		 * @param cmd		{string}	Selector of the message to pass.
		 * @param args		{array}		Arguments in the message to pass.
		 * @param field		{string}	Field within the message's return value.
		 * 
		 * @returns The return value of the sent Objective-J message.
		 */
		var msgSend = function(type, target, sel, args, field) {
			var msgJS = "objj_msgSend(" + target + ",'" + sel + "'";
			if (!args) args = [];
			
// $if{Debug}
			// Ensure the required arguments have been provided.
			var colons = sel.match(/:/g) || [];
			if (args.length < colons.length) {
				throw "Objective-J method -" + sel + " expects " +
					colons.length + " arguments; " + args.length + " given.";
			}
// $endif{}
			
			// Add the arguments, quoting strings and objects.
			for (var i = 0; i < args.length; i++) {
				var arg = args[i];
				if (typeof arg == "string" || typeof arg == "object") {
					arg = "\"" + arg.replace(/"/g, "\\\"") + "\"";
				}
				msgJS += "," + arg;
			}
			msgJS += ")";
			
			if (field) msgJS += "." + field;
			
			// Cast the return value to a safe type.
			switch (type) {
				case "number": msgJS += "+0"; break;
				case "boolean": msgJS = "!!" + msgJS; break;
				case "string": msgJS += "+''"; break;
			}
			
// $if{Debug}
			try {
// $endif{}
				return Cu.evalInSandbox(msgJS, sandbox);
// $if{Debug}
			}
			catch (exc) {
				exc.message += "\n" + "Obj-J: " + msgJS;
				throw exc;
			}
// $endif{}
		};
		
		this.type = "text";
		if (msgSend("boolean", "textLayer", "hasSelection")) {
			throw "Non-empty selection.";
		}
		
		// All this just to get the line-relative offset.
		var selectionRange = {
			location: msgSend("number", "textLayer", "selectedRange", [],
							  "location"),
			length: msgSend("number", "textLayer", "selectedRange", [],
							"length")
		};
//		dump(">>> selectionRange: " + selectionRange.location + "+" + selectionRange.length);	// debug
		// moveCaret:extendSelection: doesn't set the selection ends correctly.
		//sandbox.objj_msgSend(sandbox.textLayer, "moveCaret:extendSelection:",
		//					 1 /* kFirst */, false);
		//var linePos = sandbox.objj_msgSend(sandbox.textLayer, "selectedRange").location;
		var linePosJS = "var p=" + (selectionRange.location - 1) +
			";var c=textLayer._previousCharacter;" +
			"while(c){c=c.previousSibling;if(!c)break;p--;}" +
			"p";
		var linePos = Cu.evalInSandbox(linePosJS, sandbox);
//		dump("; linePos: " + linePos);											// debug
		this.selectionStart = this.selectionEnd =
			selectionRange.location - linePos;
		
		// Get the text value.
		this.value = this.oldValue =
			Cu.evalInSandbox("textLayer._currentParagraph.textContent+''",
							 sandbox).substring(0, this.selectionStart);
//		dump("; value: <" + this.value + ">\n");								// debug
		
		this.commit = function() {
			if (this.value == this.oldValue) return;
			
			// Prepare SlideKit for the changes.
			msgSend(0, "textLayer._undoManager", "beginUndoGrouping");
			
			// Compare the old and new strings, inserting or replacing
			// characters as needed.
			for (var i = 0; i < this.value.length; i++) {
				if (this.value[i] == this.oldValue[i]) continue;
				
				// Select the character.
				var startJS = "textLayer._selectionStart=" +
					"textLayer._currentParagraph.children.item(" + i + ")";
				Cu.evalInSandbox(startJS, sandbox);
				if (this.oldValue[i]) {
					Cu.evalInSandbox("textLayer._selectionEnd=" +
									 "textLayer._currentParagraph.children." +
									 "item(" + (i + 1) + ")", sandbox);
				}
				else {
					Cu.evalInSandbox("textLayer._selectionEnd=" +
									 "textLayer._selectionStart", sandbox);
				}
				msgSend(0, "textLayer", "calculateSelectedRange");
				
				// Replace the character.
				if (msgSend("boolean", "textLayer", "hasSelection")) {
					msgSend(0, "textLayer", "deleteSelection");
				}
				msgSend(0, "textLayer", "insertCharacter:stillInserting:",
						[this.value[i], true]);
			}
			
			// Return the caret to its natural position.
			selectionRange.location += this.value.length - this.oldValue.length;
			Cu.evalInSandbox("objj_msgSend(textLayer,'setSelectedRange:'," +
				"{location:" + selectionRange.location + ",length:" +
				selectionRange.length + "})", sandbox);
			
			// Update the rest of SlideKit to reflect the changes.
			msgSend(0, "textLayer._undoManager", "endUndoGrouping");
			msgSend(0, "textLayer", "selectionDidChange");
			msgSend(0, "textLayer", "resize");
			msgSend(0, "textLayer", "positionCaret");
			msgSend(0, "textLayer", "textDidChange");
		};
	};
	SkitProxy.prototype = new TextControlProxy();
	
	/**
	 * Returns the nsIEditor (or subclass) instance associated with the given
	 * XUL or HTML element.
	 *
	 * @param el	{object}	The XUL or HTML element.
	 * @returns	{object}	The associated nsIEditor instance.
	 */
	var getEditor = function(el) {
		if (!el || el instanceof TextControlProxy) {
			return undefined;
		}
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
			var webNavigation = el.QueryInterface(Ci.nsIInterfaceRequestor)
				.getInterface(Ci.nsIWebNavigation);
			var editingSession = webNavigation
				.QueryInterface(Ci.nsIInterfaceRequestor)
				.getInterface(Ci.nsIEditingSession);
			return editingSession.getEditorForWindow(el)
				.QueryInterface(Ci.nsIHTMLObjectResizer);
		}
		catch (e) {}
//		dump("AVIM.getEditor -- couldn't get editor: " + e + "\n");		// debug
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
	 * Transaction that replaces a particular substring in a text node. Based on
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
	var SpliceTxn = function(outer, node, pos, len, repl) {
		//* @type Element
		this.outer = outer;
		//* @type Text
		this.node = node;
		//* @type Number
		this.pos = pos;
		//* @type Number
		this.len = len;
		//* @type String
		this.repl = repl;
		
		//* @type Boolean
		this.isTransient = false;
		
		if (outer && "selectionStart" in outer) {
			this.caret = outer.selectionStart;
		}
		
		/**
		 * Shift the selection to the right by the given number of characters.
		 *
		 * @param numChars	{number}	The number of characters to shift.
		 */
		this.shiftSelection = function(numChars) {
			if (!this.outer) return;
			if ("caret" in this) {
				var pos = this.caret + numChars;
//				dump("AVIM.SpliceTxn.shiftSelection -- numChars: " + numChars + "; pos: " + pos + "\n");	// debug
				this.outer.selectionStart = this.outer.selectionEnd = pos;
//				return;
			}
			//else if (window.goDoCommand) {
			//	// No idea why this works!
			//	goDoCommand("cmd_charNext");
			//	goDoCommand("cmd_charNext");
			//}
//			var range = this.outer.getSelection().getRangeAt(0);
//			range.setStart(this.node, range.startOffset + numChars);
		};
		
		/**
		 * Replaces a substring in the text node with the given substitution.
		 */
		this.doTransaction = this.redoTransaction = function() {
			this.orig = this.node.substringData(this.pos, this.len);
			this.node.replaceData(this.pos, this.len, this.repl);
			this.shiftSelection(this.repl.length - this.len);
		};
		
		/**
		 * Replaces the previously inserted substitution with the original
		 * string.
		 */
		this.undoTransaction = function() {
			this.node.replaceData(this.pos, this.repl.length, this.orig);
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
		// Anonymous node-based editing
		try {
			var editor = getEditor(el);
//			dump("AVIM.splice -- editor: " + editor + "; repl: " + repl + "\n");	// debug
			var anchorNode = editor.selection.anchorNode;
			var absPos = el.selectionStart;
			var relPos = editor.selection.anchorOffset;
			if (anchorNode == editor.rootElement) {
				var pos = 0;
				for (var i = 0; i < anchorNode.childNodes.length; i++) {
					var child = anchorNode.childNodes[i];
					if (child.nodeType != el.TEXT_NODE) {
						pos++;
						continue;
					}
					pos += child.length;
					if (pos < absPos) continue;
					anchorNode = child;
					break;
				}
				relPos = anchorNode.textContent.length;
			}
			var replPos = index + relPos - absPos;
			
			// Carry out the transaction.
			var txn = new SpliceTxn(el, anchorNode, replPos, len, repl);
			editor.doTransaction(txn);
			
			//// Coalesce the transaction with an existing one.
			//// Assuming transactions are batched at most one level deep.
			//var stack = editor.transactionManager.getUndoList();
			//var txnIndex = stack.numItems - 1;
			//var prev = stack.getItem(txnIndex);
			//var childStack;
			//if (!prev) {
			//	childStack = stack.getChildListForItem(txnIndex);
			//	dump("AVIM.splice() -- childStack.numItems: " + childStack.getNumChildrenForItem(txnIndex) + "\n");	// debug
			//	child = childStack.getItem(childStack.numItems - 1);
			//}
			//prev.merge(txn);
			//// Clean up refcounted transactions.
			//txn = stack = prev = childStack = child = null;
			return repl.length - len;
		}
		catch (e) {}
		
		// Ordinary DOM editing
		var val = el.value;
		el.value = val.substr(0, index) + repl + val.substr(index + len);
//		dump("splice() -- <" + val + "> -> <" + el.value + ">\n");				// debug
		return repl.length - len;
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
	
	// Include characters from major scripts that separate words with a space.
	var wordChars =
		"\u0400-\u052f\u2de0-\u2dff\ua640-\ua69f" +	// Cyrillic
		"\u0370-\u03ff\u1f00-\u1fff" +	// Greek
		"A-Za-zÀ-ÖØ-öø-\u02af\u1d00-\u1dbf\u1e00-\u1eff\u2c60-\u2c7f" +
			"\ua720-\ua7ff\ufb00-\ufb4f" +	// Latin
		"\u0600-\u06ff\u0750-\u077f\ufb50-\ufdff\ufe70-\ufeff" +	// Arabic
		"\u0590-\u05ff\ufb1d-\ufb40" +	// Hebrew
		"\u0900-\u097f" +	// Devanagari
		"\u02b0-\u02ff" +	// spacing modifier letters
		"0-9" +	// numerals
		"₫\u0303" +	// miscellaneous Vietnamese characters
		"’";	// word-inner punctuation not found in Vietnamese
	var wordRe = new RegExp("[" + wordChars + "]*$");
	
	var isMac = window.navigator.platform == "MacPPC" ||
		window.navigator.platform == "MacIntel";
	
	this.prefsRegistered = false;
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
		
		var uk = up(k);
		
		// Đồng sign after a number: valid
		var num = /^([0-9]+)(d?)$/.exec(w);
		var isVni = AVIMConfig.method == 2 ||
			(AVIMConfig.method == 0 && AVIMConfig.autoMethods.vni);
		if (num) {
			// Entering the first D: valid
			if (!num[2] && uk == "D") return false;
			
			// Entering the second D: valid
			if (num[2] && uk == this.method.D) return false;
		}
		
		w = this.unV(w);
		var uw = up(w), tw = uw, uw2 = this.unV2(uw), twE;
		var vSConsonant = "BCDĐGHKLMNPQRSTVX";
		var vDConsonant = "[CKNP]H|G[HI]|NGH?|QU|T[HR]";
		if (AVIMConfig.informal) {
			vSConsonant += "F";
			vDConsonant += "|DZ";
		}
		
		// NG~: valid
		if (uw == "NG" && uk == this.method.X && AVIMConfig.informal) {
			return false;
		}
		
		// Non-Vietnamese characters: invalid
		var nonViet = "A-EGHIK-VXYĐ";
		if (AVIMConfig.informal) nonViet += "FZ";
		if (new RegExp("[^" + nonViet + "]").test(uw2)) return true;
		
		// Final consonants with ` ? ~ tones: invalid
		if (this.method.FRX.indexOf(uk) >= 0 && /[CPT]$|CH$/.test(uw)) {
			return true;
		}
		
		// Initial non-Vietnamese consonants: invalid
		if (AVIMConfig.informal) {
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
		if (uk == this.method.AEO && /Ư[AEOƠ]$/.test(tw)) return true;	// ưô
		
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
	
	/**
	 * Returns the current position of the cursor in the given textbox.
	 *
	 * @param obj	{object}	The DOM element representing the current
	 * 							textbox.
	 * @returns {number}	The current cursor position, or -1 if the cursor
	 * 						cannot be found.
	 */
	this.getCursorPosition = function(obj) {
		// Specialized control
		if (obj instanceof TextControlProxy) return obj.selectionStart;
		
		// Anything else
		var data = (obj.data) ? obj.data : text(obj);
		if (!data || !data.length) return -1;
		if (obj.data) return obj.pos;
		if (!obj.setSelectionRange) return -1;
		return obj.selectionStart;
	}
	
	/**
	 * Returns whether VIQR or VIQR* is the current input method, taking into
	 * account whether they are enabled for Auto.
	 *
	 * @returns {bool}	True if VIQR or VIQR* is the current input method.
	 */
	this.methodIsVIQR = function() {
		if (AVIMConfig.method > 2) return true;
		return AVIMConfig.method == 0 && (AVIMConfig.autoMethods.viqr ||
										  AVIMConfig.autoMethods.viqrStar);
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
		var pos = this.getCursorPosition(obj);
		if (pos < 0) return false;
		if (obj.selectionStart != obj.selectionEnd) return ["", pos];
		
		var data = obj.data || text(obj);
		var w = data.substring(0, pos);
		if (w.substr(-1) == "\\" && this.methodIsVIQR()) return ["\\", pos];
		w = wordRe.exec(w);
		return [w ? w[0] : "", pos];
	};
	
	/**
	 * @param obj	{object}	The DOM element representing the current
	 * 							textbox.
	 * @param key	{object}	The keydown event.
	 */
	this.start = function(obj, key) {
		var method = AVIMConfig.method, dockspell = AVIMConfig.ckSpell;
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
		
		var w = this.mozGetText(obj);
//		dump(">>> start() -- w: <" + w + ">\n");								// debug
		if (key.keyCode == 8 /* Backspace */ && key.shiftKey) key = "";
		else key = fcc(key.which);
		if (!w || ("sel" in obj && obj.sel)) return;
		
		var noNormC = this.D2.indexOf(up(key)) >= 0;
		
		for (var i = 0; i < uniA.length; i++) {
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
		var uw = up(word), uk = up(key);
		
		if (/^[0-9]+.$/.test(word)) {
			var lastChar = word.substr(-1);
			if (lastChar == "đ" && uk == this.method.D) {
				// Convert [number]đ (case-sensitive) into the đồng sign.
				this.splice(this.oc, pos - 1, 1, "₫");
				this.changed = true;
			}
			else if (lastChar == "₫" && uk == this.method.D) {
				// On repeat, pull the underline out from under the Đ.
				this.splice(this.oc, pos - 1, 1, "d" + key);
				this.changed = true;
			}
			else if (lastChar == "₫" && uk == this.method.Z) {
				// On remove, revert to a D.
				this.splice(this.oc, pos - 1, 1, "d");
				this.changed = true;
			}
			return;
		}
		
		if (AVIMConfig.informal || !AVIMConfig.ckSpell) {
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
		var method = AVIMConfig.method;
		if (this.methodIsVIQR() && w.substr(-1) == "\\") {
			return [1, k.charCodeAt(0)];
		}
		var str = "", res, cc = "", pc = "", vowA = [], s = "ÂĂÊÔƠƯêâăơôư", c = 0, dn = false, uw = up(w), tv, g;
		var h, uc;
		for (var g = 0; g < sf.length; g++) {
			str += nan(sf[g]) ? sf[g] : fcc(sf[g]);
		}
		var uk = up(k), w2 = up(this.unV2(this.unV(w))), dont = ["ƯA", "ƯU"];
		
		if (this.method.DAWEO.indexOf(uk) >= 0) {
			// Horned diphthongs and triphthongs
			if (uk == this.method.moc) {
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
						if ((uk == this.method.moc && this.unV(uc) == "U" && up(this.unV(w.substr(-g + 1, 1))) == "A") ||
							(uk == this.method.trang && this.unV(uc) == "A" && this.unV(pc) == "U")) {
							tv = 1 + (this.unV(uc) != "U");
							var ccc = up(w.substr(-g - tv, 1));
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
						if(!this.whit || (uw.indexOf("Ư") < 0) || (uw.indexOf("W") < 0)) {
							break;
						}
					} else if(DAWEOFA.indexOf(uc) >= 0) {
						if(uk == this.method.D) {
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
		if (uk != this.method.Z && this.method.DAWEO.indexOf(uk) < 0) {
			tE = this.retKC(uk, true);
		}
		if (this.method.DAWEO.indexOf(uk) < 0) for (var g = 1; g <= w.length; g++) {
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
		if (uk != this.method.Z && typeof(res) != 'object' &&
			this.ckspell(w, k)) {
			return false;
		}
		if (this.method.DAWEO.indexOf(uk) < 0) {
			for (var g = 1; g <= w.length; g++) {
				if (uk != this.method.Z && s.indexOf(w.substr(-g, 1)) >= 0) {
					return g;
				}
				if (tE.indexOf(w.substr(-g, 1)) >= 0) {
					var pos = tE.indexOf(w.substr(-g, 1));
					if (pos >= 0) return [g, skey_str[pos]];
				}
			}
		}
		if (res) return res;
		if (c == 1 || uk == this.method.Z) return vowA[0];
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
//		dump("AVIM.replaceChar -- pos: " + pos + "; original: " + text(o, pos, 1) + "; repl: " + fcc(c) + "\n");	// debug
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
			this.splice(o, pos, 1 + !!r, replaceBy);
			// Native editors only
			if (!(o instanceof TextControlProxy)) {
				o.setSelectionRange(savePos, savePos);
				o.scrollTop = sst;
			}
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
			var doc = o.ownerDocument;
			var winWrapper = new XPCNativeWrapper(doc.defaultView);
			var editor = getEditor(winWrapper);
			if (r) {
				replaceBy = r + replaceBy;
				pos--;
			}
			var txn = new SpliceTxn(winWrapper, o, pos, 1 + !!r, replaceBy);
			editor.doTransaction(txn);
//			o.replaceData(pos, 1, replaceBy);
//			if(r) o.replaceData(pos - 1, 1, r);
		}
		this.whit = false;
	};
	
	/**
	 * @param w	{string}	The word ending at the cursor position.
	 * @param k	{string}	The character equivalent of the pressed key.
	 */
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
	/**
	 * @param w	{string}	The word ending at the cursor position.
	 * @param k	{string}	The character equivalent of the pressed key, or the
	 * 						empty string for diacritic removal.
	 */
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
			case 1: this.method = this.methods.telex; break;
			case 2: this.method = this.methods.vni; break;
			case 3: this.method = this.methods.viqr; break;
			case 4: this.method = this.methods.viqrStar; // break;
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
		var uk = up(k);
		if (alphabet.indexOf(uk) < 0 && this.D2.indexOf(uk) < 0) return w;
		var u = this.repSign(null);
		for(var j = 1; j <= w.length; j++) {
			var h = u.indexOf(w.charCodeAt(w.length - j));
			if (h < 0) continue;
			
			var fS = this.method.X;
			if (h <= 23) fS = this.method.S;
			else if (h <= 47) fS = this.method.F;
			else if (h <= 71) fS = this.method.J;
			else if (h <= 95) fS = this.method.R;
			
			var c = skey[h % 24];
			var sp = this.oc.selectionStart;
			var end = this.oc.selectionEnd;
			var pos = sp;
			w = this.unV(w);
			if(!this.changed) {
				w += k;
				var sst = this.oc.scrollTop;
				pos += k.length;
				if(!this.oc.data) {
//					this.oc.value = this.oc.value.substr(0, sp) + k +
//						this.oc.value.substr(this.oc.selectionEnd);
					this.splice(this.oc, sp, end - sp, k);
					this.changed = true;
					this.oc.scrollTop = sst;
				} else {
					this.oc.insertData(this.oc.pos, k);
					this.range.setEnd(this.oc, ++this.oc.pos);
					this.specialChange = true;
				}
			}
			
			// Specialized control
			else if (this.oc instanceof TextControlProxy) {
				this.oc.selectionStart = this.oc.selectionEnd = pos;
			}
			// Anything else
			else if(!this.oc.data) this.oc.setSelectionRange(pos, pos);
			
			if(!this.ckspell(w, fS)) {
				this.replaceChar(this.oc, i - j, c);
				if(!this.oc.data) this.main(w, fS, pos, [this.method.D], false);
				else {
					var ww = this.mozGetText(this.oc);
					this.main(ww[0], fS, ww[1], [this.method.D], false);
				}
			}
		}
		return "";
	};
	
	const ccA = [aA, mocA, trangA, eA, oA], ccrA = [arA, mocrA, arA, erA, orA];
	this.DAWEOF = function(cc, k, g) {
		var kA = [this.method.A, this.method.moc, this.method.trang,
				  this.method.E, this.method.O];
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
			case this.method.S: chars = "áấắéếíóốớúứýÁẤẮÉẾÍÓỐỚÚỨÝ"; break;
			case this.method.F: chars = "àầằèềìòồờùừỳÀẦẰÈỀÌÒỒỜÙỪỲ"; break;
			case this.method.J: chars = "ạậặẹệịọộợụựỵẠẬẶẸỆỊỌỘỢỤỰỴ"; break;
			case this.method.R: chars = "ảẩẳẻểỉỏổởủửỷẢẨẲẺỂỈỎỔỞỦỬỶ"; break;
			case this.method.X: chars = "ãẫẵẽễĩõỗỡũữỹÃẪẴẼỄĨÕỖỠŨỮỸ";
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
		var pos = this.findC(w, k, skey_str);
		if (!pos) return;
		if (pos[1]) this.replaceChar(this.oc, i - pos[0], pos[1]);
		else this.replaceChar(this.oc, i - pos, this.retUni(w, k, pos));
	};
	
	/**
	 * @param w	{string}	The word ending at the cursor position.
	 * @param k	{string}	The character equivalent of the pressed key.
	 */
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
	 * Fires a fake onInput event from the given element. If preventDefault() is
	 * called on the onKeyPress event, most textboxes will not respond
	 * appropriately to AVIM's changes (autocomplete, in-page find, `oninput`
	 * attribute, etc.) unless this method is called.
	 *
	 * @param outer	{object}	A DOM node representing the textbox element.
	 * @param inner	{object}	A DOM node representing the anonymous element.
	 */
	this.updateContainer = function(outer, inner) {
		if (!inner) return;
		var inputEvent = document.createEvent("Events");
		inputEvent.initEvent("input", true, true);
		inner.dispatchEvent(inputEvent);
		
		// Autocomplete textboxes for Toolkit
		if (outer && outer.form) {
			var controller = Cc["@mozilla.org/autocomplete/controller;1"]
				.getService(Ci.nsIAutoCompleteController);
			controller.handleText(true);
		}
	};
	
	/**
	 * Handles key presses for WYSIWYG HTML documents (editable through
	 * Mozilla's Midas component).
	 */
	this.ifMoz = function(e) {
		var code = e.which;
		var doc = e.originalTarget.ownerDocument;
		var target = doc.documentElement;
		var cwi = new XPCNativeWrapper(doc.defaultView);
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
		
		var editor = getEditor(cwi);
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
			this.updateContainer(null, target);
		}
	};
	
	this.checkCode = function(code) {
		return !AVIMConfig.onOff || (code < 45 && code != 8 /* Backspace */ &&
									 code != 42 && code != 32 && code != 39 &&
									 code != 40 && code != 43) ||
			code == 145 || code == 255;
	};
	
	/**
	 * Returns whether AVIM should ignore the given element.
	 *
	 * @param el	{object}	A DOM node representing a textbox element.
	 * @returns {boolean}	True if the element should be ignored; false
	 * 						otherwise.
	 */
	this.findIgnore = function(el) {
		if (!el || !el.getAttribute) return true;
		var id = el.id || el.getAttribute("id");
		if (id && id.toLowerCase &&
			AVIMConfig.exclude.indexOf(id.toLowerCase()) >= 0) {
			return true;
		}
		var name = el.name || el.getAttribute("name");
		if (name && name.toLowerCase &&
			AVIMConfig.exclude.indexOf(name.toLowerCase()) >= 0) {
			return true;
		}
		
		// Honor "ime-mode: disabled" in CSS.
		var win = el.ownerDocument && el.ownerDocument.defaultView;
		if (!win || !win.getComputedStyle) return false;
		var mode = win.getComputedStyle(el, null).getPropertyValue("ime-mode");
		return mode == "disabled";
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
	this.handleKeyPress = function(e) {
		// https://developer.mozilla.org/en/HTML/Element/input
		// Supported <input> types are: text, search, password (if .passwords),
		// url (if "url" or "urlbar" in .ignoredFieldIds), and email (if
		// "e-mail" or "email" in .ignoredFieldIds).
		const htmlTypes = ["search", "text", "textarea"];
		
		var el = e.originalTarget || e.target, code = e.which;
//		dump("AVIM.handleKeyPress -- target: " + el.tagName + "; code: " + code + "\n");	// debug
		if (e.ctrlKey || e.metaKey || e.altKey) return false;
		if (this.findIgnore(e.target)) return false;
		var isHTML = htmlTypes.indexOf(el.type) >= 0 ||
			(el.type == "password" && AVIMConfig.passwords) ||
			(el.type == "url" && (AVIMConfig.exclude.indexOf("url") < 0 ||
								  AVIMConfig.exclude.indexOf("urlbar") < 0)) ||
			(el.type == "email" && (AVIMConfig.exclude.indexOf("email") < 0 ||
									AVIMConfig.exclude.indexOf("e-mail") < 0));
		
		if(!isHTML || this.checkCode(code)) return false;
		this.sk = fcc(code);
		var editor = getEditor(el);
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
			this.updateContainer(e.originalTarget, el);
			// A bit of a hack to prevent single-line textboxes from scrolling
			// to the beginning of the line.
			if (window.goDoCommand && el.type != "textarea") {
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
		var code = e.which;
//		dump("AVIM.handleSciMoz -- target: " + el + "; type: " + el.type + "; code: " + code + "\n");	// debug
		if (e.ctrlKey || e.metaKey || e.altKey || this.checkCode(code) ||
			el.type != sciMozType || this.findIgnore(e.target)) {
			return false;
		}
//		dump("xul:scintilla:\n" + [prop for (prop in el)] + "\n");				// debug
//		el.setSelectionNStart(0, 8);											// debug
//		dump(">>> scimoz.getSelectionNStart: " + el.selections ? el.getSelectionNStart(0) : "" + "\n");					// debug
		
		el.beginUndoAction();
		try {
			// Fake a native textbox and keypress event for each selection.
			var firstSel = 0;
			var numSel = el.selections;
			
			// Komodo only seems to support one selection at a time, but it does
			// support rectangular selection.
			var selectionIsRectangle = el.selectionMode == el.SC_SEL_RECTANGLE ||
				el.selectionMode == el.SC_SEL_THIN;
			if (selectionIsRectangle) {
				var startLine = el.lineFromPosition(el.rectangularSelectionAnchor);
				var endLine = el.lineFromPosition(el.rectangularSelectionCaret);
				firstSel = Math.min(startLine, endLine);
				numSel = Math.abs(endLine - startLine) + 1;
//				dump(">>> Rectangular selection, lines " + firstSel + "-" +
//					 (firstSel + numSel) + "\n");	// debug
			}
			
			var anyChanged = this.changed;
			var proxy;
			for (var i = firstSel; i < firstSel + numSel; i++) {
				if (selectionIsRectangle) proxy = new SciMozProxy(el, 0, i);
				else proxy = new SciMozProxy(el, i);
				if (!proxy) continue;
				
				this.sk = fcc(code);
				this.start(proxy, e);
				
				if (this.changed) anyChanged = true;
				if (proxy.commit) proxy.commit();
				delete proxy;
				this.changed = false;
			}
			this.changed = anyChanged;
		}
		catch (exc) {
// $if{Debug}
			throw exc;
// $endif{}
		}
		finally {
			el.endUndoAction();
		}
		
		if (this.changed) {
			this.changed = false;
			e.handled = true;
			e.stopPropagation();
			this.updateContainer(el, el);
			return false;
		}
		return true;
	};
	
	/**
	 * Handles key presses in the Ace editor. This function is triggered as soon
	 * soon as the key goes up.
	 *
	 * @param evt	{object}	The keypress event.
	 * @param elt	{object}	The DOM element node that represents the Ace
	 * 							editor. Defaults to the given event's original
	 * 							target.
	 * @returns {boolean}	True if AVIM plans to modify the input; false
	 * 						otherwise.
	 */
	this.handleAce = function(evt, elt) {
//		dump("AVIM.handleAce\n");												// debug
		if (!elt) elt = evt.originalTarget;
		var code = evt.which;
		if (evt.ctrlKey || evt.metaKey || evt.altKey || this.checkCode(code) ||
			this.findIgnore(evt.target)) {
			return false;
		}
		
//		dump("---AceProxy---\n");												// debug
		// Build a sandbox with all the toys an Ace editor could want.
		var sandbox = new Cu.Sandbox(elt.ownerDocument.location.href);
		sandbox.elt = elt.wrappedJSObject;
		try {
			sandbox.env = Cu.evalInSandbox("elt.env || null", sandbox);
			if (sandbox.env === null) return false;
		}
		catch (exc) {
			return false;
		}
		
		// Fake a native textbox.
		var proxy = new AceProxy(sandbox);
		
		this.sk = fcc(code);
		this.start(proxy, evt);
		
		proxy.commit();
		delete proxy;
		delete sandbox;
		
		if (this.changed) {
			this.changed = false;
			evt.handled = true;
			evt.stopPropagation();
			evt.preventDefault();
			this.updateContainer(elt, elt);
			return false;
		}
		return true;
	};
	
	// Silverlight applets
	
	/**
	 * Returns whether AVIM should ignore the given element.
	 *
	 * @param ctl	{object}	The XAML TextBox element.
	 * @returns {boolean}	True if the element should be ignored; false
	 * 						otherwise.
	 */
	this.slightFindIgnore = function(ctl) {
		if (!("name" in ctl)) return false;
		return ctl.name && ctl.name.toLowerCase &&
			AVIMConfig.exclude.indexOf(ctl.name.toLowerCase()) >= 0;
	};
	
	var avim = this;
	
	/**
	 * Handles key presses in Silverlight. This function is triggered as soon as
	 * the key goes down.
	 *
	 * @param root	{object}	The root XAML element in the Silverlight applet.
	 * @param evt	{object}	The keyDown event.
	 */
	this.handleSlightKeyDown = function(root, evt) {
		try {
			//root = XPCSafeJSObjectWrapper(root);
			//evt = XPCSafeJSObjectWrapper(evt);
			
			var ctl = evt.source;	// TextBox
			// TODO: Support password boxes.
//			var isPasswordBox = "password" in ctl;
//			if (AVIMConfig.method > 2) return;	// TODO: Support VIQR.			// debug -- uncomment
			if (!("text" in ctl /* || isPasswordBox */)) return;
//			if (isPasswordBox && !AVIMConfig.passwords) return;
			if (!("isEnabled" in ctl && ctl.isEnabled)) return;
			if (!("isReadOnly" in ctl && !ctl.isReadOnly)
				/* && !isPasswordBox */) {
				return;
			}
			if (evt.ctrl || avim.slightFindIgnore(ctl)) return;
//			dump(root + ": Key " + evt.key + " (platform " + evt.platformKeyCode +
//				 ") down on " + ctl + " -- " + ctl.text + "\n");				// debug
			
			// Fake a native textbox and keypress event.
			var ctlProxy = new SlightCtlProxy(ctl);
			var evtProxy = new SlightEvtProxy(evt);
			if (!evtProxy.charCode || evtProxy.charCode == 0xff) return;
			
			avim.sk = fcc(evtProxy.charCode);
			avim.start(ctlProxy, evtProxy);
			
			ctlProxy.commit();
			delete ctlProxy, evtProxy;
			if (avim.changed) {
				avim.changed = false;
				evt.handled = true;
			}
		}
		catch (exc) {
// $if{Debug}
			throw exc;
// $endif{}
		}
	};
	
	/**
	 * Handles miscellaneous key presses in Silverlight. This function is
	 * triggered as soon as the key goes up, and only responds if the key does
	 * not correspond to a virtual key. In that case, it uses the character
	 * immediately preceding the caret.
	 *
	 * @param root	{object}	The root XAML element in the Silverlight applet.
	 * @param evt	{object}	The keyUp event.
	 */
	this.handleSlightKeyUp = function(root, evt) {
		try {
			//root = XPCSafeJSObjectWrapper(root);
			//evt = XPCSafeJSObjectWrapper(evt);
			
			// Already handled by handleSlightKeyDown().
			if (!("key" in evt) ||
				virtualKeyFromSlight(evt.key, evt.shift) != 0xff) {
				return;
			}
			
			var ctl = evt.source;	// TextBox
			if (!("text" in ctl)) return;
			if (AVIMConfig.method < 3) return;
			if (!("isEnabled" in ctl && ctl.isEnabled)) return;
			if (!("isReadOnly" in ctl && !ctl.isReadOnly)) return;
			if (evt.ctrl || avim.slightFindIgnore(ctl)) return;
			if (isMac && evt.platformKeyCode == 0x37) return;	// Cmd on Mac
//			dump(root + ": Key " + evt.key + " (platform " + evt.platformKeyCode +
//				 ", ctrl: " + evt.ctrl.toString() + ") UP on " + ctl + " -- " + ctl.text + "\n");	// debug
			
			// Override the event proxy's key code using the last character.
			var text = ctl.text;
			var lastChar = text.substr(-1);
			var charCode = lastChar.charCodeAt(0);
			if (charCode == 0xff) return;
//			dump("\tUsing " + charCode + "(" + lastChar + ") instead.\n");		// debug
			
			// Remove the last character from the textbox and move the caret
			// back.
			var selStart = ctl.selectionStart;
			ctl.text = text.substr(0, text.length - 1);
			ctl.selectionStart = selStart - 1;
//			dump("\t\"" + text + "\" @ " + ctl.selectionStart + "\n");		// debug
			
			// Fake a native textbox and keypress event.
			var ctlProxy = new SlightCtlProxy(ctl);
			var evtProxy = new SlightEvtProxy(evt, charCode);
			
			avim.sk = fcc(evtProxy.charCode);
			avim.start(ctlProxy, evtProxy);
			
			ctlProxy.commit();
			delete ctlProxy, evtProxy;
			avim.changed = false;
			evt.handled = true;
//			dump("After -- text: \"" + text + "\"; ctl.text: \"" + ctl.text + "\"\n");	// debug
			if (text == ctl.text + lastChar) {
				// Nothing changed, so revert the textbox contents.
				ctl.text = text;
				ctl.selectionStart = selStart;
			}
		}
		catch (exc) {
// $if{Debug}
			throw exc;
// $endif{}
		}
	}
	
	/**
	 * Attaches AVIM to the given Silverlight applet. This method should be
	 * called on an applet whenever the containing page is shown, not just when
	 * it is loaded, because the applet is loaded afresh even when the page is
	 * loaded from cache.
	 *
	 * @param slight	{object}	The DOM node representing the Silverlight
	 * 								applet.
	 */
	this.registerSlight = function(elt, sandbox) {
		if (!slightTypeRe.test(elt.type)) return;
//		dump("registerSlight -- " + slight.content.root + "\n");				// debug
		sandbox.importFunction(avim.handleSlightKeyDown, "handleSlightKeyDown");
		Cu.evalInSandbox("elt.content.root.addEventListener('keyDown', " +
						 "handleSlightKeyDown)", sandbox);
		// Observing keyUp introduces problems with character limits.
//		slight.content.root.addEventListener("keyUp", avim.handleSlightKeyUp);
		sandbox.importFunction(avim.handleSlightKeyUp, "handleSlightKeyUp");
		Cu.evalInSandbox("elt.content.root.addEventListener('keyUp', " +
						 "handleSlightKeyUp)", sandbox);
//		dump("\t" + slight.content.root.children + "\n");						// debug
	};
	
//	this.registerSlightsOnChange = function(evt) {
//		this.registerSlight(evt.target);
//	};
	
	/**
	 * Attaches AVIM to Silverlight applets in the page targeted by the given
	 * DOM load event.
	 *
	 * @param evt	{object}	The DOMContentLoaded event.
	 */
	this.registerSlightsOnPageLoad = function(evt) {
		try {
			//var docWrapper = new XPCNativeWrapper(evt.originalTarget);
			var sandbox = new Cu.Sandbox(evt.originalTarget.location.href);
			
			var slights = evt.originalTarget.getElementsByTagName("object");
//			dump("registerSlightsOnPageLoad -- originalTarget: " + evt.originalTarget +
//				 "; target: " + evt.target + "\n");								// debug
			for (var i = 0; i < slights.length; i++) {
//				dump("\t> " + slights[i].id + "\n");								// debug
//				avim.registerSlight(slights[i]);
				sandbox.elt = slights[i].wrappedJSObject;
				avim.registerSlight(slights[i], sandbox);
			}
//			doc.addEventListener("DOMNodeInserted",
//								 avim.registerSlightsOnChange, true);
		}
		catch (exc) {
// $if{Debug}
			throw exc;
// $endif{}
		}
	};
	
	/**
	 * Attaches AVIM to Silverlight applets whenever their containers load. This
	 * method currently attaches only when the pages load, not when the applets
	 * are loaded dynamically via JavaScript.
	 */
	this.registerSlights = function() {
		var appcontent = document.getElementById("appcontent");   // browser
		if (!appcontent) return;
		appcontent.addEventListener("pageshow", this.registerSlightsOnPageLoad,
									true);
	};
	
	// SlideKit text fields
	
	/**
	 * Handles key presses in a SlideKit text field.
	 *
	 * @param evt	{object}		The keypress event.
	 * @returns {boolean}	True if AVIM plans to modify the input; false
	 * 						otherwise.
	 */
	this.handleSkit = function(evt) {
		var elt = evt.originalTarget;
		var code = evt.which;
		if (evt.ctrlKey || evt.metaKey || evt.altKey || this.checkCode(code)) {
			return false;
		}
		
		var sandbox = new Cu.Sandbox(elt.ownerDocument.location.href);
		sandbox.window = elt.ownerDocument.defaultView.wrappedJSObject;
		try {
			if (!Cu.evalInSandbox("'objj_msgSend' in window &&" +
								  "'SlideEditor' in window && " +
								  "'TextLayer' in window", sandbox)) {
				return false;
			}
			sandbox.objj_msgSend = Cu.evalInSandbox("window.objj_msgSend",
													sandbox);
			sandbox.textLayer =
				Cu.evalInSandbox("window.CPApp._mainWindow._windowController." +
								 "_slideEditor._firstResponder._textLayer ||" +
								 "null", sandbox);
			if (sandbox.textLayer === null) return false;
		}
		catch (exc) {
			return false;
		}
		
		// Fake a native textbox.
//		dump("AVIM.handleSkit\n");											// debug
		var proxy = new SkitProxy(sandbox);
		
		this.sk = fcc(code);
		this.start(proxy, evt);
		
		proxy.commit();
		delete proxy, sandbox;
		if (this.changed) {
			this.changed = false;
			evt.stopPropagation();
			evt.preventDefault();
			return false;
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
		var boolPrefs = {
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
			var ids = Cc["@mozilla.org/supports-string;1"]
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
			case "passwords":
				AVIMConfig.passwords = prefs.getBoolPref("passwords");
				if (specificPref) break;
			case "ignoredFieldIds":
				var ids = prefs.getComplexValue("ignoredFieldIds",
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
	
	// Script monitor
	
	// Markers and disablers for embedded Vietnamese IMEs
	var disablers = {
		// For each of these disablers, we don't need a sanity check for an
		// object or member that served as a marker for the IME. Also,
		// everything is wrapped in a try...catch block, so we don't need sanity
		// checks if the disabler can halt on error without failing to reach
		// independent statements.
		
		AVIM: function() {
			return AVIMConfig.disabledScripts.AVIM &&
				"marker.setMethod(-1)";
		},
		Google: function() {
			return AVIMConfig.disabledScripts.Google &&
				"if ('keyboard' in marker.elements)" +
					"marker.elements.keyboard.Keyboard.prototype." +
						"setVisible(false);";
		},
		CHIM: function() {
			return AVIMConfig.disabledScripts.CHIM &&
				"if (window.parseInt(marker.method))" +
					"marker.SetMethod(0);";
		},
		HIM: function() {
			return AVIMConfig.disabledScripts.AVIM &&
				"if ('setMethod' in window) window.setMethod(-1);" +
				"window.on_off = 0;";
		},
		Mudim: function() {
			return AVIMConfig.disabledScripts.Mudim &&
				"if (window.parseInt(marker.method) != 0) {" +
					"if ('Toggle' in marker) marker.Toggle();" +
					"else window.CHIM.Toggle();" +
				"}";
		},
		MViet: function() {
			return AVIMConfig.disabledScripts.MViet &&
				"if (typeof(window.MVOff) != 'boolean' || !window.MVOff) {" +
					"if ('MVietOnOffButton' in window &&" +
						"window.MVietOnOffButton instanceof Function) {" +
						"window.MVietOnOffButton();" +
					"}" +
					"else if ('button' in window) window.button(0);" +
				"}";
		},
		VietIMEW: function() {
			return AVIMConfig.disabledScripts.VietIMEW &&
				"if ('VietIME' in window) {" +
					"for (var memName in window) {" +
						"var mem = window[memName];" +
						"if (mem.setTelexMode != undefined &&" +
							"mem.setNormalMode != undefined) {" +
							"mem.setNormalMode();" +
							"break;" +
						"}" +
					"}" +
				"}";
		},
		VietTyping: function() {
			return AVIMConfig.disabledScripts.VietTyping &&
				"if ('changeMode' in window) window.changeMode(-1);" +
				"else window.ON_OFF = 0;";
		},
		VietUni: function() {
			return AVIMConfig.disabledScripts.VietUni &&
				"if ('setTypingMode' in window) window.setTypingMode();" +
				"else if ('setMethod' in window) window.setMethod(0);";
		},
		Vinova: function() {
			return AVIMConfig.disabledScripts.Vinova &&
				"marker.reset(true);";
		},
		XaLo: function() {
			return AVIMConfig.disabledScripts.AVIM &&
				"if (window._e_ &&" +
					"window.document.getElementsByClassName('vk').length) {" +
					"window._e_(null, 0);" +
				"}";
		},
		xvnkb: function() {
			return AVIMConfig.disabledScripts.CHIM &&
				"if (parseInt(window.vnMethod) != 0) window.VKSetMethod(0);";
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
		// VietUni 1.7 by nthachus (2008-10-16)
		CVietUni: disablers.VietUni,
		// XaLộ (vn.xalo.client.vnk)
		_xalo_ga: disablers.XaLo,
		// Google (google.com.vn) and Google Virtual Keyboard API 1.0
		google: disablers.Google
	};
	var frameMarkers = ["MVietOnOffButton", "DAWEOF"];
	
	/**
	 * Given a marker and sandboxed contexts, disables the Vietnamese JavaScript
	 * input method editor (IME) with that marker.
	 *
	 * @param marker		{string}	Name of a JavaScript object (possibly a
	 *									function) that indicates the presence of
	 *									the IME.
	 * @param sandbox		{object}	JavaScript sandbox in the current page's
	 *									context.
	 * @param parentSandbox	{object}	JavaScript sandbox in the parent page's
	 *									context.
	 * @returns {boolean}	True if the disabler ran without errors (possibly
	 * 						without effect); false if errors were raised.
	 */
	this.disableOther = function(marker, sandbox, parentSandbox) {
		try {
			// Get the disabling code.
			var disabler = markers[marker];
			var js = disabler();
			if (!js) return false;
			js = js.replace("marker", "window." + marker, "g");
			
			// Try to disable the IME in the current document.
			var hasMarker = false;
			try {
				hasMarker = Cu.evalInSandbox("'" + marker + "' in window",
											 sandbox) === true;
			}
			catch (exc) {}
			if (hasMarker) {
				Cu.evalInSandbox(js, sandbox);
				return true;
			}
			
			// Try to disable the IME in the parent document.
			if (!parentSandbox) return false;
			hasMarker = false;
			try {
				hasMarker = Cu.evalInSandbox("'" + marker + "' in window",
											 parentSandbox) === true;
			}
			catch (exc) {}
			if (hasMarker) {
				Cu.evalInSandbox(js, parentSandbox);
				return true;
			}
			return false;
		}
		catch (exc) {
// $if{Debug}
			dump(">>> Script monitor -- marker: " + marker + "; error on line " +
				 exc.lineNumber + ": " + exc + "\n" + exc.stack + "\n");
// $endif{}
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
		
		// Since wrappedJSObject is only safe in Firefox 3 and above, sandbox
		// all operations on it.
		var winWrapper = new XPCNativeWrapper(doc.defaultView);
		var win = winWrapper.wrappedJSObject;
		if (win === undefined || win === null || win === window) return;
		
		// Create a sandbox to execute the code in.
//		dump("inner sandbox URL: " + doc.location.href + "\n");				// debug
		var sandbox = new Cu.Sandbox(doc.location.href);
		sandbox.window = win;
		
		// Some IMEs are applied to rich textareas in iframes. Create a new
		// sandbox based on the parent document's URL.
		var parentSandbox;
		win = winWrapper.frameElement && winWrapper.parent.wrappedJSObject;
		if (win !== undefined && win !== null) {
//			dump("outer sandbox URL: " + winWrapper.parent.location.href + "\n");	// debug
			parentSandbox = new Cu.Sandbox(winWrapper.parent.location.href);
			parentSandbox.window = win;
		}
		
		for (var marker in markers) {
			if (this.disableOther(marker, sandbox, parentSandbox)) return;
		}
		delete sandbox, parentSandbox;
	};
	
	/**
	 * First responder for keypress events.
	 *
	 * @param e	{object}	The generated event.
	 * @returns {boolean}	True if AVIM modified the textbox as a result of the
	 * 						keypress.
	 */
	this.onKeyPress = function(e) {
//		dump("AVIM.onKeyPress -- code: " + fcc(e.which) + " #" + e.which +
//			 "; target: " + e.target.nodeName + "#" + e.target.id +
//			 "; originalTarget: " + e.originalTarget.nodeName + "#" + e.originalTarget.id + "\n");			// debug
		var target = e.target;
		var origTarget = e.originalTarget;
		var doc = target.ownerDocument;
		if (doc.defaultView == window) doc = origTarget.ownerDocument;
		this.disableOthers(doc);
		
		// SciMoz plugin
		var tagName = origTarget.localName.toLowerCase();
		if (tagName == "scintilla") {
			origTarget = doc.getAnonymousElementByAttribute(origTarget, "type",
															sciMozType);
		}
		if (origTarget.localName.toLowerCase() == "embed") {
			return this.handleSciMoz(e, origTarget);
		}
		
		// Specialized Web editors
		try {
			// SlideKit
			if (tagName == "html" && this.handleSkit(e)) return true;
			
			// ACE editor
			// <pre class="ace-editor">
			if (tagName == "textarea" && "classList" in origTarget.parentNode &&
				origTarget.parentNode.classList.contains("ace_editor") &&
				this.handleAce(e, origTarget.parentNode)) {
				return true;
			}
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
		var wysiwyg =
			(doc.designMode && doc.designMode.toLowerCase() == "on") ||
			(target.contentEditable &&
			 target.contentEditable.toLowerCase() == "true");
		if (wysiwyg) return this.ifMoz(e);
		
		// Plain text editors
		return this.handleKeyPress(e);
	};
	
	// IME and DiMENSiON extension
	if (window && "getIMEStatus" in window) {
		var getStatus = getIMEStatus;
		getIMEStatus = function() {
			try {
				return AVIMConfig.onOff || getStatus();
			}
			catch (e) {
				return AVIMConfig.onOff;
			}
		}
	}
};

if (window && !("avim" in window) && !window.frameElement) {
	window.avim = new AVIM();
	addEventListener("load", function() {
		if (!avim) return;
		avim.registerPrefs();
		avim.updateUI();
		avim.registerSlights();
	}, false);
	addEventListener("unload", function() {
		if (avim) avim.unregisterPrefs();
		delete avim;
	}, false);
	addEventListener("keypress", function(e) {
		if (avim) avim.onKeyPress(e);
	}, true);
}
