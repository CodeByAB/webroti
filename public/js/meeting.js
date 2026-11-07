// @ts-check
/** Meeting page: live vote summary, voting link and QR code. */

import { ApiError, formatRoti, getMeeting, meetingIdFromUrl } from './api.js';
import { renderQrCode } from './qr.js';

/** How often the results are refreshed while the page is visible. */
const POLL_INTERVAL_MS = 5000;

/** @param {string} id */
const el = (id) => /** @type {HTMLElement} */ (document.getElementById(id));

/** @param {string} message */
function showError(message) {
  el('error').textContent = message;
  el('error').hidden = false;
  el('meeting').hidden = true;
}

/** @param {import('./api.js').MeetingSummary} summary */
function render(summary) {
  el('vote-count').textContent = String(summary.votes);
  el('average').textContent = formatRoti(summary.average);
  el('min-max').textContent = summary.min === null ? '–' : `${formatRoti(summary.min)}–${formatRoti(summary.max)}`;
}

const id = meetingIdFromUrl();
if (!id) {
  showError('This link has no valid meeting code.');
} else {
  el('meeting-id').textContent = id;
  document.title = `Meeting ${id} – Web-ROTI`;

  const voteUrl = new URL(`/vote?id=${id}`, window.location.origin).href;
  const link = /** @type {HTMLAnchorElement} */ (el('vote-url'));
  link.href = voteUrl;
  link.textContent = voteUrl;
  /** @type {HTMLAnchorElement} */ (el('vote-link')).href = `/vote?id=${id}`;
  renderQrCode(el('qr-code'), voteUrl);

  const copyButton = /** @type {HTMLButtonElement} */ (el('copy-link'));
  if (navigator.clipboard) {
    copyButton.addEventListener('click', async () => {
      await navigator.clipboard.writeText(voteUrl);
      copyButton.textContent = 'Copied!';
      setTimeout(() => (copyButton.textContent = 'Copy link'), 2000);
    });
  } else {
    copyButton.hidden = true;
  }

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;

  const refresh = async () => {
    clearTimeout(timer);
    try {
      render(await getMeeting(id));
      el('meeting').hidden = false;
      el('error').hidden = true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        showError(`Meeting ${id} does not exist. It may have expired after 90 days without activity.`);
        return; // stop polling
      }
      // Keep showing the last result on a temporary failure; retry on the next tick.
      if (el('meeting').hidden) showError(err instanceof Error ? err.message : String(err));
    }
    if (!document.hidden) timer = setTimeout(refresh, POLL_INTERVAL_MS);
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(timer);
    else refresh();
  });

  refresh();
}
