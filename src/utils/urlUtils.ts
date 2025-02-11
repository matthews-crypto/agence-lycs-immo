
export const getAbsoluteUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) {
    return path.replace('http://', 'https://');
  }
  return `https://gdgooabpwdnuiagjokn.supabase.co${path}`;
};
