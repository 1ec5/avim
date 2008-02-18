/*
 * AVIM JavaScript Vietnamese Input Method Source File dated 02-11-2007
 * 
 * Copyright (C) 2004-2007 Hieu Tran Dang <lt2hieu2004 (at) users (dot) sf (dot) net>
 * Website:	http://avim.veneroida.com/
 * 
 * You are allowed to use this software in any way you want providing:
 * 	1. You must retain this copyright notice at all time
 * 	2. You must not claim that you or any other third party is the author
 *	   of this software in any way.
 * 
 * Modified for the AVIM Firefox extension by Minh Nguyen <http://www.1ec5.org/>.
 */

var avim = {
	// Defaults -- remember to set these defaults in defaults/preferences/avim.js!
	va: "email,TextboxEval".split(','), //Put the ID of the fields you DON'T want to let users type Vietnamese in, multiple fields allowed, separated by a comma (,)
	method: 0, //Default input method, 0=AUTO, 1=TELEX, 2=VNI, 3=VIQR, 4=VIQR*
	on_off: 1, //Start AVIM on
	dockspell: 1, //Start AVIM with spell checking on
	dauCu: 1, //Start AVIM with old way of marking accent (o`a, o`e, u`y)
	
	// Interface element IDs
	radioID: "him_auto,him_telex,him_vni,him_viqr,him_viqr2,him_off,him_ckspell,him_daucu".split(","),
	enabledID: "him_on", methodLabel: "avim-status", methodCmdID: "avim-method-cmd",
	
	alphabet: "QWERTYUIOPASDFGHJKLZXCVBNM ",
	them: undefined,
	spellerr: undefined,
	
	S: undefined, F: undefined, J: undefined, R: undefined, X: undefined, D: undefined, oc: undefined, sk: undefined, saveStr: undefined, wi: undefined, frame: undefined, D2: undefined,
	changed: false, specialChange: false, uni: undefined, uni2: undefined, g: undefined, h: undefined, SFJRX: undefined, DAWEO: undefined, Z: undefined, AEO: undefined, moc: undefined, trang: undefined, kl: 0, tw5: undefined, range: null, fID: document.getElementsByTagName("iframe"),
	
	skey: [97,226,259,101,234,105,111,244,417,117,432,121,65,194,258,69,202,73,79,212,416,85,431,89],
	
	skey2: "a,a,a,e,e,i,o,o,o,u,u,y,A,A,A,E,E,I,O,O,O,U,U,Y".split(','),
	A: undefined, E: undefined, O: undefined, whit: false, english: "ĐÂĂƠƯÊÔ", lowen: "đâăơưêô", ds1: "d,D".split(","), db1: [273,272],
	
	os1: "o,O,ơ,Ơ,ó,Ó,ò,Ò,ọ,Ọ,ỏ,Ỏ,õ,Õ,ớ,Ớ,ờ,Ờ,ợ,Ợ,ở,Ở,ỡ,Ỡ".split(","),
	ob1: "ô,Ô,ô,Ô,ố,Ố,ồ,Ồ,ộ,Ộ,ổ,Ổ,ỗ,Ỗ,ố,Ố,ồ,Ồ,ộ,Ộ,ổ,Ổ,ỗ,Ỗ".split(","),
	
	mocs1: "o,O,ô,Ô,u,U,ó,Ó,ò,Ò,ọ,Ọ,ỏ,Ỏ,õ,Õ,ú,Ú,ù,Ù,ụ,Ụ,ủ,Ủ,ũ,Ũ,ố,Ố,ồ,Ồ,ộ,Ộ,ổ,Ổ,ỗ,Ỗ".split(","),
	mocb1: "ơ,Ơ,ơ,Ơ,ư,Ư,ớ,Ớ,ờ,Ờ,ợ,Ợ,ở,Ở,ỡ,Ỡ,ứ,Ứ,ừ,Ừ,ự,Ự,ử,Ử,ữ,Ữ,ớ,Ớ,ờ,Ờ,ợ,Ợ,ở,Ở,ỡ,Ỡ".split(","),
	
	trangs1: "a,A,â,Â,á,Á,à,À,ạ,Ạ,ả,Ả,ã,Ã,ấ,Ấ,ầ,Ầ,ậ,Ậ,ẩ,Ẩ,ẫ,Ẫ".split(","),
	trangb1: "ă,Ă,ă,Ă,ắ,Ắ,ằ,Ằ,ặ,Ặ,ẳ,Ẳ,ẵ,Ẵ,ắ,Ắ,ằ,Ằ,ặ,Ặ,ẳ,Ẳ,ẵ,Ẵ".split(","),
	
	as1: "a,A,ă,Ă,á,Á,à,À,ạ,Ạ,ả,Ả,ã,Ã,ắ,Ắ,ằ,Ằ,ặ,Ặ,ẳ,Ẳ,ẵ,Ẵ,ế,Ế,ề,Ề,ệ,Ệ,ể,Ể,ễ,Ễ".split(","),
	ab1: "â,Â,â,Â,ấ,Ấ,ầ,Ầ,ậ,Ậ,ẩ,Ẩ,ẫ,Ẫ,ấ,Ấ,ầ,Ầ,ậ,Ậ,ẩ,Ẩ,ẫ,Ẫ,é,É,è,È,ẹ,Ẹ,ẻ,Ẻ,ẽ,Ẽ".split(","),
	
	es1: "e,E,é,É,è,È,ẹ,Ẹ,ẻ,Ẻ,ẽ,Ẽ".split(","),
	eb1: "ê,Ê,ế,Ế,ề,Ề,ệ,Ệ,ể,Ể,ễ,Ễ".split(","),
	
	arA: "á,à,ả,ã,ạ,a,Á,À,Ả,Ã,Ạ,A".split(','),
	mocrA: "ó,ò,ỏ,õ,ọ,o,ú,ù,ủ,ũ,ụ,u,Ó,Ò,Ỏ,Õ,Ọ,O,Ú,Ù,Ủ,Ũ,Ụ,U".split(','),
	erA: "é,è,ẻ,ẽ,ẹ,e,É,È,Ẻ,Ẽ,Ẹ,E".split(','),
	orA: "ó,ò,ỏ,õ,ọ,o,Ó,Ò,Ỏ,Õ,Ọ,O".split(','),
	
	aA: "ấ,ầ,ẩ,ẫ,ậ,â,Ấ,Ầ,Ẩ,Ẫ,Ậ,Â".split(','),
	mocA: "ớ,ờ,ở,ỡ,ợ,ơ,ứ,ừ,ử,ữ,ự,ư,Ớ,Ờ,Ở,Ỡ,Ợ,Ơ,Ứ,Ừ,Ử,Ữ,Ự,Ư".split(','),
	trangA: "ắ,ằ,ẳ,ẵ,ặ,ă,Ắ,Ằ,Ẳ,Ẵ,Ặ,Ă".split(','),
	eA: "ế,ề,ể,ễ,ệ,ê,Ế,Ề,Ể,Ễ,Ệ,Ê".split(','),
	oA: "ố,ồ,ổ,ỗ,ộ,ô,Ố,Ồ,Ổ,Ỗ,Ộ,Ô".split(','),
	
	notWord: function (w) {
		var str=" \r\n#,\\;.:-_()<>+-*/=?!\"$%{}[]'~|^@&\t"+this.fcc(160);
		return (str.indexOf(w)>=0);
	},
	nan: function (w) {
		return (isNaN(w))||(w=='e');
	},
	mozGetText: function (obj) {
		var v,pos,w="";this.g=1;
		v=(obj.data)?obj.data:obj.value;
		if(v.length<=0) return false;
		if(!obj.data) {
			if(!obj.setSelectionRange) return false;
			pos=obj.selectionStart;
		} else pos=obj.pos;
		if(obj.selectionStart!=obj.selectionEnd) return ["",pos];
		while(1) {
			if(pos-this.g<0) break;
			else if(this.notWord(v.substr(pos-this.g,1))) {
				if(v.substr(pos-this.g,1)=="\\") w=v.substr(pos-this.g,1)+w;
				break;
			}
			else w=v.substr(pos-this.g,1)+w;
			this.g++;
		}
		return [w,pos];
	},
	start: function (obj,key) {
		var w="",nnc;this.oc=obj;this.uni2=false;
		if(this.method==0) { this.uni="D,A,E,O,W,W".split(','); this.uni2="9,6,6,6,7,8".split(','); this.D2="DAWEO6789"; }
		else if(this.method==1) { this.uni="D,A,E,O,W,W".split(','); this.D2="DAWEO"; }
		else if(this.method==2) { this.uni="9,6,6,6,7,8".split(','); this.D2="6789"; }
		else if(this.method==3) { this.uni="D,^,^,^,+,(".split(','); this.D2="D^+("; }
		else if(this.method==4) { this.uni="D,^,^,^,*,(".split(','); this.D2="D^*("; }
		key=this.fcc(key.which);
		w=this.mozGetText(obj);
		nnc=(this.D2.indexOf(this.up(key))>=0);
		if((!w)||(obj.sel)) return;
		this.main(w[0],key,w[1],this.uni,nnc);
		if(!this.dockspell) w=this.mozGetText(obj);
		if((w)&&(this.uni2)&&(!this.changed)) this.main(w[0],key,w[1],this.uni2,nnc);
		if(this.D2.indexOf(this.up(key))>=0) {
			w=this.mozGetText(obj);
			if(!w) return;
			this.normC(w[0],key,w[1]);
		}
	},
	tr: function (k,w,by,sf,i) {
		var r,pos=this.findC(w,k,sf);
		if(pos) {
			if(pos[1]) return this.replaceChar(this.oc,i-pos[0],pos[1]);
			var c,pC=w.substr(w.length-pos,1),cmp;r=sf;
			for(this.g=0;this.g<r.length;this.g++) {
				if((this.nan(r[this.g]))||(r[this.g]=="e")) cmp=pC;
				else cmp=pC.charCodeAt(0);
				if(cmp==r[this.g]) {
					if(!this.nan(by[this.g])) c=by[this.g];
					else c=by[this.g].charCodeAt(0);
					return this.replaceChar(this.oc,i-pos,c);
				}
			}
		}
		return false;
	},
	main: function (w,k,i,a,nnc) {
		var uk=this.up(k),bya=[this.db1,this.ab1,this.eb1,this.ob1,this.mocb1,this.trangb1],got=false,t="d,D,a,A,a,A,o,O,u,U,e,E,o,O".split(",");
		var sfa=[this.ds1,this.as1,this.es1,this.os1,this.mocs1,this.trangs1],by=[],sf=[];
		if((this.method==2)||((this.method==0)&&(a[0]=="9"))) {
			this.DAWEO="6789";this.SFJRX="12534";this.S="1";this.F="2";this.J="5";this.R="3";this.X="4";this.Z="0";this.D="9";FRX="234";this.AEO="6";this.moc="7";this.trang="8";this.them="678";this.A="^";this.E="^";this.O="^";
		} else if(this.method==3) {
			this.DAWEO="^+(D";this.SFJRX="'`.?~";this.S="'";this.F="`";this.J=".";this.R="?";this.X="~";this.Z="-";this.D="D";FRX="`?~";this.AEO="^";this.moc="+";this.trang="(";this.them="^+(";this.A="^";this.E="^";this.O="^";
		} else if(this.method==4) {
			this.DAWEO="^*(D";this.SFJRX="'`.?~";this.S="'";this.F="`";this.J=".";this.R="?";this.X="~";this.Z="-";this.D="D";FRX="`?~";this.AEO="^";this.moc="*";this.trang="(";this.them="^*(";this.A="^";this.E="^";this.O="^";
		} else if((this.method==1)||((this.method==0)&&(a[0]=="D"))) {
			this.SFJRX="SFJRX";this.DAWEO="DAWEO";this.D='D';this.S='S';this.F='F';this.J='J';this.R='R';this.X='X';this.Z='Z';FRX="FRX";this.them="AOEW";this.trang="W";this.moc="W";this.A="A";this.E="E";this.O="O";
		}
		if(this.SFJRX.indexOf(uk)>=0) {
			var ret=this.sr(w,k,i); got=true;
			if(ret) return ret;
		} else if(uk==this.Z) {
			sf=this.repSign(null);
			for(this.h=0;this.h<this.english.length;this.h++) {
				sf[sf.length]=this.lowen.charCodeAt(this.h);
				sf[sf.length]=this.english.charCodeAt(this.h);
			}
			for(this.h=0;this.h<5;this.h++) for(this.g=0;this.g<this.skey.length;this.g++) by[by.length]=this.skey[this.g];
			for(this.h=0;this.h<t.length;this.h++) by[by.length]=t[this.h];
			got=true;
		}
		else for(this.h=0;this.h<a.length;this.h++) if(a[this.h]==uk) { got=true; by=by.concat(bya[this.h]); sf=sf.concat(sfa[this.h]); }
		if(uk==this.moc) this.whit=true;
		if(!got) {
			if(nnc) return;
			return this.normC(w,k,i);
		}
		return this.DAWEOZ(k,w,by,sf,i,uk);
	},
	DAWEOZ: function (k,w,by,sf,i,uk) { if((this.DAWEO.indexOf(uk)>=0)||(this.Z.indexOf(uk)>=0)) return this.tr(k,w,by,sf,i); },
	normC: function (w,k,i) {
		var uk=this.up(k),u=this.repSign(null),fS,c,j,space=(k.charCodeAt(0)==32);
		if(space) return;
		for(j=1;j<=w.length;j++) {
			for(this.h=0;this.h<u.length;this.h++) {
				if(u[this.h]==w.charCodeAt(w.length-j)) {
					if(this.h<=23) fS=this.S;
					else if(this.h<=47) fS=this.F;
					else if(this.h<=71) fS=this.J;
					else if(this.h<=95) fS=this.R;
					else fS=this.X;
					c=this.skey[this.h%24]; if((this.alphabet.indexOf(uk)<0)&&(this.D2.indexOf(uk)<0)) return w;
					w=this.unV(w);
					if((!space)&&(!this.changed)) w+=k;
					var sp=this.oc.selectionStart,pos=sp;
					if(!this.changed) {
						var sst=this.oc.scrollTop;pos+=k.length;
						if(!this.oc.data) { this.oc.value=this.oc.value.substr(0,sp)+k+this.oc.value.substr(this.oc.selectionEnd);this.changed=true;this.oc.scrollTop=sst; }
						else { this.oc.insertData(this.oc.pos,k);this.oc.pos++;this.range.setEnd(this.oc,this.oc.pos);this.specialChange=true; }
					}
					if(!this.oc.data) this.oc.setSelectionRange(pos,pos);
					if(!this.ckspell(w,fS)) {
						this.replaceChar(this.oc,i-j,c);
						var a=[this.D];
						if(!this.oc.data) {
							main(w,fS,pos,a,false);
						} else {
							var ww=this.mozGetText(this.oc);
							main(ww[0],fS,ww[1],a,false);
						}
					}
				}
			}
		}
	},
	nospell: function (w,k) { return false; },
	ckspell: function (w,k) {
		w=this.unV(w); var exc="UOU,IEU".split(','),z,next=true,noE="UU,UOU,UOI,IEU,AO,IA,AI,AY,AU,AO".split(','),noBE="YEU",test,a,b;
		var check=true,noM="UE,UYE,IU,EU,UY".split(','),noMT="AY,AU".split(','),noT="UA",t=-1,notV2="IAO";
		var uw=this.up(w),tw=uw,update=false,gi="IO",noAOEW="OE,OO,AO,EO,IA,AI".split(','),noAOE="OA";
		var notViet="AA,AE,EE,OU,YY,YI,IY,EY,EA,EI,II,IO,YO,YA,OOO".split(','),uk=this.up(k),twE,uw2=this.unV2(uw);
		var vSConsonant="B,C,D,G,H,K,L,M,N,P,Q,R,S,T,V,X".split(','),vDConsonant="CH,GI,KH,NGH,GH,NG,NH,PH,QU,TH,TR".split(',');
		var vDConsonantE="CH,NG,NH".split(','),sConsonant="C,P,T,CH".split(','),vSConsonantE="C,M,N,P,T".split(',');
		var noNHE="O,U,IE,Ô,Ơ,Ư,IÊ,Ă,Â,UYE,UYÊ,UO,ƯƠ,ƯO,UƠ,UA,ƯA,OĂ,OE,OÊ".split(','),oMoc="UU,UOU".split(',');
		if(FRX.indexOf(uk)>=0) for(a=0;a<sConsonant.length;a++) if(uw.substr(uw.length-sConsonant[a].length,sConsonant[a].length)==sConsonant[a]) return true;
		for(a=0;a<uw.length;a++) {
			if("FJZW1234567890".indexOf(uw.substr(a,1))>=0) return true;
			for(b=0;b<notViet.length;b++) {
				if(uw2.substr(a,notViet[b].length)==notViet[b]) {
					for(z=0;z<exc.length;z++) if(uw2.indexOf(exc[z])>=0) next=false;
					if((next)&&((gi.indexOf(notViet[b])<0)||(a<=0)||(uw2.substr(a-1,1)!='G'))) return true;
				}
			}
		}
		for(b=0;b<vDConsonant.length;b++) if(tw.indexOf(vDConsonant[b])==0){tw=tw.substr(vDConsonant[b].length);update=true;t=b;break}
		if(!update) for(b=0;b<vSConsonant.length;b++) if(tw.indexOf(vSConsonant[b])==0){tw=tw.substr(1);break}
		update=false;twE=tw;
		for(b=0;b<vDConsonantE.length;b++) {
			if(tw.substr(tw.length-vDConsonantE[b].length)==vDConsonantE[b]) {
				tw=tw.substr(0,tw.length-vDConsonantE[b].length);
				if(b==2){
					for(z=0;z<noNHE.length;z++) if(tw==noNHE[z]) return true;
					if((uk==this.trang)&&((tw=="OA")||(tw=="A"))) return true;
				}
				update=true;break;
			}
		}
		if(!update) for(b=0;b<vSConsonantE.length;b++) if(tw.substr(tw.length-1)==vSConsonantE[b]){tw=tw.substr(0,tw.length-1);break}
		if(tw) {
			for(a=0;a<vDConsonant.length;a++) {
				for(b=0;b<tw.length;b++) { if(tw.substr(b,vDConsonant[a].length)==vDConsonant[a]) return true; }
			}
			for(a=0;a<vSConsonant.length;a++) { if(tw.indexOf(vSConsonant[a])>=0) return true; }
		}
		test=tw.substr(0,1);
		if((t==3)&&((test=="A")||(test=="O")||(test=="U")||(test=="Y"))) return true;
		if((t==5)&&((test=="E")||(test=="I")||(test=="Y"))) return true;
		uw2=this.unV2(tw);
		if(uw2==notV2) return true;
		if(tw!=twE) for(z=0;z<noE.length;z++) if(uw2==noE[z]) return true;
		if((tw!=uw)&&(uw2==noBE)) return true;
		if(uk!=this.moc) for(z=0;z<oMoc.length;z++) if(tw==oMoc[z]) return true;
		if((uw2.indexOf('UYE')>0)&&(uk=='E')) check=false;
		if((this.them.indexOf(uk)>=0)&&(check)) {
			for(a=0;a<noAOEW.length;a++) if(uw2.indexOf(noAOEW[a])>=0) return true;
			if(uk!=this.trang) if(uw2==noAOE) return true;
			if((uk==this.trang)&&(this.trang!='W')) if(uw2==noT) return true;
			if(uk==this.moc) for(a=0;a<noM.length;a++) if(uw2==noM[a]) return true;
			if((uk==this.moc)||(uk==this.trang)) for(a=0;a<noMT.length;a++) if(uw2==noMT[a]) return true;
		}
		this.tw5=tw;
		if((uw2.charCodeAt(0)==272)||(uw2.charCodeAt(0)==273)) { if(uw2.length>4) return true; }
		else if(uw2.length>3) return true;
		return false;
	},
	DAWEOF: function (cc,k) {
		var ret=[],kA=[this.A,this.moc,this.trang,E,this.O],z,a;ret[0]=this.g;
		var ccA=[this.aA,this.mocA,this.trangA,this.eA,this.oA],ccrA=[this.arA,this.mocrA,this.arA,this.erA,this.orA];
		for(a=0;a<kA.length;a++) if(k==kA[a]) for(z=0;z<ccA[a].length;z++) if(cc==ccA[a][z]) ret[1]=ccrA[a][z];
		if(ret[1]) return ret;
		return false;
	},
	findC: function (w,k,sf) {
		if(((this.method==3)||(this.method==4))&&(w.substr(w.length-1,1)=="\\")) return [1,k.charCodeAt(0)];
		var str="",res,cc="",pc="",tE="",vowA=[],s="ÂĂÊÔƠƯêâăơôư",c=0,dn=false,uw=this.up(w),tv;
		var DAWEOFA=this.aA.join()+this.eA.join()+this.mocA.join()+this.trangA.join()+this.oA.join()+this.english;DAWEOFA=this.up(DAWEOFA);
		for(this.g=0;this.g<sf.length;this.g++) {
			if(this.nan(sf[this.g])) str+=sf[this.g];
			else str+=this.fcc(sf[this.g]);
		}
		var uk=this.up(k),i=w.length,uni_array=this.repSign(k),w2=this.up(this.unV2(this.unV(w))),dont="ƯA,ƯU".split(',');
		if (this.DAWEO.indexOf(uk)>=0) {
			if(uk==this.moc) {
				if((w2.indexOf("UU")>=0)&&(this.tw5!=dont[1])) {
					if(w2.indexOf("UU")==(w.length-2)) res=2;
					else return false;
				} else if(w2.indexOf("UOU")>=0) {
					if(w2.indexOf("UOU")==(w.length-3)) res=2;
					else return false;
				}
			}
			if(!res) {
				for(this.g=1;this.g<=w.length;this.g++) {
					cc=w.substr(w.length-this.g,1);
					pc=this.up(w.substr(w.length-this.g-1,1));
					uc=this.up(cc);
					for(this.h=0;this.h<dont.length;this.h++) if((this.tw5==dont[this.h])&&(this.tw5==this.unV(pc+uc))) dn=true;
					if(dn) { dn=false; continue; }
					if(str.indexOf(uc)>=0) {
						if(((uk==this.moc)&&(this.unV(uc)=="U")&&(this.up(this.unV(w.substr(w.length-this.g+1,1)))=="A"))||((uk==this.trang)&&(this.unV(uc)=='A')&&(this.unV(pc)=='U'))) {
							if(this.unV(uc)=="U") tv=1;
							else tv=2;
							ccc=this.up(w.substr(w.length-this.g-tv,1));
							if(ccc!="Q") res=this.g+tv-1;
							else if(uk==this.trang) res=this.g;
							else if(this.moc!=this.trang) return false;
						} else res=this.g;
						if((!this.whit)||(uw.indexOf("Ư")<0)||(uw.indexOf("W")<0)) break;
					} else if(DAWEOFA.indexOf(uc)>=0) {
						if(uk==this.D) {
							if(cc=="đ") res=[this.g,'d'];
							else if(cc=="Đ") res=[this.g,'D'];
						} else res=this.DAWEOF(cc,uk);
						if(res) break;
					}
				}
			}
		}
		if((uk!=this.Z)&&(this.DAWEO.indexOf(uk)<0)) { var tEC=this.retKC(uk); for (this.g=0;this.g<tEC.length;this.g++) tE+=this.fcc(tEC[this.g]); }
		for(this.g=1;this.g<=w.length;this.g++) {
			if(this.DAWEO.indexOf(uk)<0) {
				cc=this.up(w.substr(w.length-this.g,1));
				pc=this.up(w.substr(w.length-this.g-1,1));
				if(str.indexOf(cc)>=0) {
					if(cc=='U') {
						if(pc!='Q') { c++;vowA[vowA.length]=this.g; }
					} else if(cc=='I') {
						if((pc!='G')||(c<=0)) { c++;vowA[vowA.length]=this.g; }
					} else { c++;vowA[vowA.length]=this.g; }
				} else if(uk!=this.Z) {
					for(this.h=0;this.h<uni_array.length;this.h++) if(uni_array[h]==w.charCodeAt(w.length-this.g)) {
						if(this.spellerr(w,k)) return false;
						return [this.g,tEC[this.h%24]];
					}
					for(this.h=0;this.h<tEC.length;this.h++) if(tEC[this.h]==w.charCodeAt(w.length-this.g)) return [this.g,this.fcc(this.skey[this.h])];
				}
			}
		}
		if((uk!=this.Z)&&(typeof(res)!='object')) if(this.spellerr(w,k)) return false;
		if(this.DAWEO.indexOf(uk)<0) {
			for(this.g=1;this.g<=w.length;this.g++) {
				if((uk!=this.Z)&&(s.indexOf(w.substr(w.length-this.g,1))>=0)) return this.g;
				else if(tE.indexOf(w.substr(w.length-this.g,1))>=0) {
					for(this.h=0;this.h<tEC.length;this.h++) {
						if(w.substr(w.length-this.g,1).charCodeAt(0)==tEC[this.h]) return [this.g,this.fcc(this.skey[this.h])];
					}
				}
			}
		}
		if(res) return res;
		if((c==1)||(uk==this.Z)) return vowA[0];
		else if(c==2) {
			var v=2;
			if(w.substr(w.length-1)==" ") v=3;
			var ttt=this.up(w.substr(w.length-v,2));
			if((this.dauCu==0)&&((ttt=="UY")||(ttt=="OA")||(ttt=="OE"))) return vowA[0];
			var c2=0,fdconsonant,sc="BCD"+this.fcc(272)+"GHKLMNPQRSTVX",dc="CH,GI,KH,NGH,GH,NG,NH,PH,QU,TH,TR".split(',');
			for(this.h=1;this.h<=w.length;this.h++) {
				fdconsonant=false;
				for(this.g=0;this.g<dc.length;this.g++) {
					if(this.up(w.substr(w.length-this.h-dc[this.g].length+1,dc[this.g].length)).indexOf(dc[this.g])>=0) {
						c2++;fdconsonant=true;
						if(dc[this.g]!='NGH') this.h++;
						else this.h+=2;
					}
				}
				if(!fdconsonant) {
					if(sc.indexOf(this.up(w.substr(w.length-this.h,1)))>=0) c2++;
					else break;
				}
			}
			if((c2==1)||(c2==2)) return vowA[0];
			return vowA[1];
		} else if(c==3) return vowA[1];
		else return false;
	},
	unV: function (w) {
		var u=this.repSign(null),b,a;
		for(a=1;a<=w.length;a++) {
			for(b=0;b<u.length;b++) {
				if(u[b]==w.charCodeAt(w.length-a)) {
					w=w.substr(0,w.length-a)+this.fcc(this.skey[b%24])+w.substr(w.length-a+1);
				}
			}
		}
		return w;
	},
	unV2: function (w) {
		var a,b;
		for(a=1;a<=w.length;a++) {
			for(b=0;b<this.skey.length;b++) {
				if(this.skey[b]==w.charCodeAt(w.length-a)) w=w.substr(0,w.length-a)+this.skey2[b]+w.substr(w.length-a+1);
			}
		}
		return w;
	},
	repSign: function (k) {
		var t=[],u=[],a,b;
		for(a=0;a<5;a++) {
			if((k==null)||(this.SFJRX.substr(a,1)!=this.up(k))) {
				t=this.retKC(this.SFJRX.substr(a,1));
				for(b=0;b<t.length;b++) u[u.length]=t[b];
			}
		}
		return u;
	},
	sr: function (w,k,i) {
		var sf=this.getSF();
		pos=this.findC(w,k,sf);
		if(pos) {
			if(pos[1]) this.replaceChar(this.oc,i-pos[0],pos[1]);
			else {
				var c=this.retUni(w,k,pos);
				this.replaceChar(this.oc,i-pos,c);
			}
		}
		return false;
	},
	retUni: function (w,k,pos) {
		var u=this.retKC(this.up(k)),uC,lC,c=w.charCodeAt(w.length-pos),a;
		for(a=0;a<this.skey.length;a++) if(this.skey[a]==c) {
			if(a<12) { lC=a;uC=a+12; }
			else { lC=a-12;uC=a; }
			t=this.fcc(c);if(t!=this.up(t)) return u[lC];
			return u[uC];
		}
	},
	replaceChar: function (o,pos,c) {
		var bb=false; if(!this.nan(c)) { var replaceBy=this.fcc(c),wfix=this.up(unV(this.fcc(c))); this.changed=true; }
		else { var replaceBy=c; if((this.up(c)=="O")&&(this.whit)) bb=true; }
		if(!o.data) {
			var savePos=o.selectionStart,sst=o.scrollTop;
			if ((this.up(o.value.substr(pos-1,1))=='U')&&(pos<savePos-1)&&(this.up(o.value.substr(pos-2,1))!='Q')) {
				if((wfix=="Ơ")||(bb)) {
					if (o.value.substr(pos-1,1)=='u') var r=this.fcc(432);
					else var r=this.fcc(431);
				}
				if(bb) {
					this.changed=true; if(c=="o") replaceBy="ơ";
					else replaceBy="Ơ";
				}
			}
			o.value=o.value.substr(0,pos)+replaceBy+o.value.substr(pos+1);
			if(r) o.value=o.value.substr(0,pos-1)+r+o.value.substr(pos);
			o.setSelectionRange(savePos,savePos);o.scrollTop=sst;
		} else {
			if ((this.up(o.data.substr(pos-1,1))=='U')&&(pos<o.pos-1)) {
				if((wfix=="Ơ")||(bb)) {
					if (o.data.substr(pos-1,1)=='u') var r=this.fcc(432);
					else var r=this.fcc(431);
				}
				if(bb) {
					this.changed=true; if(c=="o") replaceBy="ơ";
					else replaceBy="Ơ";
				}
			}
			o.deleteData(pos,1);o.insertData(pos,replaceBy);
			if(r) { o.deleteData(pos-1,1);o.insertData(pos-1,r); }
		}
		if(this.whit) this.whit=false;
	},
	retKC: function (k) {
		if(k==this.S) return [225,7845,7855,233,7871,237,243,7889,7899,250,7913,253,193,7844,7854,201,7870,205,211,7888,7898,218,7912,221];
		if(k==this.F) return [224,7847,7857,232,7873,236,242,7891,7901,249,7915,7923,192,7846,7856,200,7872,204,210,7890,7900,217,7914,7922];
		if(k==this.J) return [7841,7853,7863,7865,7879,7883,7885,7897,7907,7909,7921,7925,7840,7852,7862,7864,7878,7882,7884,7896,7906,7908,7920,7924];
		if(k==this.R) return [7843,7849,7859,7867,7875,7881,7887,7893,7903,7911,7917,7927,7842,7848,7858,7866,7874,7880,7886,7892,7902,7910,7916,7926];
		if(k==this.X) return [227,7851,7861,7869,7877,297,245,7895,7905,361,7919,7929,195,7850,7860,7868,7876,296,213,7894,7904,360,7918,7928];
	},
	getEL: function (id) { return document.getElementById(id); },
	getSF: function () {
		var sf=[],x; for(x=0;x<this.skey.length;x++) sf[sf.length]=this.fcc(this.skey[x]);
		return sf;
	},
	updateInfo: function () {
		this.setPref();
		this.getPref();
		this.updateMenu();
	},
	updateMenu: function () {
		// Update method menu items
		var radioOn = this.getEL(this.enabledID ? this.enabledID : this.radioID[5]);
		this.setObservedAttr(radioOn, "checked", !!this.on_off);
		var cmdMethod = this.getEL(this.methodCmdID);
		if (cmdMethod) cmdMethod.setAttribute("disabled", !this.on_off);
		this.setObservedAttr(this.getEL(this.radioID[6]), "disabled", !this.on_off);
		this.setObservedAttr(this.getEL(this.radioID[7]), "disabled", !this.on_off);
		this.setObservedAttr(this.getEL(this.radioID[this.method]), "checked", true);
		
		// Update options menu items
		this.setObservedAttr(this.getEL(this.radioID[6]), "checked", !!this.dockspell);
		this.setObservedAttr(this.getEL(this.radioID[7]), "checked", !!this.dauCu);
		
		// Update status bar panel
		if (this.getEL(this.methodLabel)) {
			if (this.on_off) this.setObservedAttr(this.getEL(this.methodLabel), "label", this.getEL(this.radioID[this.method]).getAttribute("label"));
			else this.setObservedAttr(this.getEL(this.methodLabel), "label", this.getEL(this.radioID[5]).getAttribute("label"));
		}
	},
	setObservedAttr: function (bcaster, attr, val) {
		if (!bcaster) return;
		var ids = bcaster.getAttribute("observers");
		if (!ids) {	// not a <broadcaster>
			bcaster.setAttribute(attr, val);
			return;
		}
		ids = ids.split(",");
		for (var i = 0; i < ids.length; i++) {
			var radio = this.getEL(ids[i]);
			if (radio) radio.setAttribute(attr, val);
		}
	},
	setMethod: function (m) {
		if (m == -1) this.on_off = 0;
		else {
			this.on_off = 1;
			this.method = m;
		}
		this.updateInfo();
	},
	toggleEnabled: function (item) {
		if (this.enabledID) {
			var enabled = item.getAttribute("checked") == "true";
			this.setMethod(enabled ? this.method : -1);
		}
		else this.setMethod(item.value);
	},
	setDauCu: function (box) {
		if(typeof(box)=="number") this.dauCu=box;
		else this.dauCu = 0 + (box.getAttribute("checked") == "true");
		this.updateInfo();
	},
	setSpell: function (box) {
		if(typeof(box)=="number") this.spellerr=(box==1)?this.ckspell:this.nospell;
		else {
			if(box.getAttribute("checked") == "true") { this.spellerr=this.ckspell;this.dockspell=1; }
			else { this.spellerr=this.nospell;this.dockspell=0; }
		}
		this.updateInfo();
	},
	ifInit: function (w) {
		var sel=w.getSelection();
		this.range=sel?sel.getRangeAt(0):document.createRange();
	},
	ifMoz: function (e) {
		var code=e.which,cwi=e.target.parentNode.wi;
		if(typeof(cwi)=="undefined") cwi=e.target.parentNode.parentNode.wi;
		if((e.ctrlKey)||((e.altKey)&&(code!=92)&&(code!=126))) return;
		this.ifInit(cwi);
		var node=this.range.endContainer,newPos;this.sk=this.fcc(code);this.saveStr="";
		if(this.checkCode(code)||(!this.range.startOffset)||(typeof(node.data)=='undefined')) return;
		node.sel=false;
		if(node.data) {
			this.saveStr=node.data.substr(this.range.endOffset);
			if(this.range.startOffset!=this.range.endOffset) node.sel=true;
			node.deleteData(this.range.startOffset,node.data.length);
		}
		this.range.setEnd(node,this.range.endOffset);
		this.range.setStart(node,0);
		if(!node.data) return;
		node.value=node.data; node.pos=node.data.length; node.which=code;
		this.start(node,e);
		node.insertData(node.data.length,this.saveStr);
		newPos=node.data.length-this.saveStr.length+this.kl;
		this.range.setEnd(node,newPos);this.range.setStart(node,newPos);this.kl=0;
		if(this.specialChange) { this.specialChange=false; this.changed=false; node.deleteData(node.pos-1,1); }
		if(this.changed) { this.changed=false; e.preventDefault(); }
	},
	checkCode: function (code) { return((this.on_off==0)||((code<45)&&(code!=42)&&(code!=32)&&(code!=39)&&(code!=40)&&(code!=43))||(code==145)||(code==255)); },
	fcc: function (x) { return String.fromCharCode(x); },
	setPref: function () {
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.avim.");
		prefs.setBoolPref("enabled", !!this.on_off);
		prefs.setIntPref("method", this.method);
		prefs.setBoolPref("ignoreMalformed", !!this.dockspell);
		prefs.setBoolPref("oldAccents", !!this.dauCu);
		prefs.setCharPref("ignoredFieldIds", this.va.join(","));
	},
	getPref: function () {
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.avim.");
		this.on_off = 0 + prefs.getBoolPref("enabled");
		this.method = prefs.getIntPref("method");
		this.dockspell = 0 + prefs.getBoolPref("ignoreMalformed");
		this.dauCu = 0 + prefs.getBoolPref("oldAccents");
		this.va = prefs.getCharPref("ignoredFieldIds").split(",");
	},
	up: function (w) {
		w=w.toUpperCase();
		return w;
	},
	findIgnore: function (el) {
		for(var i=0;i<this.va.length;i++) if((el.id == this.va[i] || el.name == this.va[i]) && this.va[i].length > 0) return true;
	},
	onKeyPress: function (e) {
		if (document.documentElement.localName == "page") return;
		var el=e.target,code=e.which;
		if(e.ctrlKey) return;
		if((e.altKey)&&(code!=92)&&(code!=126)) return;
		var xulURI = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
		var xulAnonIDs = {
			"searchbar": "searchbar-textbox",
			"findbar": "findbar-textbox"
		};
		if (el.namespaceURI == xulURI && xulAnonIDs[el.localName]) {
			el = document.getAnonymousElementByAttribute(el, "anonid", xulAnonIDs[el.localName]);
		}
		var isHTML = el.type == "textarea" || el.type == "text";
		var xulTags = ["textbox", "searchbar", "findbar"];
		var isXUL = el.namespaceURI == xulURI && xulTags.indexOf(el.localName) >= 0 && el.type != "password";
		if((!isHTML && !isXUL) || this.checkCode(code)) return;
		this.sk=this.fcc(code); if (this.findIgnore(el)) return;
		this.start(el,e);
		if(this.changed) {
			this.changed=false;
			e.preventDefault();
		}
	},
	attachEvt: function (obj,evt,handle,capture) {
		obj.addEventListener(evt,handle,capture);
	//	obj.addEventListener(evt,this.getPref,capture);
	},
	init: function () {
		var kkk=false;
		for(this.g=0;this.g<this.fID.length;this.g++) {
			if(this.findIgnore(this.fID[this.g])) continue;
			var iframedit;
			try {
				this.wi=this.fID[this.g].contentWindow;iframedit=this.wi.document;iframedit.wi=this.wi;
				if((iframedit)&&(this.up(iframedit.designMode)=="ON")) {
					this.attachEvt(iframedit,"keypress",this.ifMoz,false);
				}
			} catch(e) { }
		}
	},
	uglyF: function () { var ugly=50;while(ugly<5000) {setTimeout(this.init,ugly);ugly+=50} },
	initMenu: function () {
		this.getPref();
		this.updateMenu();
	}
};

this.getPref();
if(this.on_off==0) this.setMethod(-1);
else this.setMethod(this.method);
this.setSpell(this.dockspell);
this.setDauCu(this.dauCu);

this.attachEvt(document,"keypress",this.onKeyPress,false);

this.uglyF();
this.attachEvt(document,"mousedown",this.uglyF,false);

this.attachEvt(window, "focus", this.initMenu, false);
