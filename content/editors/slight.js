"use strict";

(function () {

/**
 * Returns the Gecko-compatible virtual key code for the given Silverlight
 * virtual key code.
 *
 * @param	keyCode			{number}	Silverlight virtual key code.
 * @param	platformKeyCode	{number}	Platform key code.
 * @param	shiftKey		{boolean}	True if the Shift key is held down;
 * 										false otherwise.
 * @returns	A Gecko-compatible virtual key code, or 0xff (255) if no virtual key
 * 			is applicable.
 *
 * @see		http://msdn.microsoft.com/en-us/library/bb979636%28VS.95%29.aspx
 * @see		https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
 */
function virtualKey(keyCode, platformKeyCode, shiftKey) {
//	dump("key code: " + keyCode + "; platform key code: " + platformKeyCode + "\n");	// debug
	if (keyCode > 19 && keyCode < 30) {	// number row
		if (shiftKey) return 0xff;
		else keyCode += 28;
	}
	else if (keyCode > 29 && keyCode < 56) {	// alphabetic
		keyCode += 35;
		if (!shiftKey) keyCode += 32;
	}
//	if (keyCode == 0xff && platformKeyCode == 39) {	// '
//		keyCode = platformKeyCode;
//	}
	return keyCode;
}

/**
 * Handles key presses in Silverlight. This function is triggered as soon as the
 * key goes down.
 *
 * @param sender	{object}	The object that invoked the event.
 * @param evt		{object}	The keyDown event.
 */
function keyDown(sender, evt) {
	try {
		let ctl = evt.source;
		let text = ctl.text;
		if (!text || !ctl.isEnabled || ctl.isReadOnly || evt.ctrl ||
			ctl.selectionLength || findIgnore(ctl.name)) {
			return;
		}
		let selStart = ctl.selectionStart;
		let word = lastWordInString(text.substr(0, selStart));
		if (!word) return;
		
		let evtProxy = {
			charCode: virtualKey(evt.key, evt.platformKeyCode, evt.shift),
			platformKeyCode: evt.platformKeyCode,
			shiftKey: evt.shift,
		};
		evtProxy.which = evtProxy.charCode;
		
		if (!evtProxy.charCode || evtProxy.charCode == 0xff) {
			setTimeout(function () {
				eatChar(ctl, evtProxy);
			}, 0);
			return;
		}
		
		let [newWord, changed] = applyKey(word, evtProxy);
		if (changed || (newWord && newWord != word)) {
			if (!changed) newWord += String.fromCharCode(evtProxy.charCode);
			let numExtraChars = newWord.length - word.length;
			let tooLong = ctl.maxLength &&
				text.length + numExtraChars > ctl.maxLength;
			if (!tooLong) {
				// Silverlight 2 no longer respects KeyboardEventArgs.Handled,
				// so override the control contents asynchronously.
				setTimeout(function () {
					let wordStart = selStart - word.length;
					ctl.text = text.substr(0, wordStart) + newWord +
						text.substr(selStart);
					ctl.selectionStart = selStart + numExtraChars;
					ctl.selectionLength = 0;
				}, 0);
			}
		}
		if (changed) evt.handled = true;
	}
	catch(exc) {
// $if{Debug}
		throw ">>> keyDown -- " + exc;
// $endif{}
	}
}

/**
 * Handles miscellaneous key presses in Silverlight. This function is triggered
 * as soon as the key goes up, and only responds if the key does not correspond
 * to a virtual key. In that case, it uses the character immediately preceding
 * the caret.
 *
 * @param ctl		{object}	A <TextBox> XAML element.
 * @param evtProxy	{object}	An object imitating a keyUp event.
 */
function eatChar(ctl, evtProxy) {
	try {
		let selStart = ctl.selectionStart;
		if (!selStart || ctl.selectionLength) return;
		
		// Override the event proxy's key code using the last character.
		let text = ctl.text;
		evtProxy.which = evtProxy.charCode = text.charCodeAt(selStart - 1);
		if (evtProxy.charCode == 0xff) return;
		
		// Exclude the last character from the word.
		let word = lastWordInString(text.substr(0, selStart - 1));
		let [newWord, changed] = word && applyKey(word, evtProxy);
		if (changed || (newWord && newWord != word)) {
			if (!changed) newWord += text[selStart - 1];
			let numExtraChars = newWord.length - word.length;
			let tooLong = ctl.maxLength &&
				text.length - 1 + numExtraChars > ctl.maxLength;
			if (!tooLong) {
				let wordStart = selStart - 1 - word.length;
				ctl.text = text.substr(0, wordStart) + newWord +
					text.substr(selStart);
				ctl.selectionStart = selStart - 1 + numExtraChars;
				ctl.selectionLength = 0;
			}
		}
	}
	catch(exc) {
// $if{Debug}
		throw ">>> eatChar -- " + exc;
// $endif{}
	}
}

let plugin = document.querySelector("object[data-avim-registering]");
let content = plugin && plugin.content;
if (content) content.root.addEventListener("keyDown", keyDown);

})();
