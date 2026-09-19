// Older projects do not have an ownership share. Treat them as fully owned so
// their financial reporting remains unchanged until the user chooses otherwise.
export const ownershipShare = (project) => {
  const value = Number(project?.ownershipShare);
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 100;
};

export const ownedAmount = (amount, project) =>
  (Number(amount) || 0) * (ownershipShare(project) / 100);
