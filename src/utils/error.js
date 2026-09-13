export const errorText = (
  error,
  fallback = "Something went wrong. Please try again.",
) => {
  const raw =
    error?.payload ||
    error?.code ||
    error?.message ||
    (typeof error === "string" ? error : "");
  if (!raw) return fallback;
  const text = String(raw)
    .replace(/^auth\//, "")
    .replaceAll("-", " ");
  if (/permission/i.test(text)) {
    return "Access denied. Sign out and sign in again, and deploy Firestore rules from this project.";
  }
  return text;
};
