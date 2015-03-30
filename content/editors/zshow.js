/* globals _avim_applyKey, _avim_evtInfo, _avim_textChanged:true, ShapeEditor */
(function () {
"use strict";

let editor = ShapeEditor.text.editor;
let cursorIndex = editor && editor.cursor.getIndex();
if (!cursorIndex || cursorIndex.si !== cursorIndex.ei) return;

let fromTo = editor._getFromTo();
let wholeWord = fromTo.to.element.word.data().text;
// Yes, charCount() is -1-based!
let selectionStart = fromTo.to.element.charCount + 1;
if (selectionStart > wholeWord.length) return;
let word = wholeWord.substr(0, selectionStart);
if (!word || !word.length) return;

//dump(">>> zshow.js -- word: " + word + "; selectionStart: " + selectionStart + "\n");	// debug

let [newWord, changed] = JSON.parse(_avim_applyKey(word, {
	keyCode: _avim_evtInfo[0],
	which: _avim_evtInfo[1],
	shiftKey: _avim_evtInfo[2],
}));
if (newWord && newWord !== word) {
	//dump(">>> zshow.js -- Replacing <" + word + "> with <" + newWord + ">\n");	// debug
	
	for (let i = 0; i < selectionStart; i++) editor.backspace();
	editor.addText(newWord);
}
if (changed) _avim_textChanged = true;

})();
