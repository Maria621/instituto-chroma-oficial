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
