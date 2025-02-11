
const RENDERTRON_URL = 'https://middlewarepreview-production.up.railway.app';

const BOTS = [
  'bot',
  'facebookexternalhit',
  'whatsapp',
  'twitter',
  'linkedin',
  'telegram',
  'discord',
  'slack',
  'viber'
];

export function shouldPrerender(userAgent: string = '') {
  return BOTS.some(bot => userAgent.toLowerCase().includes(bot));
}

export function getPrerenderUrl(originalUrl: string) {
  return `${RENDERTRON_URL}/render/${encodeURIComponent(originalUrl)}`;
}
