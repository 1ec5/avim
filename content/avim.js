/**
 * Default preferences. Be sure to update defaults/preferences/avim.js to
 * reflect any changes to the default preferences.
 */
var AVIMConfig = {
	method: 0, //Default input method: 0=AUTO, 1=TELEX, 2=VNI, 3=VIQR, 4=VIQR*
	onOff: 1, //Starting status: 0=Off, 1=On
	ckSpell: 1, //Spell Check: 0=Off, 1=On
	oldAccent: 1, //0: New way (oa`, oe`, uy`), 1: The good old day (o`a, o`e, u`y)
	informal: false,
	statusBarPanel: true,	// Display status bar panel
	//IDs of the fields you DON'T want to let users type Vietnamese in
	exclude: ["colorzilla-textbox-hex",	// Hex box, Color Picker, ColorZilla
			  "email", "e-mail",		// don't want it for e-mail fields in general
			  "textboxeval",			// Code bar, Firefox Error Console
			  "tx_tagname",				// Tag Name, Insert Node, DOM Inspector
			  ],
	// Default input methods to contribute to Auto.
	autoMethods: {telex: true, vni: true, viqr: false, viqrStar: false},
	// Script monitor
	disabledScripts: {
		enabled: true,
		AVIM: true, CHIM: false, Mudim: false,
		mViet: true, VietIMEW: false, VietTyping: true, VietUni: true
	}
};

function AVIM()	{
	// IDs of user interface elements
	this.commands = {
		method: "avim-method-cmd",
		prevMethod: "avim-prev-method-cmd",
		nextMethod: "avim-next-method-cmd",
		spell: "avim-spell-cmd",
		oldAccents: "avim-oldaccents-cmd"
	};
	this.broadcasters = {
		enabled: "avim-enabled-bc",
		methods: ["avim-auto-bc", "avim-telex-bc", "avim-vni-bc",
				  "avim-viqr-bc", "avim-viqr-star-bc"],
		spell: "avim-spell-bc",
		oldAccents: "avim-oldaccents-bc"
	};
	this.keys = {
		enabled: "avim-enabled-key",
		prevMethod: "avim-prev-method-key",
		nextMethod: "avim-next-method-key",
		spell: "avim-spell-key",
		oldAccents: "avim-oldaccents-key"
	}
//	this.menuItems = {
//		methods: ["avim-menu-auto", "avim-menu-telex", "avim-menu-vni",
//				  "avim-menu-viqr", "avim-menu-viqr-star"]
//	}
	this.panel = "avim-status";
	
	this.changed=false
	this.alphabet="QWERTYUIOPASDFGHJKLZXCVBNM\ ";this.specialChange=false
	this.skey=new Array(97,226,259,101,234,105,111,244,417,117,432,121,65,194,258,69,202,73,79,212,416,85,431,89)
	this.range=null;this.whit=false;this.db1=new Array(273,272);this.ds1="d,D".split(",")
	this.os1="o,O,ơ,Ơ,ó,Ó,ò,Ò,ọ,Ọ,ỏ,Ỏ,õ,Õ,ớ,Ớ,ờ,Ờ,ợ,Ợ,ở,Ở,ỡ,Ỡ".split(",");this.ob1="ô,Ô,ô,Ô,ố,Ố,ồ,Ồ,ộ,Ộ,ổ,Ổ,ỗ,Ỗ,ố,Ố,ồ,Ồ,ộ,Ộ,ổ,Ổ,ỗ,Ỗ".split(",")
	this.mocs1="o,O,ô,Ô,u,U,ó,Ó,ò,Ò,ọ,Ọ,ỏ,Ỏ,õ,Õ,ú,Ú,ù,Ù,ụ,Ụ,ủ,Ủ,ũ,Ũ,ố,Ố,ồ,Ồ,ộ,Ộ,ổ,Ổ,ỗ,Ỗ".split(",");this.mocb1="ơ,Ơ,ơ,Ơ,ư,Ư,ớ,Ớ,ờ,Ờ,ợ,Ợ,ở,Ở,ỡ,Ỡ,ứ,Ứ,ừ,Ừ,ự,Ự,ử,Ử,ữ,Ữ,ớ,Ớ,ờ,Ờ,ợ,Ợ,ở,Ở,ỡ,Ỡ".split(",")
	this.trangs1="a,A,â,Â,á,Á,à,À,ạ,Ạ,ả,Ả,ã,Ã,ấ,Ấ,ầ,Ầ,ậ,Ậ,ẩ,Ẩ,ẫ,Ẫ".split(",");this.trangb1="ă,Ă,ă,Ă,ắ,Ắ,ằ,Ằ,ặ,Ặ,ẳ,Ẳ,ẵ,Ẵ,ắ,Ắ,ằ,Ằ,ặ,Ặ,ẳ,Ẳ,ẵ,Ẵ".split(",")
	this.as1="a,A,ă,Ă,á,Á,à,À,ạ,Ạ,ả,Ả,ã,Ã,ắ,Ắ,ằ,Ằ,ặ,Ặ,ẳ,Ẳ,ẵ,Ẵ,ế,Ế,ề,Ề,ệ,Ệ,ể,Ể,ễ,Ễ".split(",");this.ab1="â,Â,â,Â,ấ,Ấ,ầ,Ầ,ậ,Ậ,ẩ,Ẩ,ẫ,Ẫ,ấ,Ấ,ầ,Ầ,ậ,Ậ,ẩ,Ẩ,ẫ,Ẫ,é,É,è,È,ẹ,Ẹ,ẻ,Ẻ,ẽ,Ẽ".split(",")
	this.es1="e,E,é,É,è,È,ẹ,Ẹ,ẻ,Ẻ,ẽ,Ẽ".split(",");this.eb1="ê,Ê,ế,Ế,ề,Ề,ệ,Ệ,ể,Ể,ễ,Ễ".split(",");this.english="ĐÂĂƠƯÊÔ"
	this.lowen="đâăơưêô";this.arA="á,à,ả,ã,ạ,a,Á,À,Ả,Ã,Ạ,A".split(',');this.mocrA="ó,ò,ỏ,õ,ọ,o,ú,ù,ủ,ũ,ụ,u,Ó,Ò,Ỏ,Õ,Ọ,O,Ú,Ù,Ủ,Ũ,Ụ,U".split(',');this.erA="é,è,ẻ,ẽ,ẹ,e,É,È,Ẻ,Ẽ,Ẹ,E".split(',')
	this.orA="ó,ò,ỏ,õ,ọ,o,Ó,Ò,Ỏ,Õ,Ọ,O".split(',');this.aA="ấ,ầ,ẩ,ẫ,ậ,â,Ấ,Ầ,Ẩ,Ẫ,Ậ,Â".split(',');this.oA="ố,ồ,ổ,ỗ,ộ,ô,Ố,Ồ,Ổ,Ỗ,Ộ,Ô".split(',')
	this.mocA="ớ,ờ,ở,ỡ,ợ,ơ,ứ,ừ,ử,ữ,ự,ư,Ớ,Ờ,Ở,Ỡ,Ợ,Ơ,Ứ,Ừ,Ử,Ữ,Ự,Ư".split(',');this.trangA="ắ,ằ,ẳ,ẵ,ặ,ă,Ắ,Ằ,Ẳ,Ẵ,Ặ,Ă".split(',')
	this.eA="ế,ề,ể,ễ,ệ,ê,Ế,Ề,Ể,Ễ,Ệ,Ê".split(',');this.oA="ố,ồ,ổ,ỗ,ộ,ô,Ố,Ồ,Ổ,Ỗ,Ộ,Ô".split(',');this.skey2="a,a,a,e,e,i,o,o,o,u,u,y,A,A,A,E,E,I,O,O,O,U,U,Y".split(',')
	var fcc = String.fromCharCode;
	var $ = function (id) {
		return document.getElementById(id);
	};
	this.getSF=function() { var sf=new Array(),x; for(x=0;x<this.skey.length;x++) sf[sf.length]=fcc(this.skey[x]); return sf }
	this.ckspell=function(w,k) {
		if (!AVIMConfig.ckSpell) return false;
		w=this.unV(w); var exc="UOU,IEU".split(','),z,next=true,noE="UU,UOU,UOI,IEU,AO,IA,AI,AY,AU,AO".split(','),noBE="YEU"
		var check=true,noM="UE,UYE,IU,EU,UY".split(','),noMT="AY,AU".split(','),noT="UA",t=-1,notV2="IAO"
		var uw=this.up(w),tw=uw,update=false,gi="IO",noAOEW="OE,OO,AO,EO,IA,AI".split(','),noAOE="OA",test,a,b
		var notViet="AA,AE,EE,OU,YY,YI,IY,EY,EA,EI,II,IO,YO,YA,OOO".split(','),uk=this.up(k),twE,uw2=this.unV2(uw)
		var vSConsonant="B,C,D,G,H,K,L,M,N,P,Q,R,S,T,V,X".split(','),vDConsonant="CH,GI,KH,NGH,GH,NG,NH,PH,QU,TH,TR".split(',')
		if (AVIMConfig.informal) {
			vSConsonant.push("F");
			vDConsonant.push("DZ");
		}
		var vDConsonantE="CH,NG,NH".split(','),sConsonant="C,P,T,CH".split(','),vSConsonantE="C,M,N,P,T".split(',')
		var noNHE="O,U,IE,Ô,Ơ,Ư,IÊ,Ă,Â,UYE,UYÊ,UO,ƯƠ,ƯO,UƠ,UA,ƯA,OĂ,OE,OÊ".split(','),oMoc="UU,UOU".split(',')
		if(this.FRX.indexOf(uk)>=0) for(a=0;a<sConsonant.length;a++) if(uw.substr(uw.length-sConsonant[a].length,sConsonant[a].length)==sConsonant[a]) return true
		if (/[JW0-9]/.test(uw)) return true;
		if (AVIMConfig.informal) {
			if (uw.substr(0, 2) != "DZ" && uw.indexOf("Z") >= 0) return true;
		}
		else if (uw.indexOf("F") >= 0 || uw.indexOf("Z") >= 0) return true;
		for(a=0;a<uw.length;a++) {
			for(b=0;b<notViet.length;b++) {
				if(uw2.substr(a,notViet[b].length)==notViet[b]) {
					for(z=0;z<exc.length;z++) if(uw2.indexOf(exc[z])>=0) next=false
					if((next)&&((gi.indexOf(notViet[b])<0)||(a<=0)||(uw2.substr(a-1,1)!='G'))) return true
				}
			}
		}
		for(b=0;b<vDConsonant.length;b++) if(tw.indexOf(vDConsonant[b])==0){tw=tw.substr(vDConsonant[b].length);update=true;t=b;break}
		if(!update) for(b=0;b<vSConsonant.length;b++) if(tw.indexOf(vSConsonant[b])==0){tw=tw.substr(1);break}
		update=false;twE=tw
		for(b=0;b<vDConsonantE.length;b++) {
			if(tw.substr(tw.length-vDConsonantE[b].length)==vDConsonantE[b]) {
				tw=tw.substr(0,tw.length-vDConsonantE[b].length)
				if(b==2){
					for(z=0;z<noNHE.length;z++) if(tw==noNHE[z]) return true
					if((uk==this.trang)&&((tw=="OA")||(tw=="A"))) return true
				}
				update=true;break
			}
		}
		if(!update) for(b=0;b<vSConsonantE.length;b++) if(tw.substr(tw.length-1)==vSConsonantE[b]){tw=tw.substr(0,tw.length-1);break}
		if(tw) {
			for(a=0;a<vDConsonant.length;a++) {
				for(b=0;b<tw.length;b++) { if(tw.substr(b,vDConsonant[a].length)==vDConsonant[a]) return true }
			}
			for(a=0;a<vSConsonant.length;a++) { if(tw.indexOf(vSConsonant[a])>=0) return true }
		}
		test=tw.substr(0,1)
		if((t==3)&&((test=="A")||(test=="O")||(test=="U")||(test=="Y"))) return true
		if((t==5)&&((test=="E")||(test=="I")||(test=="Y"))) return true
		uw2=this.unV2(tw)
		if(uw2==notV2) return true
		if(tw!=twE) for(z=0;z<noE.length;z++) if(uw2==noE[z]) return true
		if((tw!=uw)&&(uw2==noBE)) return true
		if(uk!=this.moc) for(z=0;z<oMoc.length;z++) if(tw==oMoc[z]) return true
		if((uw2.indexOf('UYE')>0)&&(uk=='E')) check=false
		if((this.them.indexOf(uk)>=0)&&(check)) {
			for(a=0;a<noAOEW.length;a++) if(uw2.indexOf(noAOEW[a])>=0) return true
			if(uk!=this.trang) if(uw2==noAOE) return true
			if((uk==this.trang)&&(this.trang!='W')) if(uw2==noT) return true
			if(uk==this.moc) for(a=0;a<noM.length;a++) if(uw2==noM[a]) return true
			if((uk==this.moc)||(uk==this.trang)) for(a=0;a<noMT.length;a++) if(uw2==noMT[a]) return true
		}
		this.tw5=tw
		if((uw2.charCodeAt(0)==272)||(uw2.charCodeAt(0)==273)) { if(uw2.length>4) return true }
		else if(uw2.length>3) return true
		return false
	}
	
	/**
	 * Enables or disables AVIM and updates the stored preferences.
	 *
	 * @param enabled	{boolean}	true to enable AVIM; false to disable it.
	 */
	this.setEnabled = function(enabled) {
		AVIMConfig.onOff = 0 + enabled;
		this.setPrefs();
	};
	
	/**
	 * Enables AVIM if currently disabled; disables AVIM otherwise.
	 */
	this.toggle = function() {
		this.setEnabled(!AVIMConfig.onOff);
	};
	
	/**
	 * Sets the input method to the method with the given ID and updates the
	 * stored preferences. If the given method ID is -1, the method is not
	 * changed and AVIM is instead disabled.
	 *
	 * @param m	{number}	the ID of the method to enable, or -1 to diable
	 * 						AVIM.
	 */
	this.setMethod=function(m) {
		if (m == -1) AVIMConfig.onOff = 0;
		else {
			AVIMConfig.onOff = 1;
			AVIMConfig.method = m;
		}
		this.setPrefs();
	};
	
	/**
	 * Sets the input method to the one with the given distance away from the
	 * currently enabled input method. For instance, a distance of 1 selects the
	 * next input method, while a distance of -1 selects the previous one.
	 *
	 * @param distance {number}	the distance from the currently selected input
	 * 							method to the input method to select.
	 */
	this.cycleMethod=function(distance) {
		AVIMConfig.onOff = 1;
		
		var method = AVIMConfig.method;
		method += distance;
		if (method < 0) method += this.broadcasters.methods.length;
		method %= this.broadcasters.methods.length;
		AVIMConfig.method = method;
		
		this.setPrefs();
	};
	
	/**
	 * Enables or disables old-style placement of diacritical marks over
	 * diphthongs and updates the stored preferences.
	 *
	 * @param enabled	{boolean}	true to use old-style diacritics; false to
	 * 								use new-style diacritics.
	 */
	this.setDauCu=function(enabled) {
		AVIMConfig.oldAccent = 0 + enabled;
		this.setPrefs()
	}
	
	/**
	 * Enables old-style diacritical marks if currently disabled; disables them
	 * otherwise.
	 */
	this.toggleDauCu = function() {
		this.setDauCu(!AVIMConfig.oldAccent);
	};
	
	/**
	 * Enables or disables spelling enforcement and updates the stored
	 * preferences. If enabled, diacritical marks are not placed over words that
	 * do not conform to Vietnamese spelling rules and are instead treated as
	 * literals.
	 *
	 * @param enabled	{boolean}	true to enforce spelling; false otherwise.
	 */
	this.setSpell=function(enabled) {
		AVIMConfig.ckSpell = 0 + enabled;
		this.setPrefs()
	}
	
	/**
	 * Enables spelling enforcement if currently disabled; disables it
	 * otherwise.
	 */
	this.toggleSpell = function() {
		this.setSpell(!AVIMConfig.ckSpell);
	};
	
	/**
	 * Displays or hides the status bar panel and updates the stored
	 * preferences.
	 *
	 * @param shown	{boolean}	true to display the status bar panel; false to
	 * 							hide it.
	 */
	this.setStatusPanel=function(shown) {
		AVIMConfig.statusBarPanel = shown;
		this.setPrefs()
	}
	
	/**
	 * Displays the status bar panel if currently hidden; hides it otherwise.
	 */
	this.toggleStatusPanel = function() {
		this.setStatusPanel(!AVIMConfig.statusBarPanel);
	};
	
	/**
	 * Updates the XUL menus and status bar panel to reflect AVIM's current
	 * state.
	 */
	this.updateUI = function() {
		// Enabled/disabled
		var bc_enabled = $(this.broadcasters.enabled);
		if (bc_enabled) {
			bc_enabled.setAttribute("checked", "" + !!AVIMConfig.onOff);
		}
		
		// Disable methods and options if AVIM is disabled
		for each (var cmd in this.commands) {
			$(cmd).setAttribute("disabled", "" + !AVIMConfig.onOff);
		}
		
		// Method
		for each (var bc in this.broadcasters.methods) {
			$(bc).removeAttribute("checked");
			$(bc).removeAttribute("key");
		}
		var bc_sel = $(this.broadcasters.methods[AVIMConfig.method]);
		if (bc_sel) bc_sel.setAttribute("checked", "true");
		
//		var prev_bc_idx = AVIMConfig.method - 1;
//		if (prev_bc_idx < 0) prev_bc_idx += this.menuItems.methods.length;
//		var prev_bc = $(this.menuItems.methods[prev_bc_idx]);
//		if (prev_bc) prev_bc.setAttribute("key", this.keys.prevMethod);
//		
//		var next_bc_idx =
//			(AVIMConfig.method + 1) % this.menuItems.methods.length;
//		var next_bc = $(this.menuItems.methods[next_bc_idx]);
//		if (next_bc) next_bc.setAttribute("key", this.keys.nextMethod);
		
		// Options
		var bc_spell = $(this.broadcasters.spell);
		if (bc_spell) {
			bc_spell.setAttribute("checked", "" + !!AVIMConfig.ckSpell);
		}
		var bc_old = $(this.broadcasters.oldAccents);
		if (bc_old) {
			bc_old.setAttribute("checked", "" + !!AVIMConfig.oldAccent);
		}
		
		// Status bar panel
		var panel = $(this.panel);
		if (!panel) return;
		if (AVIMConfig.onOff) {
			panel.setAttribute("label", bc_sel.getAttribute("label"));
		}
		else panel.setAttribute("label", panel.getAttribute("disabledLabel"));
		panel.style.display =
			AVIMConfig.statusBarPanel ? "-moz-box" : "none";
//		var bc_panel = $(this.broadcasters.statusBarPanel);
//		bc_panel.setAttribute("checked", "" + AVIMConfig.statusBarPanel);
	};
	this.mozGetText=function(obj) {
		var v,pos,w="",g=1
		v=(obj.data)?obj.data:obj.value
		if(v.length<=0) return false
		if(!obj.data) {
			if(!obj.setSelectionRange) return false
			pos=obj.selectionStart
		} else pos=obj.pos
		if(obj.selectionStart!=obj.selectionEnd) return new Array("",pos)
		while(1) {
			if(pos-g<0) break
			else if(this.notWord(v.substr(pos-g,1))) { if(v.substr(pos-g,1)=="\\") w=v.substr(pos-g,1)+w; break }
			else w=v.substr(pos-g,1)+w; g++
		}
		return new Array(w,pos)
	}
	this.start=function(obj,key) {
		var w="",method=AVIMConfig.method,dockspell=AVIMConfig.ckSpell,fixed=false,uni,uni2=false,uni3=false,uni4=false;this.oc=obj
		var telex="D,A,E,O,W,W".split(','),vni="9,6,6,6,7,8".split(','),viqr="D,^,^,^,+,(".split(','),viqr2="D,^,^,^,*,(".split(','),a,noNormC
		if(method==0) {
			var arr=new Array(),check=new Array(AVIMConfig.autoMethods.telex,AVIMConfig.autoMethods.vni,AVIMConfig.autoMethods.viqr,AVIMConfig.autoMethods.viqrStar)
			var value1=new Array(telex,vni,viqr,viqr2),uniA=new Array(uni,uni2,uni3,uni4),D2A=new Array("DAWEO","6789","D^+(","D^*(")
			for(a=0;a<check.length;a++) {
				if(check[a]) arr[arr.length]=value1[a]
				else D2A[a]="";
			}
			for(a=0;a<arr.length;a++) uniA[a]=arr[a]
			uni=uniA[0]; uni2=uniA[1]; uni3=uniA[2]; uni4=uniA[3]; this.D2=D2A.join()
			if(!uni) return
		} else if(method==1) { uni=telex; this.D2="DAWEO" }
		else if(method==2) { uni=vni; this.D2="6789" }
		else if(method==3) { uni=viqr; this.D2="D^+(" }
		else if(method==4) { uni=viqr2; this.D2="D^*(" }
		key=fcc(key.which)
		w=this.mozGetText(obj)
		if((!w)||(obj.sel)) return
		if(this.D2.indexOf(this.up(key))>=0) noNormC=true
		else noNormC=false
		this.main(w[0],key,w[1],uni,noNormC)
		if(!dockspell) w=this.mozGetText(obj)
		if((w)&&(uni2)&&(!this.changed)) this.main(w[0],key,w[1],uni2,noNormC)
		if(!dockspell) w=this.mozGetText(obj)
		if((w)&&(uni3)&&(!this.changed)) this.main(w[0],key,w[1],uni3,noNormC)
		if(!dockspell) w=this.mozGetText(obj)
		if((w)&&(uni4)&&(!this.changed)) this.main(w[0],key,w[1],uni4,noNormC)
		if(this.D2.indexOf(this.up(key))>=0) {
			w=this.mozGetText(obj)
			if(!w) return
			this.normC(w[0],key,w[1])
		}
	}
	this.findC=function(w,k,sf) {
		var method=AVIMConfig.method
		if(((method==3)||(method==4))&&(w.substr(w.length-1,1)=="\\")) return new Array(1,k.charCodeAt(0))
		var str="",res,cc="",pc="",tE="",vowA=new Array(),s="ÂĂÊÔƠƯêâăơôư",c=0,dn=false,uw=this.up(w),tv,g
		var DAWEOFA=this.up(this.aA.join()+this.eA.join()+this.mocA.join()+this.trangA.join()+this.oA.join()+this.english),h,uc
		for(g=0;g<sf.length;g++) {
			if(this.nan(sf[g])) str+=sf[g]
			else str+=fcc(sf[g])
		}
		var uk=this.up(k),i=w.length,uni_array=this.repSign(k),w2=this.up(this.unV2(this.unV(w))),dont="ƯA,ƯU".split(',')
		if (this.DAWEO.indexOf(uk)>=0) {
			if(uk==this.moc) {
				if((w2.indexOf("UU")>=0)&&(this.tw5!=dont[1])) {
					if(w2.indexOf("UU")==(w.length-2)) res=2
					else return false
				} else if(w2.indexOf("UOU")>=0) {
					if(w2.indexOf("UOU")==(w.length-3)) res=2
					else return false
				}
			}
			if(!res) {
				for(g=1;g<=w.length;g++) {
					cc=w.substr(w.length-g,1)
					pc=this.up(w.substr(w.length-g-1,1))
					uc=this.up(cc)
					for(h=0;h<dont.length;h++) if((this.tw5==dont[h])&&(this.tw5==this.unV(pc+uc))) dn=true
					if(dn) { dn=false; continue }
					if(str.indexOf(uc)>=0) {
						if(((uk==this.moc)&&(this.unV(uc)=="U")&&(this.up(this.unV(w.substr(w.length-g+1,1)))=="A"))||((uk==this.trang)&&(this.unV(uc)=='A')&&(this.unV(pc)=='U'))) {
							if(this.unV(uc)=="U") tv=1
							else tv=2
							ccc=this.up(w.substr(w.length-g-tv,1))
							if(ccc!="Q") res=g+tv-1
							else if(uk==this.trang) res=g
							else if(this.moc!=this.trang) return false
						} else res=g
						if((!this.whit)||(uw.indexOf("Ư")<0)||(uw.indexOf("W")<0)) break
					} else if(DAWEOFA.indexOf(uc)>=0) {
						if(uk==this.D) {
							if(cc=="đ") res=new Array(g,'d')
							else if(cc=="Đ") res=new Array(g,'D')
						} else res=this.DAWEOF(cc,uk,g)
						if(res) break
					}
				}
			}
		}
		if((uk!=this.Z)&&(this.DAWEO.indexOf(uk)<0)) { var tEC=this.retKC(uk); for (g=0;g<tEC.length;g++) tE+=fcc(tEC[g]) }
		for(g=1;g<=w.length;g++) {
			if(this.DAWEO.indexOf(uk)<0) {
				cc=this.up(w.substr(w.length-g,1))
				pc=this.up(w.substr(w.length-g-1,1))
				if(str.indexOf(cc)>=0) {
					if(cc=='U') {
						if(pc!='Q') { c++;vowA[vowA.length]=g }
					} else if(cc=='I') {
						if((pc!='G')||(c<=0)) { c++;vowA[vowA.length]=g }
					} else { c++;vowA[vowA.length]=g }
				} else if(uk!=this.Z) {
					for(h=0;h<uni_array.length;h++) if(uni_array[h]==w.charCodeAt(w.length-g)) {
						if(this.ckspell(w,k)) return false
						return new Array(g,tEC[h%24])
					}
					for(h=0;h<tEC.length;h++) if(tEC[h]==w.charCodeAt(w.length-g)) return new Array(g,fcc(this.skey[h]))
				}
			}
		}
		if((uk!=this.Z)&&(typeof(res)!='object')) if(this.ckspell(w,k)) return false
		if(this.DAWEO.indexOf(uk)<0) {
			for(g=1;g<=w.length;g++) {
				if((uk!=this.Z)&&(s.indexOf(w.substr(w.length-g,1))>=0)) return g
				else if(tE.indexOf(w.substr(w.length-g,1))>=0) {
					for(h=0;h<tEC.length;h++) {
						if(w.substr(w.length-g,1).charCodeAt(0)==tEC[h]) return new Array(g,fcc(this.skey[h]))
					}
				}
			}
		}
		if(res) return res
		if((c==1)||(uk==this.Z)) return vowA[0]
		else if(c==2) {
			var v=2
			if(w.substr(w.length-1)==" ") v=3
			var ttt=this.up(w.substr(w.length-v,2))
			if((AVIMConfig.oldAccent==0)&&((ttt=="UY")||(ttt=="OA")||(ttt=="OE"))) return vowA[0]
			var c2=0,fdconsonant,sc="BCD"+fcc(272)+"GHKLMNPQRSTVX",dc="CH,GI,KH,NGH,GH,NG,NH,PH,QU,TH,TR".split(',')
			for(h=1;h<=w.length;h++) {
				fdconsonant=false
				for(g=0;g<dc.length;g++) {
					if(this.up(w.substr(w.length-h-dc[g].length+1,dc[g].length)).indexOf(dc[g])>=0) {
						c2++;fdconsonant=true
						if(dc[g]!='NGH') h++
						else h+=2
					}
				}
				if(!fdconsonant) {
					if(sc.indexOf(this.up(w.substr(w.length-h,1)))>=0) c2++
					else break
				}
			}
			if((c2==1)||(c2==2)) return vowA[0]
			else return vowA[1]
		} else if(c==3) return vowA[1]
		else return false
	}
	this.ie_replaceChar=function(w,pos,c) {
		var r="",uc=0
		if(isNaN(c)) uc=this.up(c)
		if((this.whit)&&(this.up(w.substr(w.length-pos-1,1))=='U')&&(pos!=1)&&(this.up(w.substr(w.length-pos-2,1))!='Q')) {
			this.whit=false
			if((this.up(this.unV(fcc(c)))=="Ơ")||(uc=="O")) {
				if(w.substr(w.length-pos-1,1)=='u') r=fcc(432)
				else r=fcc(431)
			}
			if(uc=="O") {
				if(c=="o") c=417
				else c=416
			}
		}
		if(!isNaN(c)) {
			this.changed=true;r+=fcc(c)
			return w.substr(0,w.length-pos-r.length+1)+r+w.substr(w.length-pos+1)
		} else return w.substr(0,w.length-pos)+c+w.substr(w.length-pos+1)
	}
	this.replaceChar=function(o,pos,c) {
		var bb=false
		if(!this.nan(c)) { var replaceBy=fcc(c),wfix=this.up(this.unV(fcc(c))); this.changed=true }
		else { var replaceBy=c; if((this.up(c)=="O")&&(this.whit)) bb=true }
		if(!o.data) {
			var savePos=o.selectionStart,sst=o.scrollTop
			if ((this.up(o.value.substr(pos-1,1))=='U')&&(pos<savePos-1)&&(this.up(o.value.substr(pos-2,1))!='Q')) {
				if((wfix=="Ơ")||(bb))
				{
					if (o.value.substr(pos-1,1)=='u') var r=fcc(432)
					else var r=fcc(431)
				}
				if(bb) {
					this.changed=true; if(c=="o") replaceBy="ơ"
					else replaceBy="Ơ"
				}
			}
			o.value=o.value.substr(0,pos)+replaceBy+o.value.substr(pos+1)
			if(r) o.value=o.value.substr(0,pos-1)+r+o.value.substr(pos)
			o.setSelectionRange(savePos,savePos);o.scrollTop=sst
		} else {
			if ((this.up(o.data.substr(pos-1,1))=='U')&&(pos<o.pos-1)) {
				if((wfix=="Ơ")||(bb))
				{
					if (o.data.substr(pos-1,1)=='u') var r=fcc(432)
					else var r=fcc(431)
				}
				if(bb) {
					this.changed=true; if(c=="o") replaceBy="ơ"
					else replaceBy="Ơ"
				}
			}
			o.deleteData(pos,1);o.insertData(pos,replaceBy)
			if(r) { o.deleteData(pos-1,1);o.insertData(pos-1,r) }
		}
		if(this.whit) this.whit=false
	}
	this.tr=function(k,w,by,sf,i) {
		var r,pos=this.findC(w,k,sf),g
		if(pos) {
			if(pos[1]) {
				return this.replaceChar(this.oc,i-pos[0],pos[1])
			} else {
				var c,pC=w.substr(w.length-pos,1),cmp;r=sf
				for(g=0;g<r.length;g++) {
					if((this.nan(r[g]))||(r[g]=="e")) cmp=pC
					else cmp=pC.charCodeAt(0)
					if(cmp==r[g]) {
						if(!this.nan(by[g])) c=by[g]
						else c=by[g].charCodeAt(0)
						return this.replaceChar(this.oc,i-pos,c)
					}
				}
			}
		}
		return false
	}
	this.main=function(w,k,i,a,noNormC) {
		var uk=this.up(k),bya=new Array(this.db1,this.ab1,this.eb1,this.ob1,this.mocb1,this.trangb1),got=false,t="d,D,a,A,a,A,o,O,u,U,e,E,o,O".split(",")
		var sfa=new Array(this.ds1,this.as1,this.es1,this.os1,this.mocs1,this.trangs1),by=new Array(),sf=new Array(),method=AVIMConfig.method,h,g
		if((method==2)||((method==0)&&(a[0]=="9"))) {
			this.DAWEO="6789";this.SFJRX="12534";this.S="1";this.F="2";this.J="5";this.R="3";this.X="4";this.Z="0";this.D="9"
			this.FRX="234";this.AEO="6";this.moc="7";this.trang="8";this.them="678";this.A="^";this.E="^";this.O="^"
		} else if((method==3)||((method==0)&&(a[4]=="+"))) {
			this.DAWEO="^+(D";this.SFJRX="'`.?~";this.S="'";this.F="`";this.J=".";this.R="?";this.X="~";this.Z="-";this.D="D"
			this.FRX="`?~";this.AEO="^";this.moc="+";this.trang="(";this.them="^+(";this.A="^";this.E="^";this.O="^"
		} else if((method==4)||((method==0)&&(a[4]=="*"))) {
			this.DAWEO="^*(D";this.SFJRX="'`.?~";this.S="'";this.F="`";this.J=".";this.R="?";this.X="~";this.Z="-";this.D="D"
			this.FRX="`?~";this.AEO="^";this.moc="*";this.trang="(";this.them="^*(";this.A="^";this.E="^";this.O="^"
		} else if((method==1)||((method==0)&&(a[0]=="D"))) {
			this.SFJRX="SFJRX";this.DAWEO="DAWEO";this.D='D';this.S='S';this.F='F';this.J='J';this.R='R';this.X='X';this.Z='Z'
			this.FRX="FRX";this.them="AOEW";this.trang="W";this.moc="W";this.A="A";this.E="E";this.O="O"
		}
		if(this.SFJRX.indexOf(uk)>=0) {
			var ret=this.sr(w,k,i);got=true
			if(ret) return ret
		} else if(uk==this.Z) {
			sf=this.repSign(null)
			for(h=0;h<this.english.length;h++) {
				sf[sf.length]=this.lowen.charCodeAt(h)
				sf[sf.length]=this.english.charCodeAt(h)
			}
			for(h=0;h<5;h++) for(g=0;g<this.skey.length;g++) by[by.length]=this.skey[g]
			for(h=0;h<t.length;h++) by[by.length]=t[h]
			got=true
		}
		else for(h=0;h<a.length;h++) if(a[h]==uk) { got=true; by=by.concat(bya[h]); sf=sf.concat(sfa[h]) }
		if(uk==this.moc) this.whit=true;
		if(!got) {
			if(noNormC) return "";
			else return this.normC(w,k,i)
		}
		return this.DAWEOZ(k,w,by,sf,i,uk)
	}
	this.DAWEOZ=function(k,w,by,sf,i,uk) { if((this.DAWEO.indexOf(uk)>=0)||(this.Z.indexOf(uk)>=0)) return this.tr(k,w,by,sf,i); return false; }
	this.normC=function(w,k,i) {
		var uk=this.up(k),u=this.repSign(null),fS,c,j,h,space=(k.charCodeAt(0)==32);
		if(space) return "";
		for(j=1;j<=w.length;j++) {
			for(h=0;h<u.length;h++) {
				if(u[h]==w.charCodeAt(w.length-j)) {
					if(h<=23) fS=this.S
					else if(h<=47) fS=this.F
					else if(h<=71) fS=this.J
					else if(h<=95) fS=this.R
					else fS=this.X
					c=this.skey[h%24]; if((this.alphabet.indexOf(uk)<0)&&(this.D2.indexOf(uk)<0)) return w; w=this.unV(w)
					if((!space)&&(!this.changed)) w+=k
					var sp=this.oc.selectionStart,pos=sp
					if(!this.changed) {
						var sst=this.oc.scrollTop;pos+=k.length
						if(!this.oc.data) { this.oc.value=this.oc.value.substr(0,sp)+k+this.oc.value.substr(this.oc.selectionEnd);this.changed=true;this.oc.scrollTop=sst }
						else { this.oc.insertData(this.oc.pos,k);this.oc.pos++;this.range.setEnd(this.oc,this.oc.pos);this.specialChange=true }
					}
					if(!this.oc.data) this.oc.setSelectionRange(pos,pos)
					if(!this.ckspell(w,fS)) {
						this.replaceChar(this.oc,i-j,c)
						if(!this.oc.data) {
							var a=new Array(this.D)
							this.main(w,fS,pos,a,false)
						} else {
							var ww=this.mozGetText(this.oc),a=new Array(this.D)
							this.main(ww[0],fS,ww[1],a,false)
						}
					}
				}
			}
		}
		return "";
	}
	this.DAWEOF=function(cc,k,g) {
		var ret=new Array(),kA=new Array(this.A,this.moc,this.trang,this.E,this.O),z,a;ret[0]=g
		var ccA=new Array(this.aA,this.mocA,this.trangA,this.eA,this.oA),ccrA=new Array(this.arA,this.mocrA,this.arA,this.erA,this.orA)
		for(a=0;a<kA.length;a++) if(k==kA[a]) for(z=0;z<ccA[a].length;z++) if(cc==ccA[a][z]) ret[1]=ccrA[a][z]
		if(ret[1]) return ret
		else return false
	}
	this.retKC=function(k) {
		if(k==this.S) return new Array(225,7845,7855,233,7871,237,243,7889,7899,250,7913,253,193,7844,7854,201,7870,205,211,7888,7898,218,7912,221)
		if(k==this.F) return new Array(224,7847,7857,232,7873,236,242,7891,7901,249,7915,7923,192,7846,7856,200,7872,204,210,7890,7900,217,7914,7922)
		if(k==this.J) return new Array(7841,7853,7863,7865,7879,7883,7885,7897,7907,7909,7921,7925,7840,7852,7862,7864,7878,7882,7884,7896,7906,7908,7920,7924)
		if(k==this.R) return new Array(7843,7849,7859,7867,7875,7881,7887,7893,7903,7911,7917,7927,7842,7848,7858,7866,7874,7880,7886,7892,7902,7910,7916,7926)
		if(k==this.X) return new Array(227,7851,7861,7869,7877,297,245,7895,7905,361,7919,7929,195,7850,7860,7868,7876,296,213,7894,7904,360,7918,7928)
		return [];
	}
	this.unV=function(w) {
		var u=this.repSign(null),b,a
		for(a=1;a<=w.length;a++) {
			for(b=0;b<u.length;b++) {
				if(u[b]==w.charCodeAt(w.length-a)) {
					w=w.substr(0,w.length-a)+fcc(this.skey[b%24])+w.substr(w.length-a+1)
				}
			}
		}
		return w
	}
	this.unV2=function(w) {
		var a,b
		for(a=1;a<=w.length;a++) {
			for(b=0;b<this.skey.length;b++) {
				if(this.skey[b]==w.charCodeAt(w.length-a)) w=w.substr(0,w.length-a)+this.skey2[b]+w.substr(w.length-a+1)
			}
		}
		return w
	}
	this.repSign=function(k) {
		var t=new Array(),u=new Array(),a,b
		for(a=0;a<5;a++) {
			if((k==null)||(this.SFJRX.substr(a,1)!=this.up(k))) {
				t=this.retKC(this.SFJRX.substr(a,1))
				for(b=0;b<t.length;b++) u[u.length]=t[b]
			}
		}
		return u
	}
	this.sr=function(w,k,i) {
		var sf=this.getSF(),pos=this.findC(w,k,sf)
		if(pos) {
			if(pos[1]) {
				this.replaceChar(this.oc,i-pos[0],pos[1])
			} else {
				var c=this.retUni(w,k,pos)
				this.replaceChar(this.oc,i-pos,c)
			}
		}
		return false
	}
	this.retUni=function(w,k,pos) {
		var u=this.retKC(this.up(k)),uC,lC,c=w.charCodeAt(w.length-pos),a,t=fcc(c)
		for(a=0;a<this.skey.length;a++) if(this.skey[a]==c) {
			if(a<12) { lC=a;uC=a+12 }
			else { lC=a-12;uC=a }
			if(t!=this.up(t)) return u[lC]
			return u[uC]
		}
		return false
	}
	this.ifInit=function(w) {
		var sel=w.getSelection()
		this.range=sel?sel.getRangeAt(0):document.createRange()
	}
	/**
	 * Handles key presses for WYSIWYG HTML documents (editable through
	 * Mozilla's Midas component).
	 */
	this.ifMoz=function(e) {
		var code=e.which; //,avim=this.AVIM,cwi=e.target.parentNode.wi
		var cwi = e.target.ownerDocument.defaultView;
//		dump("ifMoz -- target: " + e.target.tagName + "; code: " + code + "\n");	// debug
//		if(typeof(cwi)=="undefined") cwi=e.target.parentNode.parentNode.wi
		if(e.ctrlKey || e.metaKey || e.altKey) return;
		this.ifInit(cwi);
		var node=this.range.endContainer,newPos;this.sk=fcc(code);this.saveStr=""
		if(this.checkCode(code)||(!this.range.startOffset)||(typeof(node.data)=='undefined')) return;node.sel=false
		if(node.data) {
			this.saveStr=node.data.substr(this.range.endOffset)
			if(this.range.startOffset!=this.range.endOffset) node.sel=true
			node.deleteData(this.range.startOffset,node.data.length)
		}
		this.range.setEnd(node,this.range.endOffset)
		this.range.setStart(node,0)
		if(!node.data) return
		node.value=node.data; node.pos=node.data.length; node.which=code
		this.start(node,e)
		node.insertData(node.data.length,this.saveStr)
		newPos=node.data.length-this.saveStr.length+this.kl
		this.range.setEnd(node,newPos); this.range.setStart(node,newPos); this.kl=0
		if(this.specialChange) { this.specialChange=false; this.changed=false; node.deleteData(node.pos-1,1) }
		if(this.changed) { this.changed=false; e.preventDefault() }
	}
	this.checkCode=function(code) {
		return AVIMConfig.onOff == 0 || (code < 45 && code != 42 && code != 32 && code != 39 && code != 40 && code != 43) || code == 145 || code == 255;
	}
	this.notWord=function(w) {
		var str="\ \r\n\xa0#,\\;.:-_()<>+-*/=?!\"$%{}[]\'~|^\@\&\t“”‘’«»‹›–—…−×÷°″′"
		return (str.indexOf(w)>=0)
	}
	this.nan=function(w) {
		return ((isNaN(w))||(w=='e'));
	}
	this.up=function(w) {
		w=w.toUpperCase()
		return w
	}
	this.findIgnore=function(el) {
		return el.id &&
			AVIMConfig.exclude.indexOf(el.id.toLowerCase()) >= 0;
	}
	
	/**
	 * Handles key presses in the current window. This function is triggered as
	 * soon as the key goes up. If the key press's target is a XUL element, this
	 * function finds the anonymous XBL child that actually handles text input,
	 * as necessary.
	 *
	 * @param e	{object}	the key press event.
	 * @returns {boolean}	true if AVIM plans to modify the input; false
	 * 						otherwise.
	 */
	this.keyPressHandler=function(e) {
		var el=e.target,code=e.which;
//		dump("keyPressHandler -- target: " + el.tagName + "; code: " + code + "\n");	// debug
		if(e.ctrlKey || e.metaKey) return false;
		if(e.altKey) return false;
		var xulURI =
			"http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
		if (document.documentElement.namespaceURI == xulURI) {
			// Ignore XUL pages embedded inside XUL windows.
			if (document.documentElement.localName == "page") return false;
			// Ignore about:config.
			if (el.parentNode && el.parentNode.id == "filterRow") return false;
		}
		// If the XUL element is actually an XBL-bound element, get the
		// anonymous inner element. This would be much easier if el.inputField
		// actually worked.
		if (el.namespaceURI == xulURI) {
			var xulAnonIDs = {
				searchbar: "searchbar-textbox", findbar: "findbar-textbox",
				menulist: "input"
			};
			if (xulAnonIDs[el.localName]) {
				el = document.getAnonymousElementByAttribute(el, "anonid",
					xulAnonIDs[el.localName]);
			}
			// TODO: Make this work in editable trees.
//			var xulAnonClasses = {
//				tree: "tree-input"
//			};
//			if (xulAnonClasses[el.localName]) {
//				var className = xulAnonClasses[el.localName];
//				var anons = document.getAnonymousElementByAttribute(el, "class",
//																	className);
//				el = anons[0];
//			}
//			if (el.localName == "tree") {
//				el = document.getAnonymousElementByAttribute(stack, "anonid",
//															 "input");
//			}
		}
		var isHTML = el.type == "textarea" || el.type == "text";
		var xulTags = ["textbox", "searchbar", "findbar"];
		var isXUL = el.namespaceURI == xulURI &&
			xulTags.indexOf(el.localName) >= 0 && el.type != "password";
		if((!isHTML && !isXUL) || this.checkCode(code)) return false;
		this.sk=fcc(code); if(this.findIgnore(el)) return false;
		this.start(el,e)
		if (this.changed) {
			this.changed=false;
			e.preventDefault();
			return false;
		}
		return true
	}
	this.attachEvt=function(obj,evt,handle,capture) {
		obj.addEventListener(evt,handle,capture)
	}
	
	// Integration with Mozilla preferences service
	
	// Root for AVIM preferences
	this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService)
		.getBranch("extensions.avim.");
	
	/**
	 * Registers an observer so that AVIM automatically reflects changes to its
	 * preferences.
	 */
	this.registerPrefs = function() {
		this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this.prefs.addObserver("", this, false);
		this.getPrefs();
		this.updateUI();
	};
	
	/**
	 * Unregisters the preferences observer as the window is being closed.
	 */
	this.unregisterPrefs = function() {
		this.setPrefs();
		this.prefs.removeObserver("", this);
	};
	
	/**
	 * Responds to changes to AVIM preferences.
	 *
	 * @param subject
	 * @param topic		{string}	the type of event that occurred.
	 * @param data		{string}	the name of the preference that changed.
	 */
	this.observe = function(subject, topic, data) {
		if (topic != "nsPref:changed") return;
		this.getPrefs(data);
		this.updateUI();
	};
	
	/**
	 * Updates the stored preferences to reflect AVIM's current state.
	 */
	this.setPrefs = function() {
		// Basic options
		this.prefs.setBoolPref("enabled", !!AVIMConfig.onOff);
		this.prefs.setIntPref("method", AVIMConfig.method);
		this.prefs.setBoolPref("ignoreMalformed", !!AVIMConfig.ckSpell);
		this.prefs.setBoolPref("oldAccents", !!AVIMConfig.oldAccent);
		this.prefs.setBoolPref("statusBarPanel",
							   AVIMConfig.statusBarPanel);
		
		// Advanced options
		this.prefs.setBoolPref("informal", !!AVIMConfig.informal);
		var ids = AVIMConfig.exclude.join(" ").toLowerCase();
		this.prefs.setCharPref("ignoredFieldIds", ids);
		
		// Auto input method configuration
		this.prefs.setBoolPref("auto.telex",
							   AVIMConfig.autoMethods.telex);
		this.prefs.setBoolPref("auto.vni", AVIMConfig.autoMethods.vni);
		this.prefs.setBoolPref("auto.viqr", AVIMConfig.autoMethods.viqr);
		this.prefs.setBoolPref("auto.viqrStar",
							   AVIMConfig.autoMethods.viqrStar);
		
		// Script monitor
		this.prefs.setBoolPref("scriptMonitor.enabled",
							   AVIMConfig.disabledScripts.enabled);
		this.prefs.setBoolPref("scriptMonitor.avim",
							   AVIMConfig.disabledScripts.AVIM);
		this.prefs.setBoolPref("scriptMonitor.chim",
							   AVIMConfig.disabledScripts.CHIM);
		this.prefs.setBoolPref("scriptMonitor.mudim",
							   AVIMConfig.disabledScripts.Mudim);
		this.prefs.setBoolPref("scriptMonitor.mViet",
							   AVIMConfig.disabledScripts.mViet);
		this.prefs.setBoolPref("scriptMonitor.vietImeW",
							   AVIMConfig.disabledScripts.VietIMEW);
		this.prefs.setBoolPref("scriptMonitor.vietTyping",
							   AVIMConfig.disabledScripts.VietTyping);
		this.prefs.setBoolPref("scriptMonitor.vietUni",
							   AVIMConfig.disabledScripts.VietUni);
	};
	
	/**
	 * Updates AVIM's current state to reflect the stored preferences.
	 *
	 * @param changedPref	{string}	the name of the preference that changed.
	 */
	this.getPrefs = function(changedPref) {
//		dump("Changed pref: " + changedPref + "\n");							// debug
		var specificPref = true;
		switch (changedPref) {
			default:
				// Fall through when changedPref isn't defined, which happens at
				// startup, when we want to get all the preferences.
				specificPref = false;
			
			// Basic options
			case "enabled":
				AVIMConfig.onOff = 0 + this.prefs.getBoolPref("enabled");
				if (specificPref) break;
			case "method":
				AVIMConfig.method = this.prefs.getIntPref("method");
				// In case someone enters an invalid method ID in about:config
				var method = AVIMConfig.method;
				if (method < 0 || method >= this.broadcasters.methods.length) {
					Components.classes["@mozilla.org/preferences-service;1"]
						.getService(Components.interfaces.nsIPrefService)
						.getDefaultBranch("extensions.avim.")
						.clearUserPref("method");
					AVIMConfig.method = this.prefs.getIntPref("method");
				}
				if (specificPref) break;
			case "ignoreMalformed":
				AVIMConfig.ckSpell =
					0 + this.prefs.getBoolPref("ignoreMalformed");
				if (specificPref) break;
			case "oldAccents":
				AVIMConfig.oldAccent = 0 + this.prefs.getBoolPref("oldAccents");
				if (specificPref) break;
			case "statusBarPanel":
				AVIMConfig.statusBarPanel =
					this.prefs.getBoolPref("statusBarPanel");
				if (specificPref) break;
			
			// Advanced options
			case "informal":
				AVIMConfig.informal = this.prefs.getBoolPref("informal");
				if (specificPref) break;
			case "ignoredFieldIds":
				var ids = this.prefs.getCharPref("ignoredFieldIds");
				AVIMConfig.exclude = ids.toLowerCase().split(/\s+/);
				if (specificPref) break;
			
			// Auto input method configuration
			case "auto.telex":
				AVIMConfig.autoMethods.telex =
					this.prefs.getBoolPref("auto.telex");
				if (specificPref) break;
			case "auto.vni":
				AVIMConfig.autoMethods.vni = this.prefs.getBoolPref("auto.vni");
				if (specificPref) break;
			case "auto.viqr":
				AVIMConfig.autoMethods.viqr =
					this.prefs.getBoolPref("auto.viqr");
				if (specificPref) break;
			case "auto.viqrStar":
				AVIMConfig.autoMethods.viqrStar =
					this.prefs.getBoolPref("auto.viqrStar");
				if (specificPref) break;
			
			// Script monitor
			case "scriptMonitor.enabled":
				AVIMConfig.disabledScripts.enabled =
					this.prefs.getBoolPref("scriptMonitor.enabled");
				if (specificPref) break;
			case "scriptMonitor.avim":
				AVIMConfig.disabledScripts.AVIM =
					this.prefs.getBoolPref("scriptMonitor.avim");
				if (specificPref) break;
			case "scriptMonitor.chim":
				AVIMConfig.disabledScripts.CHIM =
					this.prefs.getBoolPref("scriptMonitor.chim");
				if (specificPref) break;
			case "scriptMonitor.mudim":
				AVIMConfig.disabledScripts.Mudim =
					this.prefs.getBoolPref("scriptMonitor.mudim");
				if (specificPref) break;
			case "scriptMonitor.mViet":
				AVIMConfig.disabledScripts.mViet =
					this.prefs.getBoolPref("scriptMonitor.mViet");
				if (specificPref) break;
			case "scriptMonitor.vietImeW":
				AVIMConfig.disabledScripts.VietIMEW =
					this.prefs.getBoolPref("scriptMonitor.vietImeW");
				if (specificPref) break;
			case "scriptMonitor.vietTyping":
				AVIMConfig.disabledScripts.VietTyping =
					this.prefs.getBoolPref("scriptMonitor.vietTyping");
				if (specificPref) break;
			case "scriptMonitor.vietUni":
				AVIMConfig.disabledScripts.VietUni =
					this.prefs.getBoolPref("scriptMonitor.vietUni");
//				if (specificPref) break;
		}
	};
	
	// Script monitor
	
	// Markers and disablers for embedded Vietnamese IMEs
	var disablers = {
		// For each of these disablers, we don't need a sanity check for an
		// object or member that served as a marker for the IME. Also,
		// everything is wrapped in a try...cach block, so we don't need sanity
		// checks if the disabler can halt on error without failing to reach
		// independent statements.
		
		AVIM: function(win, AVIMObj) {
			if (!AVIMConfig.disabledScripts.AVIM) return;
			AVIMObj.setMethod(-1);
		},
		CHIM: function(win, CHIM) {
			if (!AVIMConfig.disabledScripts.CHIM) return;
			if (parseInt(CHIM.method) == 0) return;
			CHIM.SetMethod(0);
		},
		HIM: function(win) {
			if (!AVIMConfig.disabledScripts.AVIM) return;
			if ("setMethod" in win) win.setMethod(-1);
			win.on_off = 0;
		},
		Mudim: function(win, Mudim) {
			if (!AVIMConfig.disabledScripts.Mudim) return;
			if (parseInt(Mudim.method) == 0) return;
			if ("Toggle" in Mudim) Mudim.Toggle();
			else win.CHIM.Toggle();
		},
		mViet: function(win) {
			if (!AVIMConfig.disabledScripts.mViet) return;
			if (typeof(win.MVOff) == "boolean" && win.MVOff) return;
			if ("MVietOnOffButton" in win) win.MVietOnOffButton();
			else if ("button" in win) win.button(0);
		},
		VietIMEW: function(win) {
			if (!AVIMConfig.disabledScripts.VietIMEW) return;
			if (!("VietIME" in win)) return;
			for (var memName in win) {
				var mem = win[memName];
				if (mem.setTelexMode != undefined &&
					mem.setNormalMode != undefined) {
					mem.setNormalMode();
					break;
				}
			}
		},
		VietTyping: function(win) {
			if (!AVIMConfig.disabledScripts.VietTyping) return;
			if ("changeMode" in win) win.changeMode(-1);
			else win.ON_OFF = 0;
		},
		VietUni: function(win) {
			if (!AVIMConfig.disabledScripts.VietUni) return;
			win.setTypingMode();
		},
		xvnkb: function(win) {
			if (!AVIMConfig.disabledScripts.CHIM) return;
			if (parseInt(win.vnMethod) == 0) return;
			win.VKSetMethod(0);
		}
	};
	var markers = {
		// HIM and AVIM since at least version 1.13 (build 20050810)
		"DAWEOF": disablers.HIM,
		// VietTyping, various versions
		"UNIZZ": disablers.VietTyping,
		// VietUni, including vietuni8.js (2001-10-19) and version 14.0 by Tran
		// Kien Duc (2004-01-07)
		"telexingVietUC": disablers.VietUni,
		// Mudim since version 0.3 (r2)
		"Mudim": disablers.Mudim,
		// mViet 12 AC
		"evBX": disablers.mViet,
		// mViet 14 RTE
		"MVietOnOffButton": disablers.mViet,
		// CHIM since version 0.9.3
		"CHIM": disablers.CHIM,
		// CHIM (xvnkb.js) versions 0.8-0.9.2 and BIM 0.00.01-0.0.3
		"vnMethod": disablers.xvnkb,
		// HIM since at least version 1.1 (build 20050430)
		"DAWEO": disablers.HIM,
		// HIM since version 1.0
		"findCharToChange": disablers.HIM,
		// AVIM after build 20071102
		"AVIMObj": disablers.AVIM,
		// VietIMEW
		"GetVnVowelIndex": disablers.VietIMEW
	};
	
	/**
	 * Given a context and marker, disables the Vietnamese JavaScript input
	 * method editor (IME) with that marker.
	 *
	 * @param win		{object}	A JavaScript window object.
	 * @param marker	{object}	A JavaScript object (possibly a function)
	 * 								that indicates the presence of the IME.
	 * @returns {boolean}	True if the disabler ran without errors (possibly
	 * 						without effect); false if errors were raised.
	 */
	this.disableOther = function(win, marker) {
		try {
			var disabler = markers[marker];
			disabler(win, win[marker]);
			return true;
		}
		catch (e) {
			return false;
		}
	};
	
	/**
	 * Given a HTML document node, disables any Vietnamese JavaScript input
	 * method editors (IMEs) embedded in the document that may cause conflicts.
	 * If AVIM is disabled, this method does nothing.
	 *
	 * @param doc {object}	An HTML document node.
	 */
	this.disableOthers = function(doc) {
		if (!AVIMConfig.onOff || !AVIMConfig.disabledScripts.enabled) return;
		
		// Using wrappedJSObject is only safe in Firefox 3 and above.
		var winWrapper = new XPCNativeWrapper(doc.defaultView);
		var win = winWrapper.wrappedJSObject;
		if (!win || win == window) return;
		
		for (var marker in markers) {
			if (!(marker in win)) continue;
			if (this.disableOther(win, marker)) return;
		}
		
		// mViet 14 RTE
		if (!AVIMConfig.disabledScripts.mViet) return;
		if (win.frameElement) win = win.frameElement.ownerDocument.defaultView;
		var marker = "MVietOnOffButton";
		if (marker in win) disablers.mViet(win);
	};
}

if (!AVIMObj) {
	var AVIMObj=new AVIM()
	addEventListener("load", function (e) {
		AVIMObj.registerPrefs();
	}, false);
	addEventListener("unload", function (e) {
		AVIMObj.unregisterPrefs();
	}, false);
	addEventListener("keypress", function (e) {
//		dump("keyPressHandler -- code: " + e.which + "\n");						// debug
//		dump("keyPressHandler -- target: " + e.target.nodeName + "\n");			// debug
		var doc = e.target.ownerDocument;
		AVIMObj.disableOthers(doc);
		
		// Handle key press either in WYSIWYG mode or normal mode.
		var wysiwyg =
			(doc.designMode && doc.designMode.toLowerCase() == "on") ||
			(e.target.contentEditable &&
			 e.target.contentEditable.toLowerCase() == "true");
		if (wysiwyg) return AVIMObj.ifMoz(e);
		
		return AVIMObj.keyPressHandler(e);
	}, true);
}
