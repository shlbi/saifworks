// One-time, guarded migration. Executed and tested on the checkout before publishing.
'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {iconizeText}=require('../ui-icons.js');
assert.equal(execFileSync('git',['hash-object','index.html'],{encoding:'utf8'}).trim(),'e4c142082bc41f4b78041dbd03e90322e25c0fc5','Source changed; inspect and reconcile rather than overwrite.');
let html=fs.readFileSync('index.html','utf8');
function replaceOnce(before,after){assert.equal(html.split(before).length-1,1,`Expected one source marker: ${before.slice(0,90)}`);html=html.replace(before,()=>after);}
const parallaxLine=html.match(/^parallax:\{screenshot:(\{.*?\}),name:'Parallax'.*$/m);
assert(parallaxLine,'Parallax project data not found');
const screenshot=JSON.parse(parallaxLine[1]);
assert.equal(screenshot.src,'/assets/project-screenshots/parallax.png');
screenshot.caption='The Northlight demo: people, organizations, and research documents linked in one view. Fictional case; static screenshot.';
const project={screenshot,name:'Parallax',number:'02',status:'Interactive prototype',intro:'An investigation dashboard for mapping connections between people, organizations, places, and documents. Follow a connection, check the source behind it, and see how the case unfolds over time.',idea:'Explore relationships, inspect the evidence behind each link, and follow a case through its map and timeline.',demo:'Start with the fictional Northlight case. Select Alex Mercer, explore the connected people and research documents, and inspect the evidence behind a relationship.',link:'https://parallax-steel-chi.vercel.app/',linkText:'Explore Parallax demo ↗'};
replaceOnce(parallaxLine[0],'parallax:'+JSON.stringify(project)+',');
replaceOnce('Explore Parallax, a live intelligence platform','Explore Parallax, an interactive relationship and evidence-mapping prototype');
replaceOnce('Scattered signals. A clearer picture.','Map people, organizations, and the evidence linking them.');
replaceOnce('AI / INTELLIGENCE<br>LIVE PROJECT','RESEARCH / EVIDENCE<br>INTERACTIVE PROTOTYPE');
const helpers=`function projectQuickStartHTML(key){
  if(key!=='parallax')return '';
  return \`<div class="project-quickstart"><a class="project-launch" href="\${projects[key].link}" target="_blank" rel="noopener noreferrer">Explore the Parallax demo ↗</a><p>No setup. Open a fictional case and explore the connections.</p></div>\`;
}
function projectDetailsHTML(key){
  const p=projects[key];
  if(key!=='parallax')return \`<div class="dialog-details"><div><h3>The idea</h3><p>\${p.idea}</p></div><div><h3>What you’re seeing</h3><p>\${p.demo}</p></div></div>\`;
  return \`<section class="case-workflow" aria-label="What you can do in Parallax"><div class="case-step"><span class="step-number">01 / CONNECT</span><h3>Follow relationships</h3><p>Click a person or organization to explore its connections. Filter the graph by relationship type to focus on what matters.</p></div><div class="case-step"><span class="step-number">02 / VERIFY</span><h3>Check the evidence</h3><p>Inspect the source and review status behind a link. See which claims are supported, disputed, or still need review.</p></div><div class="case-step"><span class="step-number">03 / REPLAY</span><h3>Use time and place</h3><p>Explore mapped locations and replay the case timeline to see how the connections fit together over time.</p></div></section><div class="case-example"><strong>Try this:</strong> Open the Northlight demo and select Alex Mercer. Follow the links to the lab, people, and research documents, then inspect the evidence behind a connection.</div><p class="prototype-note">The current demo uses fictional data and scripted assistant responses. Live data collection and AI analysis are planned.</p>\`;
}
`;
replaceOnce('function openProject(key){',helpers+'function openProject(key){');
replaceOnce('${projectPreviewHTML(key)}<div class="dialog-details"><div><h3>The idea</h3><p>${p.idea}</p></div><div><h3>What you’re seeing</h3><p>${p.demo}</p></div></div>','${projectQuickStartHTML(key)}${projectPreviewHTML(key)}${projectDetailsHTML(key)}');
// Canvas text can also fall back to Apple Color Emoji. Draw this mark as geometry.
replaceOnce('ctx.fillText(o.word,0,1);',`if(o.word==='\\u2197'){const a=o.r*.28;ctx.beginPath();ctx.moveTo(-a,a);ctx.lineTo(a,-a);ctx.moveTo(-a,-a);ctx.lineTo(a,-a);ctx.lineTo(a,a);ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=Math.max(1.6,o.r*.065);ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke()}else{ctx.fillText(o.word,0,1);}`);
replaceOnce('</head>','<meta name="saifworks-ui-release" content="vector-icons-v1">\n<link rel="stylesheet" href="/ui-polish.css?v=1">\n</head>');
replaceOnce('</body>','<script src="/ui-icons.js?v=1"></script>\n</body>');
// Preserve tags, attributes, artwork SVGs, styles, and JS verbatim. Convert only
// literal HTML text, so icons are already vectors even before JS runs.
html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<svg\b[^>]*>[\s\S]*?<\/svg\s*>|<!--([\s\S]*?)-->|<[^>]+>|[^<]+/gi,token=>token.startsWith('<')?token:iconizeText(token));
assert(!html.includes('A visual workspace for connecting public signals'));
assert.equal((html.match(/class="project-card"/g)||[]).length,3);
assert(html.includes('src="/assets/hero-collage.webp"'));
assert(html.includes('data-ui-icon="asterisk"'));
fs.writeFileSync('index.html',html);
let readme=fs.readFileSync('README.md','utf8');
readme=readme.replace(/^- \*\*Parallax\*\*.*$/m,'- **Parallax** — [interactive evidence-mapping prototype](https://parallax-steel-chi.vercel.app/): explore relationships, inspect sources, and replay a fictional case. Live research integrations and model-backed analysis are planned.');
readme+='\n## Consistent mobile icons\n\nInterface symbols use inline SVG paths, not platform emoji glyphs. `ui-icons.js` shares the icon registry between source markup and dynamic dialogs/controls. The playground arrow is drawn with canvas paths. Project screenshots still appear only after opening a project.\n\nRun `node tests/verify-mobile-icons.mjs` with Playwright Chromium and WebKit installed to check vectors, narrow layouts, prototype copy, dialog navigation, and the screenshot-only-after-click contract.\n';
fs.writeFileSync('README.md',readme);
console.log(JSON.stringify({vectorIcons:(html.match(/data-ui-icon=/g)||[]).length,projectCount:3,parallax:'concrete prototype copy',screenshots:'unchanged assets; dialogs only'}));
