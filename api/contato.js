// Endpoint Vercel. Configurar Resend, antispam e política LGPD antes da publicação definitiva.
module.exports=async(req,res)=>{
res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
const {RESEND_API_KEY,CONTACT_TO_EMAIL,CONTACT_FROM_EMAIL}=process.env;
const ready=Boolean(RESEND_API_KEY&&CONTACT_TO_EMAIL&&CONTACT_FROM_EMAIL);
if(req.method==='GET')return res.status(200).json({ok:true,acceptingMessages:ready});
if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return res.status(405).json({ok:false,message:'Método não permitido'});}
if(!ready)return res.status(503).json({ok:false,message:'Envio não configurado'});
const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body||{});
if(raw.length>8000)return res.status(413).json({ok:false,message:'Mensagem extensa demais'});
let p;try{p=typeof req.body==='string'?JSON.parse(req.body):req.body||{};}catch{return res.status(400).json({ok:false,message:'Corpo inválido'});}
const trim=x=>typeof x==='string'?x.trim():'';
if(p.website)return res.status(200).json({ok:true});
const nome=trim(p.nome),email=trim(p.email),unidade=trim(p.unidade),assunto=trim(p.assunto)||'Contato',mensagem=trim(p.mensagem)||'Solicitação de retorno';
if(nome.length<2||nome.length>150||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!['Diadema','Sorocaba','Não sei / ambas'].includes(unidade)||assunto.length>150||mensagem.length>2000||!['on','true',true].includes(p.consentimento))return res.status(400).json({ok:false,message:'Campos inválidos'});
const safe=x=>x.replace(/[<>]/g,'').slice(0,2100);
const lines=['Nome: '+safe(nome),'E-mail: '+safe(email),'Telefone: '+safe(trim(p.telefone)),'Unidade: '+safe(unidade),'Perfil: '+safe(trim(p.perfil)),'Assunto: '+safe(assunto),'Mensagem: '+safe(mensagem)];
try{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:CONTACT_FROM_EMAIL,to:[CONTACT_TO_EMAIL],reply_to:email,subject:'Chroma • '+safe(assunto)+' / '+safe(unidade),text:lines.join('\n')})});if(!r.ok)return res.status(502).json({ok:false,message:'Não foi possível confirmar o envio'});return res.status(200).json({ok:true});}catch{return res.status(502).json({ok:false,message:'Falha de envio'});}
};