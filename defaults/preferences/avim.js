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
