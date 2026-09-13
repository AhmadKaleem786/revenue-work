export const errorText = (
  error,
  fallback = "Something went wrong. Please try again.",
) => {
  const raw =
    error?.payload ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.data?.message ||
    error?.data?.error ||
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
