import assert from 'node:assert/strict';
import { test } from 'node:test';
import { announceStudy, bookSession, createDemoState, createDemoStore, publishSample, sampleDraft, studyEligibility } from '../src/demo-state.js';
import { createTourBaseline, demoTours, tourScene } from '../src/demo-tours.js';

test('four fictional studies, future slots and isolated snapshots', () => {
  const initial = createDemoState();
  const store = createDemoStore(initial);
  assert.equal(initial.studies.length, 4);
  assert.ok(initial.studies.every((study) => study.slots.every((slot) => new Date(slot.starts_at) > new Date())));
  store.snapshot().studies.pop();
  assert.equal(store.snapshot().studies.length, 4);
});

test('ranking changes without changing eligibility or exposing private rules', async () => {
  const store = createDemoStore();
  const before = await store.request('/matches');
  assert.equal(before.matches[0].id, 1);
  await store.request('/preferences', 'PATCH', { weights: { interest: 1, compensation: 5, convenience: 5 } });
  const after = await store.request('/matches');
  assert.equal(after.matches[0].id, 2);
  for (const match of after.matches) {
    assert.equal(match.status, before.matches.find((study) => study.id === match.id).status);
    assert.equal(match.rules, undefined);
    assert.equal(match.requirements, undefined);
  }
});

test('known failures are omitted; missing prior participation blocks booking', async () => {
  const store = createDemoStore();
  const initial = store.snapshot();
  assert.equal(studyEligibility(initial, initial.studies[0]).status, 'needs_screening');
  assert.throws(() => bookSession(initial, initial.studies[0].slots[0].id), /screening/);
  await store.request('/answers', 'POST', { study_id: 1, answers: { previous_visual_search: true } });
  assert.ok(!(await store.request('/matches')).matches.some((study) => study.id === 1));
  const fresh = createDemoStore();
  await fresh.request('/profile', 'PUT', { ...fresh.snapshot().profile, english: false });
  assert.deepEqual((await fresh.request('/matches')).matches.map((study) => study.id).sort(), [2, 4]);
});

test('a study can require multiple additional screening questions', async () => {
  const state = createDemoState();
  const study = state.studies[0];
  study.rules.push({ ...study.rules.at(-1), id: 'attend_oxford', value: true, question: 'Can you attend a session in Oxford?' });
  const store = createDemoStore(state);
  const match = (await store.request('/matches')).matches.find((item) => item.id === study.id);
  assert.equal(match.questions.length, 2);
  const partial = await store.request('/answers', 'POST', { study_id: study.id, answers: { previous_visual_search: false } });
  assert.equal(partial.status, 'needs_screening');
  await assert.rejects(store.request('/bookings', 'POST', { slot_id: study.slots[0].id }), /screening/);
  const complete = await store.request('/answers', 'POST', { study_id: study.id, answers: { attend_oxford: true } });
  assert.equal(complete.status, 'eligible');
  await store.request('/bookings', 'POST', { slot_id: study.slots[0].id });
  assert.equal(store.snapshot().bookings.length, 1);
});

test('sample publication creates fifth study and one notification; no replay', async () => {
  const store = createDemoStore();
  const draft = await store.request('/extract', 'POST', { demo: true });
  const date = new Date(Date.now() + 2 * 86400000).toISOString();
  await assert.rejects(store.request('/studies', 'POST', { approved: false, draft_id: draft.draft_id, slots: [{ starts_at: date, capacity: 2 }] }), /approve/);
  await store.request('/studies', 'POST', { approved: true, draft_id: draft.draft_id, slots: [{ starts_at: date, capacity: 2 }] });
  assert.equal(store.snapshot().studies.length, 5);
  assert.equal(store.snapshot().notifications.length, 1);
  await assert.rejects(store.request('/studies', 'POST', { approved: true, slots: [{ starts_at: date, capacity: 2 }] }), /Load/);
  assert.equal(store.snapshot().studies.length, 5);
});

test('publication preserves edited sample details and questions', async () => {
  const store = createDemoStore();
  const draft = await store.request('/extract', 'POST', { demo: true });
  draft.fields.title = 'Memory and focus';
  draft.fields.compensation = 20;
  draft.rules.push({ id: 'attend_oxford', field: 'question', answer_type: 'boolean', question: 'Can you attend in Oxford?', value: true, choices: [], source: 'Added by researcher' });
  const study = await store.request('/studies', 'POST', { approved: true, draft, slots: [{ starts_at: new Date(Date.now() + 2 * 86400000).toISOString(), capacity: 3 }] });
  assert.equal(study.title, 'Memory and focus');
  assert.equal(study.compensation, 20);
  assert.equal(study.rules.length, 5);
  const match = (await store.request('/matches')).matches.find((item) => item.id === study.id);
  assert.equal(match.questions.length, 2);
});

test('screening, booking, capacity, notifications and researcher records agree', async () => {
  const store = createDemoStore();
  await store.request('/answers', 'POST', { study_id: 1, answers: { previous_visual_search: false } });
  const slot = store.snapshot().studies[0].slots[0];
  const booking = await store.request('/bookings', 'POST', { slot_id: slot.id });
  assert.equal(booking.study_id, 1);
  assert.equal((await store.request('/researcher/studies')).bookings[0].participant_name, 'Alex Morgan');
  const matches = await store.request('/matches');
  assert.ok(matches.matches.find((study) => study.id === 1).booked);
  assert.equal(matches.matches.find((study) => study.id === 1).slots[0].remaining, slot.remaining - 1);
  assert.equal(matches.notifications[0].kind, 'booking');
  await assert.rejects(store.request('/bookings', 'POST', { slot_id: slot.id }), /already/);
});

test('booking rejects full, past and overlapping sessions', () => {
  const state = createDemoState();
  state.studies[1].slots[0].remaining = 0;
  assert.throws(() => bookSession(state, state.studies[1].slots[0].id), /available/);
  state.studies[1].slots[0].remaining = 3;
  state.studies[1].slots[0].starts_at = new Date(Date.now() - 60000).toISOString();
  assert.throws(() => bookSession(state, state.studies[1].slots[0].id), /available/);
  bookSession(state, state.studies[1].slots[1].id);
  state.studies[2].slots[0].starts_at = state.studies[1].slots[1].starts_at;
  assert.throws(() => bookSession(state, state.studies[2].slots[0].id), /overlaps/);
});

test('notifications deduplicate and unsupported live extraction fails honestly', async () => {
  const state = createDemoState();
  announceStudy(state, 1);
  announceStudy(state, 1);
  assert.equal(state.notifications.length, 1);
  const store = createDemoStore(state);
  await assert.rejects(store.request('/extract/pdf', 'POST', {}), /unavailable/);
  await assert.rejects(store.request('/extract', 'POST', { demo: false }), /unavailable/);
});

test('tour instructions stay short and do not promise a fixed question count', () => {
  assert.equal(demoTours.participant[0].title, 'Fill in a starting questionnaire');
  for (const step of Object.values(demoTours).flat()) {
    assert.ok(step.description.split(/\s+/).length <= 20, step.title);
    assert.doesNotMatch(`${step.title} ${step.description}`, /only one|one extra|one additional/i);
  }
});

test('researcher Next, Back and restart cannot duplicate publication', () => {
  const baseline = createTourBaseline('researcher', createDemoState());
  const published = tourScene(baseline, 'researcher', 6);
  assert.equal(published.state.studies.length, 5);
  assert.equal(tourScene(baseline, 'researcher', 5).state.studies.length, 4);
  assert.equal(tourScene(baseline, 'researcher', 6).state.studies.length, 5);
  assert.equal(tourScene(baseline, 'researcher', 0).state.studies.length, 4);
  assert.equal(baseline.studies.length, 4);
});

test('participant-first booking survives the following researcher tour', () => {
  const participantBaseline = createTourBaseline('participant', createDemoState());
  const completed = tourScene(participantBaseline, 'participant', 10);
  const researcherBaseline = createTourBaseline('researcher', completed.state);
  assert.equal(researcherBaseline.bookings.length, 1);
  assert.equal(researcherBaseline.studies.find((study) => study.id === 1).booked_count, 1);
  const published = tourScene(researcherBaseline, 'researcher', 6);
  assert.equal(published.state.studies.length, 5);
  assert.equal(published.state.bookings.length, 1);
  const replayBaseline = createTourBaseline('researcher', published.state);
  assert.equal(replayBaseline.studies.length, 4);
  assert.equal(replayBaseline.bookings.length, 1);
});

for (const researcherFirst of [false, true]) {
  test(`participant tour works ${researcherFirst ? 'after publication' : 'standalone'} and rewinds booking`, () => {
    const current = createDemoState();
    if (researcherFirst) { current.draft = sampleDraft(); publishSample(current); }
    const baseline = createTourBaseline('participant', current);
    const studyId = researcherFirst ? 5 : 1;
    assert.equal(baseline.notifications[0].study_id, studyId);
    for (let index = 0; index < demoTours.participant.length; index++) {
      const result = tourScene(baseline, 'participant', index);
      assert.equal(result.state.studies.length, researcherFirst ? 5 : 4);
      assert.equal(result.state.bookings.length, index >= 8 ? 1 : 0);
    }
    assert.equal(tourScene(baseline, 'participant', 10).accountRole, 'researcher');
    assert.equal(tourScene(baseline, 'participant', 7).state.bookings.length, 0);
    assert.equal(tourScene(baseline, 'participant', 8).state.bookings[0].study_id, studyId);
    assert.equal(tourScene(baseline, 'participant', 0).state.bookings.length, 0);
  });
}
