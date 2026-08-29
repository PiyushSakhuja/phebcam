// Static sanity checks: every id referenced via getElementById in a page's
// inline script must actually exist as an id="" in that page's HTML.
// This catches typos/mismatches that would only otherwise surface in a
// real browser (which this sandbox doesn't have available).

const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { console.log(`PASS: ${name}`); pass++; }
  else { console.log(`FAIL: ${name}`); fail++; }
}

const publicDir = path.join(__dirname, '..', 'public');
const pages = ['index.html', 'phone.html', 'viewer.html'];

for (const page of pages) {
  const html = fs.readFileSync(path.join(publicDir, page), 'utf8');

  const declaredIds = new Set(
    [...html.matchAll(/\bid="([a-zA-Z0-9_-]+)"/g)].map((m) => m[1])
  );

  const referencedIds = new Set(
    [...html.matchAll(/getElementById\('([a-zA-Z0-9_-]+)'\)/g)].map((m) => m[1])
  );

  let allFound = true;
  for (const id of referencedIds) {
    if (!declaredIds.has(id)) {
      console.log(`  -> ${page}: getElementById('${id}') has no matching id="${id}" in HTML`);
      allFound = false;
    }
  }
  check(`${page}: all getElementById references resolve`, allFound);

  // No duplicate ids within a page
  const idList = [...html.matchAll(/\bid="([a-zA-Z0-9_-]+)"/g)].map((m) => m[1]);
  const dupes = idList.filter((id, i) => idList.indexOf(id) !== i);
  check(`${page}: no duplicate ids`, dupes.length === 0);
}

// viewer.html specific: obs-mode class toggling must reference real elements
const viewerHtml = fs.readFileSync(path.join(publicDir, 'viewer.html'), 'utf8');
check('viewer.html: obs-mode class applied to body', /classList\.add\('obs-mode'\)/.test(viewerHtml));

const css = fs.readFileSync(path.join(publicDir, 'style.css'), 'utf8');
check('style.css: .obs-mode rules exist', /body\.obs-mode/.test(css));
check('style.css: phone-view rules exist', /body\.phone-view/.test(css));
check('style.css: viewer-view rules exist', /body\.viewer-view/.test(css));

// phone.html must not auto-start the camera (no getUserMedia call outside a function triggered by a click handler)
const phoneHtml = fs.readFileSync(path.join(publicDir, 'phone.html'), 'utf8');
const hasAutoCallAtTopLevel = /^\s*startCamera\(\);\s*$/m.test(phoneHtml);
check('phone.html: does not auto-invoke startCamera() on load', !hasAutoCallAtTopLevel);
check('phone.html: startCamera is bound to a click handler', /startBtn\.addEventListener\('click', startCamera\)/.test(phoneHtml));

// index.js: room validation regex present
const indexJs = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf8');
check('index.js: room id validation present', /isValidRoomId/.test(indexJs));
check('index.js: no hardcoded TURN credentials', !/turn:.*:.*@/.test(indexJs) && !/credential\s*:\s*['"]/.test(indexJs));

// --- Logo / branding asset checks ---

const requiredAssets = ['logo.png', 'logo-icon.png', 'favicon.png', 'og-image.png'];
for (const asset of requiredAssets) {
  const assetPath = path.join(publicDir, 'assets', asset);
  check(`assets/${asset} exists on disk`, fs.existsSync(assetPath));
}

for (const page of pages) {
  const html = fs.readFileSync(path.join(publicDir, page), 'utf8');

  // Every referenced local asset path (assets/... or /assets/...) must exist.
  const assetRefs = new Set(
    [...html.matchAll(/(?:src|href)="\/?assets\/([a-zA-Z0-9_.-]+)"/g)].map((m) => m[1])
  );
  let allAssetsExist = true;
  for (const asset of assetRefs) {
    const assetPath = path.join(publicDir, 'assets', asset);
    if (!fs.existsSync(assetPath)) {
      console.log(`  -> ${page}: references assets/${asset} which does not exist`);
      allAssetsExist = false;
    }
  }
  check(`${page}: all referenced asset files exist`, allAssetsExist);

  // No Windows-style backslash paths anywhere.
  check(`${page}: no Windows-style backslash paths`, !/assets\\/.test(html));

  // Favicon and manifest must be root-relative (start with /) for Render deployment.
  const faviconMatch = html.match(/<link rel="icon"[^>]*href="([^"]+)"/);
  if (faviconMatch) {
    check(`${page}: favicon href is root-relative`, faviconMatch[1].startsWith('/'));
  }
  const manifestMatch = html.match(/<link rel="manifest"[^>]*href="([^"]+)"/);
  if (manifestMatch) {
    check(`${page}: manifest href is root-relative`, manifestMatch[1].startsWith('/'));
  }
}

// Every meaningful <img> of the logo must have alt="Phebcam"
for (const page of pages) {
  const html = fs.readFileSync(path.join(publicDir, page), 'utf8');
  const logoImgs = [...html.matchAll(/<img[^>]*src="\/?assets\/(logo(?:-icon)?\.png)"[^>]*>/g)];
  let allHaveAlt = true;
  for (const [tag] of logoImgs) {
    if (!/alt="Phebcam"/.test(tag)) {
      console.log(`  -> ${page}: logo image missing alt="Phebcam": ${tag}`);
      allHaveAlt = false;
    }
  }
  if (logoImgs.length > 0) {
    check(`${page}: logo images have alt="Phebcam"`, allHaveAlt);
  }
}

// manifest.json must be valid JSON and reference an existing icon
const manifestPath = path.join(publicDir, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    check('manifest.json is valid JSON', true);
    const iconSrc = manifest.icons && manifest.icons[0] && manifest.icons[0].src;
    const iconPath = iconSrc ? path.join(publicDir, iconSrc.replace(/^\//, '')) : null;
    check('manifest.json icon references an existing file', !!iconPath && fs.existsSync(iconPath));
  } catch (e) {
    check('manifest.json is valid JSON', false);
  }
}

// index.html must carry OG/Twitter metadata without overclaiming
const indexHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
check('index.html: has meta description', /<meta name="description"/.test(indexHtml));
check('index.html: has og:title', /<meta property="og:title"/.test(indexHtml));
check('index.html: has og:image', /<meta property="og:image" content="\/assets\/og-image\.png"/.test(indexHtml));
check('index.html: has twitter:card', /<meta name="twitter:card"/.test(indexHtml));
const latencyClaimText = indexHtml.replace(/doesn['’]t guarantee zero latency/i, '').replace(/does not guarantee zero latency/i, '');
check('index.html: does not claim zero latency', !/\b0\s*ms\b/i.test(latencyClaimText) && !/\bzero latency\b/i.test(latencyClaimText));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
