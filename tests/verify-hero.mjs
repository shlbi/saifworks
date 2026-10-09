// Browser smoke tests for the deployed site. Install Playwright separately; no runtime dependencies.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8765';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--no-sandbox']});
const results=[];
try{
 for(const [width,height] of [[1487,1058],[1906,926],[1024,768],[390,844],[320,700]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(base,{waitUntil:'networkidle',timeout:60000});
  assert(response?.ok(),`HTTP ${response?.status()} at ${base}`);
  await page.locator('#hero-art-board').waitFor({timeout:15000});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>[...document.querySelectorAll('.hero-figure img')].every(e=>e.complete&&e.naturalWidth===580));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');
  assert.equal(await page.locator('#sculpture-canvas').count(),0,'Old renderer is still present');
  assert.equal(await page.locator('#motion-toggle').getAttribute('aria-pressed'),'false');
  for(const [key,title] of [['repot','REPOT'],['parallax','Parallax'],['ghost','Ghost Director'],['wanneesh','Wanneesh']]){
   await page.locator(`#hero-art-board [data-project="${key}"]`).click();
   assert.equal(await page.locator('#dialog-title').innerText(),title);
   if(key==='repot')assert.equal(await page.locator('#project-dialog .dialog-footer a').getAttribute('href'),'https://getrepot.com');
   await page.keyboard.press('Escape');
  }
  await page.keyboard.press('Control+k');await page.locator('#command-input').fill('repot');await page.keyboard.press('Enter');
  assert.equal(await page.locator('#dialog-title').innerText(),'REPOT');await page.keyboard.press('Escape');
  await page.locator('[data-filter="tools"]').click();assert.equal(await page.locator('.project-card:visible').count(),1);
  await page.locator('[data-filter="all"]').click();assert.equal(await page.locator('.project-card:visible').count(),4);
  await page.locator('[data-view="list"]').click();assert.match(await page.locator('#projects').getAttribute('class'),/list-view/);
  await page.locator('[data-view="gallery"]').click();
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(150);
  await page.screenshot({path:`test-results/live-${width}.png`,fullPage:width<500});
  assert.deepEqual(errors,[],'Browser runtime errors');
  results.push({viewport:`${width}x${height}`,url:page.url(),status:response.status(),passed:true,checks:['asset loading','layout bounds','all project cards','REPOT link','command menu','gallery filters','index toggle','motion default','no runtime errors']});
  await page.close();
 }
 console.log(JSON.stringify(results,null,2));
}finally{await writeFile('test-results/report.json',JSON.stringify(results,null,2));await browser.close();}
