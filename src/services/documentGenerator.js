/**
 * Document Image Generator
 *
 * Renders synthetic document images (Aadhaar-like, PAN-like, Birth
 * Certificate, School Certificate) as 1600×1000 PNGs using Sharp.
 *
 * Each document type has a distinct colour palette and layout.
 * All documents carry the mandatory synthetic-data disclaimer.
 *
 * Documents are rendered by:
 *  1. Building an SVG string with all text, shapes, and layout
 *  2. Converting the SVG to a PNG buffer via Sharp
 *  3. Compositing the identity's avatar photo onto photo-bearing docs
 */

const sharp = require('sharp');
const path = require('path');

// ── Dimensions ──────────────────────────────────────────────────────
const IMG_W = 1600;
const IMG_H = 1000;

// ── Colour palettes per document type ───────────────────────────────
const PALETTES = {
  aadhaar: {
    bg: '#FFFFFF',
    headerBg: '#E66432',
    accent: '#C85028',
    text: '#1E1E1E',
    headerText: '#FFFFFF',
    border: '#C85028',
  },
  pan: {
    bg: '#FFFFF5',
    headerBg: '#145090',
    accent: '#145090',
    text: '#1E1E1E',
    headerText: '#FFFFFF',
    border: '#145090',
  },
  birth_certificate: {
    bg: '#FAF8F0',
    headerBg: '#643214',
    accent: '#8C501E',
    text: '#281E14',
    headerText: '#FFFFF0',
    border: '#8C6432',
  },
  school_certificate: {
    bg: '#F5FAFF',
    headerBg: '#1E643C',
    accent: '#1E643C',
    text: '#1E1E1E',
    headerText: '#FFFFFF',
    border: '#1E643C',
  },
};

// ── Fictional data tables ───────────────────────────────────────────
const SCHOOL_NAMES = [
  'Sunrise Public School, New Delhi',
  'Green Valley International Academy, Pune',
  'Lakeside Vidyalaya, Jaipur',
  'Silver Oaks Higher Secondary School, Chennai',
  'Bright Future Convent School, Lucknow',
  'Golden Horizon Academy, Hyderabad',
  'Blue Ridge Public School, Bangalore',
  'Emerald Heights School, Bhopal',
  'Pearl International School, Kolkata',
  'Diamond Jubilee Public School, Ahmedabad',
];

const PLACES_OF_BIRTH = [
  'New Delhi',
  'Mumbai',
  'Jaipur',
  'Chennai',
  'Lucknow',
  'Hyderabad',
  'Bangalore',
  'Bhopal',
  'Kolkata',
  'Ahmedabad',
];

// ── XML escaping ────────────────────────────────────────────────────
function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ── SVG building blocks ─────────────────────────────────────────────

function svgHeader() {
  return `<svg width="${IMG_W}" height="${IMG_H}" xmlns="http://www.w3.org/2000/svg">`;
}

function svgBackground(pal) {
  return `<rect x="0" y="0" width="${IMG_W}" height="${IMG_H}" fill="${pal.bg}" />`;
}

function svgBorder(pal) {
  return `
    <rect x="0" y="0" width="${IMG_W}" height="${IMG_H}"
          fill="none" stroke="${pal.border}" stroke-width="4" />
    <rect x="4" y="4" width="${IMG_W - 8}" height="${IMG_H - 8}"
          fill="none" stroke="${pal.accent}" stroke-width="2" />`;
}

function svgHeaderBar(pal, title, subtitle) {
  return `
    <rect x="6" y="6" width="${IMG_W - 12}" height="120" fill="${pal.headerBg}" />
    <text x="40" y="58" font-family="Arial, Helvetica, sans-serif"
          font-size="32" font-weight="bold" fill="${pal.headerText}">${esc(title)}</text>
    <text x="40" y="100" font-family="Arial, Helvetica, sans-serif"
          font-size="20" fill="${pal.headerText}">${esc(subtitle)}</text>`;
}

function svgField(x, y, label, value, pal) {
  return `
    <text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif"
          font-size="18" fill="${pal.accent}">${esc(label)}</text>
    <text x="${x}" y="${y + 28}" font-family="Arial, Helvetica, sans-serif"
          font-size="24" font-weight="bold" fill="${pal.text}">${esc(value)}</text>`;
}

function svgDisclaimer() {
  return `
    <text x="40" y="${IMG_H - 50}" font-family="Arial, Helvetica, sans-serif"
          font-size="18" font-weight="bold" fill="#B41E1E">WARNING: SYNTHETIC DOCUMENT — NOT A REAL GOVERNMENT DOCUMENT</text>
    <text x="40" y="${IMG_H - 25}" font-family="Arial, Helvetica, sans-serif"
          font-size="15" fill="#8C2828">For research and prototype testing only. No real personal data.</text>`;
}

function svgPhotoPlaceholder(x, y, size) {
  // A grey box where the photo will be composited later
  return `
    <rect x="${x}" y="${y}" width="${size}" height="${size}"
          fill="#E0E0E0" stroke="#3C3C3C" stroke-width="2" />
    <text x="${x + size / 2}" y="${y + size / 2 + 6}"
          font-family="Arial, sans-serif" font-size="14"
          fill="#999" text-anchor="middle">PHOTO</text>`;
}

// ── Photo compositing constants ─────────────────────────────────────
const PHOTO_X = IMG_W - 260;
const PHOTO_Y = 160;
const PHOTO_SIZE = 180;

// ── Document generators ─────────────────────────────────────────────

/**
 * Generate an Aadhaar-like synthetic identity document.
 *
 * @param {object} identity    Identity record
 * @param {string} docId       e.g. "DOC001"
 * @param {Buffer|null} photoBuffer  PNG buffer of the avatar
 * @param {object} [overrides] { name?, dob?, photoBuffer? }
 * @returns {Promise<Buffer>}  Final PNG buffer
 */
async function generateAadhaarDocument(identity, docId, photoBuffer, overrides = {}) {
  const pal = PALETTES.aadhaar;
  const name = overrides.name || identity.name;
  const dob = overrides.dob || identity.dob;
  const synId = `SYN-${identity.identity_id}`;

  let y = 170;
  const gap = 65;

  const svg = `${svgHeader()}
    ${svgBackground(pal)}
    ${svgBorder(pal)}
    ${svgHeaderBar(pal, 'SYNTHETIC AADHAAR-LIKE IDENTITY DOCUMENT', 'Fictional Government of India — Prototype Only')}
    ${svgField(40, y, 'Document Type', 'Aadhaar-like Synthetic Identity Document', pal)}
    ${svgField(40, y += gap, 'Synthetic ID', synId, pal)}
    ${svgField(40, y += gap, 'Document ID', docId, pal)}
    ${svgField(40, y += gap, 'Name', name, pal)}
    ${svgField(40, y += gap, 'Date of Birth', dob, pal)}
    ${svgField(40, y += gap, "Father's Name", identity.father_name, pal)}
    ${svgPhotoPlaceholder(PHOTO_X, PHOTO_Y, PHOTO_SIZE)}
    ${svgDisclaimer()}
  </svg>`;

  return compositeWithPhoto(svg, overrides.photoBuffer || photoBuffer);
}

/**
 * Generate a PAN-like synthetic tax document.
 */
async function generatePanDocument(identity, docId, photoBuffer, overrides = {}) {
  const pal = PALETTES.pan;
  const name = overrides.name || identity.name;
  const dob = overrides.dob || identity.dob;
  const idNum = parseInt(identity.identity_id.replace('ID', ''), 10);
  const synPan = `SYNAB${String(idNum).padStart(4, '0')}C`;

  let y = 170;
  const gap = 65;

  const svg = `${svgHeader()}
    ${svgBackground(pal)}
    ${svgBorder(pal)}
    ${svgHeaderBar(pal, 'SYNTHETIC PAN-LIKE TAX DOCUMENT', 'Fictional Tax Department — Prototype Only')}
    ${svgField(40, y, 'Document Type', 'PAN-like Synthetic Tax Document', pal)}
    ${svgField(40, y += gap, 'Synthetic PAN', synPan, pal)}
    ${svgField(40, y += gap, 'Document ID', docId, pal)}
    ${svgField(40, y += gap, 'Name', name, pal)}
    ${svgField(40, y += gap, 'Date of Birth', dob, pal)}
    ${svgField(40, y += gap, "Father's Name", identity.father_name, pal)}
    ${svgPhotoPlaceholder(PHOTO_X, PHOTO_Y, PHOTO_SIZE)}
    ${svgDisclaimer()}
  </svg>`;

  return compositeWithPhoto(svg, overrides.photoBuffer || photoBuffer);
}

/**
 * Generate a synthetic birth certificate.
 */
async function generateBirthCertificate(identity, docId, overrides = {}) {
  const pal = PALETTES.birth_certificate;
  const name = overrides.name || identity.name;
  const dob = overrides.dob || identity.dob;
  const certId = `BIRTH-${identity.identity_id}`;
  const idx = parseInt(identity.identity_id.replace('ID', ''), 10) - 1;
  const place = PLACES_OF_BIRTH[idx % PLACES_OF_BIRTH.length];

  let y = 170;
  const gap = 65;

  // Decorative seal
  const sealX = IMG_W - 200;
  const sealY = 320;
  const sealR = 80;

  const svg = `${svgHeader()}
    ${svgBackground(pal)}
    ${svgBorder(pal)}
    ${svgHeaderBar(pal, 'SYNTHETIC BIRTH CERTIFICATE', 'Fictional Municipal Corporation — Prototype Only')}
    ${svgField(40, y, 'Document Type', 'Birth Certificate (Synthetic)', pal)}
    ${svgField(40, y += gap, 'Certificate ID', certId, pal)}
    ${svgField(40, y += gap, 'Document ID', docId, pal)}
    ${svgField(40, y += gap, 'Name', name, pal)}
    ${svgField(40, y += gap, 'Date of Birth', dob, pal)}
    ${svgField(40, y += gap, "Father's Name", identity.father_name, pal)}
    ${svgField(40, y += gap, 'Place of Birth', place, pal)}
    <!-- Fictional seal -->
    <circle cx="${sealX}" cy="${sealY}" r="${sealR}"
            fill="none" stroke="${pal.accent}" stroke-width="3" />
    <text x="${sealX}" y="${sealY + 5}" font-family="Arial, sans-serif"
          font-size="14" fill="${pal.accent}" text-anchor="middle">FICTIONAL SEAL</text>
    ${svgDisclaimer()}
  </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Generate a synthetic school certificate.
 */
async function generateSchoolCertificate(identity, docId, overrides = {}) {
  const pal = PALETTES.school_certificate;
  const name = overrides.name || identity.name;
  const dob = overrides.dob || identity.dob;
  const studentId = `SCHOOL-${identity.identity_id}`;
  const idx = parseInt(identity.identity_id.replace('ID', ''), 10) - 1;
  const school = SCHOOL_NAMES[idx % SCHOOL_NAMES.length];

  let y = 170;
  const gap = 65;

  const svg = `${svgHeader()}
    ${svgBackground(pal)}
    ${svgBorder(pal)}
    ${svgHeaderBar(pal, 'SYNTHETIC SCHOOL CERTIFICATE', esc(school))}
    ${svgField(40, y, 'Document Type', 'School Certificate (Synthetic)', pal)}
    ${svgField(40, y += gap, 'Student ID', studentId, pal)}
    ${svgField(40, y += gap, 'Document ID', docId, pal)}
    ${svgField(40, y += gap, 'Student Name', name, pal)}
    ${svgField(40, y += gap, 'Date of Birth', dob, pal)}
    ${svgField(40, y += gap, "Father's Name", identity.father_name, pal)}
    ${svgField(40, y += gap, 'School Name', school, pal)}
    <!-- Signature line -->
    <line x1="40" y1="${IMG_H - 130}" x2="${IMG_W - 40}" y2="${IMG_H - 130}"
          stroke="${pal.accent}" stroke-width="2" />
    <text x="40" y="${IMG_H - 108}" font-family="Arial, sans-serif"
          font-size="16" fill="${pal.text}">Principal (Fictional)</text>
    <text x="${IMG_W - 300}" y="${IMG_H - 108}" font-family="Arial, sans-serif"
          font-size="16" fill="${pal.text}">Date of Issue: 2020-04-01</text>
    ${svgDisclaimer()}
  </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

// ── Composite helper ────────────────────────────────────────────────

/**
 * Render the SVG base document and composite the photo onto it.
 *
 * @param {string} svg         SVG markup string
 * @param {Buffer|null} photo  PNG buffer to overlay
 * @returns {Promise<Buffer>}  Final composited PNG buffer
 */
async function compositeWithPhoto(svg, photo) {
  const base = sharp(Buffer.from(svg)).png();

  if (!photo) {
    return base.toBuffer();
  }

  const resizedPhoto = await sharp(photo)
    .resize(PHOTO_SIZE, PHOTO_SIZE, { fit: 'cover' })
    .png()
    .toBuffer();

  return base
    .composite([{ input: resizedPhoto, left: PHOTO_X, top: PHOTO_Y }])
    .toBuffer();
}

// ── Document type → generator mapping ───────────────────────────────
const GENERATORS = {
  aadhaar: generateAadhaarDocument,
  pan: generatePanDocument,
  birth_certificate: generateBirthCertificate,
  school_certificate: generateSchoolCertificate,
};

// Document types that include a photo
const PHOTO_TYPES = new Set(['aadhaar', 'pan']);

module.exports = {
  generateAadhaarDocument,
  generatePanDocument,
  generateBirthCertificate,
  generateSchoolCertificate,
  GENERATORS,
  PHOTO_TYPES,
  SCHOOL_NAMES,
  PLACES_OF_BIRTH,
  IMG_W,
  IMG_H,
};
