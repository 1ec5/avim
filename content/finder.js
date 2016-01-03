/* global avim, content, sendSyncMessage, addMessageListener */
(function (msgMgr) {
"use strict";

//const Cc = Components.classes;
const Ci = Components.interfaces;
//const Cu = Components.utils;

const isChrome = typeof window === "object";

// Root for AVIM preferences
let AVIMConfig;
if (isChrome) AVIMConfig = avim.onFrameReadyForPrefs();
else {
	let results = sendSyncMessage("AVIM:readyforprefs");
	if (results) AVIMConfig = results[0];
	addMessageListener("AVIM:prefschanged", function (msg) {
		//dump(">>> Received AVIM:prefschanged -- AVIMConfig: " + msg.data + "\n");		// debug
		AVIMConfig = msg.data;
	});
}

addEventListener("find", function (evt) {
	dump(">>> find event: " + evt.detail.query + "\n");								// debug
}, true);

const baseRunPattern = /A+|a+|Ă+|ă+|Â+|â+|D+|d+|E+|e+|Ê+|ê+|G+|g+|I+|i+|O+|o+|Ô+|ô+|Ơ+|ơ+|U+|u+|Ư+|ư+|Y+|y+/g;
const charsByBase = {
	a: "aàảãáạăằẳẵắặâầẩẫấậ",
	"ă": "ăằẳẵắặ",
	"â": "âầẩẫấậ",
	d: "dđ₫",
	e: "eèẻẽéẹêềểễếệ",
	"ê": "êềểễếệ",
	g: "g̃",
	i: "iìỉĩíị",
	o: "oòỏõóọôồổỗốộơờởỡớợ",
	"ô": "ôồổỗốộ",
	"ơ": "ơờởỡớợ",
	u: "uùủũúụưừửữứự",
	"ư": "ưừửữứự",
	y: "yỳỷỹýỵ",
};

// _getSelectionController: https://dxr.mozilla.org/mozilla-central/source/toolkit/modules/Finder.jsm#662
function getSelectionController(win) {
	try {
		if (!win.innerWidth || !win.innerHeight) return null;
	}
	catch (exc) {
		return null;
	}
	let docShell = win.QueryInterface(Ci.nsIInterfaceRequestor)
		.getInterface(Ci.nsIWebNavigation)
		.QueryInterface(Ci.nsIDocShell);
	let controller = docShell.QueryInterface(Ci.nsIInterfaceRequestor)
		.getInterface(Ci.nsISelectionDisplay)
		.QueryInterface(Ci.nsISelectionController);
	return controller;
}

function getFoldPattern(query, caseSensitive) {
	// Includes some special cases from nsFind::Find().
	return new RegExp(query.replace(baseRunPattern, function (base, offset, whole) {
		let chars = charsByBase[base[0].toLowerCase()];
		if (base[0] === base[0].toUpperCase()) chars = chars.toUpperCase();
		let pattern = "[" + chars + "]";
		if (base.length > 1) pattern += "{" + base.length + "}";
		return pattern;
	}).replace(/[“”]/g, "\"").replace(/[‘’]/g, "'"), caseSensitive ? "" : "i");
}

function getNormalizedContent(node) {
	// Includes some special cases from nsFind::Find().
	if (!node.data) return "";
	return node.data.replace(/\u00ad/g /* shy */, "").replace(/\s/g, " ")
		.replace(/[“”]/g, "\"").replace(/[‘’]/g, "'");
}

function getNodeIterator(win, rootElt, pattern) {
	let doc = win.document;
	const NF = win.NodeFilter;
	/* jshint bitwise: false */
	let whatToShow = NF.SHOW_ELEMENT | NF.SHOW_TEXT;
	/* jshint bitwise: true */
	return doc.createNodeIterator(rootElt, whatToShow, function (node) {
		if (node.nodeType === 3) {
			return pattern.test(getNormalizedContent(node)) ? NF.FILTER_ACCEPT : NF.FILTER_REJECT;
		}
		// TODO: frames
		if ("mozIsTextField" in node) {
			return node.mozIsTextField(true) ? NF.FILTER_ACCEPT : NF.FILTER_REJECT;
		}
		return (node instanceof win.HTMLTextAreaElement) ? NF.FILTER_ACCEPT : NF.FILTER_REJECT;
	});
}

/**
 * Returns the nsIEditor (or subclass) instance associated with the given XUL or
 * HTML element.
 *
 * @param elt	{object}	The XUL or HTML element.
 * @returns	{object}	The associated nsIEditor instance.
 */
function getEditor(elt) {
	try {
		return elt && elt.QueryInterface(Ci.nsIDOMNSEditableElement).editor;
	}
	catch (e) {}
	try {
		return elt.QueryInterface(Ci.nsIEditor).editor;
	}
	catch (e) {}
	return null;
}

function highlightDocument(win, sel, foldPattern, rootElt) {
	if (!rootElt || !sel) return;
	sel.removeAllRanges();
	
	let iter = getNodeIterator(win, rootElt, foldPattern);
	let node;
	while ((node = iter.nextNode())) {
		if (node.nodeType === 1) {
			let editor = getEditor(node);
			if (editor) {
				let sel = editor.selectionController
					.getSelection(Ci.nsISelectionController.SELECTION_FIND);
				highlightDocument(win, sel, foldPattern, editor.rootElement);
			}
		}
		// TODO: frames
		else {
			let result = foldPattern.exec(getNormalizedContent(node));
			if (result) {
				let range = win.document.createRange();
				range.setStart(node, result.index);
				range.setEnd(node, result.index + result[0].length);
				sel.addRange(range);
			}
		}
	}
}

function onHighlightAllChange(options) {
	let query = options.query;
	let controller = getSelectionController(isChrome ? window : content);
	// TODO: Editable node listeners
	// _getEditableNode: https://dxr.mozilla.org/mozilla-central/source/toolkit/modules/Finder.jsm#693
	let findSel = controller && controller.getSelection(Ci.nsISelectionController.SELECTION_FIND);
	
	if (findSel) {
		let win = isChrome ? window : content;
		let doc = win.document;
		
		let foldPattern = getFoldPattern(query, options.caseSensitive);
		//dump(">>> findhighlightallchange event -- query: " + query +
		//	 "; foldPattern: " + foldPattern + "\n");							// debug
		highlightDocument(win, findSel, foldPattern, doc.documentElement);
	}
}

addMessageListener("AVIM:findhighlightallchange", function (msg) {
	// msg.name
	onHighlightAllChange(msg.data);
}, true);

})(this);
