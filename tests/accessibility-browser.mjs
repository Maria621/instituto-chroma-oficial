/**
 * Audit all public pages at phone and desktop widths using axe-core.
 * This is automated WCAG sampling, not a screen-reader certification.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root=resolve(process.cwd());
const pages=[
  'index.html','nossa-escola.html','nossa-essencia.html','metodologia.html',
  'estrutura.html','experiencia-chroma.html','unidades.html','novidades.html',
  'aluno-nota-10.html','parcerias.html','contato.html','privacidade.html'
];
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
 '.js':'text/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp',
 '.avif':'image/avif','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  try{
    const pathname=new URL(req.url,'http://127.0.0.1').pathname;
    const path=resolve(root,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));
    if(!path.startsWith(root+sep)){res.writeHead(403);res.end();return;}
    const info=await stat(path);if(!info.isFile())throw Error('Not file');
    res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'});
    res.end(await readFile(path));
  }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const url='http://127.0.0.1:'+server.address().port;
let browser;
const serious=[],moderate=[];
try{
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-dev-shm-usage']});
  for(const width of [390,1440]){
    const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
    for(const filename of pages){
      await page.goto(url+'/'+filename,{waitUntil:'domcontentloaded',timeout:30000});
      await page.addScriptTag({path:resolve(root,'node_modules/axe-core/axe.min.js')});
      const result=await page.evaluate(async()=>
        window.axe.run(document,{
          runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']},
          rules:{'region':{enabled:false}}
        }));
      for(const v of result.violations){
        const item={page:filename,width,rule:v.id,impact:v.impact,
          nodes:v.nodes.slice(0,24).map(n=>({target:n.target.join(' '), info:n.any?.[0]?.data||null})),
          description:v.description};
        if(['critical','serious'].includes(v.impact))serious.push(item);
        else moderate.push(item);
      }
    }
    await page.close();
  }
}finally{
  if(browser)await browser.close();
  await new Promise(done=>server.close(done));
}
console.log('Auditoria WCAG automatizada: '+(pages.length*2)+' telas, '+serious.length+
 ' ocorrências graves e '+moderate.length+' moderadas.');
for(const item of [...serious,...moderate.slice(0,12)])console.log(JSON.stringify(item));
if(serious.length)process.exitCode=1;
