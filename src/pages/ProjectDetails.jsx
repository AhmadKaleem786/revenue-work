import React, { useMemo, useRef, useState } from "react";
import { App, Button, Form, Segmented } from "antd";
import { ArrowLeft, CircleHelp, Download, FileUp, Plus } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import * as XLSX from "xlsx";
import { deleteRecordThunk, saveRecordThunk } from "../store";
import { DeleteConfirm, EmptyState, PageHeader } from "../components/UI";
import { FinancialSummary } from "../components/projectDetails/FinancialSummary";
import { ImportHelpModal } from "../components/projectDetails/ImportHelpModal";
import { TransactionFormModal } from "../components/projectDetails/TransactionFormModal";
import { TransactionsTable } from "../components/projectDetails/TransactionsTable";
import { errorText } from "../utils/error";
import { downloadExcel, exportFileName } from "../utils/excel";
import { TRANSACTION_TYPE } from "../utils/finance";
import { ownedAmount, ownershipShare } from "../utils/ownership";

dayjs.extend(customParseFormat);
const createId = () => crypto.randomUUID();
const today = () => dayjs().format("YYYY-MM-DD");
const columnValue = (row, name) =>
  row[
    Object.keys(row).find(
      (key) => key.replace(/[\s_-]/g, "").toLowerCase() === name,
    )
  ];
const importDate = (value) => {
  if (value === undefined || value === null || value === "") return today();
  if (value instanceof Date && !Number.isNaN(value.getTime()))
    return dayjs(value).format("YYYY-MM-DD");
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed)
      return dayjs(new Date(parsed.y, parsed.m - 1, parsed.d)).format(
        "YYYY-MM-DD",
      );
  }
  const parsed = dayjs(String(value).trim(), "YYYY-MM-DD", true);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : null;
};

export default function ProjectDetails() {
  const { message } = App.useApp();
  const { id: projectId } = useParams();
  const project = useSelector((state) =>
    state.projects.find((item) => item.id === projectId),
  );
  const centers = useSelector((state) => state.costCenters);
  const statuses = useSelector((state) => state.projectStatuses) || [];
  const allTransactions = useSelector((state) => state.expenses);
  const user = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [type, setType] = useState("");
  const [costCenterId, setCostCenterId] = useState();
  const [financialView, setFinancialView] = useState("share");
  const [importing, setImporting] = useState(false);
  const [importHelpOpen, setImportHelpOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const importInput = useRef(null);
  const rows = useMemo(
    () =>
      allTransactions.filter(
        (transaction) =>
          transaction.projectId === projectId &&
          (!type || transaction.type === type) &&
          (!costCenterId || transaction.costCenterId === costCenterId),
      ),
    [allTransactions, projectId, type, costCenterId],
  );
  const revenue = rows
    .filter((item) => item.type === TRANSACTION_TYPE.REVENUE)
    .reduce((total, item) => total + Number(item.amount), 0);
  const expenses = rows
    .filter((item) => item.type === TRANSACTION_TYPE.EXPENSE)
    .reduce((total, item) => total + Number(item.amount), 0);
  const receivable = rows
    .filter(
      (item) =>
        item.type === TRANSACTION_TYPE.REVENUE && item.isReceived === false,
    )
    .reduce((total, item) => total + Number(item.amount), 0);

  if (!project)
    return (
      <EmptyState
        title="Project not found"
        action={{ label: "Back to projects", onClick: () => history.back() }}
      />
    );
  const share = ownershipShare(project);
  const displayedAmount = (amount) =>
    financialView === "share" ? ownedAmount(amount, project) : amount;
  const viewLabel = financialView === "share" ? "My share" : "Full project";
  const closeEditor = () => {
    setEditing(null);
    form.resetFields();
  };
  const openEditor = (transaction) => {
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
        : { type: TRANSACTION_TYPE.REVENUE, isReceived: true, date: dayjs() },
    );
  };
  const exportProject = () =>
    downloadExcel({
      fileName: exportFileName(user?.name, project.name),
      sheets: [
        {
          name: "Summary",
          rows: [
            {
              Project: project.name,
              Description: project.description || "",
              "Created Date": project.createdDate || "",
              Status:
                statuses.find((status) => status.id === project.projectStatusId)
                  ?.name || "",
              "Ownership share": `${share}%`,
              "Financial view": viewLabel,
              Revenue: displayedAmount(revenue),
              Receivable: displayedAmount(receivable),
              Expenses: displayedAmount(expenses),
              "Net Income": displayedAmount(revenue - expenses),
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
        projectId,
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
  const importTransactions = async (file) => {
    if (!file) return;
    if (!user?.uid) {
      message.error("Please sign in before importing Excel files.");
      return;
    }
    setImporting(true);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), {
        type: "array",
        cellDates: true,
      });
      const transactionSheet = workbook.SheetNames.find(
        (name) => name.trim().toLowerCase() === "transactions",
      );
      const worksheet =
        workbook.Sheets[transactionSheet || workbook.SheetNames[0]];
      const importedRows = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
        raw: true,
      });
      if (!importedRows.length)
        throw new Error("The first worksheet has no transaction rows.");
      const centersByName = new Map(
        centers.map((center) => [center.name.trim().toLowerCase(), center.id]),
      );
      const now = new Date().toISOString();
      const items = importedRows.map((row, index) => {
        const rowNumber = index + 2;
        const description = String(
          columnValue(row, "description") ?? "",
        ).trim();
        const typeText = String(columnValue(row, "type") ?? "")
          .trim()
          .toLowerCase();
        const transactionType =
          typeText === "expense"
            ? TRANSACTION_TYPE.EXPENSE
            : TRANSACTION_TYPE.REVENUE;
        const amount = Number(
          String(columnValue(row, "amount") ?? "").replace(/[,\s]/g, ""),
        );
        const costCenterName = String(
          columnValue(row, "costcenter") ?? "",
        ).trim();
        const importedCostCenterId = centersByName.get(
          costCenterName.toLowerCase(),
        );
        const date = importDate(columnValue(row, "date"));
        const paymentStatus = String(columnValue(row, "paymentstatus") ?? "")
          .trim()
          .toLowerCase();
        if (!description)
          throw new Error(`Row ${rowNumber}: Description is required.`);
        if (!Number.isFinite(amount) || amount <= 0)
          throw new Error(`Row ${rowNumber}: Amount must be greater than 0.`);
        if (!costCenterName)
          throw new Error(`Row ${rowNumber}: Cost Center is required.`);
        if (!importedCostCenterId)
          throw new Error(
            `Row ${rowNumber}: Cost Center "${costCenterName}" does not match an existing cost center.`,
          );
        if (!date)
          throw new Error(`Row ${rowNumber}: Date must use YYYY-MM-DD.`);
        if (
          paymentStatus &&
          !["received", "receivable"].includes(paymentStatus)
        )
          throw new Error(
            `Row ${rowNumber}: Payment Status must be Received or Receivable.`,
          );
        return {
          projectId,
          costCenterId: importedCostCenterId,
          description,
          type: transactionType,
          amount,
          date,
          isReceived:
            transactionType === TRANSACTION_TYPE.REVENUE
              ? paymentStatus !== "receivable"
              : true,
          notes: String(columnValue(row, "notes") ?? "").trim(),
          id: createId(),
          createdAt: now,
          updatedAt: now,
          createdBy: user?.uid || "local-user",
        };
      });
      await Promise.all(
        items.map((item) =>
          dispatch(
            saveRecordThunk({
              collection: "expenses",
              item,
              userId: user?.uid,
            }),
          ).unwrap(),
        ),
      );
      message.success(
        `${items.length} transaction${items.length === 1 ? "" : "s"} imported.`,
      );
    } catch (error) {
      message.error(errorText(error, "Could not import transactions."));
    } finally {
      setImporting(false);
    }
  };
  return (
    <>
      <Link className="back-link" to="/projects">
        <ArrowLeft size={16} /> All projects
      </Link>
      <PageHeader
        title={project.name}
        subtitle={`${project.description || `Created ${project.createdDate}`} · Status: ${statuses.find((status) => status.id === project.projectStatusId)?.name || "Not set"}`}
        action={
          <>
            <Button
              icon={<CircleHelp size={16} />}
              onClick={() => setImportHelpOpen(true)}
            >
              Import help
            </Button>
            <Button
              icon={<FileUp size={16} />}
              loading={importing}
              onClick={() => importInput.current?.click()}
            >
              Import Excel
            </Button>
            <Button icon={<Download size={16} />} onClick={exportProject}>
              Export Excel
            </Button>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => openEditor()}
            >
              Add transaction
            </Button>
          </>
        }
      />
      <input
        ref={importInput}
        type="file"
        accept=".xlsx,.xls"
        hidden
        onChange={(event) => {
          importTransactions(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <div className="financial-view-control">
        <span>
          {share < 100
            ? `You own ${share}% of this project`
            : "You fully own this project"}
        </span>
        <Segmented
          value={financialView}
          onChange={setFinancialView}
          options={[
            { label: `My share (${share}%)`, value: "share" },
            { label: "Full project", value: "full" },
          ]}
        />
      </div>
      <FinancialSummary
        viewLabel={viewLabel}
        revenue={displayedAmount(revenue)}
        expenses={displayedAmount(expenses)}
        receivable={displayedAmount(receivable)}
        netIncome={displayedAmount(revenue - expenses)}
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
        onDelete={setDeleting}
        onMarkReceived={markReceived}
      />
      <ImportHelpModal
        open={importHelpOpen}
        onClose={() => setImportHelpOpen(false)}
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
