// Publication check: measured claims must remain connected to the recorded code.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const report = JSON.parse(fs.readFileSync(path.join(root, 'robo-skill-lab/artifacts/latest/report.json'), 'utf8'));
assert.equal(report.schema_version, 1);
assert.equal(report.engine.name, 'MuJoCo');
assert.equal(report.observation, 'simulator-state');
assert.equal(report.planner.llm_executed, false);
assert.equal(report.episodes.length, 24);
assert.equal(new Set(report.episodes.map(e => e.id)).size, 24);
for (const [name, hash] of Object.entries(report.source_sha256)) {
  assert(!name.includes('/') && !name.includes('\\'), 'Only source basenames');
  const bytes = fs.readFileSync(path.join(root, 'robo-skill-lab/roboskill', name));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), hash, 'Source evidence: ' + name);
}
for (const [policy, successes, meanTime] of [['open_loop', 5, 7.05], ['closed_loop', 12, 17.71]]) {
  const rows = report.episodes.filter(e => e.policy === policy);
  assert.equal(rows.length, 12);
  assert.equal(rows.filter(e => e.success).length, successes);
  assert.equal((rows.reduce((sum, e) => sum + e.sim_time_s, 0) / rows.length).toFixed(2), meanTime.toFixed(2));
  for (const e of rows) {
    assert(e.trajectory.length > 0 && e.events.length > 0);
    assert(e.trajectory.every(f => f.qpos.every(Number.isFinite)));
    assert.equal(e.disturbance_applied, e.scenario === 'disturbance');
    if(e.success) assert(e.settled && !e.timed_out && !e.workspace_violation && e.final_distance_m < .045 && e.distractor_displacement_m < .04);
  }
}
for (const scenario of ['nominal','slippery','heavy','disturbance']) {
  for (const seed of [0,1,2]) {
    const pair = report.episodes.filter(e => e.scenario === scenario && e.seed === seed);
    assert.equal(pair.length, 2);
    assert.deepEqual(pair[0].trajectory[0].qpos, pair[1].trajectory[0].qpos, 'Paired initial states');
    assert.deepEqual(pair[0].parameters, pair[1].parameters, 'Paired physical conditions');
  }
}
console.log('PASS: 24 MuJoCo episodes, paired conditions, success/time claims and recorded source hashes.');
