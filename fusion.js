/* Instituto Chroma · interações complementares V5 */
(()=>{
  'use strict';
  const gallery=document.querySelector('[data-fusion-gallery]');
  if(gallery){
    const slides=[...gallery.querySelectorAll('.fusion-gallery-slide')];
    const dots=[...gallery.querySelectorAll('.fusion-gallery-dot')];
    const title=gallery.querySelector('[data-gallery-title]');
    const description=gallery.querySelector('[data-gallery-description]');
    const credit=gallery.querySelector('[data-gallery-credit]');
    const items=[
      {title:'Um espaço para explorar novas ideias.',description:'Ambientes e propostas que convidam o estudante a experimentar, fazer perguntas e construir caminhos próprios.',credit:'Imagem conceitual · não representa instalações reais'},
      {title:'A prática faz parte da descoberta.',description:'Tecnologia, projetos e desafios aproximam o conteúdo da experiência — com orientação a cada etapa.',credit:'Imagem conceitual · não representa instalações reais'},
      {title:'Aprender é, também, criar conexões.',description:'Pessoas, acompanhamento e novas perspectivas tornam cada trajetória de aprendizagem singular.',credit:'Imagem conceitual · não representa instalações reais'}
    ];
    let current=0,startX=null;
    const modal=document.getElementById('fusion-modal');
    const modalImage=modal?.querySelector('img');
    const modalCaption=modal?.querySelector('p');
    const modalClose=modal?.querySelector('.fusion-modal-close');
    let lastFocus=null;
    function activate(target){
      current=(target+slides.length)%slides.length;
      slides.forEach((img,index)=>{
        const active=index===current;
        img.classList.toggle('is-active',active);
        img.setAttribute('aria-hidden',String(!active));
      });
      dots.forEach((dot,index)=>{
        const active=index===current;
        dot.classList.toggle('is-active',active);
        dot.setAttribute('aria-pressed',String(active));
      });
      if(title) title.textContent=items[current].title;
      if(description) description.textContent=items[current].description;
      if(credit) credit.textContent=items[current].credit;
    }
    gallery.querySelector('[data-gallery-prev]')?.addEventListener('click',()=>activate(current-1));
    gallery.querySelector('[data-gallery-next]')?.addEventListener('click',()=>activate(current+1));
    dots.forEach((dot,index)=>dot.addEventListener('click',()=>activate(index)));
    gallery.addEventListener('keydown',event=>{
      if(event.key==='ArrowLeft'){event.preventDefault();activate(current-1)}
      if(event.key==='ArrowRight'){event.preventDefault();activate(current+1)}
    });
    const media=gallery.querySelector('.fusion-gallery-media');
    media?.addEventListener('touchstart',event=>{startX=event.changedTouches[0]?.screenX??null},{passive:true});
    media?.addEventListener('touchend',event=>{
      if(startX===null) return;
      const delta=(event.changedTouches[0]?.screenX??startX)-startX;
      if(Math.abs(delta)>45)activate(current+(delta<0?1:-1));
      startX=null;
    },{passive:true});
    const open=gallery.querySelector('.fusion-gallery-open');
    function closeModal(){
      if(!modal||modal.hidden)return;
      modal.hidden=true;
      document.body.style.overflow='';
      lastFocus?.focus();
    }
    open?.addEventListener('click',()=>{
      if(!modal||!modalImage)return;
      lastFocus=document.activeElement;
      modalImage.src=slides[current].src;
      modalImage.alt=slides[current].alt;
      if(modalCaption)modalCaption.textContent=items[current].credit;
      modal.hidden=false;
      document.body.style.overflow='hidden';
      modalClose?.focus();
    });
    modalClose?.addEventListener('click',closeModal);
    modal?.addEventListener('click',event=>{if(event.target===modal)closeModal()});
    document.addEventListener('keydown',event=>{
      if(!modal||modal.hidden)return;
      if(event.key==='Escape'){event.preventDefault();closeModal()}
      if(event.key==='Tab'){event.preventDefault();modalClose?.focus()}
    });
    activate(0);
  }
  const revealNodes=[...document.querySelectorAll('[data-fusion-reveal]')];
  if(revealNodes.length){
    if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){
      revealNodes.forEach(el=>el.classList.add('is-visible'));
    }else{
      const observer=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}})
      },{threshold:.08,rootMargin:'0px 0px -30px 0px'});
      revealNodes.forEach(el=>observer.observe(el));
    }
  }
})();
