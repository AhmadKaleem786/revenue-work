import React from "react";
import { Button, Card, Select, Space, Table, Tag, Tooltip } from "antd";
import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { EmptyState, money } from "../UI";
import { TRANSACTION_TYPE } from "../../utils/finance";

export function TransactionsTable({
  rows,
  centers,
  type,
  costCenterId,
  onTypeChange,
  onCostCenterChange,
  onAdd,
  onEdit,
  onDelete,
  onMarkReceived,
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
            style={{ width: 140 }}
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
              description="Record revenue or expenses for this project."
              action={{ label: "Add transaction", onClick: onAdd }}
            />
          ),
        }}
        columns={[
          { title: "Description", dataIndex: "description" },
          {
            title: "Type",
            dataIndex: "type",
            render: (value) => <Tag color={value === TRANSACTION_TYPE.REVENUE ? "green" : "orange"}>{value}</Tag>,
          },
          {
            title: "Cost center",
            dataIndex: "costCenterId",
            render: (value) => (
              <Tag className="cost-center-pill">
                {centers.find((center) => center.id === value)?.name || "—"}
              </Tag>
            ),
          },
          { title: "Amount", dataIndex: "amount", render: money },
          { title: "Date", dataIndex: "date", responsive: ["md"] },
          {
            title: "Mark received",
            render: (_, record) =>
              record.type === TRANSACTION_TYPE.REVENUE && record.isReceived === false ? (
                <Tooltip title="Mark as received">
                  <Button type="text" aria-label="Mark as received" icon={<CheckCircle2 size={17} />} onClick={() => onMarkReceived(record)} />
                </Tooltip>
              ) : "—",
          },
          {
            title: "Actions",
            render: (_, record) => (
              <Space>
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
