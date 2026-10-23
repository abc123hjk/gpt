const {execFileSync}=require('node:child_process');const fs=require('node:fs');const path=require('node:path');
for(const dir of ['src','scripts','tests'])for(const file of fs.readdirSync(dir))if(/\.(c?js)$/.test(file)){execFileSync(process.execPath,['--check',path.join(dir,file)],{stdio:'inherit'});}
console.log('All JavaScript syntax checks passed.');
