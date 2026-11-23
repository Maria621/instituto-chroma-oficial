/**
 * Build browser-ready JS from isolated feature modules; no client build system.
 * Usage: node scripts/build-js.mjs [--check]
 */
import { readFile, writeFile } from 'node:fs/promises';
import { Script } from 'node:vm';
import { resolve } from 'node:path';
const root = resolve(process.cwd());
const check = process.argv.includes('--check');
if (process.argv.slice(2).some(arg=>arg!=='--check'))throw Error('Argumento inválido');
const manifest=JSON.parse(await readFile(resolve(root,'src/scripts/manifest.json'),'utf8'));
const validOutputs=['app.js','v31.js','fusion.js','timeline.js','contact.js'];
const keys=Object.keys(manifest.outputs||{});
if(keys.length!==validOutputs.length||keys.some(k=>!validOutputs.includes(k)))throw Error('Manifesto JS inválido');
const used=new Set(),stale=[];
for(const [output,parts] of Object.entries(manifest.outputs)){
  if(!Array.isArray(parts)||!parts.length)throw Error('Componentes ausentes em '+output);
  const fragments=[];
  for(const part of parts){
    if(!/^src\/scripts\/[a-z0-9-]+\.js$/.test(part)||used.has(part))throw Error('Módulo inválido ou repetido '+part);
    used.add(part);
    const text=await readFile(resolve(root,part),'utf8');
    new Script(text,{filename:part});
    fragments.push(text.trimEnd());
  }
  const code=fragments.join('\n\n')+'\n';
  new Script(code,{filename:output});
  let prior=null;
  try{prior=await readFile(resolve(root,output),'utf8');}
  catch(e){if(e.code!=='ENOENT')throw e;}
  if(prior!==code){
    if(check)stale.push(output);
    else await writeFile(resolve(root,output),code);
  }
}
if(stale.length){console.error('JS desatualizado: '+stale.join(', '));process.exitCode=1;}
else console.log('JavaScript '+(check?'verificado':'gerado')+': 5 arquivos, '+used.size+' componentes isolados.');
