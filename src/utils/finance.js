export const TRANSACTION_TYPE = {
  REVENUE: "Revenue",
  EXPENSE: "Expense",
};

export const TRANSACTION_SCOPE = {
  PROJECT: "project",
  COMPANY: "company",
};

export const isCompanyTransaction = (transaction) =>
  transaction?.scope === TRANSACTION_SCOPE.COMPANY;

export const transactionTotals = (transactions = []) => {
  let revenue = 0;
  let expenses = 0;
  let receivable = 0;
  for (const item of transactions) {
    const amount = Number(item.amount) || 0;
    if (item.type === TRANSACTION_TYPE.REVENUE) {
      revenue += amount;
      if (item.isReceived === false) receivable += amount;
    } else if (item.type === TRANSACTION_TYPE.EXPENSE) {
      expenses += amount;
    }
  }
  return { revenue, expenses, receivable, netIncome: revenue - expenses };
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
