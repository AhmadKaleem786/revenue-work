import React from "react";
import { Button, Modal, Table } from "antd";

const importColumns = [
  { column: "Description", required: "Required", details: "Transaction description." },
  { column: "Type", required: "Optional", details: "Use Expense for an expense. Blank or any other value is revenue." },
  { column: "Amount", required: "Required", details: "A number greater than zero; commas are allowed." },
  { column: "Cost Center", required: "Required", details: "Must exactly match an existing cost-center name." },
  { column: "Date", required: "Optional", details: "Use YYYY-MM-DD, for example 2026-09-19. Blank dates use today." },
  { column: "Payment Status", required: "Optional", details: "For revenue only: Received or Receivable. Blank defaults to Received." },
  { column: "Notes", required: "Optional", details: "Any additional note." },
];

export function ImportHelpModal({ open, onClose }) {
  return (
    <Modal title="Import transactions from Excel" open={open} onCancel={onClose} footer={<Button type="primary" onClick={onClose}>Got it</Button>} width={720}>
      <p>Use the Transactions worksheet when it is present; otherwise, the first worksheet is imported. Column names are case-insensitive; spaces and hyphens are allowed.</p>
      <Table
        size="small"
        pagination={false}
        rowKey="column"
        dataSource={importColumns}
        columns={[
          { title: "Column", dataIndex: "column", width: 150 },
          { title: "Required?", dataIndex: "required", width: 100 },
          { title: "How it is used", dataIndex: "details" },
        ]}
      />
    </Modal>
  );
}
