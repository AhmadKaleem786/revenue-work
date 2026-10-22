export const TRANSACTION_TYPE = {
  REVENUE: "Revenue",
  EXPENSE: "Expense",
  RECEIVABLE: "Receivable",
  RECEIVED: "Received",
};

export const CREATABLE_TRANSACTION_TYPES = [
  TRANSACTION_TYPE.REVENUE,
  TRANSACTION_TYPE.EXPENSE,
  TRANSACTION_TYPE.RECEIVABLE,
];

export const TRANSACTION_SCOPE = {
  PROJECT: "project",
  COMPANY: "company",
};

export const isCompanyTransaction = (transaction) =>
  transaction?.scope === TRANSACTION_SCOPE.COMPANY;

export const isOutstandingReceivable = (transaction) =>
  transaction?.type === TRANSACTION_TYPE.RECEIVABLE;

export const typeTagColor = (type) => {
  if (type === TRANSACTION_TYPE.REVENUE) return "green";
  if (type === TRANSACTION_TYPE.EXPENSE) return "orange";
  if (type === TRANSACTION_TYPE.RECEIVABLE) return "gold";
  if (type === TRANSACTION_TYPE.RECEIVED) return "blue";
  return "default";
};

export const transactionTotals = (transactions = []) => {
  let revenue = 0;
  let expenses = 0;
  let receivable = 0;
  let received = 0;
  for (const item of transactions) {
    const amount = Number(item.amount) || 0;
    if (item.type === TRANSACTION_TYPE.REVENUE) revenue += amount;
    else if (item.type === TRANSACTION_TYPE.EXPENSE) expenses += amount;
    else if (item.type === TRANSACTION_TYPE.RECEIVABLE) receivable += amount;
    else if (item.type === TRANSACTION_TYPE.RECEIVED) received += amount;
  }
  return {
    revenue,
    expenses,
    receivable,
    received,
    netIncome: revenue - expenses - receivable,
  };
};

export const parseTransactionType = (typeValue, paymentStatus) => {
  const typeText = String(typeValue ?? "").trim().toLowerCase();
  const status = String(paymentStatus ?? "").trim().toLowerCase();
  if (typeText === "expense" || typeText === "deduction") {
    return TRANSACTION_TYPE.EXPENSE;
  }
  if (typeText === "received") return TRANSACTION_TYPE.RECEIVED;
  if (typeText === "receivable") {
    return status === "received"
      ? TRANSACTION_TYPE.RECEIVED
      : TRANSACTION_TYPE.RECEIVABLE;
  }
  if (status === "receivable") return TRANSACTION_TYPE.RECEIVABLE;
  if (typeText === "revenue" || typeText === "") {
    return TRANSACTION_TYPE.REVENUE;
  }
  return TRANSACTION_TYPE.REVENUE;
};

export const asReceivedTransaction = (transaction) => ({
  ...transaction,
  type: TRANSACTION_TYPE.RECEIVED,
  isReceived: true,
});

// Records saved before the terminology update used "Deduction". Treat them as
// expenses so historical figures remain accurate, then save the new wording on
// the next edit. Older unpaid revenue rows become the Receivable type.
export const normalizeTransaction = (transaction) => {
  if (!transaction) return transaction;
  if (transaction.type === "Deduction") {
    return { ...transaction, type: TRANSACTION_TYPE.EXPENSE };
  }
  if (
    transaction.type === TRANSACTION_TYPE.REVENUE &&
    transaction.isReceived === false
  ) {
    return { ...transaction, type: TRANSACTION_TYPE.RECEIVABLE };
  }
  return transaction;
};

export const normalizeTransactions = (transactions = []) =>
  transactions.map(normalizeTransaction);
