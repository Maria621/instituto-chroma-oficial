/**
 * Visual regression harness — Chroma institutional website.
 *
 * Captures the same six critical pages on the PR base and proposed commit.
 * Fails when unintended visual changes exceed the configured threshold.
 *
 * Usage:
 *   node tests/visual-review.mjs capture baseline before
 *   node tests/visual-review.mjs capture . after
 *   node tests/visual-review.mjs compare
 *
 * Deliberate visual changes require reviewing screenshots in the CI artifact
 * and applying the "visual-approved" pull-request label.
 */
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { resolve, extname, sep, join } from 'node:path';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const output = resolve(process.cwd(), 'artifacts', 'visual-review');
const pages = [
  'index.html',
  'nossa-escola.html',
  'metodologia.html',
  'novidades.html',
  'unidades.html',
  'contato.html'
];
const widths = [390, 1024, 1440];
const allowedFraction = 0.012; // 1.2% of pixels, to avoid font AA false alarms.

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

async function openSite(sourceDir) {
  const root = resolve(process.cwd(), sourceDir);
  const server = createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url, 'http://localhost').pathname;
      const target = resolve(root, '.' + decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
      if (!target.startsWith(root + sep)) {
        res.writeHead(403); res.end(); return;
      }
      const f = await stat(target);
      if (!f.isFile()) throw Error('Not a file');
      res.writeHead(200, { 'Content-Type': mime[extname(target)] || 'application/octet-stream' });
      res.end(await readFile(target));
    } catch {
      res.writeHead(404); res.end();
    }
  });
  await new Promise(resolveReady => server.listen(0, '127.0.0.1', resolveReady));
  return {
    url: 'http://127.0.0.1:' + server.address().port,
    close: () => new Promise(resolveClose => server.close(resolveClose))
  };
}

async function capture(sourceDir, label) {
  if (!['before', 'after'].includes(label)) throw Error('Expected capture label before/after');
  const site = await openSite(sourceDir);
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-dev-shm-usage']
  });
  const issues = [];
  const manifest = [];
  try {
    for (const width of widths) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
        colorScheme: 'light'
      });
      for (const file of pages) {
        const page = await context.newPage();
        const url = site.url + '/' + file;
        const name = file.replace(/\.html$/, '');
        const dest = join(output, label, String(width), name + '.png');
        page.on('pageerror', err => issues.push(label + '/' + width + '/' + file + ': JavaScript: ' + err.message));
        page.on('response', response => {
          const href = response.url();
          if (!href.startsWith(site.url + '/') || response.status() < 400) return;
          // The static test server intentionally has no /api/contato function.
          if (new URL(href).pathname.startsWith('/api/contato')) return;
          issues.push(label + '/' + width + '/' + file + ': recurso HTTP ' + response.status() + ' ' + href);
        });
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.addStyleTag({ content: '* { animation-duration: 0s !important; transition-duration: 0s !important; } html { scroll-behavior: auto !important; }' });
        await page.evaluate(async () => {
          document.querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
          await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 5500))]);
          await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
          document.querySelectorAll('[data-fusion-reveal]').forEach(el => el.classList.add('is-visible'));
        });
        const status = await page.evaluate(() => ({
          width: document.documentElement.scrollWidth,
          viewport: innerWidth,
          brokenImages: [...document.querySelectorAll('img[src]')].filter(img => !img.naturalWidth).map(img => img.getAttribute('src')),
        }));
        if (status.width > status.viewport + 6) issues.push(label + '/' + width + '/' + file + ': horizontal scroll');
        for (const broken of status.brokenImages) issues.push(label + '/' + width + '/' + file + ': imagem inválida ' + broken);
        await mkdir(join(output, label, String(width)), { recursive: true });
        await page.screenshot({ path: dest, fullPage: true, animations: 'disabled', caret: 'hide' });
        manifest.push({ width, page: file, path: dest.replace(output + sep, ''), ...status });
        await page.close();
      }
      await context.close();
    }
  } finally {
    await browser.close();
    await site.close();
  }
  await mkdir(output, { recursive: true });
  await writeFile(join(output, 'manifest-' + label + '.json'), JSON.stringify({ label, manifest, issues }, null, 2) + '\n');
  console.log('Capturas ' + label + ': ' + manifest.length + ' imagens');
  if (issues.length) {
    console.error('Falhas encontradas:\n' + issues.join('\n'));
    process.exitCode = 1;
  }
}

async function compare() {
  const comparisons = [];
  let exceeded = 0;
  await mkdir(join(output, 'diff'), { recursive: true });
  for (const width of widths) {
    for (const file of pages) {
      const name = file.replace(/\.html$/, '') + '.png';
      const oldImage = PNG.sync.read(await readFile(join(output, 'before', String(width), name)));
      const newImage = PNG.sync.read(await readFile(join(output, 'after', String(width), name)));
      const comparable = oldImage.width === newImage.width && oldImage.height === newImage.height;
      let mismatch = 1;
      if (comparable) {
        const delta = new PNG({ width: oldImage.width, height: oldImage.height });
        const count = pixelmatch(
          oldImage.data, newImage.data, delta.data,
          oldImage.width, oldImage.height,
          { threshold: 0.12, includeAA: false }
        );
        mismatch = count / (oldImage.width * oldImage.height);
        if (mismatch > allowedFraction) {
          await mkdir(join(output, 'diff', String(width)), { recursive: true });
          await writeFile(join(output, 'diff', String(width), name), PNG.sync.write(delta));
        }
      }
      const changed = !comparable || mismatch > allowedFraction;
      if (changed) exceeded += 1;
      comparisons.push({
        width,
        page: file,
        before: [oldImage.width, oldImage.height],
        after: [newImage.width, newImage.height],
        changed,
        mismatchedPixelsPercent: +(mismatch * 100).toFixed(3)
      });
    }
  }
  await writeFile(join(output, 'comparison.json'), JSON.stringify({
    allowedPercent: allowedFraction * 100,
    changedScreens: exceeded,
    comparisons
  }, null, 2) + '\n');
  console.log('Comparativo visual: ' + comparisons.length + ' telas; ' + exceeded + ' com diferenças relevantes.');
  comparisons.filter(item => item.changed).forEach(item =>
    console.log(item.width + 'px / ' + item.page + ': ' + item.mismatchedPixelsPercent + '% de diferença')
  );
  if (exceeded && process.env.CHROMA_VISUAL_APPROVED !== 'true') {
    console.error('Mudança visual detectada. Revise as capturas no artifact e solicite aprovação (label visual-approved).');
    process.exitCode = 1;
  }
}

const command = process.argv[2];
if (command === 'capture') await capture(process.argv[3] || '.', process.argv[4]);
else if (command === 'compare') await compare();
else throw Error('Uso: capture <pasta> <before|after> ou compare');
