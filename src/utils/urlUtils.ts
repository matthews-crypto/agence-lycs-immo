
export const getAbsoluteUrl = (path: string) => {
  if (!path) return '';
  const fullUrl = path.startsWith('http') ? path : `${window.location.origin}${path.startsWith('/') ? '' : '/'}${path}`;
  return fullUrl.replace('http://', 'https://');
};
