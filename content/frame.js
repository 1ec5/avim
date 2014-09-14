"use strict";

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

const iCloudHostname = "www.icloud.com";
const GDocsHostname = "docs.google.com";

const winUtils = content.QueryInterface(Ci.nsIInterfaceRequestor)
	.getInterface(Ci.nsIDOMWindowUtils);

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
//	dump("AVIM.getEditor -- couldn't get editor: " + e + "\n");		// debug
	return undefined;
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
	
	let results = sendSyncMessage("AVIM:applyKey", {
		prefix: node.substringData(0, sel.anchorOffset),
		evt: {
			keyCode: evt.keyCode,
			which: evt.which,
			shiftKey: evt.shiftKey,
			ctrlKey: evt.ctrlKey,
			metaKey: evt.metaKey,
			altKey: evt.altKey,
		},
	});
	result = results && results[0];
	//dump("AVIM.splice -- editor: " + editor +
	//	 "; old word: " + (result && result.oldValue) +
	//	 "; new word: " + (result && result.value) + "\n");						// debug
	if (!result) return result;
	
	// Carry out the transaction.
	if (editor.beginTransaction) editor.beginTransaction();
	try {
		if ("value" in result && result.value != result.oldValue) {
			let txn = new SpliceTxn(outer, node,
									sel.anchorOffset - result.oldValue.length,
									result.oldValue.length, result.value);
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
}

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
	let inputEvent = inner.ownerDocument.createEvent("Events");
	inputEvent.initEvent("input", true, true);
	if (inner.dispatchEvent) inner.dispatchEvent(inputEvent);
	
	// Autocomplete textboxes for Toolkit
	if (outer && outer.form) {
		let controller = Cc["@mozilla.org/autocomplete/controller;1"]
			.getService(Ci.nsIAutoCompleteController);
		controller.handleEndComposition();
	}
}

function handleKeyPress(evt) {
	// https://developer.mozilla.org/en/HTML/Element/input
	// Supported <input> types are: text, search, password (if .passwords),
	// url (if "url" or "urlbar" in .ignoredFieldIds), and email (if
	// "e-mail" or "email" in .ignoredFieldIds).
	const htmlTypes = ["search", "text", "textarea"];
	
	let elt = evt.originalTarget;
//	dump("AVIM.handleKeyPress -- target: " + elt.tagName + "; code: " + evt.which + "\n");	// debug
	if (/*findIgnore(evt.target) ||*/ !elt.type) return false;
	let isHTML = htmlTypes.indexOf(elt.type) >= 0 /*||
		(elt.type == "password" && AVIMConfig.passwords) ||
		(elt.type == "url" && (AVIMConfig.exclude.indexOf("url") < 0 ||
							  AVIMConfig.exclude.indexOf("urlbar") < 0)) ||
		(elt.type == "email" && (AVIMConfig.exclude.indexOf("email") < 0 ||
								AVIMConfig.exclude.indexOf("e-mail") < 0))*/;
	if (!isHTML || elt.selectionStart != elt.selectionEnd) return false;
	
	let result = splice(elt, evt);
	if (result.changed) {
		evt.preventDefault();
		updateContainer(elt, elt);
		// Prevent textboxes from scrolling to the beginning.
		winUtils.sendKeyEvent("keypress", content.KeyEvent.DOM_VK_LEFT, 0, 0);
		winUtils.sendKeyEvent("keypress", content.KeyEvent.DOM_VK_RIGHT, 0, 0);
	}
	return !result.changed;
}

addEventListener("keypress", function (evt) {
	dump(">>> AVIM frame keypress -- code: " + String.fromCharCode(evt.which) + " #" + evt.which +
		 "; target: " + evt.target.nodeName + "." + evt.target.className + "#" + evt.target.id +
		 "; originalTarget: " + evt.originalTarget.nodeName + "." + evt.originalTarget.className + "#" + evt.originalTarget.id + "\n");			// debug
	
	try {
		handleKeyPress(evt);
	}
	catch (exc) {
// $if{Debug}
		dump(">>> AVIM frame keypress -- error:\n" + exc + "\n");
// $endif{}
	}
}, true);
