
export const getAbsoluteUrl = (path: string): string => {
  if (!path) return '';
  
  // Log pour débogage
  console.log('getAbsoluteUrl input:', path);
  
  // Si l'URL est déjà absolue, la retourner telle quelle
  if (path.startsWith('http')) {
    console.log('URL absolue détectée:', path);
    return path.replace('http://', 'https://');
  }
  
  // Si l'URL commence par '/storage', elle vient probablement de Supabase
  if (path.startsWith('/storage')) {
    const supabaseUrl = `https://gdgooabpwdnuiagjokn.supabase.co${path}`;
    console.log('URL Supabase générée:', supabaseUrl);
    return supabaseUrl;
  }
  
  // Sinon, construire l'URL absolue
  const absoluteUrl = `${window.location.origin}${path.startsWith('/') ? '' : '/'}${path}`;
  console.log('URL absolue générée:', absoluteUrl);
  return absoluteUrl;
};
