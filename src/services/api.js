import { firebaseEnabled } from "./firebase/config";
import { removeDocument, saveDocument } from "./firebase/data";
import { normalizeTransaction } from "../utils/finance";

export const COLLECTIONS = {
  projects: "projects",
  costCenters: "costCenters",
  projectStatuses: "projectStatuses",
  expenses: "expenses",
};

const stamp = () => new Date().toISOString();

export const prepareRecord = (item, userId) => {
  const { r, d, n, revenue, deductions, expenseTotal, net, netIncome, key, ...rest } = item;
  const record = normalizeTransaction({
    ...Object.fromEntries(
      Object.entries(rest).filter(([, value]) => value !== undefined),
    ),
    id: rest.id || crypto.randomUUID(),
    createdBy: rest.createdBy || userId || "local-user",
    createdAt: rest.createdAt || stamp(),
    updatedAt: stamp(),
  });
  return record;
};

export const saveRecord = async (collection, item, userId) => {
  const record = prepareRecord(item, userId);
  if (firebaseEnabled) {
    const id = await saveDocument(collection, record, userId);
    return { ...record, id };
  }
  return record;
};

export const deleteRecord = async (collection, id) => {
  if (firebaseEnabled) await removeDocument(collection, id);
  return id;
};

export const deleteRecords = async (items = []) => {
  await Promise.all(items.map((item) => deleteRecord(item.collection, item.id)));
};
