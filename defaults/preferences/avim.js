pref("extensions.avim.prefVersion", 0);
/* Enabled */
pref("extensions.avim.enabled", true);
pref("services.sync.prefs.sync.extensions.avim.enabled", true);

/*
 * Auto-detect input method
 * 0 = AUTO, 1 = TELEX, 2 = VNI, 3 = VIQR, 4 = VIQR*
 */
pref("extensions.avim.method", 0);
pref("services.sync.prefs.sync.extensions.avim.method", true);

/* Ignore words that do not follow Vietnamese spelling rules. */
pref("extensions.avim.ignoreMalformed", true);
pref("services.sync.prefs.sync.extensions.avim.ignoreMalformed", true);

/* Place accent marks on first vowel in a diphthong (o`a, o`e, u`y). */
pref("extensions.avim.oldAccents", true);
pref("services.sync.prefs.sync.extensions.avim.oldAccents", true);

/*
 * Allow words with informal spellings like DZ and F when spelling enforcement
 * is enabled.
 */
pref("extensions.avim.informal", false);
pref("services.sync.prefs.sync.extensions.avim.informal", true);

/* Display the status bar panel. */
pref("extensions.avim.statusBarPanel", true);
pref("services.sync.prefs.sync.extensions.avim.statusBarPanel", true);

/*
 * Ignore any fields that contain e-mail addresses, as well as the code
 * evaluation bar in the Error Console. Field IDs are case-insensitive and
 * separated by spaces.
 *
 * 	"colorzilla-textbox-hex"			Hex box, Color Picker, ColorZilla
 * 	"email", "e-mail", "emailconfirm"	e-mail fields in general
 * 	"textboxeval"						Code bar, Firefox Error Console
 * 	"tx_tagname"						Tag Name, Insert Node, DOM Inspector
 */
pref("extensions.avim.ignoredFieldIds",
	 "colorzilla-textbox-hex e-mail email emailconfirm textboxeval tx_tagname");
pref("services.sync.prefs.sync.extensions.avim.ignoredFieldIds", true);

/* Include some standard input methods in the Auto method. */
pref("extensions.avim.auto.telex", true);
pref("services.sync.prefs.sync.extensions.avim.auto.telex", true);
pref("extensions.avim.auto.vni", true);
pref("services.sync.prefs.sync.extensions.avim.auto.vni", true);
pref("extensions.avim.auto.viqr", false);
pref("services.sync.prefs.sync.extensions.avim.auto.viqr", true);
pref("extensions.avim.auto.viqrStar", false);
pref("services.sync.prefs.sync.extensions.avim.auto.viqrStar", true);

/* Disable some embedded Vietnamese IME scripts. */
pref("extensions.avim.scriptMonitor.enabled", true);
pref("services.sync.prefs.sync.extensions.avim.scriptMonitor.enabled", true);
pref("extensions.avim.scriptMonitor.avim", true);
pref("services.sync.prefs.sync.extensions.avim.scriptMonitor.avim", true);
pref("extensions.avim.scriptMonitor.chim", false);
pref("services.sync.prefs.sync.extensions.avim.scriptMonitor.chim", true);
pref("extensions.avim.scriptMonitor.google", true);
pref("services.sync.prefs.sync.extensions.avim.scriptMonitor.google", true);
pref("extensions.avim.scriptMonitor.mudim", true);
pref("services.sync.prefs.sync.extensions.avim.scriptMonitor.mudim", true);
pref("extensions.avim.scriptMonitor.mViet", true);
pref("services.sync.prefs.sync.extensions.avim.scriptMonitor.mViet", true);
pref("extensions.avim.scriptMonitor.vietImeW", false);
pref("services.sync.prefs.sync.extensions.avim.scriptMonitor.vietImeW", true);
pref("extensions.avim.scriptMonitor.vietTyping", true);
pref("services.sync.prefs.sync.extensions.avim.scriptMonitor.vietTyping", true);
pref("extensions.avim.scriptMonitor.vietUni", true);
pref("services.sync.prefs.sync.extensions.avim.scriptMonitor.vietUni", true);
pref("extensions.avim.scriptMonitor.vinova", false);
pref("services.sync.prefs.sync.extensions.avim.scriptMonitor.vinova", true);

/* Disable AVIM in password fields. */
pref("extensions.avim.passwords", false);
pref("services.sync.prefs.sync.extensions.avim.passwords", true);
