import React from "react";
import { Button, Modal, Table } from "antd";

const importColumns = [
  { column: "Description", required: "Required", details: "Transaction description." },
  { column: "Type", required: "Optional", details: "Revenue, Expense, Receivable, or Received. Blank defaults to Revenue. Receivable is subtracted in totals; Received is ignored." },
  { column: "Amount", required: "Required", details: "A number greater than zero; commas are allowed." },
  { column: "Cost Center", required: "Required", details: "Must exactly match an existing cost-center name." },
  { column: "Date", required: "Optional", details: "Use YYYY-MM-DD, for example 2026-09-19. Blank dates use today." },
  { column: "Payment Status", required: "Optional", details: "Receivable turns the row into a receivable. Received is only used when Type is Receivable." },
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
