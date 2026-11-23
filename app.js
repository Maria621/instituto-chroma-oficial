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

(() => {
  'use strict';
const methods=[...document.querySelectorAll('.method-step')];
function selectMethod(i){
  methods.forEach((button,index)=>{
    const expanded=index===i;
    button.classList.toggle('active',expanded);
    button.setAttribute('aria-expanded',String(expanded));
    const detail=button.querySelector('.method-step-main>span');
    if(detail){
      if(!detail.id)detail.id='method-detail-'+index;
      button.setAttribute('aria-controls',detail.id);
      detail.hidden=!expanded;
    }
    const symbol=button.querySelector('.method-plus');
    if(symbol)symbol.textContent=expanded?'−':'+';
  });
  const label=document.getElementById('method-label');
  if(label)label.textContent='ETAPAS DA APRENDIZAGEM';
}
methods.forEach((button,index)=>button.addEventListener('click',()=>selectMethod(index)));
if(methods.length)selectMethod(0);
})();

(() => {
  'use strict';
const experience=[['Descobrir','Tudo começa com uma nova pergunta.','O aprendizado ganha sentido quando existe espaço para curiosidade, investigação e novas ideias.','CURIOSIDADE / DESCOBERTA','orbit'],['Praticar','Conhecimento que sai do papel.','A prática cria oportunidades de experimentar, rever caminhos e transformar conteúdo em repertório.','PRÁTICA / EXPERIMENTAÇÃO','grid'],['Evoluir','Crescer é um processo contínuo.','Cada etapa pode fortalecer competências, autonomia e a confiança para enfrentar novos desafios.','AUTONOMIA / DESENVOLVIMENTO','wave']];let activeExperience=0;
function chooseExperience(i){activeExperience=(i+experience.length)%experience.length;const e=experience[activeExperience];const w=document.getElementById('exp-word');if(w)w.innerHTML=e[0]+'<span>.</span>';for(const [id,value]of [['exp-counter','EXPERIÊNCIA CHROMA'],['exp-title',e[1]],['exp-copy',e[2]],['exp-tag',e[3]]]){const el=document.getElementById(id);if(el)el.textContent=value}document.querySelectorAll('.experience-dots button').forEach((b,j)=>{b.classList.toggle('current',activeExperience===j);b.setAttribute('aria-pressed',String(activeExperience===j))});const visual=document.querySelector('#experience-art .visual-art');if(visual&& !visual.classList.contains('visual-has-image'))visual.className='visual-art visual-'+e[4]}
document.querySelectorAll('.experience-dots button').forEach((b,i)=>b.addEventListener('click',()=>chooseExperience(i)));const nav=document.querySelectorAll('.experience-buttons button');if(nav.length===2){nav[0].addEventListener('click',()=>chooseExperience(activeExperience-1));nav[1].addEventListener('click',()=>chooseExperience(activeExperience+1))}
})();

(() => {
  'use strict';
const modal=document.getElementById('gallery-modal');const galleryTitles=['Ambientes de aprendizagem','Estrutura e tecnologia','Aprendizado em movimento','O cotidiano da Chroma'];const gallerySrc=['assets/visual-hero.avif','assets/visual-metodologia.avif','assets/visual-projetos.avif','assets/visual-acolhimento.avif'];let selected=0;let lastGalleryButton=null;
function galleryOpen(i){if(!modal)return;selected=(i+galleryTitles.length)%galleryTitles.length;modal.style.display='grid';document.body.style.overflow='hidden';const v=document.getElementById('modal-photo');const img=v?.querySelector('img');if(img){img.src=gallerySrc[selected];img.alt='Ilustração digital: '+galleryTitles[selected];}const c=document.getElementById('modal-count');if(c)c.textContent=galleryTitles[selected];modal.querySelector('.modal-close')?.focus()}
function galleryClose(){if(!modal)return;modal.style.display='none';document.body.style.overflow='';lastGalleryButton?.focus()}
function galleryStep(d){galleryOpen(selected+d)}
document.querySelectorAll('.gallery-cell button').forEach((b,i)=>b.addEventListener('click',()=>{lastGalleryButton=b;galleryOpen(i)}));
modal?.querySelector('.modal-close')?.addEventListener('click',galleryClose);
modal?.addEventListener('click',e=>{if(e.target===modal)galleryClose()});
const mnav=modal?.querySelectorAll('.modal-bottom button');if(mnav?.length===2){mnav[0].addEventListener('click',()=>galleryStep(-1));mnav[1].addEventListener('click',()=>galleryStep(1))}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){galleryClose()}if(modal?.style.display==='grid'){if(e.key==='ArrowLeft')galleryStep(-1);if(e.key==='ArrowRight')galleryStep(1)}});
})();
