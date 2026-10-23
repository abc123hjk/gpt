// Make a single-file browser preview. This is explicitly not the desktop app.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=read('src/core.cjs').replace("'use strict';",'').replace(/module\.exports = .*;/,'');
const bridge=`(()=>{${core}
let s;try{s=hydrate(JSON.parse(localStorage.getItem('tangerine-preview')))}catch{s=initialState()}
const listeners=[],animations=[];
const state=()=>({...structuredClone(s),remainingMs:remaining(s),now:Date.now()});
function save(){try{localStorage.setItem('tangerine-preview',JSON.stringify(s))}catch{}}
function update(){listeners.forEach(fn=>fn(state()))}
window.cat={getState:async()=>state(),command:async action=>{const r=command(s,action);save();update();if(r.message||r.animation)animations.forEach(fn=>fn(r));return r},onUpdate:fn=>listeners.push(fn),onAnimation:fn=>animations.push(fn),hidePanel:()=>animations.forEach(fn=>fn({message:'这是浏览器预览。桌面悬浮和拖动需要 Windows 程序。'})),quit:()=>animations.forEach(fn=>fn({message:'这是浏览器预览，关闭此标签页即可。'})),resetPosition:()=>{},interactive:()=>{},drag:()=>{},move:()=>{},menu:()=>{},panel:()=>{}};
setInterval(()=>{if(completeIfDue(s)){save();animations.forEach(fn=>fn({animation:'happy',message:'专注完成，鱼干到账啦！'}))}update()},1000);
})();`;
const style=read('src/panel.css')+' .offline{font-size:9px}';const scripts=[read('src/cat-art.js'),bridge,read('src/panel.js')];
const hash=s=>"'sha256-"+crypto.createHash('sha256').update(s).digest('base64')+"'";
let html=read('src/panel.html').replace('离线陪伴 · 本地存档','浏览器预览 · 非桌面程序').replace('<title>小橘 · 桌面小窝</title>','<title>小橘 · 浏览器预览</title>').replace('<link rel="stylesheet" href="panel.css">','<style>'+style+'</style>').replace('<script src="cat-art.js"></script><script src="panel.js"></script>',scripts.map(s=>'<script>'+s+'</script>').join(''));
html=html.replace(/content="default-src[^\"]+"/,`content="default-src 'none'; script-src ${scripts.map(hash).join(' ')}; style-src ${hash(style)}; img-src data:; font-src 'self'; connect-src 'none'"`);
const output=path.join(root,'release');fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'Tangerine-Preview.html'),html);console.log('Created release/Tangerine-Preview.html');
