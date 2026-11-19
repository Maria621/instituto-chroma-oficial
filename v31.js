(()=>{'use strict';
const header=document.getElementById('header');if(!header)return;
const menu=header.querySelector('#mobile-menu'),panel=header.querySelector('#mobile-panel');
const dropdown=header.querySelector('.nav-dropdown'),toggle=header.querySelector('.nav-dropdown-toggle');
function sync(){window.chromaHeaderSync?.()}
function closeMobile(focus=false){if(!panel||!menu)return;panel.hidden=true;menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menu de navegação');document.body.classList.remove('nav-locked');sync();if(focus)menu.focus()}
function openMobile(){panel.hidden=false;menu.setAttribute('aria-expanded','true');menu.setAttribute('aria-label','Fechar menu de navegação');document.body.classList.add('nav-locked');sync();panel.querySelector('a')?.focus()}
menu?.addEventListener('click',()=>panel.hidden?openMobile():closeMobile(true));
panel?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeMobile()));
window.addEventListener('resize',()=>{if(innerWidth>1180&&!panel.hidden)closeMobile()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel?.hidden){e.preventDefault();closeMobile(true)}else if(e.key==='Tab'&&!panel?.hidden){const items=[...panel.querySelectorAll('a[href]'),menu].filter(x=>x.getClientRects().length);const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
function setDropdown(open){if(!dropdown||!toggle)return;dropdown.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));}
function closeDropdown(){setDropdown(false)}
toggle?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setDropdown(toggle.getAttribute('aria-expanded')!=='true')});
document.addEventListener('pointerdown',e=>{if(!dropdown?.contains(e.target))closeDropdown()});
dropdown?.addEventListener('focusout',e=>{if(!dropdown.contains(e.relatedTarget))closeDropdown()});
dropdown?.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeDropdown();toggle.focus()}else if(e.key==='ArrowDown'&&e.target===toggle){e.preventDefault();setDropdown(true);dropdown.querySelector('a')?.focus()}});
const dialog=document.getElementById('chroma-image-dialog');
if(dialog){document.querySelectorAll('[data-view-image]').forEach(btn=>btn.addEventListener('click',()=>{const img=dialog.querySelector('img');img.src=btn.dataset.viewImage;img.alt=btn.previousElementSibling?.alt||'Arte original da Chroma';dialog.showModal()}));dialog.querySelector('[data-close-image]')?.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()})}
})();