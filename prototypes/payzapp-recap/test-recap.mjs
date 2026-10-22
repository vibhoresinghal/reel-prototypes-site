import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base=path.dirname(decodeURIComponent(new URL(import.meta.url).pathname)).replace(/^\/(?=[A-Za-z]:)/,'');
const read=file=>fs.readFileSync(path.join(base,file),'utf8');
const context=vm.createContext({window:{location:{search:''},matchMedia:()=>({matches:false})}, URLSearchParams, Audio:class {load(){}}, console});
vm.runInContext(read('profile.js'),context);
const app=read('experience.js');
vm.runInContext(app.slice(0,app.indexOf('let currentQuestionIndex')),context);
for(const scene of ['intro','quiz','power','inactive','summary']) {
 const data=vm.runInContext(`window.RECAP_DEMO.profileForScene('${scene}')`,context);
 assert.equal(data.userName,'Vibhore');
 context.data=data;
 const questions=vm.runInContext('buildQuestionsFromData(data)',context);
 assert.equal(questions.length,scene === 'inactive' ? 5 : 6,scene);
 assert.ok(questions.every(q=>q.options.length===2 && q.correctIndex>=0 && q.correctIndex<q.options.length));
 assert.ok(questions.every(q=>!q.text.includes('undefined') && !q.text.includes('NaN')));
}
const invalid=vm.runInContext(`window.RECAP_DEMO.normalizeProfile({userName:'<img src=x>Vibhore',totalSpends:-10,userTotalCashbackEarned:'Infinity',maxMonth:'junk'})`,context);
assert.equal(invalid.totalSpends,0);assert.equal(invalid.userTotalCashbackEarned,0);assert.equal(invalid.maxMonth,null);assert.ok(!invalid.userName.includes('<'));
assert.ok(!app.includes('window.payzapp'));assert.ok(!app.includes('navigator.share'));
assert.ok(read('experience.html').includes('utilities.css'));
assert.ok(!read('experience.html').includes('cdn.tailwindcss.com'));
const manifest=JSON.parse(read('source-assets.json'));
for(const asset of manifest.assets) assert.equal(createHash('sha256').update(fs.readFileSync(path.join(base,asset.path))).digest('hex'),asset.sha256,asset.path);
for(const file of ['experience.html','experience.js','style.css']) {
 for(const match of read(file).replace(/<!--[\s\S]*?-->/g,'').matchAll(/assets\/[\w.-]+\.(?:png|svg|mp3|m4a|webp)/g)) assert.ok(fs.existsSync(path.join(base,match[0])),match[0]);
}
console.log(`Recap verified: five scenes, six personal cards / five platform cards, data guards, ${manifest.assets.length} unchanged assets, local runtime references.`);
