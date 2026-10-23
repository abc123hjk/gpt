'use strict';
const canvas=document.getElementById('cat'),ctx=canvas.getContext('2d',{willReadFrequently:true}),bubble=document.getElementById('bubble'),home=document.getElementById('home');
let data={settings:{roam:true},timer:null},mode='idle',until=0,sleeping=false,direction=1,nextAmbient=Date.now()+10000,walkUntil=0,lastFrame=0,down=null,dragging=false,hover=false,lastInteractive=false,bubbleTimer;
function setInteractive(value){if(value!==lastInteractive){lastInteractive=value;window.cat.interactive(value);}}
function say(message){if(!message)return;bubble.textContent=message;bubble.classList.add('visible');clearTimeout(bubbleTimer);bubbleTimer=setTimeout(()=>bubble.classList.remove('visible'),4200);}
function animation({animation,message}){say(message);if(!animation)return;mode=animation;until=Date.now()+({eat:4500,pet:3000,happy:5000,drag:35000}[animation]||3500);if(animation==='sleep')sleeping=true;if(['wake','idle','focus','drag'].includes(animation))sleeping=false;walkUntil=0;}
function hit(e){if(e.target===home)return true;const r=canvas.getBoundingClientRect();const x=Math.floor((e.clientX-r.left)*canvas.width/r.width),y=Math.floor((e.clientY-r.top)*canvas.height/r.height);return x>=0&&y>=0&&x<256&&y<256&&ctx.getImageData(x,y,1,1).data[3]>15;}
document.addEventListener('pointermove',e=>{hover=hit(e);document.body.classList.toggle('hover',hover||dragging);if(down&&!dragging&&Math.hypot(e.screenX-down.x,e.screenY-down.y)>4){dragging=true;canvas.setPointerCapture(e.pointerId);window.cat.drag(true);}setInteractive(hover||!!down||dragging);});
canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!hit(e))return;down={x:e.screenX,y:e.screenY};setInteractive(true);});
function release(e){if(!down&&!dragging)return;const didDrag=dragging;down=null;dragging=false;if(didDrag){window.cat.drag(false);mode='idle';until=0;}else if(e.type==='pointerup')window.cat.command({type:'pet'});if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);setInteractive(hover);}
document.addEventListener('pointerup',release);document.addEventListener('pointercancel',release);window.addEventListener('blur',()=>{if(dragging)window.cat.drag(false);down=null;dragging=false;setInteractive(false);});
document.addEventListener('mouseleave',()=>{if(!down&&!dragging){hover=false;document.body.classList.remove('hover');setInteractive(false);}});
document.addEventListener('contextmenu',e=>{e.preventDefault();window.cat.menu();});
home.addEventListener('click',()=>window.cat.panel());
window.cat.onUpdate(s=>{data=s;});window.cat.onAnimation(animation);window.cat.getState().then(s=>{data=s;say('你好呀，我是小橘。右键找我玩！');});
function frame(ts){const now=Date.now();let current=mode;
  if(!dragging&&now>until){if(data.timer&&!data.timer.paused)current='focus';else if(sleeping)current='sleep';else if(now<walkUntil)current='walk';else current='idle';}
  if(now>nextAmbient&&!dragging&&!down&&!sleeping&&!data.timer&&now>until){const choices=['lick','stretch','chase',...(data.settings.roam?['walk']:[])];const choice=choices[Math.floor(Math.random()*choices.length)];if(choice==='walk'){direction=Math.random()>.5?1:-1;walkUntil=now+3500;}else{mode=choice;until=now+3000;current=choice;}nextAmbient=now+14000+Math.random()*16000;}
  if(current==='walk'&&ts-lastFrame>45&&!hover){window.cat.move(direction*2);lastFrame=ts;}
  window.CatArt.draw(ctx,current,ts/1000,{flip:current==='walk'&&direction<0});requestAnimationFrame(frame);
}requestAnimationFrame(frame);
