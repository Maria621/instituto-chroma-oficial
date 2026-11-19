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
const widths = [360, 390, 768, 820, 900, 980, 1024, 1280, 1440];
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
      if (path === 'novidades.html') {
        // O layout final dos banners precisa ser testado após o carregamento
        // das artes, e não apenas após a construção inicial do DOM.
        await page.evaluate(async () => {
          const images = [...document.querySelectorAll('.v31-art-frame img')];
          await Promise.all(images.map(async img => {
            img.loading = 'eager';
            await img.decode().catch(() => {});
          }));
        });
      }
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
        const maxHeight = width >= 1280 ? 790 : width >= 760 ? 870 : width <= 480 ? 800 : 900;
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
      if (path === 'novidades.html' && width <= 980) {
        const imageActions = await page.locator('.v31-art-frame .v31-expand-art').evaluateAll(buttons => {
          return buttons.map(button => {
            const card = button.closest('.v31-art-frame');
            const rect = button.getBoundingClientRect();
            const parent = card.getBoundingClientRect();
            return {
              label: button.textContent.trim(),
              position: getComputedStyle(button).position,
              withinCard: rect.left >= parent.left - 3 &&
                rect.right <= parent.right + 3 &&
                rect.top >= parent.top - 3 &&
                rect.bottom <= parent.bottom + 3
            };
          });
        });
        if (!imageActions.length) problems.push(width + 'px: nenhum controle de ampliar arte encontrado');
        for (const action of imageActions) {
          if (action.position !== 'static' || !action.withinCard) {
            problems.push(width + 'px: ação de imagem posicionada fora da área visível: ' + action.label);
          }
        }
      }
      if (path === 'nossa-escola.html') {
        if (!(await page.locator('#linha-do-tempo .chroma-history-list').count())) {
          problems.push(width + 'px: link História não leva aos marcos de 2016');
        }
        if (!(await page.locator('#atividades-2026 [data-chroma-timeline]').count())) {
          problems.push(width + 'px: faltam os registros de atividades de 2026');
        }
      }
      if (path === 'contato.html') {
        if (!(await page.locator('.chroma-contact-offline').isVisible())) {
          problems.push(width + 'px: orientação de atendimento alternativo ausente');
        }
        if (await page.locator('.v3-form-grid').isVisible()) {
          problems.push(width + 'px: formulário desativado ainda solicita dados');
        }
        if (!(await page.locator('.chroma-contact-offline a').isVisible())) {
          problems.push(width + 'px: link para o canal institucional invisível');
        }
      }
      if (path === 'nossa-escola.html') {
        const contrast = await page.evaluate(() => {
          const rgba = value => {
            const parts = value.match(/[0-9.]+/g);
            return parts ? parts.slice(0,3).map(Number) : [0,0,0];
          };
          const luminance = triplet => triplet.map(value => {
            const c = value / 255;
            return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          }).reduce((sum,value,index) => sum + value * [0.2126,0.7152,0.0722][index],0);
          const ratio = (a,b) => {
            const x = luminance(rgba(a)), y = luminance(rgba(b));
            return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);
          };
          const label = document.querySelector('#traj-tab-0 small');
          const footer = document.querySelector('.chroma-footer-bottom');
          const tabRatio = ratio(getComputedStyle(label).color,getComputedStyle(label.closest('button')).backgroundColor);
          const footerRatio = ratio(getComputedStyle(footer).color,getComputedStyle(footer.closest('.chroma-footer')).backgroundColor);
          return {tabRatio, footerRatio};
        });
        if (contrast.tabRatio < 4.5) problems.push(width + 'px: contraste insuficiente nas abas (' + contrast.tabRatio.toFixed(2) + ':1)');
        if (contrast.footerRatio < 4.5) problems.push(width + 'px: contraste insuficiente no rodapé (' + contrast.footerRatio.toFixed(2) + ':1)');
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

  // Teste isolado do formulário ativo, sem serviço externo nem dados reais.
  const contactPage = await browser.newPage({ viewport: { width: 1024, height: 900 } });
  let simulateProviderFailure = true;
  const submissions = [];
  await contactPage.route('**/api/contato', async route => {
    const request = route.request();
    if (request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, acceptingMessages: true, turnstileSiteKey: 'site-key-test' })
      });
    }
    submissions.push(JSON.parse(request.postData() || '{}'));
    return route.fulfill({
      status: simulateProviderFailure ? 502 : 200,
      contentType: 'application/json',
      body: JSON.stringify(simulateProviderFailure ? {ok:false} : {ok:true})
    });
  });
  await contactPage.route('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: "window.turnstile={render(el,opts){window.__challengeOptions=opts;opts.callback('browser-test-token');return 'widget-1';},reset(){}};"
    })
  );
  try {
    await contactPage.goto(base + '/contato.html', { waitUntil: 'domcontentloaded' });
    await contactPage.waitForFunction(() => document.querySelector('[data-chroma-form]')?.dataset.sendReady === 'true');
    if (!(await contactPage.locator('.v3-form-grid').isVisible())) {
      problems.push('Contato: campos ocultos mesmo com serviço e desafio simulados disponíveis');
    }
    if (await contactPage.locator('.chroma-contact-offline').isVisible()) {
      problems.push('Contato: fallback offline visível indevidamente no modo ativo');
    }
    await contactPage.locator('input[name="nome"]').fill('Teste Chroma');
    await contactPage.locator('input[name="email"]').fill('contato@example.org');
    await contactPage.locator('select[name="unidade"]').selectOption({label:'Diadema'});
    await contactPage.locator('select[name="perfil"]').selectOption({label:'Visitante'});
    await contactPage.locator('select[name="assunto"]').selectOption({label:'Conhecer a escola'});
    await contactPage.locator('textarea[name="mensagem"]').fill('Gostaria de conhecer os projetos pedagógicos e as aulas.');
    await contactPage.locator('input[name="consentimento"]').check();

    await contactPage.locator('button[type="submit"]').click();
    await contactPage.waitForFunction(() =>
      document.querySelector('.v3-form-notice')?.textContent.includes('Não foi possível confirmar'));
    if (submissions.length !== 1 || submissions[0]['cf-turnstile-response'] !== 'browser-test-token') {
      problems.push('Contato: token de desafio ausente ou requisição duplicada');
    }
    if ((await contactPage.locator('.v3-form-notice').innerText()).includes('encaminhada')) {
      problems.push('Contato: falha do serviço exibida como sucesso');
    }

    simulateProviderFailure = false;
    await contactPage.evaluate(() => window.__challengeOptions.callback('browser-test-token'));
    await contactPage.locator('button[type="submit"]').click();
    await contactPage.waitForFunction(() =>
      document.querySelector('.v3-form-notice')?.textContent.includes('Solicitação encaminhada'));
    if (submissions.length !== 2) {
      problems.push('Contato: envio aceito não foi encaminhado exatamente uma vez');
    }
  } finally {
    await contactPage.close();
  }
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
