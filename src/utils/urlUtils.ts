
export const getAbsoluteUrl = (path: string) => {
  if (!path) return null;
  const fullUrl = path.startsWith('http') ? path : `${window.location.origin}${path}`;
  return fullUrl.replace('http://', 'https://') + `?cache=${Date.now()}`;
};
