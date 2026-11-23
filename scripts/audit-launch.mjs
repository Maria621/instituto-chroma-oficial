/**
 * Verifica metadados e limites técnicos da prévia.
 * --check-pages: falha por inconsistência técnica, mantendo noindex.
 * --release: falha se dados, privacidade, fotos ou canal não estiverem aprovados.
 * --write-sitemap: só gera sitemap.xml após aprovação de lançamento.
 */
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const root=resolve(process.cwd());
const domain='https://instituto-chroma-oficial.vercel.app';
const files=(await readdir(root)).filter(x=>x.endsWith('.html')).sort();
const strict=process.argv.includes('--release')||process.argv.includes('--write-sitemap');
const buildSitemap=process.argv.includes('--write-sitemap');
if(process.argv.slice(2).some(x=>!['--check-pages','--release','--write-sitemap'].includes(x)))throw Error('Argumento inválido');
const errors=[],blockers=[],urls=[];
if(files.length!==12)errors.push('Esperadas 12 páginas HTML, encontradas '+files.length);
for(const filename of files){
  const html=await readFile(join(root,filename),'utf8');
  const canonical=domain+(filename==='index.html'?'/':'/'+filename);
  urls.push(canonical);
  for(const required of [
    '<html lang="pt-BR">','<link rel="canonical" href="'+canonical+'">',
    '<meta property="og:url" content="'+canonical+'">',
    '<meta property="og:locale" content="pt_BR">',
    '<link rel="stylesheet" href="site.css">'
  ])if(!html.includes(required))errors.push(filename+': ausente '+required.slice(0,90));
  const noindex=/<meta name="robots" content="[^"]*noindex/.test(html);
  if(!noindex&&process.env.CHROMA_LAUNCH_APPROVED!=='true')errors.push(filename+': indexação alterada sem autorização formal');
  if(strict&&noindex)blockers.push(filename+': ainda marcado noindex');
  if(/<link rel="stylesheet" href="(?:tokens|style|fusion|v31|quality)\.css">/.test(html))errors.push(filename+': CSS legado ainda bloqueia renderização');
  if(!/<meta name="description" content="[^"]{50,220}">/.test(html))errors.push(filename+': descrição ausente/fora de faixa');
  if((html.match(/<h1\b/g)||[]).length!==1)errors.push(filename+': precisa ter um H1');
}
const home=await readFile(join(root,'index.html'),'utf8');
if(!home.includes('rel="preload" as="image" href="assets/visual-hero.avif"'))errors.push('Home: imagem LCP não pré-carregada');
if(!home.includes('fetchpriority="high"'))errors.push('Home: imagem LCP sem prioridade');
const structured=home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
try{
 const data=JSON.parse(structured?.[1]||'');
 if(data['@type']!=='EducationalOrganization'||data.foundingDate!=='2016')throw Error('Dados institucionais inconsistentes');
}catch{errors.push('Home: dados estruturados ausentes/inválidos');}
const siteSize=(await stat(join(root,'site.css'))).size;
if(siteSize>210000)errors.push('CSS acima do orçamento bruto de 210 KB: '+siteSize);
const scripts=['app.js','v31.js','fusion.js','timeline.js','contact.js'];
let scriptBytes=0;
for(const name of scripts)scriptBytes+=(await stat(join(root,name))).size;
if(scriptBytes>70000)errors.push('JavaScript acima do orçamento bruto de 70 KB: '+scriptBytes);
if(strict){
 const privacy=await readFile(join(root,'privacidade.html'),'utf8');
 const units=await readFile(join(root,'unidades.html'),'utf8');
 if(/MINUTA|REVISÃO PENDENTE|revisão jurídica|política de privacidade definitiva/i.test(privacy))blockers.push('Privacidade: minuta ainda não aprovada');
 if(/endereç[^<]{0,80}confirmar|ainda não h[aá] endereç|confirmar com a equipe/i.test(units))blockers.push('Unidades: endereços de visita não verificados');
 if(/composição gráfica ilustrativa|não é foto da unidade/i.test(units))blockers.push('Unidades: fotografias reais autorizadas não incorporadas');
 if(process.env.CONTACT_PRIVACY_APPROVED!=='true')blockers.push('Contato: aprovação de privacidade não fornecida');
 for(const k of ['RESEND_API_KEY','CONTACT_TO_EMAIL','CONTACT_FROM_EMAIL','TURNSTILE_SITE_KEY','TURNSTILE_SECRET_KEY','CONTACT_ALLOWED_ORIGIN']){
  if(!process.env[k])blockers.push('Contato: falta configuração de '+k);
 }
 if(process.env.CHROMA_LAUNCH_APPROVED!=='true')blockers.push('Lançamento: falta CHROMA_LAUNCH_APPROVED=true após aprovação formal');
}
console.log('Pré-voo Chroma: '+files.length+' páginas, CSS '+siteSize+' B, JS '+scriptBytes+' B, '+errors.length+' problemas técnicos, '+blockers.length+' bloqueios de lançamento.');
for(const issue of errors)console.error('ERRO: '+issue);
for(const issue of blockers)console.error('PENDENTE: '+issue);
if(!errors.length&&!blockers.length&&buildSitemap){
 const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
 urls.map(url=>'  <url><loc>'+url+'</loc></url>').join('\n')+'\n</urlset>\n';
 await writeFile(join(root,'sitemap.xml'),xml);
 console.log('Sitemap gerado após aprovação: '+urls.length+' URLs.');
}
if(errors.length||(strict&&blockers.length))process.exitCode=1;
