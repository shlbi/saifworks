// SVG icon and clear product-copy regressions, including mobile WebKit.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const pw=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8765';
const phase=process.env.TEST_PHASE||'local';
const results=[];
await mkdir('test-results',{recursive:true});
const targets=[['chromium',1487,1058],['chromium',390,844],['chromium',320,740],['webkit',390,844],['webkit',1487,1058]];
async function assertVectors(page){
  await page.waitForFunction(()=>document.documentElement.dataset.uiPolish==='vector-icons-v1');
  const leftovers=await page.evaluate(()=>{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),out=[];for(let n=w.nextNode();n;n=w.nextNode()){if(n.parentElement?.closest('script,style,svg,textarea,pre,code'))continue;if(/[↗↘↙↖→←↑↓↻✳⌘▶＋◎×≡◆]/u.test(n.nodeValue))out.push(n.nodeValue)}return out});
  assert.deepEqual(leftovers,[],'An interface icon is still rendered with a font');
  assert.equal(await page.locator('svg.ui-icon:not([aria-hidden="true"])').count(),0,'Decorative icon exposed to accessibility tree');
}
async function clickVisible(page,selector){
  const locator=page.locator(selector);
  // Settle the mobile visual viewport before a normal, hit-tested pointer click.
  await locator.evaluate(e=>e.scrollIntoView({behavior:'instant',block:'center',inline:'nearest'}));
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await locator.click();
}
async function diagnostics(page){return page.evaluate(()=>({scrollX,scrollY,innerWidth,innerHeight,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,visualViewport:visualViewport?{width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale,offsetTop:visualViewport.offsetTop,pageTop:visualViewport.pageTop}:null,overflow:[...document.body.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth+1&&!e.closest('svg,script,style')).slice(0,25).map(e=>({tag:e.tagName,class:e.className,rect:e.getBoundingClientRect().toJSON()})),cards:[...document.querySelectorAll('.project-art')].map(e=>{const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;return{id:e.dataset.project,rect:r.toJSON(),hit:document.elementFromPoint(x,y)?.outerHTML.slice(0,200)}})}))}
try{
 for(const [engine,width,height] of targets){
  console.log(`CHECK ${phase} ${engine} ${width}x${height}`);
  const browser=await pw[engine].launch({headless:true,...(engine==='chromium'?{args:['--no-sandbox'],...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})}:{})});
  let page;
  try{
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:width<500,hasTouch:width<500,reducedMotion:'reduce'});
   page=await context.newPage();page.setDefaultTimeout(20000);
   const errors=[],screenshotRequests=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(r.url().includes('/assets/project-screenshots/'))screenshotRequests.push(r.url())});
   const response=await page.goto(base,{waitUntil:'networkidle',timeout:60000});
   assert(response?.ok(),`HTTP ${response?.status()}`);
   await page.evaluate(()=>document.fonts.ready);
   await assertVectors(page);
   assert.equal(await page.locator('.project-card').count(),3);
   assert.equal(await page.locator('.ribbon .asterisk svg.ui-icon').count(),8);
   assert.equal(await page.locator('.corner-arrow svg.ui-icon').count(),3);
   assert.equal(await page.locator('img[src*="project-screenshots"]').count(),0);
   assert.deepEqual(screenshotRequests,[],'Screenshots downloaded before click');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),'Page horizontal overflow');
   assert.equal(await page.locator('.project-card [data-project="parallax"] .globe-large').count(),1,'Original card art missing');
   const stars=await page.locator('.ribbon .asterisk .ui-icon').first().boundingBox();assert(stars.width>15&&stars.height>15);
   await page.evaluate(()=>window.scrollTo({top:document.querySelector('#work').getBoundingClientRect().top+scrollY-56,behavior:'instant'}));
   if(width<500)await page.screenshot({path:`test-results/${phase}-${engine}-work-${width}.png`});
   await clickVisible(page,'.project-card [data-project="parallax"]');
   await page.waitForFunction(()=>{const i=document.querySelector('#project-dialog .project-screenshot img');return i?.complete&&i.naturalWidth===1919});
   await page.waitForFunction(()=>!!document.querySelector('.project-launch .ui-icon'));
   await assertVectors(page);
   assert.match(await page.locator('.dialog-intro').innerText(),/people, organizations, places, and documents/);
   assert.equal(await page.locator('.dialog-badge').innerText(),'Interactive prototype');
   assert.equal(await page.locator('.case-step').count(),3);
   assert.match(await page.locator('.case-example').innerText(),/Alex Mercer/);
   assert.match(await page.locator('.prototype-note').innerText(),/AI analysis are planned/);
   assert.equal(await page.locator('.project-launch').getAttribute('href'),'https://parallax-steel-chi.vercel.app/');
   assert(await page.locator('#project-dialog').evaluate(d=>d.scrollWidth<=d.clientWidth+1),'Dialog horizontal overflow');
   const img=await page.locator('.project-screenshot img').evaluate(e=>({width:e.naturalWidth,height:e.naturalHeight,fit:getComputedStyle(e).objectFit}));assert.deepEqual(img,{width:1919,height:942,fit:'contain'});
   await page.locator('#project-dialog').evaluate(d=>d.scrollTop=0);
   await page.screenshot({path:`test-results/${phase}-${engine}-parallax-${width}.png`});
   await clickVisible(page,'#next-project');assert.equal(await page.locator('#dialog-title').innerText(),'Ghost Director');
   assert.equal(await page.locator('#grade-slider').count(),1);
   await clickVisible(page,'#next-project');assert.equal(await page.locator('#dialog-title').innerText(),'REPOT');
   await page.waitForFunction(()=>{const i=document.querySelector('.project-screenshot img');return i?.complete&&i.naturalWidth===1904});
   await assertVectors(page);
   assert.equal(await page.locator('.dialog-footer a').getAttribute('href'),'https://getrepot.com');
   await clickVisible(page,'[aria-label="Close project"]');
   await page.waitForFunction(()=>document.body.style.overflow==='');
   await page.keyboard.press('Control+k');await page.locator('#command-input').fill('parallax');
   await page.waitForFunction(()=>!!document.querySelector('.command-item svg.ui-icon'));
   await page.keyboard.press('Enter');assert.equal(await page.locator('#dialog-title').innerText(),'Parallax');
   await page.keyboard.press('Escape');await page.waitForFunction(()=>document.body.style.overflow==='');
   await clickVisible(page,'#gravity-toggle');
   await page.waitForFunction(()=>!!document.querySelector('#gravity-toggle .ui-icon'));
   await assertVectors(page);
   await clickVisible(page,'#gravity-toggle');
   await clickVisible(page,'[data-filter="tools"]');assert.equal(await page.locator('.project-card:visible').count(),1);
   await clickVisible(page,'[data-filter="all"]');assert.equal(await page.locator('.project-card:visible').count(),3);
   assert.deepEqual(errors,[],'Browser runtime error');
   results.push({engine,version:browser.version(),viewport:`${width}x${height}`,base,passed:true,checks:['SVG icons in static and dynamic UI','no emoji glyphs','original gallery artwork','screenshots only after click','clear Parallax purpose and prototype status','source/map/timeline explanation','live links','next-project navigation','close and Escape','command menu','dynamic gravity icon','filters','no overflow','no runtime errors']});
   await context.close();
  }catch(error){
   if(page&&!page.isClosed()){
    await page.screenshot({path:`test-results/${phase}-${engine}-failure-${width}.png`});
    const info=await diagnostics(page);console.log(JSON.stringify(info,null,2));
    await writeFile(`test-results/${phase}-${engine}-failure-${width}.json`,JSON.stringify(info,null,2));
   }
   throw error;
  }finally{await browser.close()}
 }
 console.log(JSON.stringify(results,null,2));
}finally{await writeFile(`test-results/${phase}-mobile-polish-report.json`,JSON.stringify(results,null,2))}
