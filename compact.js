(function(){"use strict";
const head=document.querySelector('.appHeader'),line=document.getElementById('compactLineups'),dock=document.querySelector('.bottom'),more=document.getElementById('moreActions');
if(!head||!line||!dock||!more)return;
line.addEventListener('click',()=>{const open=head.classList.toggle('lineupsExpanded');line.setAttribute('aria-expanded',String(open));line.textContent=open?'Aufstellung ausblenden ▴':'Aufstellung anzeigen ▾';});
more.addEventListener('click',()=>{const open=dock.classList.toggle('expanded');more.setAttribute('aria-expanded',String(open));more.textContent=open?'Weniger ×':'Mehr ⋯';});
})();
