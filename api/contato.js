// Endpoint Vercel. Configurar Resend, antispam e política LGPD antes da publicação definitiva.
module.exports=async(req,res)=>{
res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
const {RESEND_API_KEY,CONTACT_TO_EMAIL,CONTACT_FROM_EMAIL}=process.env;
const ready=Boolean(RESEND_API_KEY&&CONTACT_TO_EMAIL&&CONTACT_FROM_EMAIL);
if(req.method==='GET')return res.status(200).json({ok:true,acceptingMessages:ready});
if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return res.status(405).json({ok:false,message:'Método não permitido'});}
if(!ready)return res.status(503).json({ok:false,message:'Envio não configurado'});
if(!String(req.headers?.['content-type']||'').toLowerCase().startsWith('application/json'))return res.status(415).json({ok:false,message:'Formato não suportado'});
const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body||{});
if(raw.length>8000)return res.status(413).json({ok:false,message:'Mensagem extensa demais'});
let p;try{p=typeof req.body==='string'?JSON.parse(req.body):req.body||{};}catch{return res.status(400).json({ok:false,message:'Corpo inválido'});}
const trim=x=>typeof x==='string'?x.trim():'';
const units=['Diadema','Sorocaba','Não sei / ambas'];
const profiles=['Responsável por aluno','Aluno(a)','Visitante','Parceiro(a) institucional','Representante de escola','Representante de empresa','Outro'];
const subjects=['Conhecer a escola','Aluno Nota 10','Acompanhamento pedagógico','Atendimento administrativo','Projetos e parcerias','Parceria com escola','Parceria com empresa','Outros assuntos'];
if(p.website)return res.status(200).json({ok:true});
const nome=trim(p.nome),email=trim(p.email),unidade=trim(p.unidade),perfil=trim(p.perfil),assunto=trim(p.assunto),mensagem=trim(p.mensagem),telefone=trim(p.telefone);
if(nome.length<2||nome.length>150||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!units.includes(unidade)||!profiles.includes(perfil)||!subjects.includes(assunto)||mensagem.length<10||mensagem.length>2000||telefone.length>35||!['on','true',true].includes(p.consentimento))return res.status(400).json({ok:false,message:'Campos inválidos'});
const safe=x=>x.replace(/[<>]/g,'').slice(0,2100);
const lines=['Nome: '+safe(nome),'E-mail: '+safe(email),'Telefone: '+safe(telefone),'Unidade: '+safe(unidade),'Perfil: '+safe(perfil),'Assunto: '+safe(assunto),'Mensagem: '+safe(mensagem)];
try{const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:CONTACT_FROM_EMAIL,to:[CONTACT_TO_EMAIL],reply_to:email,subject:'Chroma • '+safe(assunto)+' / '+safe(unidade),text:lines.join('\n')})});if(!r.ok)return res.status(502).json({ok:false,message:'Não foi possível confirmar o envio'});return res.status(200).json({ok:true});}catch{return res.status(502).json({ok:false,message:'Falha de envio'});}
};