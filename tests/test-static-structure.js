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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
