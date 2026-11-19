import { conflicts, scoreStudy } from './api.js';

export const demoAccounts = {
  researcher: { id: 2, name: 'Dr Robin Taylor', email: 'researcher@studymatch.demo', role: 'researcher', onboarded: true },
  participant: { id: 1, name: 'Alex Morgan', email: 'participant@studymatch.demo', role: 'participant', onboarded: true },
};

const topics = ['Games & Challenges', 'Puzzles & Memory Games', 'Visual & Attention Challenges', 'Decision-Making & Rewards', 'Language & Words', 'Creativity & Imagination', 'Social Games & Interactions', 'Emotions & Relationships'];
const ordinaryRules = [
  { id: 'age', field: 'age', answer_type: 'number', value: [18, 35], question: 'How old are you?', source: 'aged 18–35', choices: [] },
  { id: 'english', field: 'english', answer_type: 'boolean', value: true, question: 'Are you fluent in English?', source: 'fluent in English', choices: [] },
  { id: 'vision', field: 'vision', answer_type: 'boolean', value: true, question: 'Do you have normal or corrected-to-normal vision?', source: 'normal or corrected-to-normal vision', choices: [] },
];
const previousRule = (id, task) => ({ id, field: 'question', answer_type: 'boolean', value: false, question: `Have you participated in our previous ${task} experiment?`, source: `have not participated in our previous ${task} experiment`, choices: [] });

export const sampleFields = {
  title: 'Memory in a distracted world',
  summary: 'Explore how everyday distractions change what we remember.',
  description: 'Complete a series of visual memory challenges on a laboratory computer. Respond to images with and without distractions during a single 45-minute session. All equipment is provided.',
  requirements: 'Adults aged 18–35, fluent in English, with normal or corrected-to-normal vision, who have not participated in our previous visual memory experiment.',
  mode: 'in_person', location: 'Oxford · Experimental Psychology', duration: 45, compensation: 15,
  tags: ['Puzzles & Memory Games', 'Visual & Attention Challenges'],
  convenience_score: 3, convenience_reason: 'One 45-minute lab visit. Equipment is provided; travel is required.',
};

export const sampleDescription = `${sampleFields.title}\n\n${sampleFields.description}\n\nOne 45-minute session at Oxford Experimental Psychology pays £15. Recruit participants aged 18–35 who are fluent in English, have normal or corrected-to-normal vision, and have not participated in our previous visual memory experiment.`;

export const demoBootstrap = {
  demo: true, ai_available: false, topics, sample_description: sampleDescription,
  languages: ['English', 'French', 'German', 'Lithuanian', 'Spanish'], language_levels: ['Beginner', 'Intermediate', 'Fluent'],
  universities: ['University of Oxford', 'Oxford Brookes University', 'University of Cambridge', 'None'],
  locations: ['Oxford · Experimental Psychology'],
  prescreen_sections: [{ title: 'Additional general information', fields: [{ field: 'gender', label: 'Gender', type: 'choice', options: ['Woman', 'Man', 'Non-binary', 'Prefer not to say'] }] }],
};

function sessionDate(now, days, hour) {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
}

function makeSlots(now, studyId, days, hour) {
  return [0, 1].map((offset) => ({ id: studyId * 10 + offset, starts_at: sessionDate(now, days + offset, hour), capacity: 3, remaining: 3 }));
}

export function createDemoState(now = new Date()) {
  const examples = [
    { title: 'Attention in a distracted world', summary: 'Explore how visual distractions affect attention in a short computer task.', description: 'Respond to shapes and patterns on a laboratory computer. This visual attention experiment takes one 45-minute session.', requirements: 'Adults aged 18–35, fluent in English, with normal or corrected-to-normal vision. No previous visual search participation.', mode: 'in_person', location: 'Oxford · Experimental Psychology', duration: 45, compensation: 12, tags: ['Visual & Attention Challenges', 'Puzzles & Memory Games'], convenience_score: 3, convenience_reason: 'A 45-minute lab visit; all equipment is supplied.', rules: [...ordinaryRules, previousRule('previous_visual_search', 'visual search')] },
    { title: 'The choices we make', summary: 'Trade off risks and rewards in an interactive decision-making game.', description: 'Make everyday choices in a browser-based decision-making game. Complete one 20-minute session from home using your laptop.', requirements: 'Adults aged 18–65 with a laptop.', mode: 'online', location: 'Online', duration: 20, compensation: 8, tags: ['Decision-Making & Rewards', 'Games & Challenges'], convenience_score: 5, convenience_reason: 'A short online task with no travel and little setup.', rules: [{ ...ordinaryRules[0], value: [18, 65] }, { id: 'has_laptop', field: 'has_laptop', value: true, answer_type: 'boolean', question: 'Can you use a laptop or desktop computer?', choices: [], source: 'with a laptop' }] },
    { title: 'Words in context', summary: 'Read short stories and explore how context changes meaning.', description: 'Read short sentences and stories, then answer questions about their meaning in a 30-minute online session.', requirements: 'Adults aged 18–65 who are fluent in English.', mode: 'online', location: 'Online', duration: 30, compensation: 10, tags: ['Language & Words', 'Creativity & Imagination'], convenience_score: 5, convenience_reason: 'A browser task with no specialist equipment or travel.', rules: [{ ...ordinaryRules[0], value: [18, 65] }, ordinaryRules[1]] },
    { title: 'Social connections', summary: 'Play a cooperative game and explore how people work together.', description: 'Join a cooperative computer game at our Oxford lab. Make decisions alongside another participant during one hour-long session.', requirements: 'Adults aged 18–65.', mode: 'in_person', location: 'Oxford · Experimental Psychology', duration: 60, compensation: 18, tags: ['Social Games & Interactions', 'Emotions & Relationships', 'Games & Challenges'], convenience_score: 3, convenience_reason: 'An hour-long lab visit with a shared appointment.', rules: [{ ...ordinaryRules[0], value: [18, 65] }] },
  ];
  return {
    createdAt: new Date(now).toISOString(),
    profile: { name: 'Alex Morgan', birth_date: '2002-05-14', handedness: 'right', first_language: 'English', additional_languages: [], language_levels: {}, english: true, vision: true, psychology_background: false, university: 'University of Oxford', gender: null, has_laptop: true, has_smartphone: true, has_headphones: true, comfortable_webcam: false, comfortable_audio_recording: false, comfortable_video_recording: false, interests: ['Puzzles & Memory Games', 'Visual & Attention Challenges'], weights: { interest: 5, compensation: 1, convenience: 1 }, preferred_mode: 'any', preferred_location: '', max_duration: 480, preferred_times: [], notifications: 'immediate', preference_filters: false },
    studies: examples.map((study, index) => ({ ...study, id: index + 1, manual_review: false, review_notes: [], booked_count: 0, slots: makeSlots(now, index + 1, index + 1, 10 + index) })),
    answers: {}, bookings: [], notifications: [], draft: null,
  };
}

export function sampleDraft() {
  return { draft_id: 1, fields: structuredClone(sampleFields), source_text: sampleDescription, rules: structuredClone([...ordinaryRules, previousRule('previous_visual_memory', 'visual memory')]), mode: 'sample', manual_review: false, review_notes: ['Check each requirement against the source text.'] };
}

function ageOnDate(birthDate, now) {
  const birth = new Date(birthDate);
  const date = new Date(now);
  return date.getUTCFullYear() - birth.getUTCFullYear() - (date.getUTCMonth() < birth.getUTCMonth() || (date.getUTCMonth() === birth.getUTCMonth() && date.getUTCDate() < birth.getUTCDate()) ? 1 : 0);
}

export function studyEligibility(state, study, now = new Date()) {
  const answers = state.answers[study.id] ?? {};
  const questions = [];
  for (const rule of study.rules) {
    const answer = rule.field === 'age' ? ageOnDate(state.profile.birth_date, now) : rule.field === 'question' ? answers[rule.id] : state.profile[rule.field];
    if (answer === undefined || answer === null) questions.push({ id: rule.id, question: rule.question, answer_type: rule.answer_type, choices: rule.choices });
    else if (Array.isArray(rule.value) ? answer < rule.value[0] || answer > rule.value[1] : answer !== rule.value) return { status: 'ineligible', questions: [] };
  }
  return { status: questions.length ? 'needs_screening' : 'eligible', questions };
}

function studyMatch(state, study) {
  const { rules, requirements, review_notes, ...publicStudy } = study;
  const screening = studyEligibility(state, study);
  const components = { interest: state.profile.interests.length ? 1 + 4 * study.tags.filter((tag) => state.profile.interests.includes(tag)).length / state.profile.interests.length : 1, compensation: 1 + 4 * Math.min(study.compensation * 60 / study.duration / 25, 1), convenience: study.convenience_score };
  return { ...structuredClone(publicStudy), ...screening, slots: screening.status === 'eligible' ? structuredClone(study.slots.filter((slot) => new Date(slot.starts_at) > new Date())) : [], components, score: scoreStudy({ components }, state.profile.weights), booked: state.bookings.some((booking) => booking.study_id === study.id), review_status: null, review_note: null };
}

function notify(state, study, kind, message) {
  state.notifications.unshift({ id: `${kind}-${study.id}`, study_id: study.id, kind, title: study.title, message, created_at: new Date().toISOString() });
}

export function announceStudy(state, studyId) {
  const study = state.studies.find((item) => item.id === studyId);
  const eligibility = studyEligibility(state, study);
  const kind = eligibility.status === 'eligible' ? 'eligible' : 'potential';
  if (!state.notifications.some((notification) => notification.id === `${kind}-${studyId}`)) notify(state, study, kind, `New study · ${study.duration} minutes · £${study.compensation}. ${kind === 'eligible' ? 'Choose an available session.' : 'Answer the remaining questions to check eligibility.'}`);
}

function addSlots(state, study, slots) {
  if (!slots.length || slots.some((slot) => !Number.isInteger(slot.capacity) || slot.capacity < 1 || !Number.isFinite(Date.parse(slot.starts_at)) || new Date(slot.starts_at) <= new Date())) throw new Error('Add a future session with at least one place.');
  const existing = new Set(study.slots.map((slot) => new Date(slot.starts_at).toISOString()));
  if (slots.some((slot) => { const start = new Date(slot.starts_at).toISOString(); const duplicate = existing.has(start); existing.add(start); return duplicate; })) throw new Error('A session already exists at this time. Choose another time.');
  let nextId = Math.max(0, ...state.studies.flatMap((item) => item.slots.map((slot) => slot.id))) + 1;
  study.slots.push(...slots.map((slot) => ({ ...slot, starts_at: new Date(slot.starts_at).toISOString(), id: nextId++, remaining: slot.capacity })));
}

export function publishSample(state, slots = makeSlots(state.createdAt, 5, 2, 14), draft = state.draft) {
  if (draft === null) throw new Error('Load the sample study before publishing.');
  const study = { ...structuredClone(draft.fields), id: 5, rules: structuredClone(draft.rules), manual_review: false, review_notes: [], booked_count: 0, slots: [] };
  if (state.studies.some((item) => item.id === study.id)) throw new Error('The sample study is already published. Explore it in My studies or reset the demo.');
  addSlots(state, study, slots);
  state.studies.unshift(study);
  state.draft = null;
  announceStudy(state, study.id);
  return structuredClone(study);
}

export function bookSession(state, slotId) {
  const study = state.studies.find((item) => item.slots.some((slot) => slot.id === slotId));
  if (!study) throw new Error('Session not found. Choose a listed session.');
  const slot = study.slots.find((item) => item.id === slotId);
  if (studyEligibility(state, study).status !== 'eligible') throw new Error('Complete the remaining screening before booking.');
  if (state.bookings.some((booking) => booking.study_id === study.id)) throw new Error('You already have a booking for this study.');
  if (new Date(slot.starts_at) <= new Date() || slot.remaining === 0) throw new Error('This session is no longer available. Choose another time.');
  if (conflicts(slot, study.duration, state.bookings)) throw new Error('This session overlaps an existing booking. Choose another time.');
  const booking = { id: state.bookings.length + 1, study_id: study.id, title: study.title, starts_at: slot.starts_at, duration: study.duration, location: study.location, mode: study.mode, participant_name: state.profile.name };
  state.bookings.push(booking);
  slot.remaining -= 1;
  study.booked_count += 1;
  notify(state, study, 'booking', 'Booking confirmed. View your session in My schedule.');
  return structuredClone(booking);
}

export function createDemoStore(initialState = createDemoState()) {
  let state = structuredClone(initialState);
  return {
    snapshot: () => structuredClone(state),
    restore: (snapshot) => { state = structuredClone(snapshot); },
    async request(path, method = 'GET', body) {
      if (method === 'GET') {
        if (path === '/profile') return structuredClone(state.profile);
        if (path === '/researcher/studies') return structuredClone({ studies: state.studies, bookings: state.bookings, review_requests: [] });
        if (path === '/matches' || path === '/notifications') {
          const matches = state.studies.map((study) => studyMatch(state, study)).filter((study) => study.status !== 'ineligible').sort((first, second) => second.score - first.score);
          const notifications = state.notifications.filter((notification) => notification.kind === 'booking' || matches.some((study) => study.id === notification.study_id && !study.booked)).map((notification) => ({ ...notification, study_id: matches.some((study) => study.id === notification.study_id) ? notification.study_id : null }));
          return structuredClone({ matches, notifications, bookings: state.bookings });
        }
      }
      if ((path === '/profile' && method === 'PUT') || (path === '/preferences' && method === 'PATCH')) {
        state.profile = { ...state.profile, ...structuredClone(body) };
        return structuredClone(state.profile);
      }
      if (path === '/extract' && method === 'POST' && body.demo) {
        state.draft = sampleDraft();
        return structuredClone(state.draft);
      }
      if (path === '/studies' && method === 'POST') {
        if (!body.approved) throw new Error('Review and approve the sample study before publishing.');
        return publishSample(state, body.slots, body.draft);
      }
      if (path === '/answers' && method === 'POST') {
        const study = state.studies.find((item) => item.id === body.study_id);
        const { questions } = studyEligibility(state, study);
        if (Object.entries(body.answers).some(([id, answer]) => !questions.some((question) => question.id === id && question.answer_type === 'boolean' && typeof answer === 'boolean'))) throw new Error('Answer the remaining screening questions using Yes or No.');
        state.answers[study.id] = { ...state.answers[study.id], ...body.answers };
        return studyEligibility(state, study);
      }
      if (path === '/bookings' && method === 'POST') return bookSession(state, body.slot_id);
      const slotsPath = path.match(/^\/researcher\/studies\/(\d+)\/slots$/);
      if (slotsPath && method === 'POST') {
        const study = state.studies.find((item) => item.id === Number(slotsPath[1]));
        addSlots(state, study, body.slots);
        return structuredClone(study);
      }
      throw new Error('Live AI and file uploads are unavailable. Use the sample study.');
    },
  };
}

export const demoStore = createDemoStore();
