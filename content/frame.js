"use strict";

dump(">>> AVIM frame.js -- this: " + this + "\n");								// debug

const Cc = Components.classes;
const supportsString = Cc["@mozilla.org/supports-string;1"];
const xformer = Cc["@1ec5.org/avim/transformer;1"];
dump("\tsupports string: " + supportsString + "\n");			// debug
dump("\txformer: " + xformer + "\n");			// debug

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
//		dump("AVIM.getEditor -- couldn't get editor: " + e + "\n");		// debug
	return undefined;
}

addEventListener("keypress", function (evt) {
	dump(">>> AVIM frame keypress -- code: " + String.fromCharCode(evt.which) + " #" + evt.which +
		 "; target: " + evt.target.nodeName + "." + evt.target.className + "#" + evt.target.id +
		 "; originalTarget: " + evt.originalTarget.nodeName + "." + evt.originalTarget.className + "#" + evt.originalTarget.id + "\n");			// debug
	dump("\teditor: " + getEditor(evt.originalTarget) + "\n");					// debug
}, true);
