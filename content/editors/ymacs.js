"use strict";

(function () {

let buffer = "ymacs" in window && ymacs.getActiveBuffer();
if (!buffer) return;
if (buffer.transientMarker &&
	buffer.caretMarker.position !== buffer.transientMarker.position) {
	return;
}

let oldSelection = {
	row: buffer.caretMarker.rowcol.row,
	column: buffer.caretMarker.rowcol.col,
};
let oldLine = buffer.getLine(oldSelection.row);
let word = _avim_lastWordInString(oldLine.substr(0, oldSelection.column));

let [newWord, changed] = _avim_applyKey(word, {
	keyCode: _avim_evtInfo[0],
	which: _avim_evtInfo[1],
	shiftKey: _avim_evtInfo[2],
});
if (newWord && newWord != word) {
	let linePos = buffer._rowColToPosition(oldSelection.row, 0);
	let line = oldLine.substr(0, oldSelection.column - word.length) +
		newWord + oldLine.substr(oldSelection.column);
	let pos = linePos + oldSelection.column + line.length - oldLine.length;
	buffer._replaceLine(oldSelection.row, line);
	buffer.redrawDirtyLines();
	buffer.caretMarker.setPosition(pos);
}
if (changed) _avim_textChanged = true;

})();
