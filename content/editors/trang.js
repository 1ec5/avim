// In strict mode, the call to _executeCommand() fails because a reentrancy
// check fails and diagnostic code attempts to build a stack using
// argument.caller.
/* jshint strict:false */
/* global _avim_lastWordInString, _avim_applyKey, _avim_evtInfo, _avim_textChanged:true, GSAUI, GSWP, GSK, GSD, GSWP */
//"use strict";

(function () {

if (!("GSF" in window)) return;
let selection = "GSAUI" in window && GSAUI.selectionController.topSelection[0];
if (!(selection && selection instanceof GSWP.TextSelection &&
	  selection.isInsertionPoint())) {
	return;
}
let storage = selection.getTextStorage();
if (!storage) return;

let selectionStart = selection.getNormalizedRange().location;
let word = _avim_lastWordInString(storage.getSubstring(0, selectionStart));
if (!word || !word.length) return;
let wordStart = selectionStart - word.length;

//dump("\tselection: " + selectionStart + " back to " + wordStart + "\n");	// debug
//dump("\t<" + word + ">\n");

let [newWord, changed] = JSON.parse(_avim_applyKey(word, {
	keyCode: _avim_evtInfo[0],
	which: _avim_evtInfo[1],
	shiftKey: _avim_evtInfo[2],
}));
if (newWord && newWord !== word) {
	//dump(">>> Replacing <" + word + "> with <" + newWord + ">\n");				// debug
	
	let editor = GSK.DocumentViewController.currentController
		.canvasViewController.getEditorController()
		.getMostSpecificCurrentEditorOfClass(GSD.Editor);
	let wordSelection = GSWP.TextSelection
		.createWithStartAndStopAndCaretAffinityAndLeadingEdge(storage,
															  wordStart,
															  selectionStart,
															  null, null);
	let cmd = editor._createReplaceTextCommand(wordSelection, newWord);
	editor._executeCommand(cmd);
}
if (changed) _avim_textChanged = true;

})();
