/* global _avim_applyKey, _avim_evtInfo, _avim_textChanged:true, Selection, Op, editor, NODE_TYPE */
(function () {
"use strict";

let cursor = editor.doc.cursor;
if (!cursor || !cursor.isCollapsed()) return;

//* One-based
let selectionStart = cursor.getWord().getStart();
//* One-based
let selectionEnd = cursor.getEnd();

let word = editor.doc.getContent(selectionStart, selectionEnd);
if (!word || !word.length) return;

//dump(">>> zwrite.js -- word: " + word + "\n");									// debug

let [newWord, changed] = JSON.parse(_avim_applyKey(word, {
	keyCode: _avim_evtInfo[0],
	which: _avim_evtInfo[1],
	shiftKey: _avim_evtInfo[2],
}));
if (newWord && newWord !== word) {
	//dump(">>> zwrite.js -- Replacing <" + word + "> with <" + newWord + ">\n");	// debug
	
	Selection.deleteContents(selectionStart, selectionEnd);
	cursor.insert(editor.doc.createElement(NODE_TYPE.TEXT, newWord), {});
	Op.sendMsg();
}
if (changed) _avim_textChanged = true;

})();
