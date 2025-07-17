const  generateDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    navigator.platform,
    canvas.toDataURL()
  ].join('|');
  
  // Create a simple hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

export const getCurrentDeviceFingerprint = (): string => {
  return generateDeviceFingerprint();
};

export const getStoredAdminFingerprint = (): string | null => {
  return localStorage.getItem('adminDeviceFingerprint');
};

export const setAdminFingerprint = (fingerprint: string): void => {
  localStorage.setItem('adminDeviceFingerprint', fingerprint);
};

export const isAuthorizedDevice = (): boolean => {
  const currentFingerprint = getCurrentDeviceFingerprint();
  const storedFingerprint = getStoredAdminFingerprint();
  
  // If no fingerprint is stored, this is the first admin login - authorize it
  if (!storedFingerprint) {
    setAdminFingerprint(currentFingerprint);
    return true;
  }
  
  // Check if current device matches stored fingerprint
  return currentFingerprint === storedFingerprint;
};
 