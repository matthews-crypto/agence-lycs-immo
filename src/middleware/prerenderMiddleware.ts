
const RENDERTRON_URL = 'https://middlewarepreview-production.up.railway.app';

const BOTS = [
  'bot',
  'facebookexternalhit',
  'facebookcatalog',
  'whatsapp',
  'twitter',
  'pinterest',
  'linkedinbot',
  'telegram',
  'discord',
  'slack',
  'viber',
  'skype',
  'snapchat',
  'googlebot',
  'Chrome-Lighthouse'
];

export function shouldPrerender(userAgent: string = '') {
  const lowercaseUA = userAgent.toLowerCase();
  return BOTS.some(bot => lowercaseUA.includes(bot.toLowerCase())) ||
    /facebookexternalhit|whatsapp|telegram|twitter/i.test(lowercaseUA);
}

export function getPrerenderUrl(originalUrl: string) {
  return `${RENDERTRON_URL}/render/${encodeURIComponent(originalUrl)}`;
}
