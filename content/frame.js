/* global avim, sendSyncMessage, addMessageListener */
(function (msgMgr) {
"use strict";

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const HTML_NS = "http://www.w3.org/1999/xhtml";

const iCloudHostname = "www.icloud.com";
const GDocsHostname = "docs.google.com";
const ZohoHostname = "docs.zoho.com";

//* {number} Milliseconds between the insertion of a syllable break and the
//* removal of the syllable overlay from the document.
const syllableOverlayLifetime = 1000 /* ms */;

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

// Include characters from major scripts that separate words with a space.
const wordChars =
	"\u0400-\u052f\u2de0-\u2dff\ua640-\ua69f" +	// Cyrillic
	"\u0370-\u03ff\u1f00-\u1fff" +	// Greek
	"A-Za-zÀ-ÖØ-öø-\u02af\u1d00-\u1dbf\u1e00-\u1eff\u2c60-\u2c7f" +
		"\ua720-\ua7ff\uab30-\uab6f\ufb00-\ufb4f" +	// Latin
	"\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff" +	// Arabic
	"\u0590-\u05ff\ufb1d-\ufb40" +	// Hebrew
	"\u0900-\u097f\u1cd0-\u1cff" +	// Devanagari
	"\u02b0-\u02ff" +	// spacing modifier letters
	"0-9" +	// numerals
	"₫\u0303" +	// miscellaneous Vietnamese characters
	"’";	// word-inner punctuation not found in Vietnamese
const wordRe = new RegExp("[" + wordChars + "]*$");

/**
 * Returns the JavaScript string literal representing the given string.
 */
function quoteJS(str) {
	return "\"" + str.replace(/\\/g, "\\\\").replace(/[\b]/g, "\\b")
					 .replace(/\f/g, "\\f").replace(/\n/g, "\\n")
					 .replace(/\r/g, "\\r").replace(/\t/g, "\\t")
					 .replace(/\v/g, "\\v").replace(/"/g, "\\\"") + "\"";
}

/**
 * Returns whether VIQR or VIQR* is the current input method, taking into
 * account whether they are enabled for Auto.
 *
 * @returns {bool}	True if VIQR or VIQR* is the current input method.
 */
function methodIsVIQR() {
	if (AVIMConfig.method > 2) return true;
	return AVIMConfig.method === 0 && (AVIMConfig.autoMethods.viqr ||
									   AVIMConfig.autoMethods.viqrStar);
}

/**
 * Returns the last word in the given string.
 *
 * If VIQR is the current input method, this function may return “\”.
 */
function lastWordInString(str) {
	if (!str) return "";
	if (str.substr(-1) === "\\" && methodIsVIQR()) return "\\";
	let match = wordRe.exec(str);
	return match && match[0];
}

const subscriptLoader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
	.getService(Ci.mozIJSSubScriptLoader);

/**
 * Loads a script at the given URI.
 *
 * @param uri		{string}	Location of the script.
 * @param target	{object}	A collection of properties to expose to the
 * 								script as its globals.
 * 
 * @see http://dxr.mozilla.org/mozilla-central/source/addon-sdk/source/lib/sdk/content/sandbox.js (importScripts())
 */
function loadSubScript(uri, target) {
	if ("loadSubScriptWithOptions" in subscriptLoader) {
		let options = {
			charset: "UTF-8",
// $if{Debug}
			ignoreCache: true,
// $endif{}
		};
		if (target) options.target = target;
		subscriptLoader.loadSubScriptWithOptions(uri, options);
	}
	else subscriptLoader.loadSubScript(uri, target, "UTF-8");
}

/**
 * A wrapper around a transparent (i.e., Xray-less) Components.utils.Sandbox
 * that restricts property access by type.
 *
 * @param principal	{object}	The security principal, also used as the
 * 								prototype object.
 */
function Sandbox(principal) {
	let sandbox = new Cu.Sandbox(principal, {
		sandboxName: "avim",
		sandboxPrototype: principal,
		wantXrays: false,
	});
	if (!sandbox) throw "No sandbox to evaluate in.";
	
	const jsVersion = "1.7";
	const evalInBox = Cu.evalInSandbox;
	
	///**
	// * Evaluates a statement in the given sandbox and returns a string.
	// */
	//this.evalString = function (text) {
	//	return evalInBox("(" + text + ")+''", sandbox, jsVersion);
	//};
	
	/**
	 * Evaluates a statement in the given sandbox and returns a Boolean.
	 */
	this.evalBoolean = function (text) {
		return evalInBox("!!(" + text + ")", sandbox, jsVersion);
	};
	
	///**
	// * Evaluates a statement in the given sandbox and returns an integer.
	// */
	//this.evalInt = function (text) {
	//	return parseInt(evalInBox("(" + text + ")+0", sandbox, jsVersion),
	//					0);
	//};
	
	///**
	// * Evaluates a statement in the given sandbox and returns a floating
	// * point number.
	// */
	//this.evalFloat = function (text) {
	//	return parseFloat(evalInBox("(" + text + ")+0", sandbox, jsVersion));
	//};
	
	///**
	// * Evaluates a statement in the given sandbox without returning
	// * anything.
	// */
	//this.evalFunctionCall = function (text) {
	//	evalInBox(text, sandbox, jsVersion);
	//};
	
	/**
	 * Assigns the evaluated result of a single JavaScript statement to the
	 * given property on the sandbox. The property does not become visible
	 * to the webpage.
	 *
	 * @returns True if the statement evaluates to a defined value.
	 */
	this.createObjectAlias = function (name, text) {
		sandbox[name] = evalInBox("(" + text + ")||undefined", sandbox,
								  jsVersion);
		return sandbox[name] !== undefined;
	};
	
	/**
	 * Imports a function into the sandbox with the given name.
	 */
	this.importFunction = function (fn, name) {
		sandbox.importFunction(fn, name);
	};
	
	/**
	 * Injects a script with the given URI into the sandbox.
	 */
	this.injectScript = function (uri) {
		loadSubScript(uri, sandbox);
	};
	
	/**
	 * Frees the internal sandbox to avoid memory leaks.
	 * 
	 * Once this method is called, all the other methods will fail, so the
	 * overall sandbox object should be discarded.
	 */
	this.nuke = function () {
		if ("nukeSandbox" in Cu) Cu.nukeSandbox(sandbox);
		sandbox = null;
	};
}

/**
 * Returns the nsIEditor (or subclass) instance associated with the given XUL or
 * HTML element.
 *
 * @param el	{object}	The XUL or HTML element.
 * @returns	{object}	The associated nsIEditor instance.
 */
function getEditor(el) {
	if (!el) return null;
	let editor;
	try {
		editor = el.QueryInterface(Ci.nsIDOMNSEditableElement).editor;
	}
	catch (e) {}
	try {
		editor = editor || el.QueryInterface(Ci.nsIEditor).editor;
	}
	catch (e) {}
	try {
		if (!editor) {
			// http://osdir.com/ml/mozilla.devel.editor/2004-10/msg00017.html
			let webNavigation = el.QueryInterface(Ci.nsIInterfaceRequestor)
				.getInterface(Ci.nsIWebNavigation);
			let editingSession = webNavigation
				.QueryInterface(Ci.nsIInterfaceRequestor)
				.getInterface(Ci.nsIEditingSession);
			return editingSession.getEditorForWindow(el);
		}
	}
	catch (e) {}
	return editor.isDocumentEditable ? editor : null;
}

/**
 * Transaction that replaces a particular substring in a text node, keeping the
 * caret at the end of the modified word for user convenience. Based on
 * <http://web.archive.org/web/20090512163928/http://weblogs.mozillazine.org/weirdal/archives/txMgr_transition.txt>.
 *
 * @param outer	{object}	A DOM node able to modify the selection range.
 * @param node	{object}	The DOM text node to be modified.
 * @param pos	{number}	The zero-based index from which to begin replacing
 * 							characters.
 * @param len	{number}	The number of characters to replace.
 * @param repl	{string}	The replacement string.
 * @implements Components.interfaces.nsITransaction
 * @implements Components.interfaces.nsISupports
 */
function SpliceTxn(outer, node, pos, len, repl) {
	this.wrappedJSObject = this;
	//* @type Boolean
	this.isTransient = false;
	
	this.node = node;
	this.pos = pos;
	this.len = len;
	this.repl = repl;
	let editor = getEditor(outer);
	let sel = editor && editor.selection;
	this.startOffset = sel && sel.anchorOffset;
	
	/**
	 * Shifts the selection to the right by the given number of characters.
	 *
	 * @param numChars	{number}	The number of characters to shift.
	 */
	this.shiftSelection = function(numChars) {
		let editor = getEditor(outer);
		let sel = editor && editor.selection;
		if (sel) sel.collapse(this.node, this.startOffset + numChars);
	};
	
	/**
	 * Replaces a substring in the text node with the given substitution.
	 */
	this.doTransaction = this.redoTransaction = function() {
		this.orig = this.node.substringData(this.pos, this.len);
		// (#105) replaceData() messes up Facebook, so delete then insert.
		this.node.deleteData(this.pos, this.len);
		this.node.insertData(this.pos, this.repl);
		this.shiftSelection(this.repl.length - this.len);
	};
	
	/**
	 * Replaces the previously inserted substitution with the original string.
	 */
	this.undoTransaction = function() {
		//node.replaceData(pos, repl.length, this.orig);
		this.node.deleteData(this.pos, this.repl.length);
		this.node.insertData(this.pos, this.orig);
		this.shiftSelection(0);
	};
	
	/**
	 * Merges the given transaction into this transaction, but only if both are
	 * SpliceTxns operating on the same word.
	 *
	 * @returns {boolean}	True if the transactions were merged.
	 */
	this.merge = function (aTxn) {
		if (!("wrappedJSObject" in aTxn &&
			  aTxn.wrappedJSObject instanceof SpliceTxn)) {
			return false;
		}
		aTxn = aTxn.wrappedJSObject;
		if (node !== aTxn.node && this.pos !== aTxn.pos) return false;
		//dump(">>> before -- repl: " + this.repl + "; len: " + this.len + "; startOffset: " + this.startOffset + "\n");	// debug
		this.repl = aTxn.repl;
		this.len = aTxn.len;
		this.startOffset = aTxn.startOffset;
		//dump("\tafter -- repl: " + this.repl + "; len: " + this.len + "; startOffset: " + this.startOffset + "\n");	// debug
		return true;
	};
	
	/**
	 * Returns whether this class implements the interface with the given IID.
	 *
	 * @param {number}	iid	The unique IID of the interface.
	 * @returns {boolean}	True if this class implements the interface; false
	 * 						otherwise.
	 */
	this.QueryInterface = function(iid) {
		if (iid === Ci.nsITransaction || iid === Ci.nsISupports) return this;
		return null;
	};
}

function applyKey(word, evt) {
	let data = {
		prefix: word,
		evt: {
			keyCode: evt.keyCode,
			which: evt.which,
			shiftKey: evt.shiftKey,
		},
	};
	if (isChrome) return avim.onFrameKeyPress({data: data});
	let results = sendSyncMessage("AVIM:keypress", data);
	return results && results[0];
}

/**
 * Returns the currently selected node in the given editor.
 */
function getSelectedNode(editor) {
	let sel = editor && editor.selection;
	if (!sel || sel.rangeCount !== 1 || !sel.isCollapsed) return null;
	let node = sel.anchorNode;
	// In Midas, clicking the end of the line takes the selection out of any
	// text node into the document at large. (#69) When an element is selected,
	// anchorOffset is the number of child nodes preceding the selection.
	if (node === editor.rootElement && sel.anchorOffset) {
		node = node.childNodes[sel.anchorOffset - 1];
		if (node.data) sel.collapse(node, node.data.length);
	}
	return node;
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
	let node = getSelectedNode(editor);
	if (!node || !sel.anchorOffset || !node.data) return result;
	
	let word = lastWordInString(node.substringData(0, sel.anchorOffset));
	let key = String.fromCharCode(evt.which);
	result = word && applyKey(word, evt);
	//dump("AVIM.splice -- editor: " + editor +
	//	 "; old word: " + word + "; key: " + key +
	//	 "; new word: " + (result && result.value) + "\n");						// debug
	if (!result || (word && result.value === word + key)) return {};
	
	// Carry out the transaction.
	// (#123) convertCustomChars() can increase the word length.
	let wordStart = sel.anchorOffset - word.length;
	if ("maxLength" in outer && outer.maxLength !== -1) {
		result.value = result.value.substr(0, outer.maxLength - wordStart);
	}
	if ("value" in result && result.value !== word) {
		let txn = new SpliceTxn(outer, node, wordStart, word.length,
								result.value);
		editor.doTransaction(txn);
	}
	return result;
}

const focusMgr = Cc["@mozilla.org/focus-manager;1"] &&
	Cc["@mozilla.org/focus-manager;1"].getService(Ci.nsIFocusManager);

/**
 * Returns the native (HTML, XUL) element that an editor is currently editing.
 */
function getEditedNativeElement() {
	let dispatcher = isChrome ? window.document.commandDispatcher : focusMgr;
	let elt = dispatcher.focusedElement;
	let doc = dispatcher.focusedWindow.document;
	
	let wysiwyg = (doc.designMode && doc.designMode.toLowerCase() === "on") ||
		(elt.contentEditable && elt.contentEditable.toLowerCase() === "true");
	return wysiwyg ? new XPCNativeWrapper(doc.defaultView) : elt;
}

/**
 * Inserts an element into the outermost document that overlays the syllable
 * immediately to the left of the insertion point.
 *
 * @param node	{Text}		The text node containing the syllable to overlay.
 * @param word	{string}	The syllable to overlay.
 */
function insertSyllableOverlay(node, word) {
	let win = isChrome ? window : msgMgr.content;
	let doc = win.document;
	if (!doc) return;
	let winUtils = win.QueryInterface(Ci.nsIInterfaceRequestor)
		.getInterface(Ci.nsIDOMWindowUtils);
	if (!("sendQueryContentEvent" in winUtils)) return;
	
	// Get the word's bounding rect relative to the outermost window's viewport
	// (which may be confined to the browser in e10s).
	// The editor's selection indices are relative to the start of the text
	// node, but sendQueryContentEvent() wants indices relative to the start of
	// the node's wholetext.
	let sel = winUtils.sendQueryContentEvent(winUtils.QUERY_SELECTED_TEXT, 0, 0,
											 0, 0);
	let textRect = winUtils.sendQueryContentEvent(winUtils.QUERY_TEXT_RECT,
												  sel.offset - word.length,
												  word.length, 0, 0);
	// sendQueryContentEvent() returns metrics in LayoutDevice pixels.
	let scale = 1;
	if ("screenPixelsPerCSSPixel" in winUtils) {
		scale /= winUtils.screenPixelsPerCSSPixel;
	}
	
	let overlay = doc.createElementNS(HTML_NS, "div");
	// Subject the overlay to AVIM's user agent stylesheet.
	overlay.className = "avim-syllable-overlay";
	overlay.style.left = textRect.left * scale + "px";
	overlay.style.top = textRect.top * scale + "px";
	overlay.style.width = textRect.width * scale + "px";
	overlay.style.height = textRect.height * scale + "px";
	
	if ("getVisitedDependentComputedStyle" in winUtils) {
		// To ensure visibility regardless of the background, use the effective
		// text color as the outline color.
		let color = winUtils.getVisitedDependentComputedStyle(node.parentElement,
															  null, "color");
		overlay.style.outlineColor = color;
	}
	
	// Document.insertAnonymousContent() is unavailable in XUL, but that's OK
	// because extensions and themes are unlikely to muck with the overlay.
	if (doc.documentElement && doc.documentElement.namespaceURI === XUL_NS) {
		doc.documentElement.appendChild(overlay);
		setTimeout(function (doc, overlay) {
			if (doc && doc.documentElement && overlay) {
				doc.documentElement.removeChild(overlay);
			}
		}, syllableOverlayLifetime, doc, overlay);
	}
	else if ("insertAnonymousContent" in doc) {
		let anonOverlay = doc.insertAnonymousContent(overlay);
		setTimeout(function (doc, anonOverlay) {
			try {
				if (doc && anonOverlay) doc.removeAnonymousContent(anonOverlay);
			}
			catch (exc) {
				// Swallow any "can't access dead object" exception.
			}
		}, syllableOverlayLifetime, doc, anonOverlay);
	}
}

/**
 * Splits the currently selected text node at the caret position so that
 * subsequent input is treated as a new word.
 * 
 * @param outer	{object}	The DOM node being edited.
 * @returns {boolean}	True if a syllable break was inserted.
 */
function insertSyllableBreak(outer) {
	if (!outer) outer = getEditedNativeElement();
	let editor = getEditor(outer);
	let node = getSelectedNode(editor);
	if (node instanceof Ci.nsIDOMText) {
		let sel = editor.selection;
		let word = lastWordInString(node.substringData(0, sel.anchorOffset));
		if (word) {
			insertSyllableOverlay(node, word);
			let newNode = node.splitText(sel.anchorOffset);
			sel.collapse(newNode, 0);
			return true;
		}
	}
	return false;
}

/**
 * Deletes a diacritic from the word immediately preceding the insertion point.
 */
function deleteDiacritic() {
	let outer = getEditedNativeElement();
	let editor = getEditor(outer);
	let node = getSelectedNode(editor);
	if (node instanceof Ci.nsIDOMText) {
		splice(outer, {
			keyCode: Ci.nsIDOMKeyEvent.DOM_VK_BACK_SPACE,
			which: Ci.nsIDOMKeyEvent.DOM_VK_BACK_SPACE,
			shiftKey: true,
		});
	}
}

/**
 * Fires a fake onInput event from the given element. If preventDefault() is
 * called on the onKeyPress event, most textboxes will not respond appropriately
 * to AVIM's changes (autocomplete, in-page find, `oninput` attribute, etc.)
 * unless this method is called.
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

/**
 * Returns whether AVIM should ignore the given element.
 *
 * @param el	{object}	A DOM node representing a textbox element.
 * @returns {boolean}	True if the element should be ignored; false otherwise.
 */
function findIgnore(el) {
	if (!el || !el.getAttribute) return true;
	let id = el.id || el.getAttribute("id");
	if (id && id.toLowerCase &&
		AVIMConfig.exclude.indexOf(id.toLowerCase()) >= 0) {
		return true;
	}
	let name = el.name || el.getAttribute("name");
	if (name && name.toLowerCase &&
		AVIMConfig.exclude.indexOf(name.toLowerCase()) >= 0) {
		return true;
	}
	
	// Honor "ime-mode: disabled" in CSS.
	let win = el.ownerDocument && el.ownerDocument.defaultView;
	if (!win || !win.getComputedStyle) return false;
	let mode = win.getComputedStyle(el, null).getPropertyValue("ime-mode");
	return mode === "disabled";
}

/**
 * Scrolls the input field to ensure that the caret is visible.
 */
function scrollToCaret(outer) {
	let editor = getEditor(outer);
	let selCtrlr = editor && editor.selectionController;
	if (!selCtrlr) return;
	selCtrlr.scrollSelectionIntoView(selCtrlr.SELECTION_NORMAL,
									 selCtrlr.SELECTION_FOCUS_REGION, 0);
}

/**
 * Handles key presses for WYSIWYG HTML documents (editable through
 * Mozilla's Midas component).
 */
function handleWysiwyg(evt) {
	let elt = evt.originalTarget;
	let win = new XPCNativeWrapper(elt.ownerDocument.defaultView);
	if (findIgnore(elt)) return;
	if (win.frameElement && findIgnore(win.frameElement)) return;
	
	if (evt.shiftKey && evt.which === evt.DOM_VK_SPACE) {
		if (insertSyllableBreak(win)) {
			evt.stopPropagation();
			evt.preventDefault();
		}
		return;
	}
	
	let result = splice(win, evt);
	if (result.changed) {
		evt.stopPropagation();
		evt.preventDefault();
		updateContainer(null, elt.ownerDocument.documentElement);
		scrollToCaret(win);
	}
}

function handleHtmlInput(evt) {
	// https://developer.mozilla.org/en/HTML/Element/input
	// Supported <input> types are: text, search, password (if .passwords), url
	// (if "url" or "urlbar" in .ignoredFieldIds), and email (if "e-mail" or
	// "email" in .ignoredFieldIds).
	const htmlTypes = ["search", "text", "textarea"];
	
	let elt = evt.originalTarget;
//	dump("AVIM.handleHtmlInput -- target: " + elt.tagName + "; code: " + evt.which + "\n");	// debug
	if (findIgnore(evt.target) || !elt.type) return;
	let isHTML = htmlTypes.indexOf(elt.type) >= 0 ||
		(elt.type === "password" && AVIMConfig.passwords) ||
		(elt.type === "url" && (AVIMConfig.exclude.indexOf("url") < 0 ||
								AVIMConfig.exclude.indexOf("urlbar") < 0)) ||
		(elt.type === "email" && (AVIMConfig.exclude.indexOf("email") < 0 ||
								  AVIMConfig.exclude.indexOf("e-mail") < 0));
	if (!isHTML || elt.selectionStart !== elt.selectionEnd) return;
	
	if (evt.shiftKey && evt.which === evt.DOM_VK_SPACE) {
		if (insertSyllableBreak(elt)) evt.preventDefault();
		return;
	}
	
	let result = splice(elt, evt);
	if (result.changed) {
		evt.preventDefault();
		updateContainer(elt, elt);
		scrollToCaret(elt);
	}
}

let lazyHandlers = {};

/**
 * Handles a keypress event on a custom editor type by lazily loading its
 * privileged subscript.
 * 
 * @param evt	{object}	The keypress event.
 * @returns {boolean}	True if AVIM plans to modify the input; false otherwise.
 */
function handleLazily(evt, scriptName) {
	if (!(scriptName in lazyHandlers)) {
		loadSubScript("chrome://avim/content/" + scriptName + ".js", {
			applyKey: applyKey,
			lastWordInString: lastWordInString,
			lazyHandlers: lazyHandlers,
		});
	}
	return lazyHandlers[scriptName](evt);
}

/**
 * Returns a parseable string representing the given KeyEvent.
 *
 * The returned string must be wrapped in quoteJS() or brackets before being
 * passed into a Sandbox.
 */
function keyEventString(evt) {
	return [evt.keyCode, evt.which, evt.shiftKey].join(",");
}

/**
 * Returns the result of applyKey() as a JSON representation of an array, due to
 * security restrictions on passing objects.
 */
function safeApplyKey(word, evtProxy) {
	let result = applyKey(word, evtProxy);
	return JSON.stringify([result.value, result.changed]);
}

/**
 * Handles a key press on a target element by injecting a content script with
 * the given name into the content page.
 *
 * @param elt			{object}	A DOM element.
 * @param scriptName	{string}	The base file name of the content script
 * 									with the .js extension.
 * @returns {boolean} True if the content script changed the text; false if the
 * 					  text remained the same.
 */
function handleWithContentScript(elt, evt, scriptName) {
	let sandbox = new Sandbox(elt.ownerDocument.defaultView);
	sandbox.createObjectAlias("_avim_evtInfo", "[" + keyEventString(evt) + "]");
	sandbox.createObjectAlias("_avim_textChanged", "false");
	sandbox.importFunction(lastWordInString, "_avim_lastWordInString");
	sandbox.importFunction(safeApplyKey, "_avim_applyKey");
	
	sandbox.injectScript("chrome://avim/content/editors/" + scriptName + ".js");
	
	let changed = sandbox.evalBoolean("_avim_textChanged");
	sandbox.nuke();
	if (changed) {
		evt.handled = true;
		evt.stopPropagation();
		evt.preventDefault();
	}
	return changed;
}

//* Available specialized editor handlers, in descending order of precedence.
const specializedHandlers = [
	// SciMoz plugin
	{
		lazyScriptName: "sciMoz",
		targetIsIgnorable: true,
		isTarget: function (origTarget, doc) {
			let koManager = isChrome && window.ko && ko.views && ko.views.manager;
			let koView = koManager && koManager.currentView;
			let scintilla = koView && koView.scintilla;
			return scintilla && scintilla.inputField &&
				origTarget === scintilla.inputField.inputField;
		},
	},
	// Pages
	{
		contentScriptName: "trang",
		isTarget: function (origTarget, doc) {
			return doc.location.hostname === iCloudHostname &&
				origTarget.isContentEditable;
		},
	},
	// Google Docs
	{
		lazyScriptName: "kix",
		isTarget: function (origTarget, doc) {
			return doc.defaultView.frameElement && doc.defaultView.parent &&
				doc.defaultView.parent.location.hostname === GDocsHostname &&
				origTarget.isContentEditable;
		},
	},
	// Zoho Writer
	{
		contentScriptName: "zwrite",
		isTarget: function (origTarget, doc) {
			return doc.location.hostname === ZohoHostname &&
				origTarget.isContentEditable &&
				doc.getElementsByClassName("zw-page").length;
		},
	},
	// Zoho Show
	{
		contentScriptName: "zshow",
		isTarget: function (origTarget, doc) {
			return doc.location.hostname === ZohoHostname &&
				origTarget.isContentEditable &&
				doc.getElementsByClassName("slide-parent-overlay").length;
		},
	},
	// Ymacs editor
	{
		contentScriptName: "ymacs",
		updatesContainer: true,
		isTarget: function (origTarget, doc) {
			let tagName = origTarget.localName.toLowerCase();
			return (tagName === "html" || tagName === "body") &&
				doc.getElementsByClassName("Ymacs-frame-content").length;
		},
	},
	// Ace editor
	{
		contentScriptName: "ace",
		targetsParent: true,
		targetIsIgnorable: true,
		updatesContainer: true,
		isTarget: function (origTarget, doc) {
			// <pre class="ace-editor">
			let tagName = origTarget.localName.toLowerCase();
			let parent = origTarget.parentNode;
			if (tagName !== "textarea") return false;
			return "classList" in parent &&
				parent.classList.contains("ace_editor") &&
				parent.classList.contains("ace_focus") &&
				"querySelector" in parent.ownerDocument;
		},
	},
];

/**
 * Returns a handler for editing the current specialized editor.
 */
function getSpecializedHandler(origTarget, doc) {
	for (let i = 0; i < specializedHandlers.length; i++) {
		let handler = specializedHandlers[i];
		if (handler.isTarget(origTarget, doc)) return handler;
	}
	return null;
}

/**
 * Edits a specialized editor with the given handler and event.
 */
function handleSpecialized(handler, evt) {
	if (!handler) return;
	let origTarget = evt.originalTarget;
	if (handler.targetIsIgnorable && findIgnore(evt.target)) return;
	if (handler.lazyScriptName) handleLazily(evt, handler.lazyScriptName);
	else if (handler.contentScriptName) {
		let elt = handler.targetsParent ? origTarget.parentNode : origTarget;
		if (handleWithContentScript(elt, evt, handler.contentScriptName) &&
			handler.updatesContainer) {
			updateContainer(elt, elt);
		}
	}
}

// Silverlight applets

/**
 * Returns whether AVIM should ignore the element with the given name.
 *
 * @param name	{object}	The XAML TextBox element’s name.
 * @returns {boolean}	True if the element should be ignored; false otherwise.
 */
function slightFindIgnore(name) {
	return name.toLowerCase &&
		AVIMConfig.exclude.indexOf(name.toLowerCase()) >= 0;
}

/**
 * Attaches AVIM to the given Silverlight applet.
 *
 * @param plugin	{object}	An <object> element.
 */
function registerSlight(plugin) {
	plugin.setAttribute("data-avim-registering", "true");
	try {
		let sandbox = new Sandbox(plugin.ownerDocument.defaultView);
		sandbox.importFunction(slightFindIgnore, "_avim_findIgnore");
		sandbox.importFunction(lastWordInString, "_avim_lastWordInString");
		sandbox.importFunction(safeApplyKey, "_avim_applyKey");
		
		sandbox.injectScript("chrome://avim/content/editors/slight.js");
		sandbox.nuke();
	}
	catch (exc) {
// $if{Debug}
		dump(">>> registerSlight -- " + exc + "\n");
		throw exc;
// $endif{}
	}
	plugin.removeAttribute("data-avim-registering");
}

/**
 * Attaches AVIM to Silverlight applets whenever their containers load.
 */
function registerSlights() {
	const slightMimeTypes = ["application/x-silverlight-1",
							 "application/x-silverlight-2",
							 "application/ag-plugin"];
	
	// This is the same event that gPluginHandler listens for to show and hide
	// Click-to-Play.
	addEventListener("PluginInstantiated", function (evt) {
		let plugin = evt.originalTarget;
		if ("querySelectorAll" in plugin.ownerDocument &&
			plugin instanceof Ci.nsIObjectLoadingContent &&
			slightMimeTypes.indexOf(plugin.actualType) >= 0) {
			registerSlight(plugin);
		}
	}, true);
}

/**
 * Given a HTML document node, disables any Vietnamese JavaScript input method
 * editors (IMEs) embedded in the document that may cause conflicts. If AVIM is
 * disabled, this method does nothing.
 *
 * @param doc {object}	An HTML document node.
 */
function disableOthers(doc) {
	if (!AVIMConfig.onOff || !AVIMConfig.disabledScripts.enabled) return;
	
	// Avoid disabling other IME extensions.
	if (doc.location.protocol === "chrome:") return;
	
	// Since wrappedJSObject is only safe in Firefox 3 and above, sandbox all
	// operations on it.
	let winWrapper = new XPCNativeWrapper(doc.defaultView);
	let win = winWrapper.wrappedJSObject;
	if (win === undefined || win === null || (isChrome && win === window)) {
		return;
	}
	
	// Create a sandbox to execute the code in.
//		dump("inner sandbox URL: " + doc.location.href + "\n");				// debug
	let sandbox = new Sandbox(doc.defaultView);
	let disabledScriptNames = [];
	for (let name in AVIMConfig.disabledScripts) {
		if (name && AVIMConfig.disabledScripts.propertyIsEnumerable(name) &&
			AVIMConfig.disabledScripts[name]) {
			disabledScriptNames.push(name);
		}
	}
	sandbox.createObjectAlias("disabledScripts",
							  quoteJS(disabledScriptNames.join("|")));
	sandbox.injectScript("chrome://avim/content/disabler.js");
	sandbox.nuke();
}

/**
 * Returns whether the given key code should be ignored by AVIM.
 *
 * @param evt	{object}	Key event.
 * @returns {boolean}	True if AVIM is to ignore the keypress; false otherwise.
 */
function checkCode(evt) {
	let code = evt.which;
	return !AVIMConfig.onOff ||
		(code < evt.DOM_VK_INSERT &&
		 code !== evt.DOM_VK_BACK_SPACE &&
		 code !== evt.DOM_VK_PRINT &&
		 code !== evt.DOM_VK_SPACE &&
		 code !== evt.DOM_VK_RIGHT && code !== evt.DOM_VK_DOWN &&
		 code !== evt.DOM_VK_EXECUTE) ||
		code === evt.DOM_VK_SCROLL_LOCK;
}

let isWaitingForShiftSpace = false;

addEventListener("keydown", function (evt) {
	//dump("AVIM frame script keydown -- code: " + String.fromCharCode(evt.which) + " #" + evt.which +
	//	 "; target: " + evt.target.nodeName + "." + evt.target.className + "#" + evt.target.id +
	//	 "; originalTarget: " + evt.originalTarget.nodeName + "." + evt.originalTarget.className + "#" + evt.originalTarget.id + "\n");			// debug
	if (evt.shiftKey && evt.which !== evt.DOM_VK_SPACE) {
		isWaitingForShiftSpace = evt.which === evt.DOM_VK_SHIFT;
	}
	if (evt.ctrlKey || evt.metaKey || evt.altKey || checkCode(evt)) return;
	let doc = evt.target.ownerDocument;
	if (isChrome && doc.defaultView === window) {
		doc = evt.originalTarget.ownerDocument;
	}
	disableOthers(doc);
}, true);

addEventListener("keypress", function (evt) {
	//dump("AVIM frame script keypress -- isChrome: " + isChrome + "; code: " + String.fromCharCode(evt.which) + " #" + evt.which +
	//	 "; target: " + evt.target.nodeName + "." + evt.target.className + "#" + evt.target.id +
	//	 "; originalTarget: " + evt.originalTarget.nodeName + "." + evt.originalTarget.className + "#" + evt.originalTarget.id + "\n");			// debug
	if (evt.ctrlKey || evt.metaKey || evt.altKey || checkCode(evt)) return;
	if (isChrome && evt.originalTarget.localName === "browser") return;
	if (!isWaitingForShiftSpace && evt.shiftKey && evt.which === evt.DOM_VK_SPACE) {
		return;
	}
	isWaitingForShiftSpace = false;
	
	let target = evt.target;
	let origTarget = evt.originalTarget;
	if (isChrome && origTarget.localName === "browser") return;
	let doc = target.ownerDocument;
	if (isChrome && doc.defaultView === window) {
		doc = origTarget.ownerDocument;
	}
	
	try {
		let handler = getSpecializedHandler(origTarget, doc);
		handleSpecialized(handler, evt);
	} catch (exc) {
// $if{Debug}
		dump(">>> AVIM frame script keypress -- error on line " +
			 (exc && exc.lineNumber) + ": " + exc + "\n" + (exc && exc.stack) +
			 "\n");
// $endif{}
		// Instead of returning here, try to handle it as a normal textbox.
//		return false;
	}
	
	// Rich text editors
	let wysiwyg =
		(doc.designMode && doc.designMode.toLowerCase() === "on") ||
		(target.contentEditable &&
		 target.contentEditable.toLowerCase() === "true");
	if (wysiwyg) handleWysiwyg(evt);
	// Plain text editors
	else handleHtmlInput(evt);
}, true);

addEventListener("keyup", function (evt) {
	if (evt.which === evt.DOM_VK_SHIFT) {
		isWaitingForShiftSpace = false;
	}
}, true);

//* Text event types mapped to functions that perform text commands.
const textEventHandlers = {
	brokesyllable: insertSyllableBreak,
	deleteddiacritic: deleteDiacritic,
};

if (isChrome) {
	avim.doTextCommand = function (txtCmd) {
		textEventHandlers[txtCmd]();
	};
}
else {
	let listener = function (msg) {
		let txtEvt = msg.name.match(/^AVIM:(.+)/)[1];
		textEventHandlers[txtEvt]();
	};
	for (let txtEvt in textEventHandlers) {
		if (textEventHandlers.propertyIsEnumerable(txtEvt)) {
			addMessageListener("AVIM:" + txtEvt, listener);
		}
	}
}

registerSlights();

})(this);
