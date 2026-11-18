import { announceStudy, bookSession, createDemoState, publishSample, sampleDraft } from './demo-state.js';

export const demoTours = {
  researcher: [
    { title: 'Manage your studies', description: 'View published studies, available sessions and bookings.', target: '.research-table' },
    { title: 'Import a study document', description: 'Load the prepared sample to see its study details and eligibility checks.', target: '[data-tour="import"]', next: 'Load sample' },
    { title: 'Check the study details', description: 'Check the description, payment and participation requirements.', target: '[data-tour="preview"]' },
    { title: 'Review eligibility questions', description: 'Check which requirements use saved answers and which need study-specific questions.', target: '[data-tour="rules"]' },
    { title: 'Set session times', description: 'Choose when sessions run and how many participants can book.', target: '[data-tour="sessions"]' },
    { title: 'Approve and publish', description: 'Confirm the study details and participation requirements, then publish.', target: '[data-tour="publish"]', next: 'Publish study' },
    { title: 'Study published', description: 'Participants can now find the study, check eligibility and choose a session.', target: '.detail-facts' },
  ],
  participant: [
    { title: 'Fill in a starting questionnaire', description: 'Save your age, languages and other details used to check study requirements.', target: '.form-section:first-child' },
    { title: 'Get notified about new studies', description: 'Open a study notification to view the study and any remaining eligibility questions.', target: '.notification-row:first-child' },
    { title: 'Browse studies', description: 'Compare pay, duration and location. Use filters to narrow the list.', target: '.study-list' },
    { title: 'Set your priorities', description: 'Choose how much earnings, interests and convenience affect study order.', target: '.weights', next: 'Apply priorities' },
    { title: 'See the updated ranking', description: 'The short online study now comes first. Your priorities change ranking, not eligibility.', target: '.study-list' },
    { title: 'Answer study-specific questions', description: 'Answer the researcher’s remaining questions before booking.', target: '.screen-questions', next: 'Check eligibility' },
    { title: 'Check available sessions', description: 'Your answers meet this study’s requirements. You can now choose a session.', target: '.slot-options' },
    { title: 'Book a session', description: 'Check the selected time and location, then confirm your booking.', target: '.calendar-selection', next: 'Confirm booking' },
    { title: 'See your booking', description: 'Your session appears in My schedule. The researcher can see the same booking.', target: '.upcoming-bookings' },
    { title: 'Read your confirmation', description: 'The booking confirmation appears in Notifications.', target: '.notification-row:first-child', next: 'Switch to researcher view', nextRole: 'researcher' },
    { title: 'Researcher view: bookings', description: 'The researcher sees Alex’s name, study and session time.', target: '.bookings-table', nextRole: 'researcher' },
  ],
};

export function createTourBaseline(role, currentState) {
  const baseline = structuredClone(currentState);
  if (role === 'researcher') {
    baseline.studies = baseline.studies.filter((study) => study.id !== 5);
    baseline.bookings = baseline.bookings.filter((booking) => booking.study_id !== 5);
    baseline.notifications = baseline.notifications.filter((notification) => notification.study_id !== 5);
    delete baseline.answers[5];
    baseline.draft = null;
    return baseline;
  }
  baseline.profile = createDemoState(baseline.createdAt).profile;
  baseline.answers = {};
  baseline.bookings = [];
  baseline.draft = null;
  baseline.notifications = [];
  for (const study of baseline.studies) {
    study.booked_count = 0;
    for (const slot of study.slots) slot.remaining = slot.capacity;
  }
  announceStudy(baseline, baseline.studies.some((study) => study.id === 5) ? 5 : 1);
  return baseline;
}

export function tourScene(baseline, role, index) {
  const state = structuredClone(baseline);
  const scene = { view: 'studies' };
  let accountRole = role;
  if (role === 'researcher') {
    if (index >= 1 && index <= 5) scene.view = 'create';
    if (index >= 2) {
      state.draft = sampleDraft();
      scene.draft = sampleDraft();
      scene.slots = [0, 1].map((offset) => {
        const date = new Date(state.createdAt);
        date.setDate(date.getDate() + 2 + offset);
        date.setHours(14, 0, 0, 0);
        return { starts_at: new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16), capacity: 3 };
      });
    }
    if (index >= 5) scene.approved = true;
    if (index === 6) {
      publishSample(state, scene.slots.map((slot) => ({ ...slot, starts_at: new Date(slot.starts_at).toISOString() })));
      scene.selected = 5;
    }
  } else {
    const target = state.studies.find((study) => study.id === 5) ?? state.studies.find((study) => study.id === 1);
    if (index === 0) { scene.view = 'profile'; scene.profileTab = 'prescreen'; }
    if (index === 1 || index === 9) scene.view = 'notifications';
    if (index >= 3) state.profile.weights = { interest: 1, compensation: 5, convenience: 5 };
    if (index === 3) scene.view = 'profile';
    if (index === 5 || index === 6) {
      scene.selected = target.id;
      scene.answers = { [target.rules.find((rule) => rule.field === 'question').id]: false };
    }
    if (index >= 6) state.answers[target.id] = { [target.rules.find((rule) => rule.field === 'question').id]: false };
    if (index === 7 || index === 8) { scene.view = 'schedule'; scene.focusStartsAt = target.slots[0].starts_at; }
    if (index === 7) scene.selectedSlot = target.slots[0].id;
    if (index >= 8) bookSession(state, target.slots[0].id);
    if (index === 10) { accountRole = 'researcher'; scene.view = 'bookings'; }
  }
  return { state, scene, accountRole };
}
