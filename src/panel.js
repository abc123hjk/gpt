'use strict';
const $=id=>document.getElementById(id);
let data,preview='idle',previewUntil=0,toastTimer;
const titles={home:'今天，也一起好好生活。',focus:'把这一小段时间，留给自己。',settings:'照顾好小橘，也照顾好自己。'};
document.querySelectorAll('.nav').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b===button));document.querySelectorAll('.page').forEach(p=>p.classList.toggle('hidden',p.id!=='page-'+button.dataset.page));$('page-title').textContent=titles[button.dataset.page];}));
function toast(message){if(!message)return;$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3500);}
async function act(action){const result=await window.cat.command(action);if(!result.ok)toast(result.message);return result;}
function format(ms){const sec=Math.ceil(Math.max(0,ms)/1000);return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');}
function render(s){data=s;for(const k of ['fish','affection','completed'])$(k).textContent=s[k];$('minutes').textContent=s.focusMinutes;
  $('scale').value=s.settings.scale;$('roam').checked=s.settings.roam;$('alwaysOnTop').checked=s.settings.alwaysOnTop;
  const t=s.timer;const duration=s.settings.duration;
  $('timer').textContent=format(t?s.remainingMs:duration*60000);$('timer-label').textContent=t?(t.paused?'休息一下，小橘等你':'专注中，小橘在陪你'):'准备好就出发';
  $('timer-primary').textContent=t?(t.paused?'继续专注':'暂停一下'):'开始专注';$('timer-cancel').classList.toggle('hidden',!t);
  $('timer-detail').textContent=`完成后获得 ${Math.max(1,Math.floor((t?t.totalMs:duration*60000)/1500000))} 条小鱼干`;
  document.querySelectorAll('[data-minutes]').forEach(b=>{b.classList.toggle('selected',Number(b.dataset.minutes)===duration);b.disabled=!!t;});
  $('custom-duration').disabled=!!t;if(document.activeElement!==$('custom-duration'))$('custom-duration').value=duration;
  document.querySelector('[data-action="feed"]').disabled=s.fish<1;
  $('hero-status').textContent=t?(t.paused?'暂停中，等你回来':'敲着小键盘，陪你专注'):'正在认真陪伴你';
}
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>act({type:b.dataset.action})));
document.querySelectorAll('[data-minutes]').forEach(b=>b.addEventListener('click',()=>act({type:'settings',value:{duration:Number(b.dataset.minutes)}})));
$('custom-duration').addEventListener('change',()=>{const n=Number($('custom-duration').value);if(!Number.isFinite(n)||n<5||n>120){toast('专注时间可以设置为 5～120 分钟。');$('custom-duration').value=data.settings.duration;return;}act({type:'settings',value:{duration:Math.round(n)}});});
$('timer-primary').addEventListener('click',()=>act({type:data?.timer?(data.timer.paused?'resume':'pause'):'start'}));
$('timer-cancel').addEventListener('click',()=>$('cancel-dialog').showModal());$('keep-focus').addEventListener('click',()=>$('cancel-dialog').close());$('confirm-cancel').addEventListener('click',()=>{$('cancel-dialog').close();act({type:'cancel'});});
for(const key of ['roam','alwaysOnTop'])$(key).addEventListener('change',()=>act({type:'settings',value:{[key]:$(key).checked}}));
$('scale').addEventListener('change',()=>act({type:'settings',value:{scale:Number($('scale').value)}}));
$('reset-position').addEventListener('click',()=>{window.cat.resetPosition();toast('小橘回到主屏幕右下方啦。');});
$('to-desktop').addEventListener('click',()=>window.cat.hidePanel());$('quit').addEventListener('click',()=>window.cat.quit());
window.cat.onUpdate(render);window.cat.onAnimation(({animation,message})=>{if(animation){preview=animation;previewUntil=Date.now()+(animation==='sleep'?60000:4500);}toast(message);});window.cat.getState().then(render);
const ctx=$('hero-cat').getContext('2d');function frame(ts){const mode=Date.now()<previewUntil?preview:data?.timer&&!data.timer.paused?'focus':'idle';window.CatArt.draw(ctx,mode,ts/1000);requestAnimationFrame(frame);}requestAnimationFrame(frame);
