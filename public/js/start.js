// @ts-check
/** Start page: create a meeting, or jump to voting with a meeting code. */

import { createMeeting } from './api.js';

const button = /** @type {HTMLButtonElement} */ (document.getElementById('create-meeting'));
const status = /** @type {HTMLElement} */ (document.getElementById('create-status'));

button.addEventListener('click', async () => {
  button.disabled = true;
  status.textContent = 'Creating meeting…';
  status.classList.remove('status--error');
  try {
    const id = await createMeeting();
    window.location.assign(`/meeting?id=${id}`);
  } catch (err) {
    status.textContent = err instanceof Error ? err.message : String(err);
    status.classList.add('status--error');
    button.disabled = false;
  }
});
