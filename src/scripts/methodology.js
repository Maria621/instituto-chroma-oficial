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
