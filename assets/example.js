/* example.js: The worked example: the same fictional charity as the guide and the register
   Split from the prototype (artifact version 18, 29 September 2026) by tools/split-prototype.py. */
"use strict";
function fromLib(l){
  var t={key:(l.id||"custom")+"-"+Math.random().toString(36).slice(2,7),lib:l.id||null,note:l.note||""};
  FIELDS.forEach(function(f){t[f]="";});
  t.name=l.name||"";t.job=l.job||"";t.kind=l.k||"";
  if(l.k==="Devices"){t.signin=l.signin||"";}
  else if(l.id){t.where=l.w||"";t.based=l.b||"";t.open=l.o?"Yes":"No";t.exp=l.x||"";t.loc=l.loc||(l.w===ELSE?"OTHER":"");t.hq=l.hq||"";t.note="";}
  return t;
}
function example(){
  function mk(id,a){return Object.assign(fromLib(BYID[id]),a);}
  var tools=[
   mk("microsoft-365",{name:"Microsoft 365 Business Basic",owner:"Office manager",account:"Organisation",admins:"Two or more",cost:0,hours:2,depend:"Critical",data:"Personal",renewal:"Annual, April",signin:"Yes",where:EU,based:ELSE,open:"No",terms:"Yes",exp:"Yes",copy:"No",ai:"No",rights:"Not checked",env:"Not checked",fits:"Yes",value:"Green",decision:"Reduce dependency",next:"Set up an independent backup of mailboxes and files, and test one restore by December."}),
   mk("mailchimp",{owner:"Comms lead",account:"Organisation",admins:"One person",cost:480,hours:3,depend:"Important",data:"Personal",renewal:"Monthly",signin:"Yes",where:ELSE,based:ELSE,open:"No",terms:DK,exp:"Yes",copy:"No",ai:DK,fits:"Yes",value:"Amber",decision:"Replace",next:"Add a second admin this week. Then compare two newsletter tools that keep data in the UK or EU before the next renewal."}),
   mk("zoom",{name:"Zoom Pro",owner:"Office manager",account:"Organisation",admins:"Two or more",cost:150,hours:0,depend:"Important",data:"Internal",renewal:"Annual, June",signin:"No",where:ELSE,based:ELSE,open:"No",terms:"Yes",exp:"Partial",copy:"No",ai:DK,fits:"Yes",value:"Amber",decision:"Keep",next:"Switch on MFA for everyone."}),
   mk("dropbox",{job:"Shared files (duplicates SharePoint)",owner:"",account:"Personal",admins:DK,cost:0,hours:1,depend:"Important",data:"Sensitive",signin:DK,where:ELSE,based:ELSE,open:"No",terms:"No",exp:"Yes",copy:"No",value:"Red",decision:"Retire",next:"Move the files into SharePoint, then delete them from the personal Dropbox."}),
   mk("canva",{owner:"Comms lead",account:"Organisation",admins:"Two or more",cost:0,hours:2,depend:"Minor",data:"None",renewal:"Free plan",signin:"Yes",where:ELSE,based:ELSE,open:"No",terms:"Yes",exp:"Partial",copy:"No",value:"Green",decision:"Keep"}),
   Object.assign(fromLib({name:"Donor CRM (UK-hosted)",job:"Donors and supporters",k:"Software"}),{loc:"GB",hq:"GB",owner:"Fundraising lead",account:"Organisation",admins:"Two or more",cost:1368,hours:4,depend:"Critical",data:"Sensitive",renewal:"Annual, January",signin:"Yes",where:EU,based:EUR,open:"No",terms:"Yes",exp:"Yes",copy:"Yes",value:"Green",decision:"Keep"}),
   mk("plausible-analytics",{owner:"Comms lead",account:"Organisation",admins:"Two or more",cost:108,hours:0,depend:"Minor",data:"None",renewal:"Annual, March",signin:"Yes",where:EU,based:EUR,open:"Yes",terms:"Yes",exp:"Yes",copy:"Yes",value:"Green",decision:"Keep"}),
   mk("win10",{name:"Laptops on Windows 10 (5)",owner:"Office manager",account:"Organisation",admins:"Two or more",cost:0,hours:3,depend:"Critical",data:"Sensitive",renewal:"Updates ended Oct 2025",signin:"No",copy:"No",value:"Red",decision:"Replace",next:"Upgrade to Windows 11 where possible, test Linux Mint on one, and replace the rest."}),
   mk("chatgpt",{name:"ChatGPT (staff personal accounts)",job:"Drafting and summaries",owner:"",account:"Personal",admins:DK,cost:0,hours:0,depend:"Important",data:"Personal",signin:DK,where:ELSE,based:ELSE,open:"No",terms:"No",exp:"Partial",copy:"No",ai:"Yes",fits:"Needs discussion",value:"Green",decision:"Replace",next:"Agree one AI tool on an organisation account, and a one-page rule on what must never go into it."})
  ];
  var k=function(i){return tools[i].key;};
  return {v:6,showLaw:true,org:"nonprofit",loc:"UK",home:"GB",ccy:"GBP",mode:"example",step:3,cur:0,jcur:0,tools:tools,journeys:[
   {title:"A supporter signs up at an event",who:"Supporter",stops:[
    {ref:"x:paper",how:""},{ref:k(5),how:"Typed in by hand"},{ref:k(1),how:"Automatic connection"},
    {ref:k(3),how:"Saved or exported as a file"},{ref:k(0),how:"Sent by email"},{ref:k(7),how:"Downloaded to a device"}]},
   {title:"A staff member replies to a supporter",who:"Supporter",stops:[
    {ref:k(0),how:""},{ref:k(8),how:"Pasted into an AI tool"}]}
  ]};
}
