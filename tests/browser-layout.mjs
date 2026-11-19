/**
 * Teste de integridade visual para o Instituto Chroma.
 * Executar depois de instalar playwright: node tests/browser-layout.mjs
 * Testa páginas em diferentes larguras, clipping de texto e navegação.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve(process.cwd());
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const target = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!target.startsWith(root + sep)) {
      res.writeHead(403); res.end(); return;
    }
    const file = await stat(target);
    if (!file.isFile()) { res.writeHead(404); res.end(); return; }
    const bytes = await readFile(target);
    res.writeHead(200, { 'Content-Type': mime[extname(target)] || 'application/octet-stream' });
    res.end(bytes);
  } catch {
    res.writeHead(404); res.end();
  }
});

const listen = () => new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser = null;
const problems = [];
const widths = [360, 390, 768, 1024, 1280, 1440];
const paths = [
  'index.html', 'nossa-escola.html', 'nossa-essencia.html',
  'metodologia.html', 'estrutura.html', 'experiencia-chroma.html',
  'unidades.html', 'novidades.html', 'aluno-nota-10.html',
  'parcerias.html', 'contato.html', 'privacidade.html'
];
try {
  await listen();
  const base = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-dev-shm-usage'] });
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    for (const path of paths) {
      await page.goto(base + '/' + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.evaluate(async () => {
        await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 1700))]);
      });
      const issues = await page.evaluate(() => {
        const tolerance = 6;
        const failures = [];
        const isHidden = el => {
          if (el.closest('[hidden], [aria-hidden="true"]')) return true;
          const style = getComputedStyle(el);
          return style.display === 'none' || style.visibility === 'hidden';
        };
        const candidates = document.querySelectorAll('main h1, main h2, main h3, main p, main li, main button, main a');
        for (const element of candidates) {
          if (isHidden(element) || !element.textContent.trim()) continue;
          const rect = element.getBoundingClientRect();
          if (rect.width < 2 || rect.height < 2) continue;
          const style = getComputedStyle(element);
          const name = element.tagName.toLowerCase();
          const label = element.textContent.replace(/\s+/g, ' ').trim().slice(0, 55);
          if (style.textOverflow === 'ellipsis' || (style.webkitLineClamp && style.webkitLineClamp !== 'none')) {
            failures.push(name + ' truncado: ' + label);
          }
          if (element.clientWidth > 0 && element.scrollWidth > element.clientWidth + tolerance &&
              /(hidden|clip)/.test(style.overflowX)) {
            failures.push(name + ' largura cortada: ' + label);
          }
          if (element.clientHeight > 0 && element.scrollHeight > element.clientHeight + tolerance &&
              /(hidden|clip)/.test(style.overflowY)) {
            failures.push(name + ' altura cortada: ' + label);
          }
          // Tabs horizontais possuem rolagem deliberada: não são texto cortado.
          if (element.closest('.chroma-timeline-tabs')) continue;
          if (rect.left < -tolerance || rect.right > innerWidth + tolerance) {
            failures.push(name + ' fora da tela (' + Math.round(rect.left) + '/' + Math.round(rect.right) + '): ' + label);
          }
          for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
            const cs = getComputedStyle(parent);
            if (!/(hidden|clip)/.test(cs.overflowX + ',' + cs.overflowY)) continue;
            const clip = parent.getBoundingClientRect();
            if (rect.bottom > clip.bottom + tolerance || rect.top < clip.top - tolerance ||
                rect.right > clip.right + tolerance || rect.left < clip.left - tolerance) {
              failures.push(name + ' atrás de área recortada: ' + label);
            }
            break;
          }
        }
        return [...new Set(failures)].slice(0, 16);
      });
      for (const issue of issues) problems.push(width + 'px / ' + path + ': ' + issue);
      if (path === 'index.html') {
        const hero = await page.evaluate(async () => {
          const section = document.querySelector('.fusion-hero');
          const image = document.querySelector('.fusion-visual-frame img');
          const frame = document.querySelector('.fusion-visual-frame');
          await image.decode().catch(() => {});
          const bounds = section.getBoundingClientRect();
          const pictureBounds = image.getBoundingClientRect();
          const style = getComputedStyle(image);
          return {
            heroHeight: Math.ceil(bounds.height),
            imageNaturalWidth: image.naturalWidth,
            imageNaturalHeight: image.naturalHeight,
            declaredWidth: Number(image.getAttribute('width')),
            declaredHeight: Number(image.getAttribute('height')),
            objectFit: style.objectFit,
            imageTransform: style.transform,
            frameOverflow: getComputedStyle(frame).overflow,
            pictureInViewport: pictureBounds.left >= -6 &&
              pictureBounds.right <= innerWidth + 6
          };
        });
        console.log('Banner ' + width + 'px: ' + JSON.stringify(hero));
        const maxHeight = width >= 1280 ? 790 : width >= 760 ? 870 : 1080;
        if (hero.heroHeight > maxHeight) {
          problems.push(width + 'px: banner muito alto (' + hero.heroHeight + 'px / limite ' + maxHeight + 'px)');
        }
        if (hero.imageNaturalWidth !== 1100 || hero.imageNaturalHeight !== 619 ||
            hero.declaredWidth !== 1100 || hero.declaredHeight !== 619) {
          problems.push(width + 'px: proporções da imagem principal não correspondem ao arquivo');
        }
        if (hero.objectFit !== 'contain' || hero.imageTransform !== 'none' ||
            hero.frameOverflow !== 'visible' || !hero.pictureInViewport) {
          problems.push(width + 'px: arte principal ainda pode ser recortada');
        }
      }
    }
    // Navegação em janela responsiva.
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    const menu = page.locator('#mobile-menu');
    if (width <= 1300) {
      if (!(await menu.isVisible())) problems.push(width + 'px: menu móvel invisível');
      else {
        await menu.click();
        if ((await menu.getAttribute('aria-expanded')) !== 'true') problems.push(width + 'px: menu não abre');
        await page.keyboard.press('Escape');
        if ((await menu.getAttribute('aria-expanded')) !== 'false') problems.push(width + 'px: menu não fecha por Escape');
      }
    } else if (await menu.isVisible()) {
      problems.push(width + 'px: menu móvel visível junto da navegação desktop');
    }
    await page.close();
  }
  // Interações de conteúdo prioritárias.
  const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
  await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-gallery-next]').click();
  if (!(await page.locator('.fusion-gallery-slide').nth(1).getAttribute('class')).includes('is-active')) {
    problems.push('Galeria: próxima imagem não selecionada');
  }
  await page.locator('.fusion-gallery-open').click();
  if (!(await page.locator('#fusion-modal').evaluate(node => node.open))) problems.push('Galeria: modal não abre');
  await page.keyboard.press('Escape');
  if (await page.locator('#fusion-modal').evaluate(node => node.open)) problems.push('Galeria: Escape não fecha modal');
  await page.goto(base + '/nossa-escola.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#traj-tab-1').click();
  if (await page.locator('#traj-panel-1').isHidden()) problems.push('Linha do tempo: aba não troca o painel');
  await page.locator('[data-timeline-next]').click();
  if (await page.locator('#traj-panel-2').isHidden()) problems.push('Linha do tempo: seta seguinte não funciona');
  await page.close();
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
if (problems.length) {
  console.error('Problemas de layout/interação (' + problems.length + '):\n' + problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Layout aprovado em ' + widths.join(', ') + 'px para ' + paths.length + ' páginas; menus, galeria e linha do tempo funcionais.');
}
