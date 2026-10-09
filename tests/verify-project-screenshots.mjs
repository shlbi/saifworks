// Regression checks: original cards first, exact user screenshots only after opening.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:8765';
const phase = process.env.TEST_PHASE || 'live';
const expected = {
  repot: {title:'REPOT',width:1904,height:943,url:'https://getrepot.com',sha:'839d4ce5b85e8eec51d3f178d3a0da3da06753d9153fa5fe9aebc9388734aec6'},
  parallax: {title:'Parallax',width:1919,height:942,url:'https://parallax-steel-chi.vercel.app/',sha:'1063caee37de99d5cdde09f6b068cd800501c2c9f8f46a396d445bab4a6c5d35'}
};
const results = [];
await mkdir('test-results',{recursive:true});
const browser = await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--no-sandbox']});
try {
  for (const [width,height] of [[1487,1058],[1024,768],[390,844],[320,740]]) {
    const page = await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    page.setDefaultTimeout(15000);
    const errors=[], requests=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(r.url().includes('/assets/project-screenshots/'))requests.push(r.url())});
    const response = await page.goto(base,{waitUntil:'networkidle',timeout:60000});
    assert(response?.ok(),`Cannot open portfolio: HTTP ${response?.status()}`);
    await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator('.project-card').count(),3);
    assert.equal(await page.locator('.project-screenshot').count(),0,'Screenshot mounted before click');
    assert.equal(await page.locator('.project-card img[src*="project-screenshots"],#hero-art-board img[src*="project-screenshots"]').count(),0);
    assert.deepEqual(requests,[],'Screenshot fetched before a project was opened');
    const cardsBefore=await page.locator('#projects').innerHTML();
    assert(await page.locator('.repot-art .art-content').count(),'REPOT card artwork missing');
    assert(await page.locator('.parallax-art .globe-large').count(),'Parallax card artwork missing');
    for (const [key,project] of Object.entries(expected)) {
      for(const source of ['hero','gallery']) {
        const selector=source==='hero'?`#hero-art-board [data-project="${key}"]`:`.project-card [data-project="${key}"]`;
        await page.locator(selector).click();
        assert.equal(await page.locator('#dialog-title').innerText(),project.title);
        const image=page.locator('#project-dialog .project-screenshot img');
        await image.waitFor({state:'visible'});
        await page.waitForFunction(()=>{const i=document.querySelector('#project-dialog .project-screenshot img');return i?.complete&&i.naturalWidth>0});
        const size=await image.evaluate(i=>({width:i.naturalWidth,height:i.naturalHeight,renderedWidth:i.getBoundingClientRect().width,renderedHeight:i.getBoundingClientRect().height,fit:getComputedStyle(i).objectFit}));
        assert.equal(size.width,project.width);assert.equal(size.height,project.height);
        assert.equal(size.fit,'contain');
        assert(Math.abs(size.renderedWidth/size.renderedHeight-project.width/project.height)<0.02,'Screenshot cropped or distorted');
        assert.equal(await image.getAttribute('src'),`/assets/project-screenshots/${key}.png`);
        assert.equal(await page.locator('#project-dialog #transfer-button,#project-dialog .signal-demo').count(),0,'Old sample demo still rendered');
        assert.equal(await page.locator('#project-dialog .interactive-demo').count(),0,'Misleading interactive/sample wrapper');
        assert.match(await page.locator('.screenshot-meta').innerText(),/ACTUAL PROJECT SCREENSHOT/);
        assert.equal(await page.locator('#project-dialog .dialog-footer a').getAttribute('href'),project.url);
        const fullSize=page.locator('#project-dialog .screenshot-meta a');
        assert.equal(await fullSize.getAttribute('href'),`/assets/project-screenshots/${key}.png`);
        assert.equal(await fullSize.getAttribute('target'),'_blank');
        assert(await page.locator('#project-dialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1),'Dialog horizontal overflow');
        if(source==='hero' && [1487,390].includes(width)) {
          await page.locator('#project-dialog').evaluate(d=>d.scrollTop=0);
          await page.screenshot({path:`test-results/${phase}-${key}-dialog-${width}.png`});
        }
        if(source==='hero' && width===1487) {
          const asset=await page.request.get(new URL(`/assets/project-screenshots/${key}.png`,base).href);
          assert(asset.ok());assert.equal(createHash('sha256').update(await asset.body()).digest('hex'),project.sha,'Screenshot changed from original upload');
        }
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#project-dialog').evaluate(d=>d.open),false);
        await page.waitForFunction(()=>document.body.style.overflow==='');
        assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
      }
    }
    // Forward navigation and the untouched concept must remain functional.
    await page.locator('#hero-art-board [data-project="repot"]').click();
    await page.locator('#next-project').click();
    assert.equal(await page.locator('#dialog-title').innerText(),'Parallax');
    assert.equal(await page.locator('#project-dialog .project-screenshot').count(),1);
    await page.locator('#next-project').click();
    assert.equal(await page.locator('#dialog-title').innerText(),'Ghost Director');
    assert.equal(await page.locator('#project-dialog .project-screenshot').count(),0);
    await page.locator('#grade-slider').evaluate(el=>{el.value='85';el.dispatchEvent(new Event('input',{bubbles:true}))});
    assert.match(await page.locator('#grade-label').innerText(),/THE AFTER/);
    await page.locator('#next-project').click();
    assert.equal(await page.locator('#dialog-title').innerText(),'REPOT');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+k');
    await page.locator('#command-input').fill('parallax');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#dialog-title').innerText(),'Parallax');
    assert.equal(await page.locator('#project-dialog .project-screenshot').count(),1);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#projects').innerHTML(),cardsBefore,'Cards changed after opening popups');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Page overflow');
    assert.deepEqual(errors,[],'Browser runtime errors');
    results.push({viewport:`${width}x${height}`,base,passed:true,checks:['no screenshots before click','unchanged homepage artwork','hero and gallery open real screenshots','original PNG dimensions and aspect ratio','no old interactive samples','live links','full-size link','next project','Ghost Director slider','command menu','Escape and scroll restoration','no runtime errors']});
    await page.close();
  }
  console.log(JSON.stringify(results,null,2));
} finally {
  await writeFile(`test-results/${phase}-screenshot-report.json`,JSON.stringify(results,null,2));
  await browser.close();
}
