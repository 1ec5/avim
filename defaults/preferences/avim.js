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

/* Display the status bar panel. */
pref("extensions.avim.statusBarPanel", true);

/*
 * Ignore any fields that contain e-mail addresses, as well as the code
 * evaluation bar in the Error Console. Field IDs are case-insensitive and
 * separated by spaces.
 */
pref("extensions.avim.ignoredFieldIds", "colorzilla-textbox-hex e-mail email textboxeval tx_tagname");

/* Include some standard input methods in the Auto method. */
pref("extensions.avim.auto.telex", true);
pref("extensions.avim.auto.vni", true);
pref("extensions.avim.auto.viqr", false);
pref("extensions.avim.auto.viqrStar", false);

/* Disable some embedded Vietnamese IME scripts. */
pref("extensions.avim.scriptMonitor.enabled", true);
pref("extensions.avim.scriptMonitor.avim", true);
pref("extensions.avim.scriptMonitor.vietTyping", true);
pref("extensions.avim.scriptMonitor.vietUni", true);
pref("extensions.avim.scriptMonitor.vietImeW", false);
