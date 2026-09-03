/**
 * Synthetic Photo Generator
 *
 * Creates deterministic geometric avatar images using Sharp.
 * Each identity gets a unique avatar based on their identity_id.
 * No real photographs are used.
 */

const sharp = require('sharp');
const crypto = require('crypto');

/**
 * Derive a deterministic RGB colour from a seed string.
 *
 * @param {string} seed
 * @returns {{ r: number, g: number, b: number }}
 */
function colorFromSeed(seed) {
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  const n = parseInt(hash.substring(0, 8), 16);
  return {
    r: 80 + (n % 120),
    g: 80 + ((n >> 8) % 120),
    b: 80 + ((n >> 16) % 120),
  };
}

/**
 * Generate a synthetic avatar PNG buffer for an identity.
 *
 * The avatar consists of:
 * - A coloured background
 * - A head circle
 * - A body ellipse
 * - The person's initials
 * - A border frame
 *
 * @param {object} identity  { identity_id, name, ... }
 * @param {number} [size=200]
 * @returns {Promise<Buffer>}  PNG buffer
 */
async function generatePhoto(identity, size = 200) {
  const iid = identity.identity_id;
  const name = identity.name;
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const bg = colorFromSeed(iid + 'bg');
  const fg = colorFromSeed(iid + 'fg');

  const headR = Math.floor(size / 4);
  const cx = Math.floor(size / 2);
  const cy = Math.floor(size / 3);
  const bodyW = Math.floor(size / 3);
  const bodyTop = cy + headR + 4;
  const fontSize = Math.floor(headR * 0.9);

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect x="0" y="0" width="${size}" height="${size}"
            fill="rgb(${bg.r},${bg.g},${bg.b})" />

      <!-- Body ellipse -->
      <ellipse cx="${cx}" cy="${bodyTop + Math.floor(size / 2)}"
               rx="${bodyW}" ry="${Math.floor(size / 2)}"
               fill="rgb(${fg.r},${fg.g},${fg.b})" />

      <!-- Head circle -->
      <circle cx="${cx}" cy="${cy}" r="${headR}"
              fill="rgb(${fg.r},${fg.g},${fg.b})" />

      <!-- Initials -->
      <text x="${cx}" y="${cy + Math.floor(fontSize / 3)}"
            font-family="Arial, Helvetica, sans-serif"
            font-size="${fontSize}" font-weight="bold"
            fill="white" text-anchor="middle">${initials}</text>

      <!-- Border -->
      <rect x="1" y="1" width="${size - 2}" height="${size - 2}"
            fill="none" stroke="#3C3C3C" stroke-width="2" />
    </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

module.exports = { generatePhoto, colorFromSeed };
