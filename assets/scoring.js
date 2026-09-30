/* scoring.js: Five lights and the suggested action. The register spreadsheet v2.2 is the reference; each rule names its column
   Split from the prototype (artifact version 18, 29 September 2026) by tools/split-prototype.py. */
"use strict";
// ---------- Scoring: the same rules as the register spreadsheet, column for column ----------
function SOLE(){return !!(state&&state.org==="sole");}
function oneAdmin(t){return t.admins==="One person"&&!SOLE();}
function own(t){return !!(t.owner&&String(t.owner).trim())||SOLE();}
function ownerName(t){return (t.owner&&String(t.owner).trim())||(SOLE()?"Me":"");}
function personal(t){return t.data==="Personal"||t.data==="Sensitive";}
function dev(t){return t.kind==="Devices";}
// Register v2.2 (decision 2026-09-30): two kinds for which some questions do not apply.
function app(t){return t.kind==="App on our computers";}
function platform(t){return t.kind==="Account on a platform";}
function answered(t){return !!(t.name&&t.data);}
function safety(t){ // column C
  if(!answered(t)||!t.signin)return "";
  if(t.signin==="Yes"||t.signin==="Not offered")return "Green";
  return (personal(t)||dev(t))?"Red":"Amber";
}
function control(t){ // column D
  if(!answered(t))return "";
  // An app on our computers has no account or supplier location; a platform's unknown location is amber, not red.
  if(!own(t)||(t.account==="Personal"&&!app(t))||oneAdmin(t)||(t.where===DK&&!app(t)&&!platform(t)))return "Red";
  var ok=t.admins==="Two or more"&&(dev(t)||app(t)||platform(t)||t.data==="None"||t.data==="Internal"||t.terms==="Yes");
  // A platform with no location answer counts as not sure (decision 2026-09-30): amber, as the map shows.
  var held=!app(t)&&((t.data==="Sensitive"&&(t.where===ELSE||t.based===ELSE))||(t.data==="Personal"&&t.where===ELSE)||t.where===DK||(platform(t)&&!t.where));
  return ok&&!held?"Green":"Amber";
}
function exitL(t){ // column E
  if(!answered(t))return "";
  if(dev(t)||app(t))return t.copy==="Yes"?"Green":(personal(t)||t.depend==="Critical")?"Red":"Amber";
  if(t.exp==="Yes"&&t.copy==="Yes")return "Green";
  var noExp=t.exp==="No"||t.exp===DK||!t.exp;
  if((noExp&&t.copy!=="Yes")||(t.depend==="Critical"&&t.copy!=="Yes"))return "Red";
  return "Amber";
}
function mission(t){ // column G
  if(!answered(t))return "";
  if(!t.ai&&!t.rights&&!t.env&&!t.fits)return "Not checked";
  if(t.fits==="No"||t.rights==="Serious concern"||t.env==="Serious concern"||(t.ai==="Yes"&&personal(t)))return "Red";
  if(t.fits==="Yes"&&t.rights==="None known"&&t.env==="None known"&&(t.ai==="No"||t.ai==="Opted out"||t.ai==="Not relevant"))return "Green";
  return "Amber";
}
function action(t){ // column B
  if(!answered(t))return "";
  var p=personal(t);
  if(safety(t)==="Red"||!own(t)||oneAdmin(t)||(t.account==="Personal"&&!app(t)&&p))return "Fix now";
  if(mission(t)==="Red"&&!(t.approved&&String(t.approved).trim()))return "Trustee decision";
  if((p&&(control(t)==="Red"||exitL(t)==="Red"))||(t.depend==="Critical"&&exitL(t)==="Red"))return "Review this year";
  var reds=[safety(t),control(t),exitL(t),t.value,mission(t)].filter(function(x){return x==="Red";}).length;
  return reds>=2?"Review at renewal":"Keep";
}
