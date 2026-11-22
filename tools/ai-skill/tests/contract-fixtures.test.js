'use strict';
const fs=require('fs'); const path=require('path'); const {validateDocument}=require('../lib/schema-lite.js');
const root=path.resolve(__dirname,'../../..'); // wisdomdesign/
const skillRoot=path.join(root,'ai/skill');
function readJson(rel){ return JSON.parse(fs.readFileSync(path.join(skillRoot,rel),'utf8')); }
function fail(msg){ console.error('FAIL: '+msg); process.exitCode=1; }
function expectValid(name,doc,schema){ const errors=validateDocument(doc,schema); if(errors.length) fail(name+' should be valid: '+JSON.stringify(errors.slice(0,5))); else console.log('PASS '+name); }
function expectInvalid(name,doc,schema,code){ const errors=validateDocument(doc,schema); const ok = code ? errors.some(e=>e.code===code) : errors.length>0; if(!ok) fail(name+' should be invalid'+(code?' with '+code:'')); else console.log('PASS '+name+' ('+(errors[0]?.code||code||'semantic')+')'); }

const pageSchema=readJson('page-spec/schema.json');
for(const f of ['page-spec/examples/task-list.valid.json','page-spec/examples/settings-form.valid.json']) expectValid(f,readJson(f),pageSchema);
const negatives=readJson('page-spec/examples/invalid-cases.json');
for(const c of negatives.cases) expectInvalid('negative '+c.id,c.spec,pageSchema);

const providerSchema=readJson('provider/provider.schema.json');
const capsSchema=readJson('provider/capabilities.schema.json');
const apiCardSchema=readJson('provider/api-card.schema.json');
const manifestSchema=readJson('manifest/manifest.schema.json');
const zero='0000000000000000000000000000000000000000';
const hash='a'.repeat(64);
const repo={repository:'example',commit:zero,dirty:false,contentHash:hash};
const provider={
  schemaVersion:'1.0',id:'ios',displayName:'SwiftUI',library:'WisdomUI',libraryVersion:'1.0.0',
  source:repo,adapters:{api:'api/adapters/ios.js',tokens:'tokens/ios.js',templates:'templates/ios/',verify:'verify/ios.sh'},
  capabilities:'capabilities.json',apiCards:'api/cards/index.json',
  status:{effective:'experimental',declared:'verified',reason:'example-compiled only',evidenceRefs:['reports/ios-build.json'],computedAtBuild:true},
  unsupportedBehavior:{onMissingComponent:'spec-only',onMissingApiCard:'spec-only',onMissingTemplate:'fail-with-guidance',onIncompatibleVersion:'fail-build',forbidden:['fabricate-api','fake-verified','bypass-test','cross-repo-write']},
  writeBoundary:{defaultReadOnlyPlatformRepos:true,requiresOwnerApprovalForPlatformWrites:true}
};
expectValid('provider valid with non-self-certifying status',provider,providerSchema);
expectInvalid('provider cannot self-certify verified without evidence shape',{...provider,status:{...provider.status,declared:'verified',effective:'verified',evidenceRefs:[]}},providerSchema,'MIN_ITEMS');
// F3: omitting the evidence fields must fail as well (not only filling an empty array).
expectInvalid('provider effective=verified with evidenceRefs omitted',{...provider,status:{effective:'verified',declared:'experimental',reason:'self claim'}},providerSchema);
expectInvalid('provider declared=verified with computedAtBuild omitted',{...provider,status:{effective:'experimental',declared:'verified',reason:'x',evidenceRefs:['reports/ios-build.json']}},providerSchema);
expectInvalid('provider verified with computedAtBuild=false',{...provider,status:{...provider.status,declared:'verified',effective:'verified',computedAtBuild:false}},providerSchema,'CONST');

const group={status:'supported',evidence:'example-compiled',sourceRefs:['Sources/WisdomUI'],values:{deploymentTarget:'iOS 17'}};
const caps={schemaVersion:'1.0',platform:'ios',groups:{runtime:group,navigation:group,layout:group,typography:group,input:group,accessibility:group,rendering:group,verification:{...group,notVerified:['device']}},componentCoverage:{specOnly:['WDFAB'],experimental:['WDButton'],verified:[],unsupported:[]}};
expectValid('capabilities valid',caps,capsSchema);
expectInvalid('capabilities missing group',{...caps,groups:{...caps.groups,input:undefined}},capsSchema);

const card={schemaVersion:'1.0',platform:'ios',component:'WDButton',canonicalParam:'loading',symbol:'WDButton',signature:'init(label:variant:size:isLoading:action:)',callShape:'WDButton(label:variant:.filled, isLoading:false) {}',evidence:'example-compiled',sourceRefs:['api/WisdomUI.api.json'],compilation:{command:'Scripts/ci.sh pr',exitCode:0,matrixRef:'reports/ios-build.json',executed:true}};
expectValid('api card valid',card,apiCardSchema);
expectInvalid('api card cannot be verified without compilation evidence',{...card,evidence:'template-verified',compilation:{...card.compilation,executed:false}},apiCardSchema,'CONST');
// F3: omitted compilation must not bypass the evidence rule.
expectInvalid('api card example-compiled with compilation omitted',{...card,evidence:'example-compiled',compilation:undefined},apiCardSchema);
expectValid('api card example-compiled with executed compilation',{...card,evidence:'example-compiled'},apiCardSchema);
expectInvalid('api card template-verified without matrixRef',{...card,evidence:'template-verified',compilation:{command:'Scripts/ci.sh pr',exitCode:0,executed:true}},apiCardSchema);

const repos={wisdomdesign:repo,ios:{...repo,dirty:true,dirtyFiles:['Sources/WisdomUI/WDAvatar.swift']},android:repo};
const manifest={
  schemaVersion:'1.0',package:'wisdom-page-all',version:{skill:'0.1.0',pageSpecSchema:'1.0',providerSchema:'1.0',manifestSchema:'1.0'},
  contents:{kind:'directory',platforms:['ios','android'],entry:'SKILL.md',contentHash:hash},
  sources:{repositories:repos,design:{tokenVersion:'1.1.0',tokenHash:hash,contractCount:37,contractTreeHash:hash}},
  versions:{tokens:'1.1.0',contracts:'2026-11-21',providers:{ios:'0.1.0',android:'0.1.0'},templates:{ios:'0.1.0',android:'0.1.0'}},
  status:{releaseKind:'workspace-snapshot',overall:'experimental',platforms:{ios:'experimental',android:'experimental'}},
  coverage:{components:{specOnly:10,experimental:5,verified:0,unsupported:0},verification:{structure:true,nativeCompile:false,runtimeMatrix:false,designReview:false,hostLoad:false},a11yStates:['default','light','dark']},
  verification:{reportRef:'reports/verification-report.json',checksumsRef:'checksums.json',unverified:['native compile']},
  reproducibility:{noAbsolutePaths:true,noTimestamps:true,noMachineIdentifiers:true,fixedNewline:'LF',fixedZipTimestamps:true,builderVersion:'0.1.0'}
};
expectValid('manifest valid snapshot',manifest,manifestSchema);
expectInvalid('dirty android cannot be release',{...manifest,sources:{...manifest.sources,repositories:{...manifest.sources.repositories,android:{...manifest.sources.repositories.android,dirty:true}}},status:{...manifest.status,releaseKind:'release'}},manifestSchema,'CONST');
expectInvalid('dirty wisdomdesign cannot be release',{...manifest,sources:{...manifest.sources,repositories:{...manifest.sources.repositories,wisdomdesign:{...manifest.sources.repositories.wisdomdesign,dirty:true}}},status:{...manifest.status,releaseKind:'release'}},manifestSchema,'CONST');
expectInvalid('dirty ios cannot be release',{...manifest,sources:{...manifest.sources,repositories:{...manifest.sources.repositories,ios:{...manifest.sources.repositories.ios,dirty:true}}},status:{...manifest.status,releaseKind:'release'}},manifestSchema,'CONST');
expectInvalid('manifest cannot claim verified without verification report flags',{...manifest,status:{...manifest.status,releaseKind:'workspace-snapshot',overall:'verified'},coverage:{...manifest.coverage,verification:{...manifest.coverage.verification,nativeCompile:false,runtimeMatrix:false,designReview:false}}},manifestSchema,'CONST');

if(process.exitCode) console.error('CONTRACT SELFTEST FAILED'); else console.log('CONTRACT SELFTEST OK');