/* theme.js: Light and dark theme switch.
   Loaded without defer so the theme applies before the page paints. Dark is the default
   (Paul, 30 Sep); a light choice is remembered in this browser.
   Only the words "light" or "dark" are stored, never anything the person enters. */
"use strict";
(function(){
  var KEY="stackcheck.theme",root=document.documentElement;
  function saved(){try{var v=localStorage.getItem(KEY);return v==="light"||v==="dark"?v:"";}catch(e){return "";}}
  function isDark(){return root.getAttribute("data-theme")==="dark";}
  root.setAttribute("data-theme",saved()||"dark");
  function sync(){var b=document.getElementById("themeBtn");if(b)b.setAttribute("aria-pressed",isDark()?"true":"false");}
  document.addEventListener("DOMContentLoaded",function(){
    var b=document.getElementById("themeBtn");if(!b)return;
    sync();
    b.addEventListener("click",function(){var next=isDark()?"light":"dark";root.setAttribute("data-theme",next);try{localStorage.setItem(KEY,next);}catch(e){}sync();});
  });
})();
