/* Pixel-fi art pipeline. Runs once at build time (see run.mjs), never in the app.
   Produces assets/themes/pixel/px/<name>.png plus manifest.json, which theme.js
   reads to swap each original asset for its pixel version and to colour each
   card's page from the top edge of its art.

   Three kinds of input:
   - scene:  the six card backgrounds are hand-drawn pixel scenes (SVGs made by
             build-pixel-art.py) rasterised at the original size;
   - BG:     other full-card art is pixelated with big blocks, snapped to the theme
             palette with ordered (Bayer) dithering;
   - obj(n): objects on the cards keep their colours, posterised, in n-px blocks;
   - bands:  the final spread's stepped violet-to-pink sky. */
(function () {
    const PIXEL_PALETTE = [
        '#1B0F4A', '#2A1680', '#4A2BD6', '#6B44F2', '#A98BFF', '#DCD0FF', '#F3EEFF', '#FFFFFF',
        '#C24FE0', '#FF7AD0', '#FFC2EA', '#FFE3F1', '#CDF34B', '#8FC21B', '#E9FBB0',
        '#7FE6FF', '#BDEFFF', '#3A8DF0', '#FFE45C', '#FFF3C4'
    ].map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
    const BG = { block: 10, dither: true };
    const obj = block => ({ block, dither: false });

    const PIXEL_ART = {};
    [1, 2, 3, 4, 5, 6].forEach(n => {
        PIXEL_ART[`assets/illustration${n}.png`] = { scene: `assets/themes/pixel/scenes/scene${n}.svg` };
    });
    ['share-illustration1', 'share-illustration2', 'share-illustration3', 'share-illustration4',
        'share-illustration5', 'share-illustration6', 'share-illustration-final']
        .forEach(name => { PIXEL_ART[`assets/${name}.png`] = BG; });
    [['currency-note', 6], ['smartphone', 6], ['handshake', 6], ['l-hand', 6], ['r-hand', 6],
        ['bubble1', 5], ['bubble2', 5], ['bubble3', 5], ['bubble4', 5], ['heart', 4],
        ['calendar', 5], ['calendar-tick', 5], ['chai', 5], ['steam', 5],
        ['product-iphone', 6], ['product-ps5', 6], ['product-samsung', 6], ['product-speaker', 6], ['product-watch', 6],
        ['vehicle-aprilia', 6], ['vehicle-byd', 6], ['vehicle-compass', 6], ['vehicle-defender', 6], ['vehicle-enfield', 6],
        ['vehicle-fortuner', 6], ['vehicle-mercedes', 6], ['vehicle-thar', 6], ['vehicle-tiago', 6],
        ['feature-1', 4], ['feature-2', 4], ['feature-3', 4], ['feature-4', 4], ['feature-5', 4], ['feature-6', 4],
        ['autopay-icons', 3]]
        .forEach(([name, block]) => { PIXEL_ART[`assets/${name}.png`] = obj(block); });
    PIXEL_ART['assets/outro-top.png'] = { bands: ['#3F2AD0', '#6A35E2'], corners: 'top' };
    PIXEL_ART['assets/outro-bottom.png'] = { bands: ['#6A35E2', '#A646D9'], corners: 'bottom' };

    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    function nearest(r, g, b) {
        let best = PIXEL_PALETTE[0], bestD = Infinity;
        for (const c of PIXEL_PALETTE) {
            const rm = (r + c[0]) / 2, dr = r - c[0], dg = g - c[1], db = b - c[2];
            const d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
            if (d < bestD) { bestD = d; best = c; }
        }
        return best;
    }
    const mix = (a, b, f) => '#' + [1, 3, 5].map(i => {
        const x = parseInt(a.slice(i, i + 2), 16), y = parseInt(b.slice(i, i + 2), 16);
        return Math.round(x + (y - x) * f).toString(16).padStart(2, '0');
    }).join('');
    const load = src => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Could not load ${src}`));
        img.src = `../${src}`;
    });
    const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

    /* Most common colour across the top rows: the page above the fold uses it. */
    function topColor(ctx, w, h) {
        const rows = Math.min(h, 24);
        const d = ctx.getImageData(0, 0, w, rows).data, counts = new Map();
        for (let i = 0; i < d.length; i += 4) {
            if (d[i + 3] < 200) continue;
            const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
            counts.set(key, (counts.get(key) || 0) + 1);
        }
        const top = [...counts].sort((a, b) => b[1] - a[1])[0];
        return top ? `#${top[0].toString(16).padStart(6, '0').toUpperCase()}` : null;
    }

    function bandedPage(width, height, [from, to], corners) {
        const c = canvasOf(width, height), cx = c.getContext('2d');
        const bands = 10, bh = Math.ceil(height / bands);
        for (let i = 0; i < bands; i++) {
            cx.fillStyle = mix(from, to, i / (bands - 1));
            cx.fillRect(0, i * bh, width, bh);
        }
        const u = Math.round(width / 13), rowsU = Math.floor(height / u);
        const cells = corners === 'top'
            ? [[0, 0, .16], [1, 0, .1], [0, 1, .1], [12, 0, .16], [11, 0, .1], [12, 1, .1], [12, 3, .07]]
            : [[0, rowsU - 1, .1], [0, rowsU - 3, .07], [1, rowsU - 1, .07], [12, rowsU - 1, .1], [12, rowsU - 2, .07]];
        cells.forEach(([x, y, a]) => { cx.fillStyle = `rgba(255,255,255,${a})`; cx.fillRect(x * u, y * u, u, u); });
        return { canvas: c, top: null };
    }

    function pixelated(img, { block, dither }) {
        const W = img.naturalWidth, H = img.naturalHeight;
        const w = Math.max(1, Math.round(W / block)), h = Math.max(1, Math.round(H / block));
        const small = canvasOf(w, h), sc = small.getContext('2d', { willReadFrequently: true });
        sc.imageSmoothingQuality = 'high';
        sc.drawImage(img, 0, 0, w, h);
        const data = sc.getImageData(0, 0, w, h), d = data.data;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4;
                if (d[i + 3] < 128) { d[i + 3] = 0; continue; }
                d[i + 3] = 255;
                if (dither) {
                    const t = (BAYER[(y % 4) * 4 + (x % 4)] / 16 - 0.5) * 10;
                    const c = nearest(d[i] + t, d[i + 1] + t, d[i + 2] + t);
                    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
                } else {
                    for (let k = 0; k < 3; k++) d[i + k] = Math.min(255, Math.round(d[i + k] / 36.43) * 36.43);
                }
            }
        }
        sc.putImageData(data, 0, 0);
        const big = canvasOf(W, H), bc = big.getContext('2d', { willReadFrequently: true });
        bc.imageSmoothingEnabled = false;
        bc.drawImage(small, 0, 0, W, H);
        return { canvas: big, top: dither ? topColor(bc, W, H) : null };
    }

    async function build(src, opts) {
        const original = await load(src);
        if (opts.bands) return bandedPage(original.naturalWidth, original.naturalHeight, opts.bands, opts.corners);
        if (opts.scene) {
            const scene = await load(opts.scene);
            const c = canvasOf(original.naturalWidth, original.naturalHeight);
            const cx = c.getContext('2d', { willReadFrequently: true });
            cx.imageSmoothingEnabled = false;
            cx.drawImage(scene, 0, 0, c.width, c.height);
            return { canvas: c, top: topColor(cx, c.width, c.height) };
        }
        return pixelated(original, opts);
    }

    /* Entry point used by run.mjs: every output as a PNG data URL plus the manifest. */
    window.buildPixelAssets = async () => {
        const files = {}, manifest = {};
        for (const [src, opts] of Object.entries(PIXEL_ART)) {
            const { canvas, top } = await build(src, opts);
            const name = src.replace(/^assets\//, '');
            files[name] = canvas.toDataURL('image/png');
            manifest[src] = top ? { file: `assets/themes/pixel/px/${name}`, top } : { file: `assets/themes/pixel/px/${name}` };
        }
        return { files, manifest };
    };
})();
