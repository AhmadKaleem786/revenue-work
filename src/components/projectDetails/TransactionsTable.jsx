import React from "react";
import { Button, Card, Select, Space, Table, Tag, Tooltip } from "antd";
import { CheckCircle2, CopyPlus, Pencil, Trash2 } from "lucide-react";
import { EmptyState, money } from "../UI";
import {
  TRANSACTION_TYPE,
  isOutstandingReceivable,
  typeTagColor,
} from "../../utils/finance";

export function TransactionsTable({
  rows,
  centers,
  type,
  costCenterId,
  onTypeChange,
  onCostCenterChange,
  onAdd,
  onEdit,
  onAdopt,
  onDelete,
  onMarkReceived,
  emptyDescription = "Record revenue or expenses for this project.",
}) {
  return (
    <Card
      className="section"
      title="Transactions"
      extra={
        <Space wrap>
          <Select
            placeholder="All types"
            allowClear
            style={{ width: 160 }}
            value={type || undefined}
            onChange={onTypeChange}
            options={Object.values(TRANSACTION_TYPE).map((value) => ({ value }))}
          />
          <Select
            placeholder="All cost centers"
            allowClear
            style={{ width: 180 }}
            value={costCenterId}
            onChange={onCostCenterChange}
            options={centers.map((center) => ({ value: center.id, label: center.name }))}
          />
        </Space>
      }
    >
      <Table
        rowKey="id"
        dataSource={rows}
        pagination={{ pageSize: 8 }}
        locale={{
          emptyText: (
            <EmptyState
              title="No transactions yet"
              description={emptyDescription}
              action={{ label: "Add transaction", onClick: onAdd }}
            />
          ),
        }}
        columns={[
          {
            title: "Description",
            dataIndex: "description",
            sorter: (a, b) => (a.description || "").localeCompare(b.description || ""),
          },
          {
            title: "Type",
            dataIndex: "type",
            sorter: (a, b) => (a.type || "").localeCompare(b.type || ""),
            render: (value) => <Tag color={typeTagColor(value)}>{value}</Tag>,
          },
          {
            title: "Cost center",
            dataIndex: "costCenterId",
            sorter: (a, b) =>
              (centers.find((center) => center.id === a.costCenterId)?.name || "").localeCompare(
                centers.find((center) => center.id === b.costCenterId)?.name || "",
              ),
            render: (value) => (
              <Tag className="cost-center-pill">
                {centers.find((center) => center.id === value)?.name || "—"}
              </Tag>
            ),
          },
          {
            title: "Amount",
            dataIndex: "amount",
            sorter: (a, b) => Number(a.amount || 0) - Number(b.amount || 0),
            render: money,
          },
          {
            title: "Date",
            dataIndex: "date",
            sorter: (a, b) => (a.date || "").localeCompare(b.date || ""),
            responsive: ["md"],
          },
          {
            title: "Mark received",
            render: (_, record) =>
              isOutstandingReceivable(record) ? (
                <Tooltip title="Mark as received">
                  <Button type="text" aria-label="Mark as received" icon={<CheckCircle2 size={17} />} onClick={() => onMarkReceived(record)} />
                </Tooltip>
              ) : "—",
          },
          {
            title: "Actions",
            render: (_, record) => (
              <Space>
                <Tooltip title="Adopt transaction">
                  <Button type="text" aria-label="Adopt transaction" icon={<CopyPlus size={16} />} onClick={() => onAdopt(record)} />
                </Tooltip>
                <Button type="text" icon={<Pencil size={16} />} onClick={() => onEdit(record)} />
                <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => onDelete(record)} />
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
}
