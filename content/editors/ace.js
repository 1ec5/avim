/* global _avim_lastWordInString, _avim_applyKey, _avim_evtInfo, _avim_textChanged:true */
(function () {
"use strict";

// This selector assumes that only one ACE editor can be focused at a time.
let elt = document.querySelector(".ace_editor.ace_focus");
let env = elt && elt.env;
let sel = env && env.document.selection;
if (!sel || !sel.isEmpty()) return;

let numRanges = sel.rangeCount || 1;

for (let i = 0; i < numRanges; i++) {
	let cursor = numRanges > 1 ? sel.ranges[i].cursor : sel.selectionLead;
	if (!cursor) continue;
	
	let lineStr = env.document.getLine(cursor.row);
	let word = _avim_lastWordInString(lineStr.substr(0, cursor.column));
	if (!word || !word.length) continue;
	
	//let selectionStart = word.length;
	let wordStart = cursor.column - word.length;
		
//	dump("\tselection: " + cursor.row + ":" + cursor.column + "\n");			// debug
//	dump("\t<" + word + ">");
	
	let [newWord, changed] = JSON.parse(_avim_applyKey(word, {
		keyCode: _avim_evtInfo[0],
		which: _avim_evtInfo[1],
		shiftKey: _avim_evtInfo[2],
	}));
	if (newWord && newWord !== word) {
		//dump(">>> ace.js -- replacing <" + word + "> with <" + newWord + ">\n");	// debug
		// Work around <https://github.com/ajaxorg/ace/pull/1813>.
/* jshint -W103 */
		let Range = sel.getRange().__proto__.constructor;
/* jshint +W103 */
		let range = new Range(cursor.row, wordStart, cursor.row, cursor.column);
		env.document.replace(range, newWord);
	}
	if (changed) _avim_textChanged = true;
}

})();
