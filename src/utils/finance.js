export const TRANSACTION_TYPE = {
  REVENUE: "Revenue",
  EXPENSE: "Expense",
};

// Records saved before the terminology update used "Deduction". Treat them as
// expenses so historical figures remain accurate, then save the new wording on
// the next edit.
export const normalizeTransaction = (transaction) =>
  transaction?.type === "Deduction"
    ? { ...transaction, type: TRANSACTION_TYPE.EXPENSE }
    : transaction;

export const normalizeTransactions = (transactions = []) =>
  transactions.map(normalizeTransaction);
