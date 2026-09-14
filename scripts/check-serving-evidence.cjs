const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const base=path.resolve(__dirname,'../med-rag-serving');
const e=JSON.parse(fs.readFileSync(path.join(base,'reports/rehearsal/evidence.json'),'utf8'));
assert.equal(e.evidence_kind,'loopback-http-and-synthetic-controls');
assert.equal(e.scope.upstream,'scripted CPU fixture');
for(const key of ['gpu_executed','external_network','live_deployment'])assert.equal(e.scope[key],false);
assert.equal(e.contracts_passed,e.events.length);
assert.equal(new Set(e.events.map(v=>v.id)).size,e.events.length);
for(const event of e.events){assert.equal(event.passed,true);for(const [key,value] of Object.entries(event.expected))assert.deepEqual(event[key],value);}
assert.equal(e.source_hash_format,'sha256-utf8-lf');
for(const [file,hash] of Object.entries(e.source_sha256)){
 const actual=crypto.createHash('sha256').update(fs.readFileSync(path.join(base,file),'utf8').replace(/\r\n/g,'\n')).digest('hex');
 assert.equal(actual,hash,`${file} changed; record fresh rehearsal evidence before publishing.`);
}
assert.equal(e.metrics.requests_total,e.metrics.completed_total+e.metrics.rejected_total+e.metrics.upstream_errors_total);
assert.equal(e.metrics.inflight,0);
assert.equal(e.quality.cases.length,12);
for(const name of ['good','bad']){
 const gate=e.quality[name];assert.equal(gate.case_count,e.quality.cases.length);
 assert.equal(gate.failed_cases,gate.results.filter(r=>!r.pass).length);
 assert.deepEqual(gate.results.map(r=>r.id),e.quality.cases.map(c=>c.id));
}
assert.equal(e.quality.good.status,'pass');assert.equal(e.quality.bad.status,'blocked');
console.log(`PASS: ${e.events.length} recorded contracts, source hashes, quality results and evidence scope.`);
