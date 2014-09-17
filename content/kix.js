"use strict";

(function () {

const Cc = Components.classes;
const Ci = Components.interfaces;
const CC = Components.Constructor;

const nsTransferable = CC("@mozilla.org/widget/transferable;1",
							  "nsITransferable");
	
/**
 * A wrapper around nsITransferable that sets the source in order to respect
 * Private Browsing Mode.
 */
function Transferable(win) {
	let xfer = nsTransferable();
	if ("init" in xfer) {
		if (win instanceof Ci.nsIDOMWindow) {
			win = win.QueryInterface(Ci.nsIInterfaceRequestor)
				.getInterface(Ci.nsIWebNavigation);
		}
		xfer.init(win);
	}
	return xfer;
}

let isMac = navigator.platform == "MacPPC" || navigator.platform == "MacIntel";

/*
 * Proxy for a Google Kix editor to pose as an ordinary HTML <textarea>.
 * 
 * @param evt		{object}	The keyPress event.
 * @param helpers	{object}	An object containing functions required by this
 * 								subscript, to wit: applyKey() and
 * 								lastWordInString().
 */
function KixProxy(evt, helpers) {
	if (evt.keyCode == evt.DOM_VK_BACK_SPACE && !evt.shiftKey) {
		throw "Backspace.";
	}
	
	let doc = evt.originalTarget.ownerDocument;
	if (!doc || !doc.body) throw "No document body to copy from.";
	
	let winUtils = QueryInterface(Ci.nsIInterfaceRequestor)
		.getInterface(Ci.nsIDOMWindowUtils);
	if (!winUtils || !("sendKeyEvent" in winUtils &&
					   "sendCompositionEvent" in winUtils &&
					   "sendContentCommandEvent" in winUtils)) {
		// Parts of the API are only available starting in Gecko 1.9 or 2.0.
		throw "Can't issue native events."
	}
	
	let frame = doc.defaultView.frameElement;
	if (!frame) throw "Not in iframe.";
	let frameDoc = frame.ownerDocument;
	
	const overlaySelector = ".kix-selection-overlay,.sketchy-text-selection-overlay";
	const presItemType = "http://schema.org/CreativeWork/PresentationObject";
	const drawingItemType = "http://schema.org/CreativeWork/DrawingObject";
	
	/**
	 * Returns whether text is currently selected in the editor, as indicated by
	 * the presence of a selection rectangle overlay.
	 */
	this.hasSelection = function() {
		return frameDoc.querySelectorAll(overlaySelector).length;
	};
	
	const tablePropsSel = "[role='menuitem'][aria-disabled='false'] " +
		"[aria-label^='Table properties']";
	const altTextSel = "[role='menuitem'][aria-disabled='false'] " +
		"[aria-label^='Alt text']";
	
	/**
	 * Returns whether the caret is currently in a table.
	 *
	 * The caret is in a table if the Table | Table Properties menu item is
	 * enabled.
	 *
	 * @returns {boolean}	True if the caret is in a table; false otherwise.
	 */
	this.isInTable = function() {
		return frameDoc.querySelector(tablePropsSel);
	};
	
	let itemType = frame.ownerDocument.body.getAttribute("itemtype");
	
	/**
	 * Returns whether a resizable (i.e., non-text) object is selected.
	 */
	this.isObjectSelected = function () {
		return itemType != drawingItemType && itemType != presItemType &&
			frameDoc.querySelector(altTextSel);
	};
	
	/**
	 * Generates a key event that selects the previous word or optionally to
	 * to beginning of the line.
	 *
	 * Mozilla observes the following platform-specific bindings for
	 * cmd_selectWordPrevious:
	 * 	/content/xbl/builtin/unix/platformHTMLBindings.xml	VK_LEFT	control,shift
	 * 	/content/xbl/builtin/mac/platformHTMLBindings.xml	VK_LEFT	alt,shift
	 * 	/content/xbl/builtin/emacs/platformHTMLBindings.xml	VK_LEFT	control,shift
	 * 	/content/xbl/builtin/win/platformHTMLBindings.xml	VK_LEFT	control,shift
	 * and for cmd_selectBeginLine:
	 * 	/content/xbl/builtin/unix/platformHTMLBindings.xml	VK_HOME	shift
	 * 	/content/xbl/builtin/mac/platformHTMLBindings.xml	VK_LEFT	accel,shift
	 * 	/content/xbl/builtin/emacs/platformHTMLBindings.xml	VK_HOME	shift
	 * 	/content/xbl/builtin/win/platformHTMLBindings.xml	VK_HOME	shift
	 *
	 * @param toLineStart	{boolean}	True to extend the selection to the
	 * 									start of the line; false otherwise.
	 */
	this.selectPrecedingWord = function(toLineStart) {
//		dump("KixProxy.selectPrecedingWord()\n");								// debug
		let key = (isMac || !toLineStart) ?
			KeyEvent.DOM_VK_LEFT : KeyEvent.DOM_VK_HOME;
		let modifiers = (isMac || toLineStart) ?
			Event.SHIFT_MASK : (Event.CONTROL_MASK | Event.SHIFT_MASK);
		if (isMac) modifiers |= toLineStart ? Event.META_MASK : Event.ALT_MASK;
		winUtils.sendKeyEvent("keypress", key, 0, modifiers);
	};
	
	const board = Cc["@mozilla.org/widget/clipboard;1"]
		.getService(Ci.nsIClipboard);
	
	/**
	 * Returns the contents of the clipboard.
	 */
	this.getClipboardData = function () {
		if (!board.hasDataMatchingFlavors(["text/unicode"], 1,
										  board.kGlobalClipboard)) {
			return false;
		}
		let xfer = Transferable(frameDoc.defaultView);
		// TODO: Use the text/html flavor to retain formatting.
		xfer.addDataFlavor("text/unicode");
		board.getData(xfer, board.kGlobalClipboard);
		return xfer;
	};
	
	/**
	 * Returns the text contents of the clipboard.
	 */
	this.getClipboardText = function() {
		let xfer = this.getClipboardData();
		if (!xfer) return "";
		
		// https://developer.mozilla.org/en/Using_the_Clipboard
		let str = new Object(), len = new Object();
		try {
			xfer.getTransferData("text/unicode", str, len);
		}
		catch (exc) {
			// At the beginning of a new line (but not the beginning of the
			// document), the previous line break has been selected.
			return "\n";
		}
		str = str && str.value.QueryInterface(Ci.nsISupportsString);
		// text/unicode is apparently stored as UTF-16.
		str = str && str.data.substring(0, len.value / 2);
		// BOM can occur at the beginning of the document.
		return str != "\ufeff" && str;
	};
	
	/**
	 * Generates a right-arrow key event that returns the selection to where it
	 * was before KixProxy started modifying it.
	 */
	this.revertSelection = function() {
//		dump("KixProxy.revertSelection()\n");									// debug
		winUtils.sendKeyEvent("keypress", KeyEvent.DOM_VK_RIGHT, 0, 0);
	};
	
	/**
	 * Generates a shift-right-arrow key event that removes the leftmost
	 * character from the selection.
	 */
	this.trimLeftSelection = function() {
		winUtils.sendKeyEvent("keypress", KeyEvent.DOM_VK_RIGHT, 0,
							  Event.SHIFT_MASK);
	};
	
	/**
	 * Copies and retrieves the selected text. Callers are responsible for
	 * reverting the clipboard contents.
	 *
	 * @throws {string}	when there was no selection, or the selection was
	 * 					nothing but spaces, in which case the selection is
	 * 					reverted.
	 */
	this.getSelectedText = function(isInTable) {
		// Clear the clipboard.
		let xfer = Transferable(frameDoc.defaultView);
		board.setData(xfer, null, board.kGlobalClipboard);
		
		// Copy the word.
		winUtils.sendContentCommandEvent("copy");
		
		// Retrieve the text from the clipboard.
		let value = this.getClipboardText();
		if (!value) {
			// Objects may not be copied as text, but they may be selected.
			if (this.hasSelection()) this.revertSelection();
			return "";
		}
		// Probably the beginning of a line (or the line has just spaces).
		if (!value.trim()) {
			this.revertSelection();
			return "";
		}
		return value;
	};
	
	// Abort if there is a selection. The selection rectangle is an overlay
	// element that can be identified by its (platform-specific) class.
	if (this.hasSelection()) throw "Non-empty selection.";
	
	// Select the previous word.
	let wasInTable = this.isInTable();
//	if (wasInTable) dump("KixProxy -- Caret in table.\n");						// debug
	this.selectPrecedingWord(wasInTable);
	if ((!wasInTable && this.isInTable()) || this.isObjectSelected()) {
		// The selection now lies in the table, so the caret was right after
		// the table.
		this.trimLeftSelection();
		throw "Right after table or resizable object.";
	}
	if (this.hasSelection() > 1) {
//		dump("KixProxy -- More than one line selected.\n");						// debug
		// A horizontal line may have been included in the selection, or the
		// word spans more than one line.
		this.revertSelection();
		// There will only be one word in this selection.
		this.selectPrecedingWord(true);
	}
	
	// Get the selected text.
	let value = this.getSelectedText();
	if (wasInTable && value) {
		//dump("KixProxy -- Reselecting text in table.\n");					// debug
		// Unselect the text, unless the cell and selection are empty.
		this.revertSelection();
		// Reselect the text, this time just the preceding word.
		this.selectPrecedingWord(false);
		value = this.getSelectedText();
	}
	if (!value) throw "No text.";
	if (!helpers.lastWordInString(value)) {
		this.revertSelection();
		throw "No word.";
	}
//	dump("KixProxy -- value: <" + value + ">\n");								// debug
	
	this.value = this.oldValue = value;
	this.selectionStart = this.selectionEnd = this.value.length;
	
	/**
	 * Updates the Kix editor represented by this proxy to reflect any changes
	 * made to the proxy.
	 * 
	 * @returns {boolean}	True if anything was changed; false otherwise.
	 */
	this.commit = function() {
//		dump("KixProxy.commit -- value: <" + this.value + ">; oldValue: <" + this.oldValue + ">\n");	// debug
		if (this.value == this.oldValue) {
			if (this.value) this.revertSelection();
			return false;
		}
		
		// Paste the updated string into the editor.
		// In Kix 3790525131, which sends events to
		// "docs-texteventtarget-iframe", wrapping the paste operation in a
		// composition prevents the selection from flashing.
		// In Kix 3491395419, "kix-clipboard-iframe" inserts a newline after the
		// composition ends, breaking editing.
		// kix_2014.35-Tue_c handles pastes asynchronously, so insert one
		// character at a time.
		winUtils.sendKeyEvent("keypress", KeyEvent.DOM_VK_BACK_SPACE, 0, 0);
		winUtils.sendCompositionEvent("compositionstart", "", "");
		try {
			for (let i = 0; i < this.value.length; i++) {
				winUtils.sendKeyEvent("keypress", 0, this.value.charCodeAt(i),
									  0);
			}
		}
		finally {
			winUtils.sendCompositionEvent("compositionend", "", "");
		}
		
		return true;
	};
}

AVIM.prototype._handleKix = function (evt, helpers) {
	let elt = evt.originalTarget;
	let frame = elt.ownerDocument.defaultView.frameElement;
	if (!frame || !("classList" in frame) ||
		!(frame.classList.contains("docs-texteventtarget-iframe") ||
		  frame.classList.contains("kix-clipboard-iframe")) ||
		!document.querySelector) {
		return false;
	}
	
//	dump("AVIM.handleKix\n");													// debug
	
	// Get the existing clipboard data in as many formats as the application
	// would likely recognize. Unfortunately, everything else will be lost.
	// TODO: Implement nsIClipboardDragDropHooks to override the clipboard, to
	// avoid dropping any clipboard data.
	const board = Cc["@mozilla.org/widget/clipboard;1"]
		.getService(Ci.nsIClipboard);
	let xfer = Transferable(elt.ownerDocument.defaultView);
	let flavors = [
		// /widget/public/nsITransferable.idl
		"text/plain",				// kTextMime
		"text/unicode",				// kUnicodeMime
		"text/x-moz-text-internal",	// kMozTextInternal
		"text/html",				// kHTMLMime
		//"AOLMAIL",					// kAOLMailMime
		"image/png",				// kPNGImageMime
		"image/jpg",				// kJPEGImageMime
		"image/gif",				// kGIFImageMime
		"application/x-moz-file",	// kFileMime
		// Registering "text/x-moz-url" and its variants cause the
		// application to crash.
		//"text/x-moz-url",			// kURLMime
		//"text/x-moz-url-data",		// kURLDataMime
		//"text/x-moz-url-desc",		// kURLDescriptionMime
		//"text/x-moz-url-priv",		// kURLPrivateMime
		"application/x-moz-nativeimage",// kNativeImageMime
		"application/x-moz-nativehtml",	// kNativeHTMLMime
		
		// /widget/src/xpwidgets/nsClipboardPrivacyHandler.cpp
		"application/x-moz-private-browsing"	// NS_MOZ_DATA_FROM_PRIVATEBROWSING
	];
	for (let i = 0; i < flavors.length; i++) xfer.addDataFlavor(flavors[i]);
	board.getData(xfer, board.kGlobalClipboard);
	
	let result = {};
	try {
		// Fake a native textbox.
		let proxy = new KixProxy(evt, helpers);
		
		result = proxy.value && helpers.applyKey(proxy.value, evt);
		if (result && result.value) proxy.value = result.value;
		
		proxy.commit();
		proxy = null;
	}
	finally {
		// Revert the clipboard to the preexisting contents.
		board.setData(xfer, null, board.kGlobalClipboard);
		
		// Clear the clipboard.
		//let xfer = Transferable(elt.ownerDocument.defaultView);
		//let board = Cc["@mozilla.org/widget/clipboard;1"]
		//	.getService(Ci.nsIClipboard);
		//board.setData(xfer, null, board.kGlobalClipboard);
		//board.emptyClipboard(board.kGlobalClipboard);
	}
	
	if (result && result.changed) {
		evt.handled = true;
		evt.stopPropagation();
		evt.preventDefault();
	}
	return true;
};
	
})();
