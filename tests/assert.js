// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
function AssertionError(options) {
	this.name = "AssertionError";
	this.message = "Expected " + options.expected + " but got " +
		options.actual;
	if (options.message) this.message += ": " + options.message;
	this.actual = options.actual;
	this.expected = options.expected;
}
AssertionError.prototype = Object.create(Error.prototype, {
	constructor: {
		value: AssertionError,
		enumerable: false,
		writable: true,
		configurable: true,
	},
});

let assert = {
	claims: 0,
	errors: [],
	flush: function () {
		let rate = Math.round((assert.claims - assert.errors.length) /
							  assert.claims * 1000) / 10;
		print("-".repeat(80));
		print(assert.errors.length + " error" +
			  (assert.errors.length == 1 ? "" : "s") + " (" + rate +
			  "% passing)");
		for (let i = 0; i < assert.errors.length; i++) print(assert.errors[i]);
		assert.errors = [];
		assert.claims = 0;
	},
	
	ok: function (value, message) {
		assert.claims++;
		if (!value) {
			assert.errors.push(new AssertionError({
				message: message,
				actual: value,
				expected: true,
			}));
		}
	},
	
	equal: function (actual, expected, message) {
		assert.claims++;
		if (actual != expected) {
			assert.errors.push(new AssertionError({
				message: message,
				actual: actual,
				expected: expected,
			}));
		}
	},
	
	notEqual: function (actual, notExpected, message) {
		assert.claims++;
		if (actual == expected) {
			assert.errors.push(new AssertionError({
				message: message,
				actual: actual,
				expected: "something other than " + notExpected,
			}));
		}
	},
};
