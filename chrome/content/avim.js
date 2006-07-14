/*
 *  AVIM JavaScript Vietnamese Input Method Firefox Extension Source File dated 13-07-2006
 *
 *	Copyright (C) 2004 Hieu Tran Dang <lt2hieu2004 (at) users (dot) sf (dot) net>
 *	Website:	http://hdang.co.uk
 *				http://hieu.acunett.com
 *
 *	You are allowed to use this software in any way you want providing:
 *		1. You must retain this copyright notice at all time
 *		2. You must not claim that you or any other third party is the author
 *		   of this software in any way.
*/

va="email".split(',') //Put the ID of the fields you DON'T want to let users type Vietnamese in, multiple fields allowed, separated by a comma (,)
method=0 //Default input method, 0=AUTO, 1=TELEX, 2=VNI, 3=VIQR
on_off=1 //Start H.I.M on
dockspell=1 //Start H.I.M with spell checking on
dauCu=1 //Start H.I.M with old way of marking accent (o`a, o`e, u`y)
var agt=navigator.userAgent.toLowerCase(),alphabet="QWERTYUIOPASDFGHJKLZXCVBNM\ ",them,spellerr,S,F,J,R,X,D,oc,sk,saveStr,wi,frame,D2
var ver=0,support=true,changed=false,uni,uni2,g,h,SFJRX,DAWEO,Z,AEO,moc,trang,kl=0,tw5,range=null,doc,radioID="him_ckspell,him_daucu".split(",")
skey=new Array(97,226,259,101,234,105,111,244,417,117,432,121,65,194,258,69,202,73,79,212,416,85,431,89)
var skey2="a,a,a,e,e,i,o,o,o,u,u,y,A,A,A,E,E,I,O,O,O,U,U,Y".split(','),A,E,O,whit=false,english="ĐÂĂƠƯÊÔ",ds1="d,D".split(","),db1=new Array(273,272)
os1="o,O,ơ,Ơ,ó,Ó,ò,Ò,ọ,Ọ,ỏ,Ỏ,õ,Õ,ớ,Ớ,ờ,Ờ,ợ,Ợ,ở,Ở,ỡ,Ỡ".split(","),ob1="ô,Ô,ô,Ô,ố,Ố,ồ,Ồ,ộ,Ộ,ổ,Ổ,ỗ,Ỗ,ố,Ố,ồ,Ồ,ộ,Ộ,ổ,Ổ,ỗ,Ỗ".split(",")
mocs1="o,O,ô,Ô,u,U,ó,Ó,ò,Ò,ọ,Ọ,ỏ,Ỏ,õ,Õ,ú,Ú,ù,Ù,ụ,Ụ,ủ,Ủ,ũ,Ũ,ố,Ố,ồ,Ồ,ộ,Ộ,ổ,Ổ,ỗ,Ỗ".split(",");mocb1="ơ,Ơ,ơ,Ơ,ư,Ư,ớ,Ớ,ờ,Ờ,ợ,Ợ,ở,Ở,ỡ,Ỡ,ứ,Ứ,ừ,Ừ,ự,Ự,ử,Ử,ữ,Ữ,ớ,Ớ,ờ,Ờ,ợ,Ợ,ở,Ở,ỡ,Ỡ".split(",")
trangs1="a,A,â,Â,á,Á,à,À,ạ,Ạ,ả,Ả,ã,Ã,ấ,Ấ,ầ,Ầ,ậ,Ậ,ẩ,Ẩ,ẫ,Ẫ".split(",");trangb1="ă,Ă,ă,Ă,ắ,Ắ,ằ,Ằ,ặ,Ặ,ẳ,Ẳ,ẵ,Ẵ,ắ,Ắ,ằ,Ằ,ặ,Ặ,ẳ,Ẳ,ẵ,Ẵ".split(",")
as1="a,A,ă,Ă,á,Á,à,À,ạ,Ạ,ả,Ả,ã,Ã,ắ,Ắ,ằ,Ằ,ặ,Ặ,ẳ,Ẳ,ẵ,Ẵ,ế,Ế,ề,Ề,ệ,Ệ,ể,Ể,ễ,Ễ".split(",");ab1="â,Â,â,Â,ấ,Ấ,ầ,Ầ,ậ,Ậ,ẩ,Ẩ,ẫ,Ẫ,ấ,Ấ,ầ,Ầ,ậ,Ậ,ẩ,Ẩ,ẫ,Ẫ,é,É,è,È,ẹ,Ẹ,ẻ,Ẻ,ẽ,Ẽ".split(",")
es1="e,E,é,É,è,È,ẹ,Ẹ,ẻ,Ẻ,ẽ,Ẽ".split(",");eb1="ê,Ê,ế,Ế,ề,Ề,ệ,Ệ,ể,Ể,ễ,Ễ".split(",")
arA="á,à,ả,ã,ạ,a,Á,À,Ả,Ã,Ạ,A".split(',');mocrA="ó,ò,ỏ,õ,ọ,o,ú,ù,ủ,ũ,ụ,u,Ó,Ò,Ỏ,Õ,Ọ,O,Ú,Ù,Ủ,Ũ,Ụ,U".split(',');erA="é,è,ẻ,ẽ,ẹ,e,É,È,Ẻ,Ẽ,Ẹ,E".split(',');orA="ó,ò,ỏ,õ,ọ,o,Ó,Ò,Ỏ,Õ,Ọ,O".split(',')
aA="ấ,ầ,ẩ,ẫ,ậ,â,Ấ,Ầ,Ẩ,Ẫ,Ậ,Â".split(',');mocA="ớ,ờ,ở,ỡ,ợ,ơ,ứ,ừ,ử,ữ,ự,ư,Ớ,Ờ,Ở,Ỡ,Ợ,Ơ,Ứ,Ừ,Ử,Ữ,Ự,Ư".split(',');trangA="ắ,ằ,ẳ,ẵ,ặ,ă,Ắ,Ằ,Ẳ,Ẵ,Ặ,Ă".split(',');eA="ế,ề,ể,ễ,ệ,ê,Ế,Ề,Ể,Ễ,Ệ,Ê".split(',');oA="ố,ồ,ổ,ỗ,ộ,ô,Ố,Ồ,Ổ,Ỗ,Ộ,Ô".split(',')
file=Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile)
file.append("avim_prefs")

function notWord(w) {
	var str="\ \r\n#,\\;.:-_()<>+-*/=?!\"$%{}[]\'~|^\@\&\t"+fcc(160)
	return (str.indexOf(w)>=0)
}
function mozGetText(obj) {
	var v,pos,w="";g=1
	v=(obj.data)?obj.data:obj.value
	if(v.length<=0) return false
	if(!obj.data) {
		if(!obj.setSelectionRange) return false
		pos=obj.selectionStart
	} else pos=obj.pos
	if(obj.selectionStart!=obj.selectionEnd) return new Array("",pos)
	while(1) {
		if(pos-g<0) break
		else if(notWord(v.substr(pos-g,1))) { if(v.substr(pos-g,1)=="\\") w=v.substr(pos-g,1)+w; break }
		else w=v.substr(pos-g,1)+w; g++
	}
	return new Array(w,pos)
}
function start(obj,key) {
	var w="";oc=obj;uni2=false;fixed=false
	if(method==0) { uni="D,A,E,O,W,W".split(','); uni2="9,6,6,6,7,8".split(','); D2="DAWEO6789" }
	else if(method==1) { uni="D,A,E,O,W,W".split(','); D2="DAWEO" }
	else if(method==2) { uni="9,6,6,6,7,8".split(','); D2="6789" }
	else if(method==3) { uni="D,^,^,^,+,(".split(','); D2="D^+(" }
	else if(method==4) { uni="D,^,^,^,*,(".split(','); D2="D^*(" }
	key=fcc(key.which)
	w=mozGetText(obj)
	if((!w)||(obj.sel)) return
	main(w[0],key,w[1],uni)
	if(!dockspell) w=mozGetText(obj)
	if((w)&&(uni2)&&(!changed)) main(w[0],key,w[1],uni2)
	if(D2.indexOf(key.toUpperCase())>=0) {
		w=mozGetText(obj)
		if(!w) return
		normC(w[0],key,w[1])
	}
}
function tr(k,w,by,sf,i) {
	var r,pos=findC(w,k,sf)
	if(pos) {
		if(pos[1]) {
			return replaceChar(oc,i-pos[0],pos[1])
		} else {
			var c,pC=w.substr(w.length-pos,1);r=sf
			for(g=0;g<r.length;g++) {
				if(isNaN(r[g])) var cmp=pC
				else var cmp=pC.charCodeAt(0)
				if(cmp==r[g]) {
					if(!isNaN(by[g])) c=by[g]
					else c=by[g].charCodeAt(0)
					return replaceChar(oc,i-pos,c)
				}
			}
		}
	}
	return false
}
function main(w,k,i,a) {
	var uk=k.toUpperCase(),bya=new Array(db1,ab1,eb1,ob1,mocb1,trangb1),got=false,t="d,D,a,A,a,A,o,O,u,U,e,E,o,O".split(",")
	var sfa=new Array(ds1,as1,es1,os1,mocs1,trangs1),by=new Array(),sf=new Array()
	if((method==2)||((method==0)&&(a[0]=="9"))) {
		DAWEO="6789";SFJRX="12534";S="1";F="2";J="5";R="3";X="4";Z="0";D="9";FRX="234";AEO="6";moc="7";trang="8";them="678";A="^";E="^";O="^"
	} else if(method==3) {
		DAWEO="^+(D";SFJRX="'`.?~";S="'";F="`";J=".";R="?";X="~";Z="-";D="D";FRX="`?~";AEO="^";moc="+";trang="(";them="^+(";A="^";E="^";O="^"
	} else if(method==4) {
		DAWEO="^*(D";SFJRX="'`.?~";S="'";F="`";J=".";R="?";X="~";Z="-";D="D";FRX="`?~";AEO="^";moc="*";trang="(";them="^*(";A="^";E="^";O="^"
	} else if((method==1)||((method==0)&&(a[0]=="D"))) {
		SFJRX="SFJRX";DAWEO="DAWEO";D='D';S='S';F='F';J='J';R='R';X='X';Z='Z';FRX="FRX";them="AOEW";trang="W";moc="W";A="A";E="E";O="O"
	}
	if(SFJRX.indexOf(uk)>=0) {
		var ret=sr(w,k,i); got=true
		if(ret) return ret
	} else if(uk==Z) {
		sf=repSign(null)
		for(h=0;h<english.length;h++) {
			sf[sf.length]=english.toLowerCase().charCodeAt(h)
			sf[sf.length]=english.charCodeAt(h)
		}
		for(h=0;h<5;h++) for(g=0;g<skey.length;g++) by[by.length]=skey[g]
		for(h=0;h<t.length;h++) by[by.length]=t[h]
		got=true
	}
	else for(h=0;h<a.length;h++) if(a[h]==uk) { got=true; by=by.concat(bya[h]); sf=sf.concat(sfa[h]) }
	if(uk==moc) whit=true;
	if(!got) return normC(w,k,i)
	return DAWEOZ(k,w,by,sf,i,uk)
}
function DAWEOZ(k,w,by,sf,i,uk) { if((DAWEO.indexOf(uk)>=0)||(Z.indexOf(uk)>=0)) return tr(k,w,by,sf,i) }
function normC(w,k,i) {
	var uk=k.toUpperCase(),u=repSign(null),fS,c,j,space=(k.charCodeAt(0)==32)?true:false
	if(space) return
	for(j=1;j<=w.length;j++) {
		for(h=0;h<u.length;h++) {
			if(u[h]==w.charCodeAt(w.length-j)) {
				if(h<=23) fS=S
				else if(h<=47) fS=F
				else if(h<=71) fS=J
				else if(h<=95) fS=R
				else fS=X
				c=skey[h%24]; if((alphabet.indexOf(uk)<0)&&(D2.indexOf(uk)<0)) return w; w=unV(w)
				if((!space)&&(!changed)) w+=k
				if(!changed) {
					if(!oc.data) {
						var sp=oc.selectionStart,sst=oc.scrollTop
						oc.value=oc.value.substr(0,oc.selectionStart)+k+oc.value.substr(oc.selectionEnd); changed=true
						oc.setSelectionRange(sp+k.length,sp+k.length); oc.scrollTop=sst
					} else { oc.insertData(oc.pos,k); range.setEnd(oc,oc.pos+1); oc.pos++; changed=true }
				}
				if(!ckspell(w,fS)) {
					replaceChar(oc,i-j,c)
					if(!oc.data) {
						var pos=oc.selectionStart
						var a=new Array(D)
						main(w,fS,pos,a)
					} else {
						var ww=mozGetText(oc)
						var a=new Array(D)
						main(ww[0],fS,ww[1],a)
					}
				}
			}
		}
	}
}
function nospell(w,k) { return false }
function ckspell(w,k) {
	w=unV(w); var exc="UOU,IEU".split(','),z,next=true,noE="UU,UOU,UOI,IEU,AO,IA,AI,AY,AU,AO".split(','),noBE="YEU",test,a,b
	var check=true,noM="UE,UYE,IU,EU,UY".split(','),noMT="AY,AU".split(','),noT="UA",t=-1,notV2="IAO"
	var uw=w.toUpperCase(),tw=uw,update=false,gi="IO",noAOEW="OE,OO,AO,EO,IA,AI".split(','),noAOE="OA"
	var notViet="AA,AE,EE,OU,YY,YI,IY,EY,EA,EI,II,IO,YO,YA,YU,OOO".split(','),uk=k.toUpperCase(),twE,uw2=unV2(uw)
	var vSConsonant="B,C,D,G,H,K,L,M,N,P,Q,R,S,T,V,X".split(','),vDConsonant="CH,GI,KH,NGH,GH,NG,NH,PH,QU,TH,TR".split(',')
	var vDConsonantE="CH,NG,NH".split(','),sConsonant="C,P,T,CH".split(','),vSConsonantE="C,M,N,P,T".split(',')
	var noNHE="O,U,IE,Ô,Ơ,Ư,IÊ,Ă,Â,UYE,UYÊ,UO,ƯƠ,ƯO,UƠ,UA,ƯA,OĂ,OE,OÊ".split(','),oMoc="UU,UOU".split(',')
	if(FRX.indexOf(uk)>=0) for(a=0;a<sConsonant.length;a++) if(uw.substr(uw.length-sConsonant[a].length,sConsonant[a].length)==sConsonant[a]) return true
	for(a=0;a<uw.length;a++) {
		if("FJZW1234567890".indexOf(uw.substr(a,1))>=0) return true
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
				if((uk==trang)&&((tw=="OA")||(tw=="A"))) return true
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
	uw2=unV2(tw)
	if(uw2==notV2) return true
	if(tw!=twE) for(z=0;z<noE.length;z++) if(uw2==noE[z]) return true
	if((tw!=uw)&&(uw2==noBE)) return true
	if(uk!=moc) for(z=0;z<oMoc.length;z++) if(tw==oMoc[z]) return true
	if((uw2.indexOf('UYE')>0)&&(uk=='E')) check=false
	if((them.indexOf(uk)>=0)&&(check)) {
		for(a=0;a<noAOEW.length;a++) if(uw2.indexOf(noAOEW[a])>=0) return true
		if(uk!=trang) if(uw2==noAOE) return true
		if((uk==trang)&&(trang!='W')) if(uw2==noT) return true
		if(uk==moc) for(a=0;a<noM.length;a++) if(uw2==noM[a]) return true
		if((uk==moc)||(uk==trang)) for(a=0;a<noMT.length;a++) if(uw2==noMT[a]) return true
	}
	tw5=tw
	if((uw2.charCodeAt(0)==272)||(uw2.charCodeAt(0)==273)) { if(uw2.length>4) return true }
	else if(uw2.length>3) return true
	return false
}
function DAWEOF(cc,k) {
	var ret=new Array(),kA=new Array(A,moc,trang,E,O),z,a;ret[0]=g
	var ccA=new Array(aA,mocA,trangA,eA,oA),ccrA=new Array(arA,mocrA,arA,erA,orA)
	for(a=0;a<kA.length;a++) if(k==kA[a]) for(z=0;z<ccA[a].length;z++) if(cc==ccA[a][z]) ret[1]=ccrA[a][z]
	if(ret[1]) return ret
	else return false
}
function findC(w,k,sf) {
	if(((method==3)||(method==4))&&(w.substr(w.length-1,1)=="\\")) return new Array(1,k.charCodeAt(0))
	var str="",res,cc="",pc="",tE="",vowA=new Array(),s="ÂĂÊÔƠƯ",c=0,dn=false,uw=w.toUpperCase(),tv;spellerr(w,k)
	var DAWEOFA=aA.join()+eA.join()+mocA.join()+trangA.join()+oA.join()+english;DAWEOFA=DAWEOFA.toUpperCase()
	for(g=0;g<sf.length;g++) {
		if(isNaN(sf[g])) str+=sf[g]
		else str+=fcc(sf[g])
	}
	var uk=k.toUpperCase(),i=w.length,uni_array=repSign(k),w2=unV2(unV(w).toUpperCase()),dont="ƯA,ƯU".split(',')
	if (DAWEO.indexOf(uk)>=0) {
		if(uk==moc) {
			if((w2.indexOf("UU")>=0)&&(tw5!=dont[1])) {
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
				pc=w.substr(w.length-g-1,1).toUpperCase()
				uc=cc.toUpperCase()
				for(h=0;h<dont.length;h++) if((tw5==dont[h])&&(tw5==unV(pc+uc))) dn=true
				if(dn) { dn=false; continue }
				if(str.indexOf(uc)>=0) {
					if(((uk==moc)&&(unV(uc)=="U")&&(unV(w.substr(w.length-g+1,1)).toUpperCase()=="A"))||((uk==trang)&&(unV(uc)=='A')&&(unV(pc)=='U'))) {
						if(unV(uc)=="U") tv=1
						else tv=2
						ccc=w.substr(w.length-g-tv,1).toUpperCase()
						if(ccc!="Q") res=g+tv-1
						else if(uk==trang) res=g
						else if(moc!=trang) return false
					} else res=g
					if((!whit)||(uw.indexOf("Ư")<0)||(uw.indexOf("W")<0)) break
				} else if(DAWEOFA.indexOf(uc)>=0) {
					if(uk==D) {
						if(cc=="đ") res=new Array(g,'d')
						else if(cc=="Đ") res=new Array(g,'D')
					} else res=DAWEOF(cc,uk)
					if(res) break
				}
			}
		}
	}
	if((uk!=Z)&&(DAWEO.indexOf(uk)<0)) { var tEC=retKC(uk); for (g=0;g<tEC.length;g++) tE+=fcc(tEC[g]) }
	for(g=1;g<=w.length;g++) {
		if(DAWEO.indexOf(uk)<0) {
			cc=w.substr(w.length-g,1).toUpperCase()
			pc=w.substr(w.length-g-1,1).toUpperCase()
			if(str.indexOf(cc)>=0) {
				if(cc=='U') {
					if(pc!='Q') { c++;vowA[vowA.length]=g }
				} else if(cc=='I') {
					if((pc!='G')||(c<=0)) { c++;vowA[vowA.length]=g }
				} else { c++;vowA[vowA.length]=g }
			} else if(uk!=Z) {
				for(h=0;h<uni_array.length;h++) if(uni_array[h]==w.charCodeAt(w.length-g)) {
					if(spellerr(w,k)) return false
					return new Array(g,tEC[h%24])
				}
				for(h=0;h<tEC.length;h++) if(tEC[h]==w.charCodeAt(w.length-g)) return new Array(g,fcc(skey[h]))
			}
		}
	}
	if((uk!=Z)&&(typeof(res)!='object')) if(spellerr(w,k)) return false
	if(DAWEO.indexOf(uk)<0) {
		for(g=1;g<=w.length;g++) {
			if((uk!=Z)&&(s.indexOf(w.substr(w.length-g,1).toUpperCase())>=0)) return g
			else if(tE.indexOf(w.substr(w.length-g,1))>=0) {
				for(h=0;h<tEC.length;h++) {
					if(w.substr(w.length-g,1).charCodeAt(0)==tEC[h]) return new Array(g,fcc(skey[h]))
				}
			}
		}
	}
	if(res) return res
	if((c==1)||(uk==Z)) return vowA[0]
	else if(c==2) {
		var v=2
		if(w.substr(w.length-1)==" ") v=3
		var ttt=w.substr(w.length-v,2).toUpperCase()
		if((dauCu==0)&&((ttt=="UY")||(ttt=="OA")||(ttt=="OE"))) return vowA[0]
		var c2=0,fdconsonant,sc="BCD"+fcc(272)+"GHKLMNPQRSTVX",dc="CH,GI,KH,NGH,GH,NG,NH,PH,QU,TH,TR".split(',')
		for(h=1;h<=w.length;h++) {
			fdconsonant=false
			for(g=0;g<dc.length;g++) {
				if(w.substr(w.length-h-dc[g].length+1,dc[g].length).toUpperCase().indexOf(dc[g])>=0) {
					c2++;fdconsonant=true
					if(dc[g]!='NGH') h++
					else h+=2
				}
			}
			if(!fdconsonant) {
				if(sc.indexOf(w.substr(w.length-h,1).toUpperCase())>=0) c2++
				else break
			}
		}
		if((c2==1)||(c2==2)) return vowA[0]
		else return vowA[1]
	} else if(c==3) return vowA[1]
	else return false
}
function unV(w) {
	var u=repSign(null),b,a
	for(a=1;a<=w.length;a++) {
		for(b=0;b<u.length;b++) {
			if(u[b]==w.charCodeAt(w.length-a)) {
				w=w.substr(0,w.length-a)+fcc(skey[b%24])+w.substr(w.length-a+1)
			}
		}
	}
	return w
}
function unV2(w) {
	var a,b
	for(a=1;a<=w.length;a++) {
		for(b=0;b<skey.length;b++) {
			if(skey[b]==w.charCodeAt(w.length-a)) {
				w=w.substr(0,w.length-a)+skey2[b]+w.substr(w.length-a+1)
			}
		}
	}
	return w
}
function repSign(k) {
	var t=new Array(),u=new Array(),a,b
	for(a=0;a<5;a++) {
		if((k==null)||(SFJRX.substr(a,1)!=k.toUpperCase())) {
			t=retKC(SFJRX.substr(a,1))
			for(b=0;b<t.length;b++) u[u.length]=t[b]
		}
	}
	return u
}
function sr(w,k,i) {
	var sf=getSF()
	pos=findC(w,k,sf)
	if(pos) {
		if(pos[1]) {
			replaceChar(oc,i-pos[0],pos[1])
		} else {
			var c=retUni(w,k,pos)
			replaceChar(oc,i-pos,c)
		}
	}
	return false
}
function retUni(w,k,pos) {
	var u=retKC(k.toUpperCase()),uC,lC,c=w.charCodeAt(w.length-pos),a
	for (a=0;a<skey.length;a++) if (skey[a]==c) {
		if (a<12) { lC=a;uC=a+12 }
		else { lC=a-12;uC=a }
		if (fcc(c)!=fcc(c).toUpperCase()) return u[lC]
		return u[uC]
	}
}
function replaceChar(o,pos,c) {
	var bb=false; if(!isNaN(c)) { var replaceBy=fcc(c),wfix=unV(fcc(c)).toUpperCase(); changed=true }
	else { var replaceBy=c; if((c.toUpperCase()=="O")&&(whit)) bb=true }
	if(!o.data) {
		var savePos=o.selectionStart,sst=o.scrollTop
		if ((o.value.substr(pos-1,1).toUpperCase()=='U')&&(pos<savePos-1)&&(o.value.substr(pos-2,1).toUpperCase()!='Q')) {
			if((wfix=="Ơ")||(bb))
			{
				if (o.value.substr(pos-1,1)=='u') var r=fcc(432)
				else var r=fcc(431)
			}
			if(bb) {
				changed=true; if(c=="o") replaceBy="ơ"
				else replaceBy="Ơ"
			}
		}
		o.setSelectionRange(pos,pos+1)
		o.value=o.value.substr(0,o.selectionStart)+replaceBy+o.value.substr(o.selectionEnd)
		if(r) {
			o.setSelectionRange(pos-1,pos)
			o.value=o.value.substr(0,o.selectionStart)+r+o.value.substr(o.selectionEnd)
		}
		o.setSelectionRange(savePos,savePos); o.scrollTop=sst
	} else {
		if ((o.data.substr(pos-1,1).toUpperCase()=='U')&&(pos<o.pos-1)) {
			if((wfix=="Ơ")||(bb))
			{
				if (o.data.substr(pos-1,1)=='u') var r=fcc(432)
				else var r=fcc(431)
			}
			if(bb) {
				changed=true; if(c=="o") replaceBy="ơ"
				else replaceBy="Ơ"
			}
		}
		o.deleteData(pos,1); o.insertData(pos,replaceBy)
		if(r) { o.deleteData(pos-1,1); o.insertData(pos-1,r) }
	}
	if(whit) whit=false
}
function retKC(k) {
	if(k==S) return new Array(225,7845,7855,233,7871,237,243,7889,7899,250,7913,253,193,7844,7854,201,7870,205,211,7888,7898,218,7912,221)
	if(k==F) return new Array(224,7847,7857,232,7873,236,242,7891,7901,249,7915,7923,192,7846,7856,200,7872,204,210,7890,7900,217,7914,7922)
	if(k==J) return new Array(7841,7853,7863,7865,7879,7883,7885,7897,7907,7909,7921,7925,7840,7852,7862,7864,7878,7882,7884,7896,7906,7908,7920,7924)
	if(k==R) return new Array(7843,7849,7859,7867,7875,7881,7887,7893,7903,7911,7917,7927,7842,7848,7858,7866,7874,7880,7886,7892,7902,7910,7916,7926)
	if(k==X) return new Array(227,7851,7861,7869,7877,297,245,7895,7905,361,7919,7929,195,7850,7860,7868,7876,296,213,7894,7904,360,7918,7928)
}
function getEL(id) { return document.getElementById(id) }
function getSF() { var sf=new Array(),x; for(x=0;x<skey.length;x++) sf[sf.length]=fcc(skey[x]); return sf }
function setMethod(m) {
	r=getEL("AVIM")
	if(m==-1) { on_off=0; r.selectedIndex=5 }
	else { on_off=1; method=m; r.selectedIndex=m }
	setSpell(dockspell);setDauCu(dauCu);setCookie()
}
function setDauCu(box) {
	if(typeof(box)=="number") {
		dauCu=box; if(getEL(radioID[1])) getEL(radioID[1]).checked=box
	} else dauCu=(box.checked)?1:0
	setCookie()
}
function setSpell(box) {
	if(typeof(box)=="number") {
		spellerr=(box==1)?ckspell:nospell
		if(getEL(radioID[0])) getEL(radioID[0]).checked=box
	} else {
		if(box.checked) { spellerr=ckspell;dockspell=1 }
		else { spellerr=nospell;dockspell=0 }
	}
	setCookie()
}
function onKeyDown(e) {
	key=fcc(e.which).toUpperCase()
	if(e.altKey||e.metaKey) {
		if(key=="Z") { on_off=1; setMethod(((method==4)?0:++method)) }
		else if(key=="C") { setDauCu(((dauCu==1)?0:1)) }
		else if(key=="S") { dockspell=(dockspell==0)?1:0; setSpell(dockspell) }
		else if(key=="O") {
			on_off=(on_off==0)?1:0
			if(on_off==0) setMethod(-1)
			else setMethod(method)
		}
		setCookie()
	}
}
function ifInit(w) {
	var sel=w.getSelection();w.focus()
	range=sel?sel.getRangeAt(0):document.createRange()
}
function ifMoz(e) {
	if((e.ctrlKey)||((e.altKey)&&(code!=92)&&(code!=126))) return;ifInit(e.target.parentNode.wi)
	var code=e.which,node=range.endContainer;sk=fcc(code);saveStr=""
	if(checkCode(code)||(!range.startOffset)||(typeof(node.data)=='undefined')) return;node.sel=false
	if(node.data) {
		saveStr=node.data.substr(range.endOffset)
		if(range.startOffset!=range.endOffset) node.sel=true
		node.deleteData(range.startOffset,node.data.length)
	}
	range.setEnd(node,range.endOffset)
	range.setStart(node,0)
	if(!node.data) return
	node.value=node.data;node.pos=node.data.length;node.which=code
	start(node,e)
	node.insertData(node.data.length,saveStr)
	range.setEnd(node,node.data.length-saveStr.length+kl)
	range.setStart(node,node.data.length-saveStr.length+kl);kl=0
	if(changed) { changed=false;e.preventDefault() }
}
function checkCode(code) { if(((on_off==0)||((code<45)&&(code!=42))||(code==145)||(code==255))&&(code!=32)&&(code!=39)&&(code!=40)&&(code!=43)) return true }
function fcc(x) { return String.fromCharCode(x) }
function setCookie() {
	foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
	foStream.init(file, 0x02 | 0x08 | 0x20, 0644, 0)
	data=on_off+"\n"+method+"\n"+dockspell+"\n"+dauCu;
	foStream.write(data, data.length)
	foStream.close()
}
function getCookie() {
	if(!file.exists()) setCookie()
	istream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream)
	istream.init(file, 0x01, 0444, 0)
	istream.QueryInterface(Components.interfaces.nsILineInputStream)
	var line={},pref=[],more
	do {
		more = istream.readLine(line)
		pref.push(parseInt(line.value))
	} while(more)
	on_off=pref[0];method=pref[1];dockspell=pref[2];dauCu=pref[3]
	istream.close()
}
getCookie()
document.onkeydown=function(e) { onKeyDown(e) }
document.onkeypress=function(e) {
	var el=e.target,code=e.which; if(e.ctrlKey) return; if((e.altKey)&&(code!=92)&&(code!=126)) return
	if(el.id=='searchbar') {
		el = document.getAnonymousNodes(el)
		el = document.getAnonymousNodes(el[el.length - 1])
		el = el[0].lastChild
		el = document.getAnonymousElementByAttribute(el, "anonid", "input")
	}
	if(((el.type!='textarea')&&(el.type!='text'))||checkCode(code)) return
	sk=fcc(code);for(i=0;i<va.length;i++) if((el.id==va[i])&&(va[i].length>0)) return;start(el,e)
	if(changed) { changed=false; return false }
}
function init() {
	if(on_off==0) setMethod(-1)
	else setMethod(method)
	setSpell(dockspell);setDauCu(dauCu)
	document.onmousedown=function(e) {
		elements=document.getElementById("content").selectedBrowser.contentDocument.getElementsByTagName("iframe")
		for(g=0;g<elements.length;g++) {
			wi=elements[g].contentWindow;iframedit=wi.document;iframedit.wi=wi
			if(iframedit.designMode.toUpperCase()=="ON") {
				iframedit.addEventListener("keypress",ifMoz,false)
				iframedit.addEventListener("keydown",onKeyDown,true)
			}
		}
	}
}
window.addEventListener("load", init, false);