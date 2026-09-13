import { fileToDataUrl } from './file';

const keyFor = (uid) => `rw-business-logo:${uid}`;

export const getLocalLogo = (uid) =>
  uid ? localStorage.getItem(keyFor(uid)) || '' : '';

export const saveLocalLogo = async (uid, file) => {
  if (!file) return getLocalLogo(uid);
  const logo = await fileToDataUrl(file);
  localStorage.setItem(keyFor(uid), logo);
  return logo;
};
