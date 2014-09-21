"use strict";

(function (context) {

/**
 * Returns the current position of the cursor in the given SciMoz plugin object.
 *
 * @param scintilla	{object}	The plugin's <xul:scintilla> tag.
 * @param selId	{number}		The selection range number. By default, this
 *								parameter is 0 (for the main selection).
 * @param lineNum {number}		The line number of a line within a rectangular
 *								selection. Omit if the selection is
 *								non-rectangular.
 * @returns {number}	The current cursor position, or -1 if the cursor cannot
 * 						be found.
 */
function getCursorPosition(scintilla, selId, lineNum) {
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
}

/**
 * Retrieves the current line from the SciMoz plugin.
 *
 * @param scintilla	{object}	The plugin's <xul:scintilla> tag.
 * @param selId		{number}	The selection range number. By default, this
 * 								parameter is 0 (for the main selection).
 * @param lineNum 	{number}	The line number of a line within a rectangular
 *								selection. Omit if the selection is
 *								non-rectangular.
 * @returns {string}	The text of the current line.
 */
function getLine(scintilla, selId, lineNum) {
	if ((selId || 0) >= scintilla.selections) return -1;
	
	// Non-rectangular selection
	if (lineNum == undefined) {
		let caretPos = scintilla.getSelectionNCaret(selId || 0);
		lineNum = scintilla.lineFromPosition(caretPos);
	}
	
	let startPos = scintilla.positionFromLine(lineNum);
	let endPos = scintilla.getLineEndPosition(lineNum);
	return scintilla.getTextRange(startPos, endPos);
}

/**
 * Proxy for a SciMoz plugin object posing as an ordinary HTML <input> element.
 *
 * @param elt		{object}	The <xul:scintilla> tag.
 * @param selId		{number}	The selection range number. By default, this
 * 								parameter is 0 (for the main selection).
 * @param lineNum	{number}	The line number of a line within a rectangular
 *								selection. Omit if the selection is
 *								non-rectangular.
 */
function SciMozProxy(elt, selId, lineNum) {
	if ((selId || 0) >= elt.selections) return;
	
	this.elt = elt;
//	dump("---SciMozProxy---\n");												// debug
	
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
	
	this.selectionStart = getCursorPosition(elt, selId, lineNum);
	this.selectionEnd = this.selectionStart;
//	dump("\tselectionStart: " + this.selectionStart + "\n");					// debug
	if (this.selectionStart < 0) return;
	this.oldLine = getLine(elt, selId, lineNum)
	let word = context.lastWordInString(this.oldLine.substr(0, this.selectionStart));
	this.value = word;
//	dump("\t<" + this.value + ">\n");											// debug
	
	/**
	 * Reselects the rectangular region that was selected prior to being edited
	 * through this proxy.
	 * 
	 * @param colChange	{number}	Number of columns to the right to shift the
	 *								caret by.
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
//		dump(">>> Selected " + this.oldSelectionStart.line + ":" +
//			 this.oldSelectionStart.col + "-" +
//			 this.oldSelectionEnd.line + ":" +
//			 this.oldSelectionEnd.col + "\n");	// debug
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
//		dump(">>> Line " + lineNum + ", position " + linePos + "\n");			// debug
		if (selectionIsRectangle) elt.clearSelections();
		let startPos = elt.positionAtChar(linePos,
										  this.selectionStart - word.length);
		elt.setSelectionNStart(selId, startPos);
		let endPos = elt.positionAtChar(linePos, this.selectionStart);
		elt.setSelectionNEnd(selId, endPos);
//		dump(">>> Selected " + elt.selectionStart + "-" + elt.selectionEnd + "\n");	// debug
		
		// Replace the selected word.
//		dump(">>> Replacing '" + elt.selText + "' with '" + this.value + "'.\n");	// debug
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
//			dump(">>> After: " + elt.getSelectionNStart(selId) + "-" +
//				 elt.getSelectionNEnd(selId) + "\n");							// debug
		}
//		dump("\t<" + sciMozGetLine(elt, selId) + ">\n");						// debug
		
		return true;
	};
}

context.lazyHandlers.sciMoz = function (evt) {
	let win = evt.originalTarget.ownerDocument.defaultView;
	let elt = win.ko.views.manager.currentView.scimoz || evt.originalTarget;
//	dump("AVIM.handleSciMoz -- target: " + elt + "; type: " + elt.type + "; code: " + evt.which + "\n");	// debug
//	dump("xul:scintilla:\n" + [prop for (prop in elt)] + "\n");					// debug
//	elt.setSelectionNStart(0, 8);												// debug
//	dump(">>> scimoz.getSelectionNStart: " + elt.selections ? elt.getSelectionNStart(0) : "" + "\n");					// debug
	
	let anyChanged = false;
	try {
		elt.beginUndoAction();
		
		// Fake a native textbox and keypress event for each selection.
		let firstSel = 0;
		let numSel = elt.selections;
		
		// Komodo only seems to support one selection at a time, but it does
		// support rectangular selection.
		let selectionIsRectangle = elt.selectionMode == elt.SC_SEL_RECTANGLE ||
			elt.selectionMode == elt.SC_SEL_THIN;
		if (selectionIsRectangle) {
			let startLine = elt.lineFromPosition(elt.rectangularSelectionAnchor);
			let endLine = elt.lineFromPosition(elt.rectangularSelectionCaret);
			firstSel = Math.min(startLine, endLine);
			numSel = Math.abs(endLine - startLine) + 1;
//			dump(">>> Rectangular selection, lines " + firstSel + "-" +
//				 (firstSel + numSel) + "\n");	// debug
		}
		
		let proxy;
		for (let i = firstSel; i < firstSel + numSel; i++) {
			if (selectionIsRectangle) proxy = new SciMozProxy(elt, 0, i);
			else proxy = new SciMozProxy(elt, i);
			if (!proxy) continue;
			
			let result = proxy.value && context.applyKey(proxy.value, evt);
			
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
		dump(">>> AVIM.handleSciMoz -- error on line " + (exc && exc.lineNumber) +
			 ": " + exc + "\n" + (exc && exc.stack) + "\n");
		throw exc;
// $endif{}
	}
	finally {
		elt.endUndoAction();
	}
	
	if (anyChanged) {
		evt.handled = true;
		evt.stopPropagation();
		updateContainer(elt, elt);
		return false;
	}
	return true;
};
	
})(this);
