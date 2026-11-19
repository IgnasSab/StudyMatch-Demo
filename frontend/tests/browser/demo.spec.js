import { expect, test } from '@playwright/test';

async function advance(page, count = 1) {
  for (let index = 0; index < count; index++) {
    await page.locator('.demo-tour-actions .button:not(.secondary)').click();
    await expect(page.locator('.driver-active-element')).toBeAttached();
  }
}

async function expectRole(page, role) {
  await expect(page.locator('.demo-toolbar .demo-role-status')).toHaveCount(0);
  await expect(page.locator('.demo-role-switch button[aria-pressed=true]')).toHaveText(role);
  await expect(page.locator('.demo-role-switch button[aria-pressed=true]')).toBeInViewport();
  await expect(page.locator('.demo-toolbar')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  if (await page.locator('.demo-tour-dock').count()) {
    await expect(page.locator('.demo-tour-dock .demo-role-status')).toHaveText(`${role} view`);
    await expect(page.locator('.demo-tour-dock .demo-role-status')).toBeInViewport();
  }
}

async function expectSidebar(page, label) {
  const active = page.locator('#main-navigation [aria-current=page]');
  await expect(active).toHaveAttribute('aria-label', label);
  await expect(active).toHaveCSS('outline-width', '5px');
  await expect(active).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(active).toHaveCSS('color', 'rgb(37, 38, 48)');
  await expect(active).toHaveCSS('z-index', '2');
}

test('participant-first journey clearly switches roles and preserves booking through researcher tour', async ({ page }) => {
  const errors = [];
  const apiRequests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => { if (request.url().includes('/api/')) apiRequests.push(request.url()); });
  await page.goto('/');
  await expect(page.locator('.demo-badge')).toHaveCount(1);
  await expect(page.locator('.demo-entry-actions .button').first()).toHaveText('Start participant tour');
  await expect(page.getByText('One study. Both sides of the experience.')).toHaveCount(0);
  await expect(page.getByText('No signup. Fictional data. Prepared AI results.')).toHaveCount(0);
  await expect(page.getByText(/Best Demo/i)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Start researcher tour', exact: true })).toHaveCount(0);
  await page.screenshot({ path: 'test-results/entry.png', fullPage: true });
  await page.getByRole('button', { name: 'Start participant tour', exact: true }).click();
  await expectRole(page, 'Participant');
  await expectSidebar(page, 'Profile & preferences');
  await expect(page.locator('.demo-tour-copy h2')).toHaveText('Fill in a starting questionnaire');
  await page.screenshot({ path: 'test-results/participant-start.png' });
  await advance(page, 2);
  await expect(page.locator('.study-row')).toHaveCount(4);
  await expectSidebar(page, 'Discover studies');
  await advance(page, 2);
  await expect(page.locator('.study-row').first()).toContainText('The choices we make');
  await advance(page, 3);
  await expect(page.locator('.calendar-selection')).toContainText('Attention in a distracted world');
  await expectSidebar(page, 'My schedule');
  await expect(page.locator('.calendar-event-copy').filter({ hasText: 'Attention in a distracted world' }).first()).toBeInViewport();
  await page.screenshot({ path: 'test-results/calendar-selection.png' });
  await advance(page);
  await expect(page.locator('.upcoming-booking')).toHaveCount(1);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.locator('.upcoming-booking')).toHaveCount(0);
  await advance(page, 2);
  await expectRole(page, 'Participant');
  await expectSidebar(page, 'Notifications');
  const switchButton = page.getByRole('button', { name: 'Switch to researcher view', exact: true });
  await expect(switchButton).toBeVisible();
  await expect(switchButton).toHaveClass(/demo-researcher-action/);
  await page.mouse.move(0, 0);
  await expect(switchButton).toHaveCSS('background-color', 'rgb(159, 60, 54)');
  await page.screenshot({ path: 'test-results/switch-action.png' });
  await advance(page);
  await expectRole(page, 'Researcher');
  await expectSidebar(page, 'Bookings');
  await expect(page.locator('.demo-tour-copy h2')).toHaveText('Researcher view: bookings');
  await expect(page.locator('.bookings-table .research-row')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/role-switch.png' });
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expectRole(page, 'Participant');
  await advance(page);
  await expectRole(page, 'Researcher');
  await page.getByRole('button', { name: 'Start researcher tour', exact: true }).click();
  await expect(page.locator('.research-toolbar')).toContainText('4 published studies');
  await expect(page.locator('.research-toolbar')).toContainText('1 booking');
  await advance(page, 2);
  await expect(page.locator('[data-tour="preview"]')).toBeVisible();
  await expectSidebar(page, 'My studies');
  await expect(page.getByRole('textbox', { name: 'Study title', exact: true })).toHaveValue('Memory in a distracted world');
  await expect(page.getByRole('spinbutton', { name: 'Payment (£)', exact: true })).toHaveValue('15');
  await page.screenshot({ path: 'test-results/researcher-tour.png' });
  await advance(page, 4);
  await expect(page.getByRole('heading', { name: 'Memory in a distracted world', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.locator('[data-tour="publish"]')).toBeVisible();
  await advance(page);
  await page.getByRole('button', { name: 'Restart tour', exact: true }).click();
  await expect(page.locator('.research-toolbar')).toContainText('4 published studies');
  await expect(page.locator('.research-toolbar')).toContainText('1 booking');
  await advance(page, 6);
  await page.getByRole('button', { name: 'Explore demo', exact: true }).click();
  await expect(page.locator('.demo-tour-dock')).toHaveCount(0);
  await expect(page.locator('.driver-overlay')).toHaveCount(0);
  await page.getByRole('button', { name: 'Bookings', exact: true }).click();
  await expect(page.locator('.bookings-table')).toContainText('Alex Morgan');
  expect(errors).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('researcher-first publication remains available in the independent participant tour', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore demo', exact: true }).click();
  await page.getByRole('button', { name: 'Researcher', exact: true }).click();
  await page.getByRole('button', { name: 'Start tour', exact: true }).click();
  await advance(page, 6);
  await page.getByRole('button', { name: 'Exit tour', exact: true }).click();
  await page.getByRole('button', { name: 'Participant', exact: true }).click();
  await expectRole(page, 'Participant');
  await page.getByRole('button', { name: 'Start tour', exact: true }).click();
  await advance(page);
  await expect(page.locator('.notification-row').first()).toContainText('Memory in a distracted world');
  await advance(page);
  await expect(page.locator('.study-row')).toHaveCount(5);
  await advance(page, 6);
  await expect(page.locator('.upcoming-booking')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('.demo-tour-dock')).toHaveCount(0);
  await expect(page.locator('.driver-overlay')).toHaveCount(0);
  await page.getByRole('button', { name: 'Researcher', exact: true }).click();
  await page.getByRole('button', { name: 'Bookings', exact: true }).click();
  await expect(page.locator('.bookings-table')).toContainText('Memory in a distracted world');
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start participant tour', exact: true })).toBeVisible();
});

test('sandbox opens as participant and supports publication, filters, screening and booking', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore demo', exact: true }).click();
  await expectRole(page, 'Participant');
  await page.getByRole('button', { name: 'Researcher', exact: true }).click();
  await expectRole(page, 'Researcher');
  await page.getByRole('button', { name: 'Create study', exact: true }).click();
  await page.getByRole('button', { name: 'Load sample study', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Study title', exact: true })).toHaveValue('Memory in a distracted world');
  await page.getByRole('checkbox', { name: 'I checked the study details' }).check();
  await page.getByRole('button', { name: 'Publish study', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Memory in a distracted world', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Participant', exact: true }).click();
  await expect(page.locator('.study-row')).toHaveCount(5);
  await page.getByRole('button', { name: 'Online', exact: true }).click();
  await expect(page.locator('.study-row')).toHaveCount(2);
  await page.getByRole('button', { name: 'All studies', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search studies' }).fill('Memory in');
  await expect(page.locator('.study-row')).toHaveCount(1);
  await page.locator('.study-open').click();
  await page.getByRole('radio', { name: 'No', exact: true }).check();
  await page.getByRole('button', { name: 'Check eligibility', exact: true }).click();
  await page.getByRole('radio', { name: /places left/ }).first().check();
  await page.getByRole('button', { name: 'Confirm booking', exact: true }).click();
  await expect(page.getByText('You’re booked. Your session is in My schedule.')).toBeVisible();
  await page.getByRole('button', { name: 'My schedule', exact: true }).click();
  await expect(page.locator('.upcoming-booking')).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Start participant tour', exact: true })).toBeVisible();
});

test('imported fields and screening questions can be edited before publication', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore demo', exact: true }).click();
  await page.getByRole('button', { name: 'Researcher', exact: true }).click();
  await page.getByRole('button', { name: 'Create study', exact: true }).click();
  await expect(page.locator('.demo-document')).toContainText('One 45-minute session');
  await expect(page.locator('.demo-document strong')).toHaveText('Sample study document');
  await expect(page.locator('.demo-source summary .tag')).toHaveCount(0);
  await expect(page.getByText('Sample import. Live AI and file uploads are not connected.', { exact: true })).toHaveCount(0);
  await page.screenshot({ path: 'test-results/study-import.png', fullPage: true });
  await page.getByRole('button', { name: 'Load sample study', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Study title', exact: true })).toHaveValue('Memory in a distracted world');
  await page.getByRole('textbox', { name: 'Study title', exact: true }).fill('Memory and focus');
  await page.getByRole('spinbutton', { name: 'Payment (£)', exact: true }).fill('20');
  await page.getByRole('textbox', { name: 'Question 1', exact: true }).fill('Have you previously completed this memory task?');
  await page.getByRole('button', { name: 'Add question', exact: true }).click();
  await page.getByRole('textbox', { name: 'Question 2', exact: true }).fill('Can you attend this session in Oxford?');
  await page.getByRole('checkbox', { name: 'I checked the study details' }).check();
  await page.getByRole('textbox', { name: 'Study description', exact: true }).fill('Complete image memory challenges at the Oxford laboratory during a 45-minute session.');
  await expect(page.getByRole('checkbox', { name: 'I checked the study details' })).not.toBeChecked();
  await page.getByRole('checkbox', { name: 'I checked the study details' }).check();
  await page.screenshot({ path: 'test-results/editable-import.png', fullPage: true });
  await page.getByRole('button', { name: 'Publish study', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Memory and focus', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Participant', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search studies', exact: true }).fill('Memory and focus');
  await expect(page.locator('.study-row')).toContainText('£20');
  await expect(page.locator('.study-row')).toContainText('2 questions left');
  await page.locator('.study-open').click();
  await expect(page.locator('.screen-questions')).toContainText('Have you previously completed this memory task?');
  await page.locator('.screen-questions .boolean-field').first().getByRole('radio', { name: 'No', exact: true }).check();
  await page.locator('.screen-questions .boolean-field').nth(1).getByRole('radio', { name: 'Yes', exact: true }).check();
  await page.getByRole('button', { name: 'Check eligibility', exact: true }).click();
  await expect(page.locator('.slot-options')).toBeVisible();
});

test('role labels and exit remain visible on compact desktop and phone', async ({ page }) => {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.getByRole('button', { name: 'Start participant tour', exact: true }).click();
    await expectRole(page, 'Participant');
    await page.screenshot({ path: `test-results/participant-${viewport.width}.png` });
    await advance(page, 10);
    await expectRole(page, 'Researcher');
    await expect(page.getByRole('button', { name: 'Exit tour', exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/role-switch-${viewport.width}.png` });
    await page.getByRole('button', { name: 'Start researcher tour', exact: true }).click();
    await advance(page, 3);
    await expect(page.getByRole('button', { name: 'Exit tour', exact: true })).toBeInViewport();
    await page.screenshot({ path: `test-results/tour-${viewport.width}.png` });
    await page.getByRole('button', { name: 'Exit tour', exact: true }).click();
    await expect(page.locator('.driver-overlay')).toHaveCount(0);
  }
});

test('keyboard focus stays in tour controls and returns to Start tour on exit', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start participant tour', exact: true }).click();
  await expect(page.locator('.driver-active-element')).toBeAttached();
  for (let index = 0; index < 8; index++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.querySelector('.demo-tour-dock').contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.demo-tour-progress')).toContainText('2 of 11');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.demo-tour-progress')).toContainText('1 of 11');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Start tour', exact: true })).toBeFocused();
});

test('role colors have readable contrast and press motion respects reduced motion', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore demo', exact: true }).click();
  const roleColors = [];
  for (const role of ['Participant', 'Researcher']) {
    await page.getByRole('button', { name: role, exact: true }).click();
    roleColors.push(await page.locator('.demo-role-switch button[aria-pressed=true]').evaluate((element) => {
      const style = getComputedStyle(element);
      function luminance(color) {
        const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map((value) => {
          const channel = value / 255;
          return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
        });
        return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
      }
      const foreground = luminance(style.color);
      const background = luminance(style.backgroundColor);
      return { color: style.color, contrast: (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05) };
    }));
  }
  expect(roleColors[0].color).not.toBe(roleColors[1].color);
  for (const colors of roleColors) expect(colors.contrast).toBeGreaterThanOrEqual(4.5);
  const button = page.getByRole('button', { name: 'Start tour', exact: true });
  await button.hover();
  await page.mouse.down();
  expect(await button.evaluate((element) => getComputedStyle(element).scale)).toBe('none');
  await page.mouse.up();
  await page.keyboard.press('Escape');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await button.hover();
  await page.mouse.down();
  await expect.poll(() => button.evaluate((element) => getComputedStyle(element).scale)).toBe('0.96');
  await page.mouse.up();
});
