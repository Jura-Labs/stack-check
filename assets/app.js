/* app.js: Screens and interaction
   Split from the prototype (artifact version 18, 29 September 2026) by tools/split-prototype.py. */
"use strict";
/*UI*/
// Reference cards, condensed from the guide. Since guide v1.1 (30 Sep) each full card has its own
// page under the guide (/updates/stay-in-command-of-your-technology/<card>), so "The full card"
// opens that card, not the Step 4 section.
// Other names people search for. Matched as well as the tool's name and job.
var ALIASES={"microsoft-365":"sharepoint onedrive outlook exchange word excel powerpoint office 365 o365","microsoft-teams":"teams","google-workspace":"gmail google drive docs sheets meet g suite","microsoft-365-copilot":"copilot","mobilepay":"vipps","facebook-page":"messenger meta","instagram-professional":"meta","meta-business-suite":"business manager business portfolio","google-ads":"ad grants adwords","zettle":"izettle paypal point of sale card reader","sumup":"card reader","justgiving":"fundraising page","e-conomic":"visma","billy":"shine","x-twitter":"twitter tweet","bluesky":"bsky at protocol"};
// Shown only when someone searches for them or has ticked them (Paul, 30 Sep: fewer Money tools, as a
// charity leader would see it). These are aimed at freelancers and micro-businesses.
var SEARCH_ONLY={freeagent:1,dinero:1,billy:1};
// The offline register templates (register v2.2), the same rules as this tool.
// Analytics (Paul, 30 Sep 2026, decision 2026-09-30-stack-check-analytics-events): Umami counts clicks on
// a few buttons and links, with fixed names and values only. Nothing a person types or chooses is sent.
var DOWNLOADS='<a href="downloads/stay-in-command-register-v2.2.xlsx" download data-umami-event="register-download" data-umami-event-format="xlsx" data-umami-event-place="start">Excel (.xlsx, 90 KB)</a> or <a href="downloads/stay-in-command-register-v2.2.ods" download data-umami-event="register-download" data-umami-event-format="ods" data-umami-event-place="start">LibreOffice (.ods, open format, 105 KB)</a>';
var GUIDE="https://juralabs.org/updates/stay-in-command-of-your-technology";
var CARDS={
 documents:{title:"Documents",anchor:"/documents",replaces:"Microsoft Word, Excel and PowerPoint, or Google Docs.",reduce:"Save finished documents as PDF or in open formats (ODF) as well as .docx, and keep templates somewhere you control.",
  options:["LibreOffice: a free desktop office suite, open source, from a German foundation.","For editing together online: the office editor that comes with a hosted Nextcloud. Collabora Online is the established option."],
  effort:"Medium. The software is easy. The friction comes from funders and partners who send complex Word files.",approach:"Do not ban Microsoft Office. Keep it on one or two machines for the documents that need it. Use LibreOffice for what you create yourself, and send documents out as PDF where you can.",stay:"You rely on Excel macros, Access databases, or complex tracked changes with partners every week."},
 files:{title:"Files and working together",anchor:"/files",replaces:"SharePoint, OneDrive, Google Drive or Dropbox.",reduce:"Keep a regular copy of important folders outside your main service, clear out duplicates, and make sure two people can manage sharing.",
  options:["IONOS Nextcloud Workspace: files, online office, email, chat and video in one. German data centres.","Hetzner Storage Share: files only, 1 TB, no user limit. Germany.","TAB.DIGITAL Business Cloud: Nextcloud with online office, up to 100 users. Germany."],
  effort:"Medium.",approach:"Do not copy everything across. Clear out duplicates and dead folders first. Move one team's shared folder, not the whole organisation.",stay:"Your files are tied into Teams channels and SharePoint workflows that people use every day, and nobody has time to own a change."},
 analytics:{title:"Website analytics",anchor:"/analytics",replaces:"Google Analytics.",reduce:"Collect only what you use. Ask: how did this data help us last month?",
  options:["Plausible: hosted in the EU by an Estonian company. Open source. No cookies.","Umami: open source. You can host it yourself. Umami's own cloud service offers EU hosting from a US company."],
  effort:"Low.",approach:"Run it alongside Google Analytics for a month before you remove anything.",stay:"You use Google Ad Grants. Check its conversion-tracking requirements before you change anything."},
 passwords:{title:"Passwords",anchor:"/passwords",replaces:"Passwords in spreadsheets, notebooks or browsers.",reduce:"This is mainly a safety fix. Any shared password manager with two-step sign-in and two admins is better than a spreadsheet. Do not switch between good password managers just to change supplier.",
  options:["Bitwarden Teams: open source. A US company, but you can choose EU hosting when you sign up.","Proton Pass: open-source apps from a Swiss company. Nonprofit discounts on request.","KeePassXC: free and open source, stored in a file on your own device. Best for one person, not a team."],
  effort:"Low.",approach:"Create the organisation account, switch on two-step sign-in for everyone, import passwords from browsers, then turn off password saving in the browser. Name a second admin.",stay:"You already use a password manager with two-step sign-in and a second admin."},
 meetings:{title:"Meetings",anchor:"/meetings",replaces:"Zoom, Microsoft Teams or Google Meet.",reduce:"This is one of the hardest things to move, because the people you meet choose the platform too. Keep your tool, switch on two-step sign-in, and think twice before recording sensitive meetings in the cloud.",
  options:["The video tool in your file or email bundle: Nextcloud Talk with IONOS Nextcloud Workspace, or Proton Meet with Proton Workspace.","Jitsi: open source. The free public service now needs a Google, GitHub or Facebook login to start a room. Running your own server needs someone technical."],
  effort:"Low for internal meetings.",approach:"Move internal meetings first. Keep Zoom or Teams for large external calls and webinars.",stay:"You run webinars or large events, or your funders and partners only use Teams."},
 windows10:{title:"Laptops still on Windows 10",anchor:"/windows-10",replaces:"",reduce:"Windows 10 stopped getting free security updates on 14 October 2025. Paid extended updates cost US$61 per device for the first year, then double each year. Unsupported software also fails Cyber Essentials.",
  options:["Upgrade to Windows 11 if the laptop meets Microsoft's requirements. The PC Health Check app will tell you.","Install Linux Mint: free, open source, supported until 2029, and runs well on older laptops.","Replace the device, refurbished where possible."],
  effort:"Medium. Someone comfortable installing an operating system, for an hour or two per laptop.",approach:"Start with laptops used mainly for web-based work. Back everything up, try Linux Mint from a USB stick first, install with disk encryption on.",stay:"The person relies on Windows-only software, such as a desktop finance package or a screen reader like JAWS. Upgrade or replace those machines instead."}
};
var FAMILY=[
 ["windows10",function(t){return t.lib==="win10";}],
 ["passwords",function(t){return /password/i.test(t.job||"")||/^(lastpass|1password|bitwarden|proton-pass|keepassxc)$/.test(t.lib||"");}],
 ["analytics",function(t){return /analytics/i.test(t.job||"");}],
 ["meetings",function(t){return /video|meeting|calls/i.test(t.job||"")||/^(zoom|microsoft-teams|jitsi-meet)$/.test(t.lib||"");}],
 ["files",function(t){return /shared files|files/i.test(t.job||"")&&!/email/i.test(t.job||"");}],
 ["documents",function(t){return /email, documents|documents/i.test(t.job||"");}]
];
function familyOf(t){for(var i=0;i<FAMILY.length;i++)if(FAMILY[i][1](t))return FAMILY[i][0];return "";}
var DUPS=[["files and documents",function(t){var f=familyOf(t);return f==="files"||f==="documents";}],["newsletter",function(t){return /newsletter/i.test(t.job||"");}],["meetings and chat",function(t){return familyOf(t)==="meetings"||/chat/i.test(t.job||"");}],["website analytics",function(t){return familyOf(t)==="analytics";}],["passwords",function(t){return familyOf(t)==="passwords";}],["donors and supporters (CRM)",function(t){return /donors|supporters|crm/i.test(t.job||"");}],["accounts",function(t){return /accounting|bookkeeping|^accounts?$/i.test((t.job||"").trim());}],["payroll and HR",function(t){return /payroll|\bHR\b|human resources/i.test(t.job||"");}],["forms and surveys",function(t){return /form|survey/i.test(t.job||"");}],["tasks and projects",function(t){return /task|project/i.test(t.job||"");}],["AI writing and summaries",function(t){return t.kind==="AI tool"&&/writing|summar|draft/i.test(t.job||"");}],["donations, payments and tickets",function(t){return /donat|payment|ticket/i.test(t.job||"");}]];
function cardHtml(c,tools){
  return '<div class="card"><h3>'+esc(c.title)+'</h3><p class="small muted">For: '+esc(tools.map(function(t){return t.name;}).join(", "))+(c.replaces?'. Usually replaces '+esc(c.replaces):"")+'</p><dl>'+
    '<dt>Reduce dependency without moving</dt><dd>'+esc(c.reduce)+'</dd>'+
    '<dt>Options if you move</dt><dd><ul>'+c.options.map(function(o){return '<li>'+esc(o)+'</li>';}).join("")+'</ul></dd>'+
    '<dt>Effort</dt><dd>'+esc(c.effort)+'</dd><dt>How to approach it</dt><dd>'+esc(c.approach)+'</dd><dt>When to stay put</dt><dd>'+esc(c.stay)+'</dd></dl>'+
    '<p class="small"><a href="'+GUIDE+c.anchor+'" target="_blank" rel="noopener noreferrer" data-umami-event="guide-visit" data-umami-event-place="card">The full card in the guide<span class="vh"> (opens in a new tab)</span></a></p></div>';
}
function fmtDate(d){if(!d)return "";var x=new Date(d+"T00:00:00");if(isNaN(x))return d;return x.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});}
function daysTo(d){if(!d)return null;var x=new Date(d+"T00:00:00"),n=new Date();n.setHours(0,0,0,0);return Math.round((x-n)/86400000);}
function dueChip(d){var n=daysTo(d);if(n===null)return "";return '<span class="due'+(n<0?" late":n<=30?" soon":"")+'">'+(n<0?"Overdue: ":"By ")+esc(fmtDate(d))+'</span>';}
function comingUp(){
  var items=[];
  state.tools.forEach(function(t){
    if(t.due&&t.next)items.push({d:t.due,what:t.next,tool:t.name,kind:"step",who:ownerName(t)});
    if(t.renewalDate)items.push({d:t.renewalDate,what:"Renewal or notice date",tool:t.name,kind:"renewal",who:ownerName(t)});
  });
  return items.filter(function(i){var n=daysTo(i.d);return n!==null&&n<=90;}).sort(function(a,b){return a.d<b.d?-1:1;});
}
function supplierEmail(t){
  var un=function(v){return !v||v===DK;};
  var all=[["where","In which countries is our data stored and processed, including backups?"],["hq","Which company, in which country, is our contract with, and who is its parent company?"],["terms","Do you have a data processing agreement we can sign or review?"],["sub","Which sub-processors handle our data? Please send the current list."],["exp","Can we export all our data, and in which formats?"],["notice","What notice period and exit charges apply if we leave?"],["signin","Is two-step sign-in (multi-factor authentication) available for all users?"],["ai","Is any of our data used to train AI models, and can we opt out?"]];
  var keep=all.filter(function(q){var f=q[0];if(f==="sub"||f==="notice")return true;if(f==="hq")return !t.hq&&!t.based;return un(t[f]);});
  var narrowed=keep.length<all.length;if(keep.length<=2)keep=all,narrowed=false;
  var L=["Subject: Questions about our data and our "+t.name+" account","","Hello,","","We are reviewing the tools our organisation uses. Could you answer these questions about our "+t.name+" account?",""];
  keep.forEach(function(q,i){L.push((i+1)+". "+q[1]);});
  L.push("","Thank you,","[Name], [Organisation]");
  if(narrowed)L.push("","(This list only includes the questions you answered \"Not sure\" to, plus the two everyone should ask. Record the answers in the register.)");
  return L.join("\n");
}

// ---------- Plain-English reasons ----------
function why(t){
  var w={safety:[],control:[],exit:[],mission:[]};
  if(!answered(t))return w;
  if(safety(t)==="Red")w.safety.push(dev(t)?(devUnsure(t)?"You are not sure the devices are encrypted and still get security updates.":"The devices are not encrypted, or no longer get security updates."):"It holds "+t.data.toLowerCase()+" data, and sign-in is not "+(t.signin===DK?"known to be ":"")+"protected.");
  if(safety(t)==="Amber")w.safety.push("Sign-in is not protected, but it holds no personal data.");
  if(!own(t))w.control.push("Nobody owns it.");
  if(t.account==="Personal"&&!app(t))w.control.push(dev(t)?"They are staff's own devices.":SOLE()?"It is on a personal account.":"It is on someone's personal account.");
  if(oneAdmin(t))w.control.push(app(t)?"Only one person can open the files.":"Only one person can manage it.");
  if(t.admins===DK)w.control.push("You are not sure who can manage it.");
  if(t.where===DK&&!app(t)&&!platform(t))w.control.push("You are not sure where the data is stored.");
  if(control(t)==="Amber"){
    if(platform(t)&&(t.where===DK||!t.where))w.control.push("The platform does not publish where it keeps data.");
    if(personal(t)&&t.terms!=="Yes"&&!dev(t)&&!app(t)&&!platform(t))w.control.push("No data protection terms recorded.");
    if(t.data==="Sensitive"&&(t.where===ELSE||t.based===ELSE))w.control.push("Sensitive data "+(t.where===ELSE?"stored":"with a supplier based")+" outside the UK, EU or EEA. Understand and document it.");
    else if(t.data==="Personal"&&t.where===ELSE)w.control.push("Personal data stored outside the UK, EU or EEA. Understand and document it.");
  }
  var e=exitL(t);
  if(e&&e!=="Green"){
    if(!dev(t)&&!app(t)&&t.exp!=="Yes")w.exit.push(t.exp==="Partial"?"You can only export some of the data.":"You may not be able to get the data out.");
    if(t.copy!=="Yes")w.exit.push("No tested copy of your own"+(t.depend==="Critical"?", and you depend on it.":"."));
  }
  var m=mission(t);
  if(m==="Red"){
    if(t.fits==="No")w.mission.push("It does not fit your "+(ML()==="Mission"?"mission":"values")+".");
    if(t.rights==="Serious concern")w.mission.push("A serious human rights concern.");
    if(t.env==="Serious concern")w.mission.push("A serious environmental concern.");
    if(t.ai==="Yes"&&personal(t))w.mission.push("The supplier trains AI on personal data you hold.");
  }
  return w;
}
var CCY={GBP:"£",EUR:"€",USD:"US$",CAD:"CA$",DKK:"DKK ",SEK:"SEK ",NOK:"NOK ",CHF:"CHF "};
// Not-for-profits only (Paul, 30 Sep): "small or medium business" is no longer offered. Its wording
// (BOARD "team") stays in the code, dormant, so a saved list that uses it still opens.
var ORGS=[["nonprofit","A charity or non-profit"],["cci","A cultural or creative organisation"],["sole","A sole trader or freelancer"]];
var ORGS_ALL=ORGS.concat([["business","A small or medium business"]]);
var LOCS=[["UK","UK"],["EU","Europe"],["CA","Canada"],["US","USA"],["OTHER","Other"]];
function NP(){return state.org==="nonprofit"||state.org==="cci";}
function ML(){return state.org==="nonprofit"?"Mission":"Values";}
function BOARD(){if(SOLE())return "";if(state.org==="business")return "team";return state.org==="nonprofit"&&state.loc==="UK"?"trustees":"board";}
function DATAHINT(){
  var o=state.org;
  if(o==="business"||o==="sole")return "None: nothing about people. Internal: documents about the business, no personal details. Personal: customers, staff, suppliers. Sensitive: payroll, ID documents, health information, anything about children. Public posts only count as Internal.";
  if(o==="cci")return "None: nothing about people. Internal: documents about the organisation, no personal details. Personal: audiences, artists, freelancers, staff. Sensitive: payroll, ID documents, health information, anything about children or young people. Public posts only count as Internal.";
  return "None: nothing about people. Internal: documents about the organisation, no personal details. Personal: supporters, staff, volunteers. Sensitive: safeguarding records, files about the people you support, health, children. Public posts only count as Internal.";
}
function PUBHINT(){
  if(SOLE())return "Would you be comfortable explaining this relationship to your clients?";
  if(state.org==="nonprofit")return "Would your "+(state.loc==="UK"?"trustees or CEO":"board")+" be comfortable explaining this relationship publicly?";
  return "Would your "+(BOARD()==="team"?"team":"board")+" be comfortable explaining this relationship to your customers and staff?";
}
function OUTSIDE_NOTE(){return (state.loc==="CA"||state.loc==="US"||state.loc==="OTHER")?'<p class="note">This check uses UK and EU data protection as its reference. Read "UK, EU or EEA" as "where our own data protection law applies".</p>':"";}
function SYM(){return CCY[state.ccy]||"£";}
function money(n){return SYM()+Number(n||0).toLocaleString("en-GB");}
function TR(){return BOARD()||"records";}
function ACT(a){if(a!=="Trustee decision")return a;return SOLE()?"Your decision":BOARD()==="trustees"?"Trustee decision":BOARD()==="team"?"Team decision":"Board decision";}
// Devices answered "Not sure" (and nothing answered No) are unknown, not failed.
function devUnsure(t){return dev(t)&&t.enc!=="No"&&t.enc!=="Some of them"&&t.upd!=="No"&&(t.enc===DK||t.upd===DK);}
// A red Mission light nobody has approved (register column AD blank) is still a decision to make.
function pendingMission(t){return mission(t)==="Red"&&!(t.approved&&String(t.approved).trim());}
// Tools grouped in the "only one admin" card. Apps on our computers are not: they have no admins.
function soloTools(){return state.tools.filter(function(t){return answered(t)&&t.admins==="One person"&&!app(t);});}
function nextStep(t,skipAdmin){
  var a=action(t),s=[];
  if(a==="Fix now"){
    if(safety(t)==="Red")s.push(dev(t)?(devUnsure(t)?"Check encryption (BitLocker or FileVault) and updates on each device.":"Upgrade, encrypt or replace these devices."):SOLE()?"Switch on two-step sign-in (MFA).":"Switch on two-step sign-in (MFA) for everyone.");
    if(!own(t))s.push("Name an owner.");
    if(oneAdmin(t)&&!(skipAdmin&&!app(t)))s.push(app(t)?"Make sure someone else can open the files"+(t.lib==="keepassxc"?", and knows where the master password is kept.":"."):"Add a second admin.");
    if(t.account==="Personal"&&personal(t)&&!app(t))s.push(dev(t)?"Agree rules for using personal devices for work, or provide work devices.":SOLE()?"Move it to a business account.":"Move the work to an organisation account.");
    return s.join(" ");
  }
  if(a==="Trustee decision")return SOLE()?"Decide whether you accept this "+ML()+" concern, and write down your decision.":"Take the "+ML()+" concern to your "+TR()+". Record who approved the trade-off, or plan a change.";
  if(a==="Review this year"){
    if(exitL(t)==="Red")s.push(dev(t)?"Back up what is on them, and test a restore.":app(t)?"Copy the files somewhere else, and check you can open the copy.":"Keep your own copy of the data, and test that you can restore it.");
    if(control(t)==="Red")s.push(t.where===DK?"Find out where the data is kept. Send the supplier the data questions.":"Sort out who controls the account.");
    return s.join(" ");
  }
  if(a==="Review at renewal")return "Look at whether you still need it before it renews.";
  return "";
}

// ---------- State ----------
var KEY="stackcheck.v5";
// The example is never saved, so looking at it cannot overwrite someone's own list.
function save(){if(!state||state.mode==="example")return;try{var s=state.step===0?Object.assign({},state,{step:RESUME}):state;localStorage.setItem(KEY,JSON.stringify(s));}catch(e){}}
function ownSaved(){var s=load();return s&&s.mode!=="example"&&s.tools&&s.tools.length?s:null;}
function load(){try{var s=JSON.parse(localStorage.getItem(KEY)||"null");if(!s||!s.tools||(s.v!==5&&s.v!==6))return null;if(s.v===5){s.tools.forEach(function(t){if(t.where==="UK or EU")t.where=EU;});s.v=6;}s.journeys=s.journeys||[];cleanKeys(s.tools);migrateDevices(s.tools);return s;}catch(e){return null;}}
function blank(){return {v:6,showLaw:true,org:state?state.org:"nonprofit",loc:state?state.loc:"UK",home:state?state.home:"GB",ccy:state?state.ccy:"GBP",mode:"own",step:1,cur:0,jcur:0,tools:[],journeys:[]};}
var state=null;state=load()||example();
// Every visit starts on the start screen (step 0); Carry on returns to where they were.
var RESUME=state.step>0?state.step:1;state.step=0;


// ---------- Places and the data map ----------
var EU27="AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE".split(" ");
var UKEU={GB:1,EU:1,NO:1,IS:1,LI:1};EU27.forEach(function(c){UKEU[c]=1;});
var PLACE={GB:"United Kingdom",IE:"Ireland",AT:"Austria",BE:"Belgium",BG:"Bulgaria",HR:"Croatia",CY:"Cyprus",CZ:"Czechia",DK:"Denmark",EE:"Estonia",FI:"Finland",FR:"France",DE:"Germany",GR:"Greece",HU:"Hungary",IT:"Italy",LV:"Latvia",LT:"Lithuania",LU:"Luxembourg",MT:"Malta",NL:"Netherlands",PL:"Poland",PT:"Portugal",RO:"Romania",SK:"Slovakia",SI:"Slovenia",ES:"Spain",SE:"Sweden",
  EU:"UK, EU or EEA, country not stated",CH:"Switzerland",NO:"Norway",IS:"Iceland",LI:"Liechtenstein",US:"United States",OTHER:"Elsewhere",UNKNOWN:"Not sure where",OFFICE:"Your office and devices"};
var PLACE_OPTS=["GB","IE"].concat(EU27.filter(function(c){return c!=="IE";}).sort(function(a,b){return PLACE[a].localeCompare(PLACE[b]);}),["EU","CH","NO","IS","LI","US","OTHER"]);
var SITE={"microsoft-365":"LON","microsoft-teams":"LON","microsoft-365-copilot":"LON","hetzner-storage-share":"FAL","plausible-analytics":"FAL","mailbox-org":"BER","typeform":"VA","mattermost-cloud":"VA","matomo-cloud":"FRA","donorfy":"DUB","sage-accounting":"DUB","ticket-tailor":"DUB"};
var SITE_NAME={LON:"London and Cardiff",FAL:"Falkenstein",BER:"Berlin",VA:"Virginia",FRA:"Frankfurt",DUB:"Dublin"};
var SHORT={GB:"UK",US:"US",EU:"UK, EU or EEA"};
// A place's name in lists and tables. "Elsewhere" alone says nothing, so say what is known.
function placeName(c){return c==="OTHER"?"Outside Europe, country not stated":PLACE[c]||c;}
var USX=-153,USY=78;
var MAPS={E:{m:BASEMAP,vb:"-160 0 920 640",w:920,h:640,side:["OTHER","UNKNOWN"],box:{OTHER:[-85,270],UNKNOWN:[-85,390],OFFICE:[-85,510]}}};
function homeCode(){var h=state.home||"GB";return h;}
function officeOnSide(M){var h=homeCode();return !(h==="US"||M.m.points[h]||M.m.cities[h+"_C"]);}
function pickMap(){return MAPS.E;}
function siteOf(t){var l=t&&t.lib&&BYID[t.lib];return l&&SITE[t.lib]&&t.loc===l.loc?SITE[t.lib]:"";}
function ptIn(M,c,site){
  if(c==="OFFICE"){var hc=homeCode();if(hc==="US"){var u=US_INSET.pts.US_C;return [USX+u[0]-18,USY+u[1]+16];}if(officeOnSide(M))return M.box.OFFICE;var h=ptIn(M,hc,"");return [h[0]-30,h[1]-16];}
  if(c==="US"){var u=US_INSET.pts[site==="VA"?"VA":"US_C"];return [USX+u[0],USY+u[1]];}
  if(site&&M.m.cities[site])return M.m.cities[site];
  if(M.m.cities[c+"_C"])return M.m.cities[c+"_C"];
  if(M.box[c])return M.box[c];
  if(c==="LI")return M.m.points.AT; // Liechtenstein is inside the EEA but too small for its own point
  return M.m.points[c]||M.box.OTHER;
}
function placeLabel(M,c,site){
  if(site)return SITE_NAME[site];
  if(c==="OFFICE")return officeOnSide(M)?"":"Your office";
  if(M.box[c])return "";
  return c==="US"?"Place not stated":(SHORT[c]||PLACE[c])+(c==="EU"?", country not stated":", place not stated");
}
function onDevice(t){return dev(t)||app(t);}
function outside(c){return !!c&&!UKEU[c]&&c!=="UNKNOWN"&&c!=="OFFICE";}
function placeOf(t){
  if(!t)return "UNKNOWN";
  if(onDevice(t))return "OFFICE";
  if(t.loc)return t.loc;
  return t.where===EU?"EU":t.where===ELSE?"OTHER":"UNKNOWN";
}
function hqOf(t){if(!t||onDevice(t))return "";return t.hq||(t.based===ELSE?"OTHER":"");}
function lawAway(t){var h=hqOf(t);return h&&!UKEU[h]&&h!==placeOf(t)?h:"";}
function mapBase(M,held,lawTo){
  var s='<rect class="m-sea" x="-160" y="0" width="'+M.w+'" height="'+M.h+'"/><path class="m-land" d="'+M.m.land+'"/>';
  Object.keys(M.m.countries).forEach(function(c){s+='<path class="m-c '+(held[c]?"m-held":UKEU[c]?"m-ukeu":"m-eea")+'" d="'+M.m.countries[c]+'"/>';});
  s+='<rect class="m-side" x="-160" y="0" width="150" height="'+M.h+'"/><text class="m-sidehead" x="-85" y="34" text-anchor="middle">Outside Europe</text>'+
    '<text class="m-boxlabel" x="-85" y="64" text-anchor="middle">United States</text>'+
    '<g transform="translate('+USX+','+USY+')"><path class="m-c '+(held.US?"m-held":"m-eea")+'" d="'+US_INSET.d+'"/></g>'+
    (lawTo&&lawTo.US?'<text class="m-lawlabel" x="-85" y="'+(USY+US_INSET.h+18)+'" text-anchor="middle">supplier\'s home</text>':"");
  M.side.concat(officeOnSide(M)?["OFFICE"]:[]).forEach(function(k){var p=M.box[k];
    s+='<rect class="m-box'+(held[k]?" m-boxheld":"")+(k==="UNKNOWN"?" m-boxunk":"")+'" x="'+(p[0]-66)+'" y="'+(p[1]-44)+'" width="132" height="90" rx="9"/>'+
      '<text class="m-boxlabel" x="'+p[0]+'" y="'+(p[1]-26)+'" text-anchor="middle">'+esc(k==="OTHER"?"Country not stated":k==="OFFICE"?"Your office":PLACE[k])+'</text>'+
      (lawTo&&lawTo[k]?'<text class="m-lawlabel" x="'+p[0]+'" y="'+(p[1]+38)+'" text-anchor="middle">supplier\'s home</text>':"");});
  return s;
}
function labelsFor(M,places){
  var seen={},s="",boxes=[];
  function hit(x,y,w){return boxes.some(function(b){return x<b[0]+b[2]&&x+w>b[0]&&y-12<b[1]&&y>b[1]-12;});}
  places.forEach(function(o){var t=placeLabel(M,o.c,o.site);if(!t)return;var key=t+"|"+Math.round(o.p[0])+","+Math.round(o.p[1]);if(seen[key])return;seen[key]=1;
    var w=t.length*7.2,x0=o.p[0],y0=o.p[1],cands=[[x0+14,y0-10],[x0+14,y0+18],[x0-14-w,y0-10],[x0-14-w,y0+18],[x0+14,y0-26],[x0-14-w,y0+34]];
    var c=cands.find(function(q){return !hit(q[0],q[1],w);})||cands[0];boxes.push([c[0],c[1],w]);
    s+='<text class="m-label" x="'+c[0].toFixed(1)+'" y="'+c[1].toFixed(1)+'">'+esc(t)+'</text>';});
  return s;
}
function curve(a,b){
  if(Math.abs(a[0]-b[0])<1&&Math.abs(a[1]-b[1])<1)return "M"+a[0]+" "+a[1]+" c 18 -30 36 -6 0 0";
  var mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,dx=b[0]-a[0],dy=b[1]-a[1];
  return "M"+a[0].toFixed(1)+" "+a[1].toFixed(1)+" Q"+(mx-dy*.18).toFixed(1)+" "+(my+dx*.18).toFixed(1)+" "+b[0].toFixed(1)+" "+b[1].toFixed(1);
}
function svgWrap(M,inner,label){return '<svg class="map" viewBox="'+M.vb+'" role="img" aria-label="'+esc(label)+'">'+inner+'</svg>';}
function overviewMap(tools){
  var codes=tools.map(placeOf),M=pickMap(codes);
  var by={},held={},law={};
  tools.forEach(function(t){var c=placeOf(t),site=siteOf(t),key=c+"|"+site;(by[key]=by[key]||{c:c,site:site,ts:[]}).ts.push(t);held[c]=1;if(state.showLaw){var h=lawAway(t);if(h)law[h]=(law[h]||[]).concat([t]);}});
  var s=mapBase(M,held,law),lines="",pins="",places=[];
  if(state.showLaw)Object.keys(law).forEach(function(h){law[h].forEach(function(t){lines+='<path class="m-law" d="'+curve(ptIn(M,placeOf(t),siteOf(t)),ptIn(M,h,""))+'"/>';});});
  Object.keys(by).forEach(function(k){var g=by[k],p=ptIn(M,g.c,g.site),n=g.ts.length,sens=g.ts.some(function(t){return t.data==="Sensitive";}),pers=g.ts.some(personal);
    var r=Math.min(9+n*2.2,M.box[g.c]?15:20),y=p[1]+(M.box[g.c]?4:0);places.push({c:g.c,site:g.site,p:[p[0],y]});
    pins+='<g class="m-pin'+(outside(g.c)?" m-out":g.c==="UNKNOWN"?" m-unk":"")+'"><title>'+esc((g.site?SITE_NAME[g.site]:PLACE[g.c])+": "+g.ts.map(function(t){return t.name;}).join(", "))+'</title><circle cx="'+p[0]+'" cy="'+y+'" r="'+r+'"'+(sens?' class="m-sens"':pers?' class="m-pers"':"")+'/><text x="'+p[0]+'" y="'+(y+4)+'" text-anchor="middle">'+n+'</text></g>';});
  s+=lines+pins+labelsFor(M,places);
  return svgWrap(M,s,"Map of where your tools keep data: "+Object.keys(by).map(function(k){return (by[k].site?SITE_NAME[by[k].site]:PLACE[by[k].c])+" "+by[k].ts.length;}).join(", ")+". The table after the map lists each place, its tools, and whose law applies.")+mapTable(by);
}
// The map as a table: every place, the tools there, and the supplier's home
// country where it differs (whose law applies). Everything the map shows.
function mapTable(by){
  var rows=Object.keys(by).map(function(k){var g=by[k];
    var law=g.ts.filter(function(t){return lawAway(t);}).map(function(t){return t.name+": "+placeName(lawAway(t));});
    return '<tr><th scope="row">'+esc(g.site?SITE_NAME[g.site]+", "+placeName(g.c):placeName(g.c))+'</th><td>'+esc(g.ts.map(function(t){return t.name+(t.data==="Sensitive"?" (sensitive data)":personal(t)?" (personal data)":"");}).join(", "))+'</td><td>'+(law.length?esc(law.join("; ")):'<span class="muted">Same country, or not stated</span>')+'</td></tr>';}).join("");
  return '<details class="maptable" open><summary>The map as a table</summary><div class="tablewrap" role="region" aria-label="The map as a table (scrolls sideways)" tabindex="0"><table class="cmp"><thead><tr><th scope="col">Where the data is kept</th><th scope="col">Tools</th><th scope="col">Supplier based elsewhere (whose law applies)</th></tr></thead><tbody>'+rows+'</tbody></table></div></details>';
}
function mapLegend(){
  return '<div class="legend small"><span>Numbers: how many tools keep data there. A dark ring means sensitive data.</span>'+
    '<span><label class="s2 row"><input type="checkbox" id="lawToggle" data-law'+(state.showLaw?" checked":"")+'> Show whose law applies <span class="lg lg-law"></span></label></span></div>';
}
function bindLaw(){view.querySelectorAll("[data-law]").forEach(function(l){l.addEventListener("change",function(){state.showLaw=l.checked;render();var e=document.getElementById(l.id);if(e)e.focus();});});}
// A fact we could not establish is shown as "Unknown", without saying why (Paul, 1 Oct 2026).
function known(v){return v==="Don't know"||v==="unclear"?"Unknown":v;}
function factsPanel(t){
  var l=t.lib&&BYID[t.lib];
  if(!l||!l.src)return t.note?'<p class="note">'+esc(t.note)+'</p>':"";
  var AI={"yes":"Yes, by default","no":"No","depends-on-plan":"Depends on the plan","not-applicable":"Not applicable","unclear":"Unknown"};
  var RES={"yes-default":"Yes, by default","yes-some-plans":"Only on some plans","yes-on-request":"On request","no":"No","unclear":"Unknown"};
  function row(k,v){return v?'<div><dt>'+k+'</dt><dd>'+esc(v)+'</dd></div>':"";}
  return '<p class="note">'+esc(l.note)+'</p><details class="facts"><summary>What we found about '+esc(l.name)+' (checked 29 September 2026)</summary><dl class="factlist">'+
    row("Company",(l.co||"")+(PLACE[l.hq]&&l.hq!=="OTHER"?", "+PLACE[l.hq]:"")+(l.par?". Owned by "+l.par+(PLACE[l.parc]?" ("+PLACE[l.parc]+")":""):""))+
    row("Where data is kept",l.store)+row("UK or EU storage",(RES[l.res]||l.res)+(l.plans?": "+l.plans:""))+
    row("Export",known(l.x))+row("Two-step sign-in (MFA)",known(l.mfa))+row("Trains AI on your data",(AI[l.ai]||l.ai)+(l.aid?". "+l.aid:""))+
    row("Nonprofit offer",l.np)+row("How sure we are",l.conf==="high"?"High: the supplier says so clearly":l.conf==="medium"?"Medium: partly stated, or depends on your plan":"Low: check this yourself")+
    '</dl><p class="small"><b>Sources</b></p><ul class="srcs">'+l.src.map(function(x){return '<li><a href="'+esc(x[1])+'" target="_blank" rel="noopener noreferrer">'+esc(x[0])+'<span class="vh"> (opens in a new tab)</span></a></li>';}).join("")+'</ul></details>';
}
function placeSelect(field,t,label,hint){
  return '<div class="field"><label for="'+field+'-'+esc(t.key)+'">'+label+'</label><select id="'+field+'-'+esc(t.key)+'"><option value="">Not sure</option>'+
    PLACE_OPTS.map(function(c){return '<option value="'+c+'"'+(t[field]===c?" selected":"")+'>'+esc(PLACE[c])+'</option>';}).join("")+'</select>'+(hint?'<span class="small muted">'+hint+'</span>':"")+'</div>';
}

// ---------- Rendering helpers ----------
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
var SHAPE={Green:'<svg viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="5"/></svg>',
  Amber:'<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 0 10 10H0z"/></svg>',
  Red:'<svg viewBox="0 0 10 10" aria-hidden="true"><rect width="10" height="10"/></svg>'};
function light(v,label){
  if(!v)return '<span class="light n">'+(label?esc(label)+": ":"")+'not answered</span>';
  if(v==="Not checked")return '<span class="light n">'+(label?esc(label)+": ":"")+'not checked</span>';
  var c=v==="Green"?"g":v==="Amber"?"a":"r";
  return '<span class="light '+c+'" title="'+esc((label?label+": ":"")+v)+'">'+SHAPE[v]+(label?esc(label)+" ":"")+esc(v)+'</span>';
}
function bare(v,label){ // light without label, for tables
  if(!v)return '<span class="light n">–</span>';
  if(v==="Not checked")return '<span class="light n">Not checked</span>';
  var c=v==="Green"?"g":v==="Amber"?"a":"r";
  return '<span class="light '+c+'" title="'+esc(label+": "+v)+'">'+SHAPE[v]+esc(v)+'</span>';
}
// A light in the register's Lights column: the shape and colour, the light's name, and the value for screen readers.
function mini(v,label){
  var c=!v||v==="Not checked"?"n":v==="Green"?"g":v==="Amber"?"a":"r";
  var val=!v?"not answered":v==="Not checked"?"not checked":v;
  return '<span class="light '+c+'" title="'+esc(label+": "+val)+'">'+(SHAPE[v]||"")+esc(label)+'<span class="vh">: '+esc(val)+'</span></span>';
}
function radios(name,options,val,labels){
  return '<div class="opts">'+options.map(function(o,i){var id=name+"-"+i;
    return '<label class="opt" for="'+id+'"><input type="radio" id="'+id+'" name="'+name+'" value="'+esc(o)+'"'+(val===o?" checked":"")+'><span>'+esc(labels&&labels[i]?labels[i]:o)+'</span></label>';}).join("")+'</div>';
}
function q(field,t,legend,hint,labels){
  var hid="hint-"+field+"-"+t.key;
  return '<fieldset class="q"'+(hint?' aria-describedby="'+hid+'"':"")+'><legend>'+legend+'</legend>'+radios(field+"-"+t.key,OPT[field],t[field],labels)+(hint?'<span class="hint" id="'+hid+'">'+hint+'</span>':"")+'</fieldset>';
}
function txt(field,t,label,hint,ph,type){
  return '<div class="field"><label for="'+field+'-'+esc(t.key)+'">'+label+'</label><input type="'+(type||"text")+'" id="'+field+'-'+esc(t.key)+'" value="'+esc(t[field])+'"'+(ph?' placeholder="'+esc(ph)+'"':"")+(type==="number"?' min="0" step="1" inputmode="numeric"':"")+'>'+(hint?'<span class="small muted">'+hint+'</span>':"")+'</div>';
}
var view=document.getElementById("view");

// Essentials for the tick in step 2 (24a decision 13). Scoring still uses answered().
// Devices answer two plain questions (Paul, 29 Sep: the combined one was too hard). The register's
// single "Sign-in protected" column is Yes only when both are yes, No when either is no or only some.
// Saved answers from before the split: a Yes or Not sure carries over to both questions. A No
// cannot say which part failed, so both stay unanswered and the red light stays until answered.
function migrateDevices(tools){(tools||[]).forEach(function(t){if(t.kind==="Devices"&&!t.enc&&!t.upd&&(t.signin==="Yes"||t.signin==="Don't know")){t.enc=t.signin;t.upd=t.signin;}});}
function deviceSignin(t){var e=t.enc,u=t.upd;
  if(e==="No"||e==="Some of them"||u==="No")return "No";
  if(e==="Yes"&&u==="Yes")return "Yes";
  if(e&&u)return "Don't know";
  return "";}
// An app on our computers has no account to ask about (register v2.2).
function essentialsDone(t){return answered(t)&&!!t.signin&&!!t.copy&&(dev(t)||((app(t)||!!t.account)&&!!t.admins))&&!!t.depend;}
function stepCounts(){var n=state.tools.length,a=state.tools.filter(essentialsDone).length;
  var s1=document.querySelector("#nav1 .sub"),s2=document.querySelector("#nav2 .sub");
  if(s1)s1.textContent=n?n+" tool"+(n===1?"":"s")+" chosen":"Tick what you use";
  if(s2)s2.textContent=n?a+" of "+n+" answered":"For each tool";}
function renderStart(){
  var own=state.mode!=="example"&&state.tools.length?state:ownSaved(),n=own?own.tools.length:0,a=own?own.tools.filter(essentialsDone).length:0;
  var h='<section class="panel stack" aria-labelledby="startH"><h2 id="startH">'+(own?"Welcome back":"Start here")+'</h2>'+
    (own?'<p><b>'+a+' of '+n+' tool'+(n===1?"":"s")+' answered</b> in this browser.</p><div class="row"><button type="button" class="btn primary" id="carryOn">Carry on where you left off</button></div>':'')+
    '<p>List every tool your organisation uses, see where your data goes, and get a recommendation on what to do. The essentials take about 2 minutes a tool, so 9 tools take about 30 minutes. You can stop and carry on later.</p>'+
    '<ol class="startsteps"><li><b>List your tools.</b> Tick what you use.</li><li><b>Answer the questions,</b> one tool at a time.</li><li><b>Decide:</b> five lights and what to do, ready to take to your '+(BOARD()||"records")+'.</li><li><b>Your data:</b> where it lives.</li></ol>'+
    '<div class="row">'+(own?'<button type="button" class="btn" id="startNew" data-umami-event="start-own" data-umami-event-place="start-new-list">Start a new list</button>':'<button type="button" class="btn primary" id="startNew" data-umami-event="start-own" data-umami-event-place="start">Start your own</button>')+
    '<button type="button" class="btn" id="seeExample">See the example</button><input type="file" id="openFile0" class="vh" accept=".json,application/json"><label class="btn" for="openFile0">Open a saved file</label><span id="fileStatus" class="toast" role="status" aria-live="polite"></span></div>'+
    '<p class="small muted">Prefer to work offline, or in a spreadsheet? The same check as a register template: '+DOWNLOADS+'.</p></section>';
  view.innerHTML=h;
  var co=document.getElementById("carryOn");if(co)co.addEventListener("click",function(){state=own;RESUME=own.step>0?own.step:RESUME;go(RESUME);});
  document.getElementById("startNew").addEventListener("click",function(){if(own){document.getElementById("confirmClear").hidden=false;document.getElementById("clearNo").focus();}else{state=blank();state.mode="own";go(1);}});
  document.getElementById("seeExample").addEventListener("click",function(){state=example();go(3);});
  bindOpenFile(document.getElementById("openFile0"),document.getElementById("fileStatus"));
}
function render(){
  document.getElementById("exampleBanner").hidden=state.mode!=="example"||state.step===0;
  var own=state.mode==="example"&&ownSaved(),sb=document.getElementById("startOwn");if(sb)sb.textContent=own?"Back to your list":"Start your own";
  // 3. The privacy box is one line after step 1 (Paul, 29 Sep): the claims row 28 sentence only.
  var top=document.querySelector("header.top");if(top)top.classList.toggle("compact",state.step>=2);
  stepCounts();
  [1,2,3,4].forEach(function(n){var b=document.getElementById("nav"+n);if(state.step===n)b.setAttribute("aria-current","step");else b.removeAttribute("aria-current");});
  if(state.step===0)renderStart();else if(state.step===1)renderPick();else if(state.step===2)renderAsk();else if(state.step===3)renderResults();else renderJourneys();
  stepTitle();
  save();
}
// The example is read-only (Paul, 29 Sep): changes are stopped before they happen (see exampleGuard),
// so nothing here turns the example into someone's own list.
function leaveExample(){}

// ---------- Step 1 ----------
var ASK="Quick question for everyone: what tools are you using for work?\n\nInclude free apps, AI tools such as ChatGPT or note-takers, WhatsApp groups, anything on your own phone or laptop, and anything you signed up for yourself.\n\nThere are no wrong answers. We just want to know what we have.";
function renderPick(){
  var chosen={};state.tools.forEach(function(t){if(t.lib)chosen[t.lib]=true;});
  var customs=state.tools.filter(function(t){return !t.lib;});
  var euOpts=PLACE_OPTS.filter(function(c){return c!=="GB"&&c!=="US"&&c!=="OTHER";});
  var h='<section class="panel stack" aria-labelledby="orgH"><h2 id="orgH">Who is this for?</h2>'+
    '<fieldset class="q"><legend class="vh">Who is this for?</legend>'+radios("org",ORGS.map(function(o){return o[0];}),state.org,ORGS.map(function(o){return o[1];}))+'</fieldset>'+
    '<p class="small muted">This changes the words, such as "trustees" or "board". The scoring is the same'+(SOLE()?', except that being the only admin is treated as normal and handled as one item':'')+'.</p>'+
    '<fieldset class="q"><legend>Where are you based?</legend>'+radios("loc",LOCS.map(function(o){return o[0];}),state.loc||"UK",LOCS.map(function(o){return o[1];}))+'</fieldset>'+
    (state.loc==="EU"?'<div class="s3 field"><label for="home">Which country? (for the map)</label><select id="home">'+euOpts.map(function(c){return '<option value="'+c+'"'+((state.home||"EU")===c?" selected":"")+'>'+esc(PLACE[c])+'</option>';}).join("")+'</select></div>':"")+
    OUTSIDE_NOTE()+
    '<div class="s3 field"><label for="ccy">Currency for costs</label><select id="ccy">'+[["GBP","Pound sterling (£)"],["EUR","Euro (€)"],["USD","US dollar (US$)"],["CAD","Canadian dollar (CA$)"],["DKK","Danish krone (DKK)"],["SEK","Swedish krona (SEK)"],["NOK","Norwegian krone (NOK)"],["CHF","Swiss franc (CHF)"]].map(function(o){return '<option value="'+o[0]+'"'+((state.ccy||"GBP")===o[0]?" selected":"")+'>'+o[1]+'</option>';}).join("")+'</select><span class="small muted">Use one currency for the whole register. The check does not convert between currencies.</span></div></section>'+
    '<section class="panel stack" aria-labelledby="fileH"><h2 id="fileH">Are you returning?</h2><p class="small muted">If you or a colleague previously saved your answers to a file, open it here.</p><div class="row"><input type="file" id="openFile1" class="vh" accept=".json,application/json"><label class="btn" for="openFile1">Open a saved file</label><span id="fileStatus" class="toast" role="status" aria-live="polite"></span></div></section>';
  h+='<section class="panel stack" aria-labelledby="askTeamH"><div class="s4 stack"><h2 id="askTeamH">Before you start, ask your team</h2><p class="muted">Ask "What tools are you using for work?", not "What software does the organisation use?" People will always find tools to get their work done. Copy this message and send it round.</p></div>'+
    '<div class="askbox">'+esc(ASK)+'</div><div class="row"><button type="button" class="btn" id="copyAsk">Copy the message</button><span id="copied" class="toast" role="status" aria-live="polite"></span></div><textarea id="copyArea" class="copyout" readonly aria-label="Copied text" hidden></textarea></section>';
  h+='<section class="panel stack" aria-labelledby="pickH"><div class="s5 stack"><h2 id="pickH">List every service</h2><p class="muted">Include the free ones, AI tools, online banking, and your laptops. It takes about 2 minutes per tool to complete. You can always return and add more detail later.</p></div>'+
    '<div class="s6 field"><label for="findTool">Find a tool</label><input type="search" id="findTool" placeholder="Type to filter the list" autocomplete="off" value="'+esc(state.findQ||"")+'"><span id="findNone" class="small muted" role="status" aria-live="polite"></span></div><p id="pickCount" class="small" role="status" aria-live="polite"></p><div class="groups">';
  LIB.forEach(function(g){
    var extra=g.items.filter(function(t){return SEARCH_ONLY[t.id];});
    h+='<div class="group"><h3>'+esc(g.g)+'</h3><div class="chips">';
    g.items.forEach(function(t){h+='<button type="button" class="chip"'+(SEARCH_ONLY[t.id]?' data-more="1"'+(chosen[t.id]?"":" hidden"):"")+' data-find="'+esc((t.name+" "+(t.job||"")+" "+(ALIASES[t.id]||"")).toLowerCase())+'" data-lib="'+t.id+'" aria-pressed="'+(chosen[t.id]?"true":"false")+'"><span class="tick" aria-hidden="true">✓</span>'+esc(t.name)+'</button>';});
    h+='</div>'+(extra.length?'<p class="small muted groupmore">Also in the list: '+esc(extra.map(function(t){return t.name.replace(/ \(.*\)$/,"");}).join(", "))+'. Type a name in Find a tool.</p>':"")+'</div>';
  });
  h+='</div><div class="s7 stack"><h3>Something not on the list?</h3>'+
     '<div class="addrow"><div class="field"><label for="newName">Tool name</label><input type="text" id="newName" placeholder="For example: JustGiving"><span id="newNameErr" class="small err" role="status"></span></div>'+
     '<div class="field"><label for="newJob">The job it does</label><input type="text" id="newJob" placeholder="For example: online donations"></div>'+
     '<div class="s8 field"><button type="button" class="btn" id="addTool">Add tool</button></div></div>';
  if(customs.length)h+='<div class="chips">'+customs.map(function(t){return '<span class="s9 chip">'+esc(t.name)+' <button type="button" class="s10 btn ghost small" data-remove="'+esc(t.key)+'" aria-label="Remove '+esc(t.name)+'">Remove</button></span>';}).join("")+'</div>';
  h+='</div></section><div class="navrow"><span class="muted small">'+state.tools.length+' tools listed</span><button type="button" class="btn primary" id="toAsk"'+(state.tools.length?"":" disabled")+'>Next: answer the questions</button></div>';
  view.innerHTML=h+(state.tools.length?SAVE_ROW:"");
  bindSaveRow();
  bindOpenFile(document.getElementById("openFile1"),document.getElementById("fileStatus"));
  document.getElementById("ccy").addEventListener("change",function(e){state.ccy=e.target.value;save();});
  var hm=document.getElementById("home");if(hm)hm.addEventListener("change",function(e){state.home=e.target.value;save();});
  view.querySelectorAll('input[name="org"]').forEach(function(r){r.addEventListener("change",function(){state.org=r.value;save();render();var e=document.getElementById(r.id);if(e)e.focus();});});
  view.querySelectorAll('input[name="loc"]').forEach(function(r){r.addEventListener("change",function(){state.loc=r.value;
    state.home=r.value==="UK"?"GB":r.value==="EU"?(state.home&&PLACE[state.home]&&state.home!=="GB"&&state.home!=="US"?state.home:"EU"):r.value;
    state.ccy={UK:"GBP",EU:"EUR",CA:"CAD",US:"USD"}[r.value]||state.ccy;save();render();var e=document.getElementById(r.id);if(e)e.focus();});});
  var ft=document.getElementById("findTool");
  function filterTools(){var qv=ft.value.trim().toLowerCase(),hits=0;state.findQ=ft.value;
    view.querySelectorAll(".group").forEach(function(g){var any=false;g.querySelectorAll("[data-lib]").forEach(function(c){var show=qv?c.dataset.find.indexOf(qv)>=0:(!c.dataset.more||c.getAttribute("aria-pressed")==="true");c.hidden=!show;if(show){any=true;hits++;}});g.hidden=!any;var gm=g.querySelector(".groupmore");if(gm)gm.hidden=!!qv;});
    var none=document.getElementById("findNone");none.textContent=qv&&!hits?'Nothing called "'+ft.value.trim()+'" in the list. Add it under "Something not on the list?" below.':"";
    if(qv&&!hits){var nn=document.getElementById("newName");if(nn&&!nn.value)nn.value=ft.value.trim();}}
  ft.addEventListener("input",filterTools);if(ft.value)filterTools();
  document.getElementById("copyAsk").addEventListener("click",function(){copy(ASK);});
  view.querySelectorAll("[data-lib]").forEach(function(b){b.addEventListener("click",function(){
    var id=b.dataset.lib,idx=state.tools.findIndex(function(t){return t.lib===id;});
    if(idx>=0)state.tools.splice(idx,1);else state.tools.push(fromLib(BYID[id]));
    leaveExample();state.cur=0;render();
    var again=view.querySelector('[data-lib="'+id+'"]');if(again)again.focus();
    var pc=document.getElementById("pickCount");if(pc)pc.textContent=(idx>=0?"Removed ":"Added ")+BYID[id].name+". "+state.tools.length+" tool"+(state.tools.length===1?"":"s")+" chosen.";
  });});
  view.querySelectorAll("[data-remove]").forEach(function(b){b.addEventListener("click",function(){
    state.tools=state.tools.filter(function(t){return t.key!==b.dataset.remove;});render();document.getElementById("newName").focus();});});
  document.getElementById("addTool").addEventListener("click",function(){
    var n=document.getElementById("newName").value.trim(),nm=document.getElementById("newName");if(!n){nm.setAttribute("aria-invalid","true");nm.setAttribute("aria-describedby","newNameErr");var er=document.getElementById("newNameErr");if(er)er.textContent="Type the tool's name first.";nm.focus();return;}
    state.tools.push(fromLib({name:n,job:document.getElementById("newJob").value.trim()}));leaveExample();render();document.getElementById("newName").focus();
  });
  document.getElementById("toAsk").addEventListener("click",function(){go(2);});
}

// ---------- Step 2 ----------
function pdotLabel(x){return (essentialsDone(x)?'<span aria-hidden="true">✓ </span><span class="vh">Answered: </span>':"")+esc(x.name);}
function lightsRow(t){
  var a=action(t);
  return '<span class="muted">So far:</span>'+light(safety(t),"Safety")+light(control(t),"Control")+light(exitL(t),"Exit")+light(t.value,"Value")+light(mission(t),ML())+
    (a?'<span class="small"><b>Suggested: '+esc(ACT(a))+'</b></span>':"");
}
function whyList(t){
  var w=why(t),all=[].concat(w.safety,w.control,w.exit,w.mission);
  return all.length?'<ul class="why">'+all.map(function(x){return '<li>'+esc(x)+'</li>';}).join("")+'</ul>':"";
}
function renderAsk(){
  if(!state.tools.length){go(1);return;}
  if(state.cur>=state.tools.length)state.cur=state.tools.length-1;
  var t=state.tools[state.cur],i=state.cur,n=state.tools.length,k=t.key,d=dev(t);
  var h='<ul class="progress" aria-label="Your tools">'+state.tools.map(function(x,j){
    return '<li><button type="button" class="pdot'+(essentialsDone(x)?" done":"")+'" data-jump="'+j+'"'+(j===i?' aria-current="true"':"")+'>'+pdotLabel(x)+'</button></li>';}).join("")+'</ul>';
  h+='<section class="panel stack" aria-labelledby="askH"><div class="cardhead"><h2 id="askH">'+esc(t.name)+'</h2><span class="muted small">Tool '+(i+1)+' of '+n+'. '+state.tools.filter(essentialsDone).length+' answered, '+(n-state.tools.filter(essentialsDone).length)+' to go.</span></div>';
  h+=factsPanel(t)+'<p id="askStatus" class="vh" role="status" aria-live="polite"></p>';
  // The essentials
  var sole=SOLE(),loc=app(t),plat=platform(t),records=!!(t.lib&&BYID[t.lib]&&BYID[t.lib].group==="Money");
  h+='<div class="sect"><h3>The essentials</h3><div class="qgrid">'+
    txt("job",t,"The job it does","Writing down the job makes duplicates obvious.","For example: shared files")+
    q("kind",t,"Kind","App on our computers: software with no online account, such as GIMP or KeePassXC. Account on a platform: a page or account on a service such as Facebook, LinkedIn, X or Bluesky.")+
    txt("owner",t,"The owner",sole?"Usually you. Write \"Me\" if so.":"A named role, not a team. If nobody owns it, leave it blank.",sole?"Me":"For example: Office manager")+
    (loc?"":q("account",t,"Account",plat?"Is the page or account owned by the "+(sole?"business":"organisation")+" (for example in a Business Portfolio), not tied to one person's own profile?":sole?"Is it a business account, or a personal one you also use for work?":"Is it an organisation account, or someone's personal account?",sole?["Business","Personal"]:null))+
    q("admins",t,sole?"Can anyone else get in?":"Admins",loc?"If the person who uses it left, could someone else open the files"+(t.lib==="keepassxc"?" and the password file (they need the master password)":"")+"? If so, answer "+(sole?"Yes, someone else can":"Two or more")+".":plat?(sole?"If you were ill for a month, could someone you trust get full control of it?":"Can two or more people get full control of the page or account?"):sole?"If you were ill for a month, could someone you trust get into it?":"Can two or more people manage it?",sole?["Yes, someone else can","Only me","Not sure"]:["Two or more","One person","Not sure"])+
    q("depend",t,"How much do you depend on it?","Critical: you would struggle to work for a week without it.")+
    q("data",t,"What data or content do you store in this tool?",DATAHINT())+
    (d?q("enc",t,"If one is lost or stolen, is the information on it locked?","This is called encryption. On Windows look for BitLocker or Device encryption in Settings; on a Mac, FileVault. Not sure? Ask whoever set them up.",["Yes, all of them","Only some","No","Not sure"])+
       q("upd",t,"Do they still get security updates?","Windows 10 stopped getting free security updates in October 2025. Windows 11, and recent Mac, iPhone and Android versions, still get them.",["Yes","No","Not sure"])
      :q("signin",t,"Two-step sign-in on for everyone?","Two-step sign-in (also called MFA or 2FA) asks for a code from a phone app, a text message or a security key as well as the password. \"Not offered\" means the tool has no two-step sign-in at all.",["Yes","No","Not offered","Not sure"]))+
    q("copy",t,"Do you have a backup of this data?",records?"Do you download and keep your own records (such as statements, Gift Aid schedules or payslips) somewhere else, and have you checked you can open them? If so, answer Yes.":loc?"Are the files copied somewhere else, such as a backup drive or shared folder, and have you checked you can open the copy?":'Do you hold a recent copy of the data separately, and have you tried restoring from it? "The supplier backs it up" only counts if you know how to get it back.',["Yes, tested","No","Not sure"])+
    '</div>';
  if(personal(t))h+='<div class="pause" role="note"><b>If it holds personal data, pause.</b><span>Some information can cause real damage or harm if it is lost or leaked. Are we comfortable putting personal information here? You need a written contract with the supplier, and you may need a data protection impact assessment (DPIA).</span></div>';
  h+='</div>';
  // More detail
  var hasDetail=!!(t.cost||t.hours||t.renewal||t.users);
  h+='<details class="facts"'+((!t.lib||hasDetail)?" open":"")+'><summary>More detail (optional: cost, renewal, where the data is, export)</summary><div class="s11 stack">'+
    '<div class="qgrid">'+
    txt("users",t,"How many people use it (optional)","","0","number")+
    txt("cost",t,"Cost per year: licence, fees or charges ("+SYM()+", optional)","Currency is set in step 1.","0","number")+
    txt("hours",t,"Hours a month spent running it or working around it (optional)","","0","number")+
    txt("renewal",t,"Renewal or notice (optional)","A decision is cheapest just before renewal.","For example: Annual, April")+
    '<div class="field"><label for="renewalDate-'+esc(t.key)+'">Next renewal date (optional)</label><input type="date" id="renewalDate-'+esc(t.key)+'" value="'+esc(t.renewalDate)+'"><span class="small muted">Used for the "Coming up" list on the results page.</span></div>'+
    '</div>';
  if(loc)h+='<div class="sect"><h3>Control</h3><p class="small muted">An app on your computers has no supplier holding your data, so where it is kept, the supplier and data protection terms are not asked.</p><div class="qgrid">'+
      q("open",t,"Open source?","Record it, but do not treat it as proof that a tool is safer. It matters mainly because open-source tools can be moved to another provider.")+'</div></div>';
  else if(!d){
    h+='<div class="sect"><h3>Control'+(t.lib?' <span class="s12 muted">(some answers pre-filled, check them)</span>':"")+'</h3>'+OUTSIDE_NOTE()+'<div class="qgrid">'+
      q("where",t,"Where is the data kept?",(plat?"Most platforms do not say. If you cannot find it, answer Not sure: for an account on a platform that gives amber, not red. ":"")+"Check the supplier's privacy page or trust centre. If you cannot find it, ask them. The EEA is the EU plus Norway, Iceland and Liechtenstein, where GDPR applies. Switzerland counts as Elsewhere: transfers there are lawful under adequacy decisions, but it is outside the EEA.",["UK, EU or EEA","Elsewhere","Not sure"])+
      q("based",t,"Where is the supplier based?","Control is not about where a company is based. It is about whether you understand and manage the relationship.",["UK or Europe","Elsewhere"])+
      q("terms",t,"Data protection terms in place?",plat?"Not needed for an account on a platform. Record it if you have them.":"A contract or data processing agreement that says what the supplier may do with your data.",["Yes","No","Not sure"])+
      q("open",t,"Open source?","Record it, but do not treat it as proof that a tool is safer. It matters mainly because open-source tools can be moved to another provider.")+
      placeSelect("loc",t,"Which country is the data in? (for the map)","Only used for the map. The lights use the answer above.")+
      placeSelect("hq",t,"Supplier's home country (for the map)","Its own law still applies, wherever the data sits.")+
      '</div></div>';
    h+='<div class="sect"><h3>Exit</h3><div class="qgrid">'+
      q("exp",t,"Full export?","Can you get all your data out in a standard format, such as CSV, ODF, iCal or vCard?",["Yes","Some of it","No","Not sure"])+
      '</div></div>';
  }
  h+='</div></details>';
  if(!d&&(loc||plat||(t.lib&&NO_EMAIL[t.lib])))h+='<p class="small muted">'+(loc?"There is no supplier holding your data, so there is nothing to ask. The note above says what to check.":"This organisation does not usually answer individual data questions. The note above says what you can check yourself.")+'</p>';
  else if(!d)h+='<div class="s13 row small"><button type="button" class="btn" id="askSupplier">Copy an email to ask the supplier</button><span class="muted">Only the questions you are not sure about, plus notice period and sub-processors.</span><span id="copied" class="toast" role="status" aria-live="polite"></span></div><textarea id="copyArea" class="copyout" readonly aria-label="Copied text" hidden></textarea>';
  // Value
  h+='<div class="sect"><h3>Value (you judge)</h3>'+q("value",t,"Is it worth the money and staff time?","",["Used, and worth it","Overlaps, or the cost keeps rising","Unused, or unaffordable"])+'</div>';
  // Mission
  var nm=["ai","rights","env","fits"].filter(function(f){return t[f];}).length;
  h+='<details class="facts"'+(nm?" open":"")+'><summary id="missionSum">'+ML()+' check (optional, '+nm+' of 4 answered)</summary><div class="s14 qgrid">'+
    q("ai",t,"Does the supplier use our data to train AI?","Check its privacy or AI page. Ask this of every supplier, not only AI companies."+(t.lib&&BYID[t.lib]&&BYID[t.lib].ai?' <b>Our research: '+esc({"yes":"yes, by default","no":"no","depends-on-plan":"it depends on the plan","not-applicable":"not applicable","unclear":"unknown"}[BYID[t.lib].ai]||BYID[t.lib].ai)+'.</b> See "What we found" above.':""))+
    q("rights",t,"Are there human rights concerns?",'Could this supplier or technology contribute to harm to people, for example through surveillance, discrimination, exploitation of workers, or targeting vulnerable groups? The <a href="https://www.business-humanrights.org" target="_blank" rel="noopener noreferrer">Business and Human Rights Resource Centre<span class="vh"> (opens in a new tab)</span></a> is a good place to look.')+
    q("env",t,"Are there environmental concerns?","Consider energy use and data-centre claims, AI compute, duplicate tools doing the same job, and how long your devices last.")+
    q("fits",t,NP()?"Does it fit our mission and values?":"Does it fit our values?",PUBHINT())+
    txt("approved",t,"Who approved the trade-off?","Write down who accepted it, and when.","For example: Chair, June 2026")+
    '</div></details>';
  h+='<div class="s5 stack"><div class="row small" id="lightsRow">'+lightsRow(t)+'</div><div id="whyBox">'+whyList(t)+'</div></div>';
  h+='</section><div class="navrow"><button type="button" class="btn" id="prevT">'+(i===0?"Back to the list":"Previous tool")+'</button><span class="row">'+(i<n-1?'<button type="button" class="btn ghost" id="toResults">See what to do now</button>':"")+'<button type="button" class="btn primary" id="nextT">'+(i===n-1?"See what to do":"Next tool")+'</button></span></div>'+SAVE_ROW;
  view.innerHTML=h;
  var rerender={kind:1,data:1};
  Object.keys(OPT).forEach(function(f){view.querySelectorAll('input[name="'+f+'-'+k+'"]').forEach(function(r){r.addEventListener("change",function(){
    t[f]=r.value;leaveExample();
    if(f==="enc"||f==="upd")t.signin=deviceSignin(t);
    if(f==="where"&&t.loc&&(r.value===DK||(r.value===EU)!==!!UKEU[t.loc])){t.loc="";var ls=document.getElementById("loc-"+k);if(ls)ls.value="";}
    if(rerender[f]){render();var e=document.getElementById(r.id);if(e)e.focus();
      if(f==="kind"){var st=document.getElementById("askStatus");if(st)st.textContent="Questions changed for "+r.value+": "+view.querySelectorAll("fieldset.q").length+" questions now.";}}else partial();});});});
  ["job","owner","renewal","approved"].forEach(function(f){var e=document.getElementById(f+"-"+k);e.addEventListener("input",function(){t[f]=e.value;leaveExample();partial();});});
  ["loc","hq","renewalDate"].forEach(function(f){var e=document.getElementById(f+"-"+k);if(e)e.addEventListener("change",function(){t[f]=e.value;leaveExample();save();});});
  var asks=document.getElementById("askSupplier");if(asks)asks.addEventListener("click",function(){copy(supplierEmail(t));});
  ["cost","hours","users"].forEach(function(f){var e=document.getElementById(f+"-"+k);if(e)e.addEventListener("input",function(){t[f]=e.value===""?"":Math.max(0,Number(e.value)||0);leaveExample();save();});});
  view.querySelectorAll("[data-jump]").forEach(function(b){b.addEventListener("click",function(){state.cur=+b.dataset.jump;render();focusHeading("#askH");});});
  document.getElementById("prevT").addEventListener("click",function(){if(i===0)go(1);else{state.cur--;render();window.scrollTo({top:0});focusHeading("#askH");}});
  var tr=document.getElementById("toResults");if(tr)tr.addEventListener("click",function(){go(3);});
  bindSaveRow();
  document.getElementById("nextT").addEventListener("click",function(){if(i===n-1)go(3);else{state.cur++;render();window.scrollTo({top:0});focusHeading("#askH");}});
  function partial(){
    document.getElementById("lightsRow").innerHTML=lightsRow(t);
    document.getElementById("whyBox").innerHTML=whyList(t);
    var sm=document.getElementById("missionSum");if(sm)sm.textContent=ML()+" check (optional, "+["ai","rights","env","fits"].filter(function(f){return t[f];}).length+" of 4 answered)";
    var dot=view.querySelector('[data-jump="'+i+'"]');if(dot){dot.classList.toggle("done",essentialsDone(t));dot.innerHTML=pdotLabel(t);}stepCounts();
    save();
  }
}

// ---------- Step 3 ----------
var ORDER=[["Fix now","now","Fix now"],["Trustee decision","dec","Decide"],["Review this year","year","This year"],["Review at renewal","ren","At renewal"]];
function renderResults(){
  var ts=state.tools,done=ts.filter(answered);
  function by(a){return done.filter(function(t){return action(t)===a;});}
  var fix=by("Fix now"),dec=by("Trustee decision"),year=by("Review this year"),later=fix.filter(pendingMission);
  var pers=done.filter(personal).length,crit=done.filter(function(t){return t.depend==="Critical";}).length;
  var cost=ts.reduce(function(s,t){return s+(Number(t.cost)||0);},0);
  var h='';
  if(done.length<ts.length)h+='<div class="banner" role="status"><span>'+(ts.length-done.length)+' of '+ts.length+' tools are not answered yet, so they are not scored.</span><button type="button" class="btn" id="finish">Answer them</button></div>';
  h+='<div class="tiles">'+
   '<div class="tile"><span class="eyebrow">Tools</span><span class="num">'+ts.length+'</span><span class="small muted">'+(cost>0?money(cost)+' a year listed':'No costs entered')+'</span></div>'+
   '<div class="tile"><span class="eyebrow">Personal data</span><span class="num">'+pers+'</span><span class="small muted">tools hold this data</span></div>'+
   '<div class="tile'+(fix.length?" alert":"")+'"><span class="eyebrow">Fix now</span><span class="num">'+fix.length+'</span></div>'+
   '<div class="tile'+(dec.length||later.length?" warn":"")+'"><span class="eyebrow">'+esc(ACT("Trustee decision"))+'</span><span class="num">'+dec.length+'</span><span class="small muted">'+ML()+' concerns'+(later.length?', and '+later.length+' more after a fix':'')+'</span></div>'+
   '<div class="tile'+(year.length?" warn":"")+'"><span class="eyebrow">Review this year</span><span class="num">'+year.length+'</span><span class="small muted">personal or critical actions</span></div></div>';
  var solo=soloTools(),grouped=solo.length>=(SOLE()?1:2);
  function adminOnly(t){return action(t)==="Fix now"&&safety(t)!=="Red"&&own(t)&&!(t.account==="Personal"&&personal(t))&&oneAdmin(t)&&!app(t);}
  // A tool shown only in the group card keeps its Mission concern visible there.
  var cardMission=grouped?solo.filter(function(t){return adminOnly(t)&&pendingMission(t);}):[];
  var pri=[];ORDER.forEach(function(o){by(o[0]).forEach(function(t){if(grouped&&adminOnly(t))return;pri.push({t:t,c:o[1],w:o[2]});});});
  var groupCard=grouped?'<li><span class="when '+(SOLE()?"year":"now")+'">'+(SOLE()?"Plan for it":"Fix now")+'</span><div class="s15 stack"><h3>'+(SOLE()?"You are the only person who can get into "+solo.length+" tool"+(solo.length===1?"":"s"):solo.length+" tools have only one admin")+'</h3><p class="small muted">'+esc(solo.map(function(t){return t.name;}).join(", "))+'.</p><p class="small"><b>'+(SOLE()?"For each one, write down the recovery codes and keep them somewhere a person you trust can reach if you cannot. Tell them where.":"Add a second admin to each. If that is not possible, write down the recovery codes and keep them with "+(BOARD()==="trustees"?"the chair":BOARD()==="team"?"someone else in your team":"the chair of the board")+".")+'</b></p>'+
    cardMission.map(function(t){return '<p class="small"><b>'+esc(t.name)+' also has a '+esc(ML())+' concern.</b> '+esc([].concat(why(t).mission).join(" "))+' '+(SOLE()?"After the fix, decide whether you accept it.":"After the fix, take it to your "+TR()+".")+'</p>';}).join("")+'</div></li>':"";
  h+='<section class="stack" aria-labelledby="prioH"><div class="s4 stack"><h2 id="prioH">What to do</h2><p class="muted">'+((pri.length||groupCard)?"Everything not listed here can stay as it is. Please review again in 12 months.":"Nothing needs attention. Please review again in 12 months, or when someone starts using a new tool.")+'</p></div>';
  if(pri.length||groupCard)h+='<ol class="prio">'+groupCard+pri.map(function(p){var w=why(p.t),r=[].concat(w.safety.filter(function(){return safety(p.t)==="Red";}),w.control.filter(function(x){return !(grouped&&!app(p.t)&&x==="Only one person can manage it.");}),w.exit.filter(function(){return exitL(p.t)==="Red";}),w.mission);
    return '<li><span class="when '+p.c+'">'+esc(p.w)+'</span><div class="s15 stack"><h3>'+esc(p.t.name)+'</h3>'+(r.length?'<p class="small muted">'+esc(r.join(" "))+'</p>':"")+'<p class="small"><b>'+esc(nextStep(p.t,grouped))+(p.c!=="dec"&&pendingMission(p.t)?" "+(SOLE()?"Then decide whether you accept the "+ML()+" concern.":"Then take the "+ML()+" concern to your "+TR()+"."):"")+'</b></p>'+(p.t.next?'<p class="small">Your next step: '+esc(p.t.next)+' '+dueChip(p.t.due)+'</p>':"")+'</div></li>';}).join("")+'</ol>';
  h+='<p class="small muted"><b>Note:</b> If you are considering moving to a new service, weigh the short-term cost in money and staff time against the benefits in the future. Alternatively, consider how you can reduce your dependency on that service.</p></section>';

  // Who does what
  var byO=ownerTasks(),owners=Object.keys(byO);
  h+='<section class="stack" aria-labelledby="ownH"><div class="s4 stack"><h2 id="ownH">Who are the owners of your technology</h2><p class="muted">Ensure that every service in your organisation has a named owner. Tools with nobody in charge come first, because naming an owner is the first fix.</p></div>';
  if(owners.length)h+='<div class="owners">'+owners.map(function(o){return '<div class="s16 panel stack"><h3>'+esc(o)+'</h3><ul class="flags">'+byO[o].map(function(x){return '<li class="'+x.lvl+'">'+(x.lvl==="ok"?'<span aria-hidden="true">·</span>':(x.lvl==="risk"?SHAPE.Red:SHAPE.Amber))+'<span><b>'+esc(x.tool)+':</b> '+esc(x.task)+'</span></li>';}).join("")+'</ul></div>';}).join("")+'</div><div class="row"><button type="button" class="btn" id="copyOwners">Copy each owner\'s list</button></div>';
  else h+='<p class="small muted">No actions for anyone yet.</p>';
  h+='</section>';

  // Coming up
  var cu=comingUp();
  if(cu.length){h+='<section class="stack" aria-labelledby="cuH"><div class="s4 stack"><h2 id="cuH">Coming up</h2><p class="muted">Next steps with a date, and renewals, in the next 90 days.</p></div><ul class="dup">'+cu.map(function(i){return '<li class="s17 row"><span><b>'+esc(i.tool)+':</b> '+esc(i.what)+(i.who?' <span class="muted">('+esc(i.who)+')</span>':"")+'</span>'+dueChip(i.d)+'</li>';}).join("")+'</ul></section>';}
  // Tools doing the same job
  var dupGroups=[];DUPS.forEach(function(f){var g=ts.filter(f[1]);if(g.length>=2)dupGroups.push({name:f[0],tools:g});});
  if(dupGroups.length){h+='<section class="stack" aria-labelledby="dupH"><div class="s4 stack"><h2 id="dupH">Tools that may be doing a similar job</h2><p class="muted">Can any of these tools be retired?</p></div><ul class="dup">'+dupGroups.map(function(g){var c=g.tools.reduce(function(a,t){return a+(Number(t.cost)||0);},0);return '<li><b>'+esc(g.name.charAt(0).toUpperCase()+g.name.slice(1))+':</b> '+esc(g.tools.map(function(t){return t.name;}).join(", "))+(c?'. <span class="muted">Together: '+money(c)+' a year.</span>':"")+(g.name==="donations, payments and tickets"?' <span class="muted">(Offering donors a choice of how to pay is fine.)</span>':"")+'</li>';}).join("")+'</ul></section>';}
  // Where your data lives: a one-line summary here; the map is on step 4 (Paul, 29 Sep)
  var zc=function(f){return ts.filter(f).length;};
  h+='<section class="stack" aria-labelledby="whereSumH"><div class="s17 row"><h2 id="whereSumH">Where your data lives</h2><button type="button" class="btn" id="toData">See it on the map</button></div><p class="muted">'+zc(function(t){return !onDevice(t)&&t.where===EU;})+' in the UK, EU or EEA, '+zc(function(t){return !onDevice(t)&&t.where===ELSE;})+' outside, '+zc(function(t){return !onDevice(t)&&(t.where===DK||!t.where);})+' not sure, and '+zc(onDevice)+' on your devices.</p></section>';

  // Register table: four columns so it fits the page (Paul, 30 Sep: twelve were too many).
  // The five lights share one column; decision, next step and date stack in the last.
  h+='<section class="stack" aria-labelledby="regH"><div class="s17 row"><h2 id="regH">Your register</h2><div class="legend" aria-hidden="true"><span>'+bare("Green","")+'</span><span>'+bare("Amber","")+'</span><span>'+bare("Red","")+'</span></div></div>'+
   '<div class="tablewrap" role="region" aria-label="Register table"><table class="reg"><thead><tr><th scope="col">Tool</th><th scope="col">Lights</th><th scope="col">Suggested action</th><th scope="col">Your decision</th></tr></thead><tbody>';
  ts.forEach(function(t){
    h+='<tr><td><b>'+esc(t.name)+'</b>'+(t.job?'<div class="small muted">'+esc(t.job)+'</div>':"")+
      '<div class="small">Owner: '+(own(t)?esc(ownerName(t)):'<span class="light r">'+SHAPE.Red+'Nobody</span>')+'</div><div class="small muted">Data: '+esc(t.data||"not answered")+'</div></td>'+
      '<td data-label="Lights"><div class="minis">'+mini(safety(t),"Safety")+mini(control(t),"Control")+mini(exitL(t),"Exit")+mini(t.value,"Value")+mini(mission(t),ML())+'</div></td>'+
      '<td data-label="Suggested action">'+esc(ACT(action(t))||"–")+'</td>'+
      '<td class="decision"><div class="decgrid"><div class="field"><label for="dec-'+esc(t.key)+'">Decision<span class="vh"> for '+esc(t.name)+'</span></label><select id="dec-'+esc(t.key)+'" data-dec="'+esc(t.key)+'"><option value="">Choose</option>'+OPT.decision.map(function(d){return '<option'+(t.decision===d?" selected":"")+'>'+d+'</option>';}).join("")+'</select></div>'+
      '<div class="field"><label for="due-'+esc(t.key)+'">By<span class="vh"> (date) for '+esc(t.name)+'</span></label><input type="date" id="due-'+esc(t.key)+'" data-due="'+esc(t.key)+'" value="'+esc(t.due)+'"></div>'+
      '<div class="field decnext"><label for="next-'+esc(t.key)+'">Next step<span class="vh"> for '+esc(t.name)+'</span></label><input type="text" id="next-'+esc(t.key)+'" data-next="'+esc(t.key)+'" value="'+esc(t.next)+'" placeholder="One concrete action"></div></div></td></tr>';
  });
  h+='</tbody></table></div><p class="small muted">Record your own decision: Keep, Reduce dependency, Replace or Retire. Then add one concrete next step, with a date.</p><p id="decStatus" class="small toast" role="status" aria-live="polite"></p></section>';
  h+='<section class="panel stack" aria-labelledby="outH"><div class="s4 stack"><h2 id="outH">'+(SOLE()?"Keep a summary":"Take it to your "+TR())+'</h2><p class="muted">'+(SOLE()?"Copy three things for your records":"Copy three things for your "+TR())+': what we depend on, what we are fixing now, and what we need you to decide. Or copy the full register: the columns match the register spreadsheet.</p></div>'+
   '<div class="row"><button type="button" class="btn primary" id="copyBoard">'+(SOLE()?"Copy a summary":"Copy summary for your "+TR())+'</button><button type="button" class="btn" id="copyRows">Copy register for a spreadsheet</button><span id="copied" class="toast" role="status" aria-live="polite"></span></div>'+
   '<div class="row"><button type="button" class="btn" id="dlCsv">Download the register (CSV)</button><button type="button" class="btn" id="printIt">Print or save as PDF</button></div>'+
   '<div class="s4 stack"><h3>Save a record of your audit</h3><p>Stack Check does not keep your data on any server. You can save a record of your audit to a file on your computer, and open it here at a later date.</p></div>'+
   '<div class="row"><button type="button" class="btn" id="saveFile">Save to a file</button><input type="file" id="openFile" class="vh" accept=".json,application/json"><label class="btn" for="openFile">Open a saved file</label><span id="fileStatus" class="toast" role="status" aria-live="polite"></span></div>'+
   '<textarea id="copyArea" class="copyout" readonly aria-label="Copied text" hidden></textarea></section>';
  // Thinking of changing a tool? Reference cards and Compare, folded (Paul, 29 Sep)
  h+='<section class="stack" aria-labelledby="chgH"><div class="s4 stack"><h2 id="chgH">Thinking of changing a tool?</h2></div>';
  // Reference cards for tools you plan to change
  var byFam={},reduceLines=[];
  ts.forEach(function(t){var f=familyOf(t);if(!f)return;if(t.decision==="Replace"||t.decision==="Retire")(byFam[f]=byFam[f]||[]).push(t);else if(t.decision==="Reduce dependency")reduceLines.push([t,CARDS[f]]);});
  var famKeys=Object.keys(byFam);
  if(famKeys.length||reduceLines.length){
    h+='<details class="fold" data-fold="cards"'+(state.foldCards?" open":"")+'><summary>Before you move: '+(famKeys.length+reduceLines.length)+' tool'+(famKeys.length+reduceLines.length===1?"":"s")+' you plan to change</summary><section class="stack" aria-labelledby="cardH"><div class="s4 stack"><h3 id="cardH">Before you move</h3><p class="muted">From the guide, for the tools you have marked Replace, Retire or Reduce dependency. Pick one tool, pilot it for at least four weeks with at least two people, and then decide.</p></div>';
    if(reduceLines.length)h+='<ul class="dup">'+reduceLines.map(function(x){return '<li><b>'+esc(x[0].name)+', reduce dependency:</b> '+esc(x[1].reduce)+'</li>';}).join("")+'</ul>';
    h+=famKeys.map(function(f){return cardHtml(CARDS[f],byFam[f]);}).join("")+'</section></details>';
  }
  // Compare two tools
  var libAll=[];LIB.forEach(function(g){g.items.forEach(function(l){if(l.src)libAll.push(l);});});
  var mine=ts.filter(function(t){return t.lib&&BYID[t.lib]&&BYID[t.lib].src;});
  var ca=state.cmpA&&BYID[state.cmpA]?state.cmpA:(mine[0]?mine[0].lib:libAll[0].id);
  var same=libAll.filter(function(l){return l.id!==ca&&l.group===BYID[ca].group;});
  var cb=state.cmpB&&BYID[state.cmpB]&&state.cmpB!==ca?state.cmpB:(same[0]?same[0].id:libAll.find(function(l){return l.id!==ca;}).id);
  function sel(id,val){return '<select id="'+id+'">'+LIB.map(function(g){var its=g.items.filter(function(l){return l.src;});if(!its.length)return "";return '<optgroup label="'+esc(g.g)+'">'+its.map(function(l){return '<option value="'+l.id+'"'+(l.id===val?" selected":"")+'>'+esc(l.name)+'</option>';}).join("")+'</optgroup>';}).join("")+'</select>';}
  var A=BYID[ca],B=BYID[cb];
  var AIW={"yes":"Yes, by default","no":"No","depends-on-plan":"Depends on the plan","not-applicable":"Not applicable","unclear":"Unknown"};
  var RESW={"yes-default":"Yes, by default","yes-some-plans":"Only on some plans","yes-on-request":"On request","no":"No","unclear":"Unknown"};
  function crow(k,fa,fb){return '<tr><th scope="row">'+k+'</th><td>'+esc(known(fa)||"Unknown")+'</td><td>'+esc(known(fb)||"Unknown")+'</td></tr>';}
  function co(l){return (l.co||"")+(PLACE[l.hq]&&l.hq!=="OTHER"?", "+PLACE[l.hq]:"")+(l.par?". Owned by "+l.par:"");}
  h+='<details class="fold" data-fold="cmp"'+(state.foldCmp?" open":"")+'><summary>Compare two tools: supplier facts side by side</summary><section class="stack" aria-labelledby="cmpH"><div class="s4 stack"><h3 id="cmpH">Compare two tools</h3><p class="muted">Facts from the suppliers\' own pages, checked 29 September 2026. This compares what we found. It does not recommend.</p></div>'+
    '<div class="qgrid"><div class="field"><label for="cmpA">This tool</label>'+sel("cmpA",ca)+'</div><div class="field"><label for="cmpB">Compared with</label>'+sel("cmpB",cb)+'</div></div>'+
    (same.length?'<div class="row small"><span class="muted">Same group:</span>'+same.slice(0,8).map(function(l){return '<button type="button" class="pdot" data-cmpb="'+l.id+'"'+(l.id===cb?' aria-current="true"':"")+'>'+esc(l.name)+'</button>';}).join("")+'</div>':"")+
    '<div class="tablewrap" role="region" aria-label="Comparison table (scrolls sideways)" tabindex="0"><table class="cmp"><thead><tr><th scope="col"></th><th scope="col">'+esc(A.name)+'</th><th scope="col">'+esc(B.name)+'</th></tr></thead><tbody>'+
    crow("In one line",A.note,B.note)+crow("Company",co(A),co(B))+crow("Where data is kept",A.store,B.store)+crow("UK or EU storage",(RESW[A.res]||A.res)+(A.plans?": "+A.plans:""),(RESW[B.res]||B.res)+(B.plans?": "+B.plans:""))+
    crow("Full export",A.x,B.x)+crow("Two-step sign-in",A.mfa,B.mfa)+crow("Trains AI on your data",(AIW[A.ai]||A.ai)+(A.aid?". "+A.aid:""),(AIW[B.ai]||B.ai)+(B.aid?". "+B.aid:""))+crow("Open source",A.o?"Yes":"No",B.o?"Yes":"No")+crow("Nonprofit offer",A.np,B.np)+
    crow("How sure we are",A.conf,B.conf)+'<tr><th scope="row">Sources</th><td><ul class="srcs">'+A.src.map(function(x){return '<li><a href="'+esc(x[1])+'" target="_blank" rel="noopener noreferrer">'+esc(x[0])+'<span class="vh"> (opens in a new tab)</span></a></li>';}).join("")+'</ul></td><td><ul class="srcs">'+B.src.map(function(x){return '<li><a href="'+esc(x[1])+'" target="_blank" rel="noopener noreferrer">'+esc(x[0])+'<span class="vh"> (opens in a new tab)</span></a></li>';}).join("")+'</ul></td></tr>'+
    '</tbody></table></div></section></details>';

  h+='</section>';
  h+='<div class="navrow"><button type="button" class="btn" id="back2">Change answers</button><span class="row"><button type="button" class="btn ghost" id="clearAll">Clear everything</button><button type="button" class="btn" id="printDecide">Print or save as PDF</button><button type="button" class="btn primary" id="to4">Next: your data</button></span></div>';
  view.innerHTML=h;

  bindLaw();
  var co=document.getElementById("copyOwners");if(co)co.addEventListener("click",function(){copy(ownersText());});
  document.getElementById("to4").addEventListener("click",function(){go(4);});
  document.getElementById("toData").addEventListener("click",function(){go(4);});
  document.getElementById("printDecide").addEventListener("click",function(){window.print();});
  view.querySelectorAll("details[data-fold]").forEach(function(d){d.addEventListener("toggle",function(){if(d.dataset.fold==="cards")state.foldCards=d.open;else state.foldCmp=d.open;save();});});
  document.getElementById("dlCsv").addEventListener("click",downloadCsv);
  document.getElementById("printIt").addEventListener("click",function(){window.print();});
  document.getElementById("saveFile").addEventListener("click",function(){saveToFile();document.getElementById("fileStatus").textContent="Saved. Look in your downloads folder.";});
  bindOpenFile(document.getElementById("openFile"),document.getElementById("fileStatus"));
  var f=document.getElementById("finish");if(f)f.addEventListener("click",function(){state.cur=ts.findIndex(function(t){return !answered(t);});go(2);});
  view.querySelectorAll("[data-dec]").forEach(function(s){s.addEventListener("change",function(){var t=ts.find(function(x){return x.key===s.dataset.dec;});t.decision=s.value;leaveExample();render();var e=document.getElementById(s.id);if(e)e.focus();var ds=document.getElementById("decStatus");if(ds&&(s.value==="Replace"||s.value==="Retire"||s.value==="Reduce dependency")&&familyOf(t))ds.textContent="Advice for "+t.name+" is under Thinking of changing a tool, below.";});});
  view.querySelectorAll("[data-next]").forEach(function(s){s.addEventListener("input",function(){var t=ts.find(function(x){return x.key===s.dataset.next;});t.next=s.value;leaveExample();save();});});
  view.querySelectorAll("[data-due]").forEach(function(s){s.addEventListener("change",function(){var t=ts.find(function(x){return x.key===s.dataset.due;});t.due=s.value;leaveExample();render();var e=document.getElementById(s.id);if(e)e.focus();});});
  var cA=document.getElementById("cmpA"),cB=document.getElementById("cmpB");
  cA.addEventListener("change",function(){state.cmpA=cA.value;state.cmpB="";render();document.getElementById("cmpA").focus();});
  cB.addEventListener("change",function(){state.cmpB=cB.value;render();document.getElementById("cmpB").focus();});
  view.querySelectorAll("[data-cmpb]").forEach(function(b){b.addEventListener("click",function(){state.cmpB=b.dataset.cmpb;render();var e=view.querySelector('[data-cmpb="'+b.dataset.cmpb+'"]');if(e)e.focus();});});
  document.getElementById("back2").addEventListener("click",function(){go(2);});
  document.getElementById("clearAll").addEventListener("click",function(){document.getElementById("confirmClear").hidden=false;document.getElementById("clearNo").focus();});
  document.getElementById("copyRows").addEventListener("click",function(){copy(tsv());});
  document.getElementById("copyBoard").addEventListener("click",function(){copy(board());});
}
function ownerTasks(){
  var out={},NOBODY="Nobody yet: name an owner",BOARDK=SOLE()?"You":BOARD()==="trustees"?"Your trustees":"Your board";
  function add(o,x){(out[o]=out[o]||[]).push(x);}
  state.tools.forEach(function(t){
    if(!answered(t))return;
    var a=action(t),o=own(t)?ownerName(t):NOBODY;
    var mine=t.next&&String(t.next).trim()?String(t.next).trim():"";
    if(a==="Fix now"){add(o,{tool:t.name,task:nextStep(t),lvl:"risk"});if(pendingMission(t))add(BOARDK,{tool:t.name,task:(SOLE()?"After the fix, decide whether you accept the ":"After the fix, decide on the ")+ML()+" concern. "+[].concat(why(t).mission).join(" "),lvl:"watch"});}
    else if(a==="Trustee decision")add(BOARDK,{tool:t.name,task:nextStep(t),lvl:"watch"});
    else if(a==="Review this year"||a==="Review at renewal")add(o,{tool:t.name,task:mine||nextStep(t),lvl:"watch"});
    else if(mine)add(o,{tool:t.name,task:mine,lvl:"ok"});
    else if(t.decision==="Replace"||t.decision==="Retire")add(o,{tool:t.name,task:"Decision is to "+t.decision.toLowerCase()+" it. Plan the move before it renews.",lvl:"watch"});
  });
  var keys=Object.keys(out).sort(function(a,b){return a===NOBODY?-1:b===NOBODY?1:a===BOARDK?1:b===BOARDK?-1:a.localeCompare(b);});
  var r={};keys.forEach(function(k){r[k]=out[k];});return r;
}
function ownersText(){
  var by=ownerTasks(),L=[];
  Object.keys(by).forEach(function(o){L.push(o);by[o].forEach(function(x){L.push("- "+x.tool+": "+x.task);});L.push("");});
  return L.join("\n");
}

// ---------- Step 4: your data ----------
function whereSection(){
  var ts=state.tools,done=ts.filter(answered),h='';
  var zones=[["UK, EU or EEA","",function(t){return !onDevice(t)&&t.where===EU;}],["Outside the UK, EU or EEA","out",function(t){return !onDevice(t)&&t.where===ELSE;}],["Not sure","unk",function(t){return !onDevice(t)&&(t.where===DK||!t.where);}],["On your devices","dev",onDevice]];
  h+='<section class="stack" aria-labelledby="whereH"><div class="s4 stack"><h2 id="whereH">Where your data lives</h2><p class="muted">Control is not about where a company is based. It is about whether you understand and manage the relationship.</p></div>'+overviewMap(done)+mapLegend()+'<p class="small muted">Tools with a heavy border hold sensitive data.</p><div class="strip">';
  zones.forEach(function(z){var here=ts.filter(z[2]);
    h+='<div class="zone '+z[1]+'"><h3>'+esc(z[0])+' <span class="muted small">('+here.length+')</span></h3><div class="tchips">'+(here.length?here.map(function(t){return '<span class="tchip'+(t.data==="Sensitive"?" sens":t.data==="Personal"?" pers":"")+'">'+esc(t.name)+(t.based===ELSE&&z[1]===""?' <span class="muted">(supplier elsewhere)</span>':"")+'</span>';}).join(""):'<span class="small muted">None</span>')+'</div></div>';});
  h+='</div></section>';

  return h;
}
var SAVE_ROW='<div class="row small savebar"><button type="button" class="btn ghost" id="saveAny">Save to a file</button><span class="muted">to carry on later or on another computer.</span><span id="saveAnyStatus" class="toast" role="status" aria-live="polite"></span></div>';
function bindSaveRow(){var b=document.getElementById("saveAny");if(b)b.addEventListener("click",function(){saveToFile();document.getElementById("saveAnyStatus").textContent="Saved. Look in your downloads folder.";});}
var DATA_END='<div class="navrow"><button type="button" class="btn" id="back3">Back to Decide</button><button type="button" class="btn" id="printData">Print or save as PDF</button></div>'+SAVE_ROW;
function bindDataEnd(){bindSaveRow();document.getElementById("back3").addEventListener("click",function(){go(3);});document.getElementById("printData").addEventListener("click",function(){window.print();});bindLaw();}
// Step 4 is the map only. "Follow one person" was removed (Paul, 30 Sep: it did not add much).
// Journeys in saved files and in the example are kept as data, so nothing is lost on a round trip.
function renderJourneys(){
  view.innerHTML=whereSection()+DATA_END;
  bindDataEnd();
}
// Columns in the same order as the register spreadsheet (A to AF)
function registerRows(){
  var H=["Tool","Suggested action","SAFETY","CONTROL","EXIT","VALUE (you judge)","MISSION","Job it does","Kind","Owner (a named role)","Account","Admins","Users","Cost per year ("+(state.ccy||"GBP")+")","Staff hours per month","How much we depend on it","Data held","Renewal or notice date","Sign-in protected","Where data is kept","Supplier based in","Open source","Data protection terms in place","Full export in standard format","Own copy, restore tested","Our data trains AI?","Human rights concerns","Environmental concerns","Fits our mission and values","Trade-off approved by","Your decision","Next step","Next renewal date","Next step by"];
  var rows=state.tools.map(function(t){return [t.name,ACT(action(t)),safety(t),control(t),exitL(t),t.value,mission(t),t.job,t.kind,t.owner,t.account,t.admins,t.users,t.cost,t.hours,t.depend,t.data,t.renewal,t.signin,t.where,t.based,dev(t)?"":t.open,t.terms,t.exp,t.copy,t.ai,t.rights,t.env,t.fits,t.approved,t.decision,t.next,t.renewalDate,t.due]
    .map(function(v){return String(v==null?"":v).replace(/[\t\n\r]/g," ");});});
  return [H].concat(rows);
}
function tsv(){return registerRows().map(function(r){return r.join("\t");}).join("\n");}
function board(){
  var d=state.tools.filter(answered);
  function by(a){return d.filter(function(t){return action(t)===a;});}
  var fix=by("Fix now"),dec=by("Trustee decision"),year=by("Review this year"),ren=by("Review at renewal");
  var crit=d.filter(function(t){return t.depend==="Critical";}).length,pers=d.filter(personal).length,ai=state.tools.filter(function(t){return t.kind==="AI tool";}).length;
  var cost=state.tools.reduce(function(s,t){return s+(Number(t.cost)||0);},0);
  var today=new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
  var L=[(SOLE()?"Technology check: summary":"Technology check: summary for our "+TR())+", "+today,""];
  var open=state.tools.length-d.length;
  L.push("1. What we depend on");
  L.push("We use "+state.tools.length+" tools"+(ai?", including "+ai+" AI tool"+(ai===1?"":"s"):"")+". "+crit+" are critical and "+pers+" hold personal or sensitive data."+(cost>0?" Listed licence costs: "+money(cost)+" a year.":""));
  if(open)L.push(open+" tool"+(open===1?" is":"s are")+" not answered yet and not included below.");
  L.push("");
  // One line for the tools whose only fix is a second admin, not one line each.
  // The same tools as the "only one admin" card on Decide, so the two counts agree.
  var solo=soloTools(),adminFix=SOLE()?[]:solo.filter(function(t){return action(t)==="Fix now";});
  L.push("2. What we are fixing now ("+fix.length+")");
  fix.forEach(function(t){var n=nextStep(t,adminFix.length>1);if(n)L.push("- "+t.name+": "+n);});
  if(adminFix.length>1)L.push("- Add a second admin to "+adminFix.length+" tools: "+adminFix.map(function(t){return t.name;}).join(", ")+".");
  if(SOLE()&&solo.length)L.push("- Recovery codes: I am the only person who can get into "+solo.length+" tool"+(solo.length===1?"":"s")+" ("+solo.map(function(t){return t.name;}).join(", ")+"). Write down the recovery codes and tell someone I trust where they are.");
  if(!fix.length)L.push("- Nothing");L.push("");
  L.push(SOLE()?"3. What I need to decide":"3. What we need you to decide");
  L.push(ACT("Trustee decision")+"s ("+dec.length+"):");dec.forEach(function(t){L.push("- "+t.name+": "+[].concat(why(t).mission).join(" "));});if(!dec.length)L.push("- None");
  // A Mission concern on a tool that also needs a fix is still a decision for the board (review, 30 Sep).
  var alsoDec=fix.filter(pendingMission);
  if(alsoDec.length){L.push("Also to decide, once the fix is done ("+alsoDec.length+"):");alsoDec.forEach(function(t){L.push("- "+t.name+": "+[].concat(why(t).mission).join(" "));});}
  L.push("Reviews this year ("+year.length+"):");year.forEach(function(t){L.push("- "+t.name+": "+nextStep(t));});if(!year.length)L.push("- None");
  if(ren.length){L.push("Reviews at renewal ("+ren.length+"):");ren.forEach(function(t){L.push("- "+t.name);});}
  var cu=comingUp();if(cu.length){L.push("");L.push("Coming up in the next 90 days:");cu.forEach(function(i){L.push("- "+fmtDate(i.d)+": "+i.tool+", "+i.what+(i.who?" ("+i.who+")":""));});}
  L.push("");L.push("Everything else stays as it is. We review the register once a year, and whenever someone starts using a new tool.");
  return L.join("\n");
}
function copy(text){
  var area=document.getElementById("copyArea"),msg=document.getElementById("copied");
  area.value=text;
  function fallback(){area.hidden=false;area.focus();area.select();msg.textContent="Select all and copy the text below.";}
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){area.hidden=true;msg.textContent="Copied. Paste it where you need it.";},fallback);}
  else fallback();
}
var STEP_NAMES=["List your tools","Answer the questions","Decide","Your data"];
function stepTitle(){document.title=state.step?"Step "+state.step+" of 4, "+STEP_NAMES[state.step-1]+": Stack Check":"Stack Check: stay in command of your technology";}
// On a step change, move focus to the new step's first heading, so keyboard and
// screen-reader users start at the top of the new content (WCAG 2.4.3).
function focusHeading(sel){var h=document.querySelector(sel||"#view > .banner, #view h2");if(h){h.setAttribute("tabindex","-1");h.focus({preventScroll:true});}}
function go(n){state.step=n;render();window.scrollTo({top:0});focusHeading();}
// Keep focused fields clear of the sticky step bar (WCAG 2.2, 2.4.11).
function padForSteps(){var nav=document.querySelector("nav.steps");if(nav)document.documentElement.style.scrollPaddingTop=(nav.offsetHeight+8)+"px";}
window.addEventListener("resize",padForSteps);

document.querySelectorAll("nav.steps [data-step]").forEach(function(b){b.addEventListener("click",function(){go(+b.dataset.step);});});
document.getElementById("startOwn").addEventListener("click",function(){var own=ownSaved();if(own){state=own;go(own.step>0?own.step:1);}else{state=blank();state.mode="own";go(1);}});
document.getElementById("exStart").addEventListener("click",function(){document.getElementById("exampleEdit").hidden=true;document.getElementById("startOwn").click();});
document.getElementById("exKeep").addEventListener("click",function(){document.getElementById("exampleEdit").hidden=true;if(exReturn&&document.getElementById(exReturn))document.getElementById(exReturn).focus();});
document.getElementById("exampleEdit").addEventListener("keydown",function(e){if(e.key==="Escape"){e.preventDefault();document.getElementById("exKeep").click();}});
// The example is read-only. Changes are stopped in the capture phase, before any handler
// runs; looking around (steps, folds, compare, the map's law toggle, search) still works.
var EX_EDIT='input,select,textarea,[data-lib],[data-remove],#addTool';
var EX_OK='#findTool,#newName,#newJob,#cmpA,#cmpB,[data-law],[name="org"],[name="loc"],#ccy,#home,[type="file"]';
var exReturn="";
function exTarget(el){if(state.mode!=="example"||!el||!el.closest)return null;var c=el.closest(EX_EDIT);return c&&!c.matches(EX_OK)&&view.contains(c)?c:null;}
function exampleEdit(c){exReturn=c&&c.id||"";var b=document.getElementById("startOwn");document.getElementById("exStart").textContent=b?b.textContent:"Start your own";document.getElementById("exampleEdit").hidden=false;document.getElementById("exStart").focus();}
view.addEventListener("click",function(e){var c=exTarget(e.target);if(!c||c.matches("input[type=text],input[type=date],input[type=number],input[type=search],select,textarea"))return;e.preventDefault();e.stopImmediatePropagation();exampleEdit(c);},true);
// Stop both events, then redraw once afterwards. Redrawing inside the first event would detach
// the field, and its second event (a select fires input then change) would skip this guard.
var exPending=false;
["change","input"].forEach(function(ev){view.addEventListener(ev,function(e){var c=exTarget(e.target);if(!c)return;e.stopImmediatePropagation();if(exPending)return;exPending=true;setTimeout(function(){exPending=false;render();exampleEdit(c);},0);},true);});
// M2: the clear-everything question starts on the safe answer; Escape keeps the answers.
function closeClear(){document.getElementById("confirmClear").hidden=true;var c=document.getElementById("clearAll");if(c)c.focus();}
document.getElementById("clearNo").addEventListener("click",closeClear);
document.getElementById("confirmClear").addEventListener("keydown",function(e){if(e.key==="Escape"){e.preventDefault();closeClear();}});
document.getElementById("clearYes").addEventListener("click",function(){document.getElementById("confirmClear").hidden=true;state=blank();state.mode="own";try{localStorage.removeItem(KEY);}catch(e){}go(1);});
render();
padForSteps();
