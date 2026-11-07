// @ts-check
/** Renders a QR code as inline SVG built with DOM APIs (no innerHTML, CSP-safe). */

import qrcode from '/vendor/qrcode-generator-2.0.4/qrcode.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const QUIET_ZONE = 4; // modules of white border, per the QR spec

/**
 * @param {HTMLElement} container
 * @param {string} text
 */
export function renderQrCode(container, text) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();

  const count = qr.getModuleCount();
  const size = count + QUIET_ZONE * 2;
  let path = '';
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) path += `M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`;
    }
  }

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('aria-hidden', 'true');
  const background = document.createElementNS(SVG_NS, 'rect');
  background.setAttribute('width', String(size));
  background.setAttribute('height', String(size));
  background.setAttribute('fill', '#fff');
  const modules = document.createElementNS(SVG_NS, 'path');
  modules.setAttribute('d', path);
  modules.setAttribute('fill', '#000');
  svg.append(background, modules);
  container.replaceChildren(svg);
}
