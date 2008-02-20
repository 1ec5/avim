/*
 * Copyright (c) 2007-2008 Minh Nguyen.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

// Remember to set these defaults at the top of chrome/content/avim.js!

/* Enabled */
pref("extensions.avim.enabled", true);

/*
 * Auto-detect input method
 * 0 = AUTO, 1 = TELEX, 2 = VNI, 3 = VIQR, 4 = VIQR*
 */
pref("extensions.avim.method", 0);

/* Ignore words that do not follow Vietnamese spelling rules. */
pref("extensions.avim.ignoreMalformed", true);

/* Place accent marks on first vowel in a diphthong (o`a, o`e, u`y). */
pref("extensions.avim.oldAccents", true);

/*
 * Ignore any fields that contain e-mail addresses, as well as the code
 * evaluation bar in the Error Console. Field IDs are separated by commas (,).
 */
pref("extensions.avim.ignoredFieldIds", "email,TextboxEval");
