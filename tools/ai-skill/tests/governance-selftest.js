'use strict';
const fs=require('fs'); const path=require('path');
const root=path.resolve(__dirname,'..','..','..'); // wisdomdesign/
function fail(msg){ console.error('FAIL: '+msg); process.exitCode=1; }
function readJson(rel){ const p=path.join(root,rel); return JSON.parse(fs.readFileSync(p,'utf8')); }
const files=[
  'ai/skill/governance/coverage-model.json',
  'ai/skill/governance/extension-priorities.json',
  'ai/skill/governance/release-governance.json'
];
let docs=[];
for(const f of files){ try{ docs.push(readJson(f)); console.log('PASS json '+f); }catch(e){ fail(f+' invalid JSON: '+e.message); } }
const [coverage,extension,governance]=docs;
if(docs.length===files.length){
  const layerIds=coverage.layers.map(l=>l.id);
  const expected=['L1-design-semantics','L2-platform-api-discovery','L3-minimal-compile','L4-template-verification','L5-snapshot-ui'];
  if(JSON.stringify(layerIds)!==JSON.stringify(expected)) fail('coverage layers must be L1-L5 in order'); else console.log('PASS coverage layer order');
  if(coverage.currentBaseline.designSemantic!==37 || coverage.currentBaseline.snapshotUi!==0) fail('current baseline must be 37 semantic / 0 snapshot UI'); else console.log('PASS current baseline is not overclaimed');
  if(!coverage.reportingRules.some(r=>r.includes('R1'))) fail('R1-R5 must not count as components'); else console.log('PASS recipes excluded');
  if(extension.pagePatternOrder.length!==6) fail('page pattern order must contain six patterns'); else console.log('PASS page pattern order');
  if(!extension.newPlatformAccession.webStatus.includes('spec-only')) fail('web must remain spec-only'); else console.log('PASS web spec-only');
  if(governance.changeTriggers.length!==6) fail('six change trigger classes required'); else console.log('PASS change triggers');
  const thr=governance.trendMonitoring.thresholds;
  if(!thr.includes('M4') || !thr.includes('基线') || !thr.includes('变更需记录原因')) fail('thresholds must be after baseline with reason logging'); else console.log('PASS no premature threshold promise');
  if(governance.prohibited.some(p=>p.includes('dirty'))) console.log('PASS dirty isolation prohibited');
}
const acceptance=fs.readFileSync(path.join(root,'ai/skill/governance/final-acceptance.md'),'utf8');
for(const token of ['12 问','构建与来源','Core','平台','Skill 与宿主','评测与发布','当前未验证项清单','frozen-for-review']){
  if(!acceptance.includes(token)) fail('final-acceptance.md missing '+token); else console.log('PASS acceptance token '+token);
}
// State-consistency guard (R1 F6): a governance doc must not claim a stage is
// unimplemented while the shipped artefacts for that stage exist in the repo.
const catalogDir=path.join(root,'ai/skill/core/catalog/components');
const cardCount=fs.existsSync(catalogDir)?fs.readdirSync(catalogDir).filter(f=>/\.md$/i.test(f)).length:0;
if(cardCount>=37){
  const m1Unimplemented=new RegExp('M1 Core 生成器[^\\n]*\\|\\s*未实施');
  const m4Unimplemented=new RegExp('M4 四类目录包[^\\n]*\\|\\s*未实施');
  if(m1Unimplemented.test(acceptance)) fail('final-acceptance claims M1 unimplemented while 37 cards exist');
  else console.log('PASS final-acceptance M1 state matches generated cards ('+cardCount+')');
  if(m4Unimplemented.test(acceptance)) fail('final-acceptance claims M4 unimplemented while packages exist');
  else console.log('PASS final-acceptance M4 state refreshed');
}
const coverageText=fs.readFileSync(path.join(root,'ai/skill/governance/coverage-model.json'),'utf8');
if(cardCount>=37 && coverageText.includes('M1 Core 尚未生成语义卡')) fail('coverage-model still claims M1 semantics not generated');
else console.log('PASS coverage-model current state refreshed');
const aiReadme=fs.readFileSync(path.join(root,'ai/README.md'),'utf8');
if(cardCount>=37 && aiReadme.includes('尚未创建')) fail('ai/README.md still claims skill/ not created');
else console.log('PASS ai/README.md state refreshed');
if(process.exitCode) console.error('M6 GOVERNANCE SELFTEST FAILED'); else console.log('M6 GOVERNANCE SELFTEST OK');
