(() => {
  'use strict';
const header=document.querySelector('#header');
const panel=document.querySelector('#mobile-panel');
const isHome=!!document.querySelector('section.hero#inicio, section.fusion-hero#inicio');
const logo=header?.querySelector('.brand-official-image');
const logoWhite='assets/logo-instituto-chroma-branco.png';
const logoNavy='assets/logo-instituto-chroma.png';
function onScroll(){if(!header)return;const solid=!isHome||scrollY>36||!!(panel&&!panel.hidden);header.classList.toggle('header-solid',solid);header.querySelector('.brand')?.classList.toggle('brand-light',!solid);if(logo){const next=solid?logoNavy:logoWhite;if(logo.dataset.chromaLogo!==next){logo.dataset.chromaLogo=next;logo.src=window.__chromaAssets?.[next]||next}}}
window.chromaHeaderSync=onScroll;window.addEventListener('scroll',onScroll,{passive:true});onScroll();
document.documentElement.classList.add('chroma-js');
})();
