/**
 * Instituto Chroma: fonte CSS modular, deploy de arquivos estáticos.
 * node scripts/build-css.mjs [--check]
 * Todos os tokens são declarados exclusivamente em src/styles/tokens.css.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
const root = resolve(process.cwd());
const check = process.argv.includes('--check');
if (process.argv.slice(2).some(arg => arg !== '--check')) throw Error('Argumento desconhecido');
const source = join(root, 'src', 'styles');
const manifest = JSON.parse(await readFile(join(source, 'manifest.json'), 'utf8'));
const names = ['tokens.css', 'style.css', 'v31.css', 'fusion.css', 'quality.css'];
const targets = Object.keys(manifest.outputs ?? {});
if (targets.length !== 4 || targets.some(name => !names.includes(name))) throw Error('Manifesto CSS inesperado');
const tokens = await readFile(join(source, 'tokens.css'), 'utf8');
const declarations = [...tokens.matchAll(/--([\w-]+)\s*:\s*([^;}\n]+)/g)];
const defined = new Set();
for (const [, name] of declarations) {
  if (defined.has(name)) throw Error('Token duplicado: --' + name);
  defined.add(name);
}
if (tokens.match(/:root\s*\{/g)?.length !== 1 ||
    !['sans', 'body', 'chroma-yellow', 'brand-space-1'].every(x => defined.has(x))) {
  throw Error('Definições centrais de tokens ausentes');
}
const built = new Map([['tokens.css', tokens]]);
const used = new Set();
for (const [target, parts] of Object.entries(manifest.outputs)) {
  if (!Array.isArray(parts) || !parts.length) throw Error('Nenhum módulo em '+target);
  const css = [];
  for (const part of parts) {
    if (!/^src\/styles\/(?:base|components|pages|quality)\/[a-z0-9-]+\.css$/.test(part) ||
        used.has(part) || !resolve(root, part).startsWith(source + sep)) {
      throw Error('Módulo inválido/repetido: '+part);
    }
    used.add(part);
    const raw = await readFile(resolve(root, part), 'utf8');
    if (/:root\s*\{/.test(raw)) throw Error('Tokens de :root fora da fonte única: '+part);
    css.push(raw);
  }
  built.set(target, css.join(''));
}
const important = [...built.values()].reduce((n,s)=>n+(s.match(/!important/g)||[]).length,0);
if (important > 55) throw Error('Novas regras !important: '+important+' > 55 existentes');
const references = [...[...built.values()].join('\n').matchAll(/var\(\s*--([\w-]+)/g)].map(x=>x[1]);
const missing = [...new Set(references.filter(name=>!defined.has(name)))];
if (missing.length) throw Error('Variáveis não declaradas: '+missing.join(', '));
let identical=0;
const pending=[];
for (const name of names) {
  let actual = null;
  try { actual = await readFile(join(root,name),'utf8'); }
  catch(e) { if (e.code!=='ENOENT') throw e; }
  if (actual===built.get(name)) identical++;
  else if(check) pending.push(name);
  else await writeFile(join(root,name),built.get(name));
}
if (pending.length) {
  console.error('CSS desatualizado: '+pending.join(', ')+'. Execute node scripts/build-css.mjs');
  process.exitCode=1;
} else {
  console.log((check?'CSS verificado':'CSS gerado')+': 5 arquivos; '+identical+
    ' idênticos; '+defined.size+' tokens centralizados; '+important+' !important existentes.');
}
