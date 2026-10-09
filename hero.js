/* Art-directed collage interaction. It is intentionally not a rotating 3D model:
   the approved portrait/loop occlusion stays intact at every viewport size. */
(() => {
 'use strict';
 const scene = document.querySelector('.hero-composition');
 if (!scene) return;
 const board = document.getElementById('hero-art-board');
 let x = 0, y = 0, dragging = false, startX = 0, startY = 0;
 const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
 const motionAllowed = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const position = (nx,ny) => {
  x = clamp(nx,-1,1); y = clamp(ny,-1,1);
  scene.style.setProperty('--art-x',`${(x*6).toFixed(2)}px`);
  scene.style.setProperty('--art-y',`${(y*4).toFixed(2)}px`);
  scene.style.setProperty('--art-r',`${(x*1.1).toFixed(2)}deg`);
 };
 const resize = () => board.style.setProperty('--art-scale',String(scene.clientWidth/835));
 new ResizeObserver(resize).observe(scene); resize();
 scene.addEventListener('pointerdown',e => {
  if(e.target.closest('button,a') || e.pointerType==='touch' || !motionAllowed()) return;
  dragging=true;startX=e.clientX;startY=e.clientY;
  scene.classList.add('is-dragging'); scene.setPointerCapture(e.pointerId);
 });
 scene.addEventListener('pointermove',e => {
  if(!motionAllowed()) return;
  if(dragging){position((e.clientX-startX)/85,(e.clientY-startY)/85);return;}
  if(typeof state==='undefined'||!state.motion||e.pointerType==='touch')return;
  const r=scene.getBoundingClientRect();
  position(((e.clientX-r.left)/r.width-.5)*2,((e.clientY-r.top)/r.height-.5)*2);
 });
 const end = () => {dragging=false;scene.classList.remove('is-dragging');position(0,0);};
 scene.addEventListener('pointerup',end); scene.addEventListener('pointercancel',end);
 scene.addEventListener('lostpointercapture',end); scene.addEventListener('pointerleave',()=>{if(!dragging)position(0,0)});
 scene.addEventListener('keydown',e => {
  if(e.target!==scene)return;
  if(e.key==='Escape'){end();return;}
  if(!motionAllowed()||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
  e.preventDefault();
  position(x+(e.key==='ArrowRight'?.3:e.key==='ArrowLeft'?-.3:0),y+(e.key==='ArrowDown'?.3:e.key==='ArrowUp'?-.3:0));
 });
 const syncColor = () => {
  const palette = {0:'142deg',1:'0deg',2:'224deg'};
  board.style.setProperty('--knot-hue',palette[typeof state==='undefined'?1:state.color]);
 };
 document.getElementById('remix').addEventListener('click',syncColor);
 document.getElementById('motion-toggle').addEventListener('click',end);
 window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',end);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)end()});
 syncColor();
})();
