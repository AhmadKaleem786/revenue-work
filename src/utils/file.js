export const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const isAllowedLogo = (file) => {
  if (!file?.type?.startsWith("image/")) return "Upload an image file.";
  if (file.size > 2 * 1024 * 1024) return "Logo must be under 2MB.";
  return "";
};
