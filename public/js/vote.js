// @ts-check
/** Vote page: pick 1.0–5.0 on a slider and submit. */

import { formatRoti, meetingIdFromUrl, vote } from './api.js';

const DEFAULT_VOTE = 3;
/** How long the "Thanks for voting" message stays before the form resets. */
const CONFIRMATION_MS = 1500;

/** @param {string} id */
const el = (id) => /** @type {HTMLElement} */ (document.getElementById(id));

const form = /** @type {HTMLFormElement} */ (el('vote-form'));
const slider = /** @type {HTMLInputElement} */ (el('vote-slider'));
const output = /** @type {HTMLOutputElement} */ (el('vote-value'));
const button = /** @type {HTMLButtonElement} */ (el('vote-button'));
const confirmation = el('confirmation');

const showValue = () => {
  output.value = formatRoti(Number(slider.value));
};

const id = meetingIdFromUrl();
if (!id) {
  el('error').textContent = 'This link has no valid meeting code.';
  el('error').hidden = false;
} else {
  el('meeting-id').textContent = id;
  document.title = `Vote in meeting ${id} – Web-ROTI`;
  /** @type {HTMLAnchorElement} */ (el('results-link')).href = `/meeting?id=${id}`;
  form.hidden = false;
  showValue();

  slider.addEventListener('input', showValue);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    confirmation.classList.remove('status--error');
    try {
      await vote(id, Math.round(Number(slider.value) * 10) / 10);
      confirmation.textContent = 'Thanks for voting!';
      // Reset before handing the phone on, so the next person isn't biased.
      slider.value = String(DEFAULT_VOTE);
      showValue();
      setTimeout(() => {
        confirmation.textContent = '';
        button.disabled = false;
      }, CONFIRMATION_MS);
    } catch (err) {
      confirmation.textContent = err instanceof Error ? err.message : String(err);
      confirmation.classList.add('status--error');
      button.disabled = false;
    }
  });
}
