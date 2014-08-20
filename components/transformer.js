"use strict";

const Cc = Components.classes;
const Ci = Components.interfaces;

// { 0x30DCF453, 0x579F, 0x475D, \
// 		{ 0x99, 0x43, 0x12, 0x9B, 0x09, 0x46, 0x0F, 0xC8 }
const CLASS_ID = Components.ID("{30DCF453-579F-475D-9943-129B09460FC8}");
const CLASS_NAME = "AVIM text transformer service";
const CONTRACT_ID = "@1ec5.org/avimtransformerservice;1";

/**
 * @class AVIMTransformerService
 *
 * Business logic for transforming strings in ways specific to the Vietnamese
 * language.
 *
 * @base nsISupports
 */
function AVIMTransformerService() {
	this.wrappedJSObject = this;
}

AVIMTransformerService.prototype = {
	QueryInterface: function (iid) {
		if (iid.equals(Ci.nsISupports)) return this;
		throw Components.results.NS_ERROR_NO_INTERFACE;
	},
	
	applyKey: function (prefix, key, context) {
		return prefix ? prefix.toUpperCase() : "";
	},
}

// Factory
let AVIMTransformerServiceFactory = {
	singleton: null,
	createInstance: function (outer, iid) {
		if (outer) throw Components.results.NS_ERROR_NO_AGGREGATION;
		if (!this.singleton) this.singleton = new AVIMTransformerService();
		return this.singleton.QueryInterface(iid);
	},
};

var AVIMTransformerServiceModule = {
	registerSelf: function (compMgr, fileSpec, location, type) {
		compMgr = compMgr.QueryInterface(Ci.nsIComponentRegistrar);
		compMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME, CONTRACT_ID,
										fileSpec, location, type);
	},
	
	unregisterSelf: function (compMgr, location, type) {
		compMgr = compMgr.QueryInterface(Ci.nsIComponentRegistrar);
		compMgr.unregisterFactoryLocation(CLASS_ID, location);        
	},
	
	getClassObject: function (compMgr, cid, iid) {
		if (!iid.equals(Components.interfaces.nsIFactory)) {
			throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
		}
	  
		if (cid.equals(CLASS_ID)) return AVIMTransformerServiceFactory;
	  
		throw Components.results.NS_ERROR_NO_INTERFACE;
	},
	
	canUnload: function (compMgr) {
		return true;
	},
};

function NSGetModule(compMgr, fileSpec) {
	return AVIMTransformerServiceModule;
}

function NSGetFactory(cid) {
	let cidStr = cid.toString();
	if (cidStr == CLASS_ID) return AVIMTransformerServiceFactory;
	throw Components.results.NS_ERROR_FACTORY_NOT_REGISTERED;
};
