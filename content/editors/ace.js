"use strict";

(function () {

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
	let word = lastWordInString(lineStr.substr(0, cursor.column));
	if (!word || !word.length) continue;
	
	//let selectionStart = word.length;
	let wordStart = cursor.column - word.length;
		
//	dump("\tselection: " + cursor.row + ":" + cursor.column + "\n");			// debug
//	dump("\t<" + word + ">");
	
	let evtInfo = $evtInfo.split(",");
	let [newWord, changed] = applyKey(word, {
		keyCode: parseInt(evtInfo[0], 10),
		which: parseInt(evtInfo[1], 10),
		shiftKey: evtInfo[2] === "true",
	});
	if (newWord && newWord != word) {
		//dump(">>> ace.js -- replacing <" + word + "> with <" + newWord + ">\n");	// debug
		// Work around <https://github.com/ajaxorg/ace/pull/1813>.
		let Range = sel.getRange().__proto__.constructor;
		let range = new Range(cursor.row, wordStart, cursor.row, cursor.column);
		env.document.replace(range, newWord);
	}
	if (changed) $anyChanged = true;
}

})();
