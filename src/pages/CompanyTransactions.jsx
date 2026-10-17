import React, { useMemo, useState } from "react";
import { App, Button, Form } from "antd";
import { Download, Plus, TrendingDown } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { deleteRecordThunk, saveRecordThunk } from "../store";
import { DeleteConfirm, PageHeader } from "../components/UI";
import { FinancialSummary } from "../components/projectDetails/FinancialSummary";
import { TransactionFormModal } from "../components/projectDetails/TransactionFormModal";
import { TransactionsTable } from "../components/projectDetails/TransactionsTable";
import { errorText } from "../utils/error";
import { downloadExcel, exportFileName } from "../utils/excel";
import {
  TRANSACTION_SCOPE,
  TRANSACTION_TYPE,
  isCompanyTransaction,
  transactionTotals,
} from "../utils/finance";

const createId = () => crypto.randomUUID();

export default function CompanyTransactions() {
  const { message } = App.useApp();
  const centers = useSelector((state) => state.costCenters);
  const allTransactions = useSelector((state) => state.expenses);
  const user = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [type, setType] = useState("");
  const [costCenterId, setCostCenterId] = useState();
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const companyRows = useMemo(
    () => allTransactions.filter(isCompanyTransaction),
    [allTransactions],
  );
  const rows = useMemo(
    () =>
      companyRows.filter(
        (transaction) =>
          (!type || transaction.type === type) &&
          (!costCenterId || transaction.costCenterId === costCenterId),
      ),
    [companyRows, type, costCenterId],
  );
  const totals = transactionTotals(rows);
  const closeEditor = () => {
    setEditing(null);
    form.resetFields();
  };
  const openEditor = (transaction, defaults = {}) => {
    setEditing(transaction || {});
    form.resetFields();
    form.setFieldsValue(
      transaction
        ? {
            ...transaction,
            date: dayjs(transaction.date),
            isReceived:
              transaction.type === TRANSACTION_TYPE.REVENUE
                ? transaction.isReceived !== false
                : true,
          }
        : {
            type: TRANSACTION_TYPE.REVENUE,
            isReceived: true,
            date: dayjs(),
            ...defaults,
          },
    );
  };
  const adoptTransaction = (transaction) =>
    openEditor({
      ...transaction,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      createdBy: undefined,
    });
  const exportCompany = () =>
    downloadExcel({
      fileName: exportFileName(user?.name, "company-transactions"),
      sheets: [
        {
          name: "Summary",
          rows: [
            {
              Revenue: totals.revenue,
              Receivable: totals.receivable,
              Expenses: totals.expenses,
              "Net Income": totals.netIncome,
            },
          ],
        },
        {
          name: "Transactions",
          rows: rows.map((transaction) => ({
            Date: transaction.date || "",
            Description: transaction.description || "",
            Type: transaction.type || "",
            "Payment Status":
              transaction.type === TRANSACTION_TYPE.REVENUE
                ? transaction.isReceived === false
                  ? "Receivable"
                  : "Received"
                : "N/A",
            "Cost Center":
              centers.find((center) => center.id === transaction.costCenterId)
                ?.name || "",
            Amount: Number(transaction.amount) || 0,
            Notes: transaction.notes || "",
          })),
        },
      ],
    });
  const save = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const item = {
        scope: TRANSACTION_SCOPE.COMPANY,
        projectId: "",
        costCenterId: values.costCenterId,
        description: values.description,
        type: values.type,
        isReceived:
          values.type === TRANSACTION_TYPE.REVENUE
            ? values.isReceived !== false
            : true,
        amount: Number(values.amount),
        date: values.date.format("YYYY-MM-DD"),
        notes: values.notes || "",
        id: editing.id || createId(),
        createdAt: editing.createdAt || now,
        updatedAt: now,
        createdBy: user?.uid || "local-user",
      };
      await dispatch(
        saveRecordThunk({ collection: "expenses", item, userId: user?.uid }),
      ).unwrap();
      setEditing(null);
      message.success(`Transaction ${editing.id ? "updated" : "added"}.`);
    } catch (error) {
      message.error(errorText(error, "Could not save this transaction."));
      throw error;
    } finally {
      setSaving(false);
    }
  };
  const markReceived = async (transaction) => {
    try {
      await dispatch(
        saveRecordThunk({
          collection: "expenses",
          item: {
            ...transaction,
            isReceived: true,
            updatedAt: new Date().toISOString(),
          },
          userId: user?.uid,
        }),
      ).unwrap();
      message.success("Transaction marked as received.");
    } catch (error) {
      message.error(errorText(error, "Could not update this transaction."));
    }
  };

  return (
    <>
      <PageHeader
        title="Company transactions"
        subtitle="Record company-level revenue and expenses that are not tied to a project."
        action={
          <>
            <Button icon={<Download size={16} />} onClick={exportCompany}>
              Export Excel
            </Button>
            <Button
              icon={<TrendingDown size={16} />}
              onClick={() => openEditor(null, { type: TRANSACTION_TYPE.EXPENSE })}
            >
              Add expense
            </Button>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => openEditor(null, { type: TRANSACTION_TYPE.REVENUE })}
            >
              Add revenue
            </Button>
          </>
        }
      />
      <FinancialSummary
        viewLabel="Company"
        revenue={totals.revenue}
        expenses={totals.expenses}
        receivable={totals.receivable}
        netIncome={totals.netIncome}
      />
      <TransactionsTable
        rows={rows}
        centers={centers}
        type={type}
        costCenterId={costCenterId}
        onTypeChange={setType}
        onCostCenterChange={setCostCenterId}
        onAdd={() => openEditor()}
        onEdit={openEditor}
        onAdopt={adoptTransaction}
        onDelete={setDeleting}
        onMarkReceived={markReceived}
        emptyDescription="Record company-level revenue or expenses."
      />
      <TransactionFormModal
        editing={editing}
        form={form}
        centers={centers}
        saving={saving}
        onCancel={closeEditor}
        onSave={save}
      />
      <DeleteConfirm
        open={!!deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          try {
            await dispatch(
              deleteRecordThunk({ collection: "expenses", id: deleting.id }),
            ).unwrap();
            setDeleting(null);
            message.success("Transaction deleted.");
          } catch (error) {
            message.error(
              errorText(error, "Could not delete this transaction."),
            );
            throw error;
          }
        }}
        title="Delete transaction?"
      />
    </>
  );
}
