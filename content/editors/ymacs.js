/* global _avim_lastWordInString, _avim_applyKey, _avim_evtInfo, _avim_textChanged:true, ymacs */
(function () {
"use strict";

let buffer = "ymacs" in window && ymacs.getActiveBuffer();
if (!buffer) return;
if (buffer.transientMarker &&
	buffer.caretMarker.position !== buffer.transientMarker.position) {
	return;
}

let oldSelection = buffer.caretMarker.rowcol;
let oldLine = buffer.getLine(oldSelection.row);
let word = _avim_lastWordInString(oldLine.substr(0, oldSelection.col));
if (!word || !word.length) return;

let [newWord, changed] = JSON.parse(_avim_applyKey(word, {
	keyCode: _avim_evtInfo[0],
	which: _avim_evtInfo[1],
	shiftKey: _avim_evtInfo[2],
}));
if (newWord && newWord !== word) {
	let linePos = buffer._rowColToPosition(oldSelection.row, 0);
	let line = oldLine.substr(0, oldSelection.col - word.length) + newWord +
		oldLine.substr(oldSelection.col);
	let pos = linePos + oldSelection.col + line.length - oldLine.length;
	buffer._replaceLine(oldSelection.row, line);
	buffer.redrawDirtyLines();
	buffer.caretMarker.setPosition(pos);
}
if (changed) _avim_textChanged = true;

})();
