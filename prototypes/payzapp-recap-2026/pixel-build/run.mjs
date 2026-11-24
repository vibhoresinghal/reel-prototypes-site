// Builds the Pixel-fi art: node pixel-build/run.mjs  (from the flow folder)
// Serves the flow folder locally, opens pixel-build/index.html in headless Chrome,
// runs window.buildPixelAssets() and writes assets/themes/pixel/px/*.png plus
// manifest.json. Run python build-pixel-art.py first if the scenes changed.
// Chrome path: CHROME env var, else the usual Windows / macOS / Linux locations.
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const flow = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(flow, 'assets', 'themes', 'pixel', 'px');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml' };

const chrome = process.env.CHROME || [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium'
].find(p => fs.existsSync(p));
if (!chrome) throw new Error('Chrome not found; set the CHROME environment variable.');

const server = http.createServer((req, res) => {
    const file = path.join(flow, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(flow) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'pixel-build-'));
const debugPort = 9400 + Math.floor(Math.random() * 500);
const browser = spawn(chrome, ['--headless=new', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });

try {
    let target;
    for (let i = 0; i < 50 && !target; i++) {
        await new Promise(r => setTimeout(r, 200));
        try { target = await (await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { /* not up yet */ }
    }
    if (!target) throw new Error('Chrome did not start.');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let id = 0; const pending = new Map();
    ws.onmessage = e => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
    const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    await new Promise(r => ws.onopen = r);
    await send('Page.enable');
    await send('Page.navigate', { url: `http://127.0.0.1:${port}/pixel-build/index.html` });
    await new Promise(r => setTimeout(r, 1500));
    const res = await send('Runtime.evaluate', { expression: 'window.buildPixelAssets()', awaitPromise: true, returnByValue: true });
    if (res.result?.exceptionDetails || !res.result?.result?.value) throw new Error(JSON.stringify(res.result?.exceptionDetails || res));
    const { files, manifest } = res.result.result.value;

    fs.rmSync(out, { recursive: true, force: true });
    fs.mkdirSync(out, { recursive: true });
    for (const [name, dataUrl] of Object.entries(files)) {
        fs.writeFileSync(path.join(out, name), Buffer.from(dataUrl.split(',')[1], 'base64'));
    }
    fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
    console.log(`Wrote ${Object.keys(files).length} images and manifest.json to ${path.relative(flow, out)}`);
    ws.close();
} finally {
    browser.kill();
    server.close();
    setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* Chrome may still hold it */ } }, 500);
}
