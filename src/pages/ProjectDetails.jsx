import React, { useMemo, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import { ArrowLeft, Download, Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { deleteRecordThunk, saveRecordThunk } from "../store";
import {
  DeleteConfirm,
  EmptyState,
  PageHeader,
  StatCard,
  money,
} from "../components/UI";
import { errorText } from "../utils/error";
import dayjs from "dayjs";
import { downloadExcel } from "../utils/excel";
const id = () => crypto.randomUUID();
export default function ProjectDetails() {
  const { id: projectId } = useParams(),
    project = useSelector((s) => s.projects.find((x) => x.id === projectId)),
    centers = useSelector((s) => s.costCenters),
    statuses = useSelector((s) => s.projectStatuses) || [],
    all = useSelector((s) => s.expenses),
    user = useSelector((s) => s.auth),
    dispatch = useDispatch(),
    [editing, setEditing] = useState(null),
    [del, setDel] = useState(null),
    [type, setType] = useState(""),
    [costCenterId, setCostCenterId] = useState(),
    [saving, setSaving] = useState(false),
    [form] = Form.useForm();
  const rows = useMemo(
      () =>
        all.filter(
          (x) => x.projectId === projectId && (!type || x.type === type) && (!costCenterId || x.costCenterId === costCenterId),
        ),
      [all, projectId, type, costCenterId],
    ),
    rev = rows
      .filter((x) => x.type === "Revenue")
      .reduce((a, x) => a + Number(x.amount), 0),
    expenseTotal = rows
      .filter((x) => x.type === "Expense")
      .reduce((a, x) => a + Number(x.amount), 0);
  if (!project)
    return (
      <EmptyState
        title="Project not found"
        action={{ label: "Back to projects", onClick: () => history.back() }}
      />
    );
  const open = (x) => {
    setEditing(x || {});
    form.resetFields();
    form.setFieldsValue(
      x ? { ...x, date: dayjs(x.date) } : { type: "Revenue", date: dayjs() },
    );
  };
  const exportProject = () =>
    downloadExcel({
      fileName: `revenueworks-${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
      sheets: [
        {
          name: "Summary",
          rows: [
            {
              Project: project.name,
              Description: project.description || "",
              "Created Date": project.createdDate || "",
              Status: statuses.find((status) => status.id === project.projectStatusId)?.name || "",
              "Total Revenue": rev,
              "Total Expenses": expenseTotal,
              "Net Income": rev - expenseTotal,
            },
          ],
        },
        {
          name: "Transactions",
          rows: rows.map((transaction) => ({
            Date: transaction.date || "",
            Description: transaction.description || "",
            Type: transaction.type || "",
            "Cost Center": centers.find((center) => center.id === transaction.costCenterId)?.name || "",
            Amount: Number(transaction.amount) || 0,
            Notes: transaction.notes || "",
          })),
        },
      ],
    });
  const save = async () => {
    let v;
    try {
      v = await form.validateFields();
    } catch {
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const item = {
        projectId,
        costCenterId: v.costCenterId,
        description: v.description,
        type: v.type,
        amount: Number(v.amount),
        date: v.date.format("YYYY-MM-DD"),
        notes: v.notes || "",
        id: editing.id || id(),
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
  return (
    <>
      <Link className="back-link" to="/projects">
        <ArrowLeft size={16} /> All projects
      </Link>
      <PageHeader
        title={project.name}
        subtitle={`${project.description || `Created ${project.createdDate}`} · Status: ${statuses.find((status) => status.id === project.projectStatusId)?.name || "Not set"}`}
        action={<><Button icon={<Download size={16} />} onClick={exportProject}>Export Excel</Button><Button type="primary" icon={<Plus size={16} />} onClick={() => open()}>Add transaction</Button></>}
      />
      <div className="stats-row">
        <StatCard
          title="Total revenue"
          value={money(rev)}
          icon={<Plus />}
          color="green"
        />
        <StatCard
          title="Total expenses"
          value={money(expenseTotal)}
          icon={<Trash2 />}
          color="orange"
        />
        <StatCard
          title="Net Income"
          value={money(rev - expenseTotal)}
          icon={<Plus />}
          color="purple"
        />
      </div>
      <Card
        className="section"
        title="Transactions"
        extra={
          <Space wrap>
            <Select placeholder="All types" allowClear style={{ width: 140 }} onChange={setType} options={[{ value: "Revenue" }, { value: "Expense" }]} />
            <Select placeholder="All cost centers" allowClear style={{ width: 180 }} onChange={setCostCenterId} options={centers.map((center) => ({ value: center.id, label: center.name }))} />
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
                action={{ label: "Add transaction", onClick: () => open() }}
              />
            ),
          }}
          columns={[
            { title: "Description", dataIndex: "description" },
            {
              title: "Type",
              dataIndex: "type",
              render: (v) => (
                <Tag color={v === "Revenue" ? "green" : "orange"}>{v}</Tag>
              ),
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
              title: "Actions",
              render: (_, r) => (
                <Space>
                  <Button
                    type="text"
                    icon={<Pencil size={16} />}
                    onClick={() => open(r)}
                  />
                  <Button
                    type="text"
                    danger
                    icon={<Trash2 size={16} />}
                    onClick={() => setDel(r)}
                  />
                </Space>
              ),
            },
          ]}
        />
      </Card>
      <Modal
        title={editing?.id ? "Edit transaction" : "Add transaction"}
        open={editing !== null}
        onCancel={() => {
          setEditing(null);
          form.resetFields();
        }}
        onOk={save}
        confirmLoading={saving}
        cancelButtonProps={{ disabled: saving }}
        closable={!saving}
        destroyOnClose
        maskClosable={false}
        okText={editing?.id ? "Save changes" : "Add transaction"}
        cancelText="Cancel"
        width={620}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Cost center"
            name="costCenterId"
            rules={[{ required: true, message: "Cost center is required" }]}
          >
            <Select
              placeholder="Select a cost center"
              options={centers.map((x) => ({ value: x.id, label: x.name }))}
            />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: "Description is required" }]}
          >
            <Input placeholder="Transaction purpose" />
          </Form.Item>
          <Form.Item
            label="Type"
            name="type"
            rules={[
              { required: true, message: "Please select a transaction type" },
            ]}
          >
            <Select
              options={[
                { value: "Revenue", label: "Revenue" },
                { value: "Expense", label: "Expense" },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="Amount"
            name="amount"
            rules={[
              { required: true, message: "Please enter an amount" },
              {
                type: "number",
                min: 0.01,
                message: "Amount must be greater than 0",
              },
            ]}
          >
            <InputNumber
              min={0.01}
              step={0.01}
              style={{ width: "100%" }}
              formatter={(value) => (value ? `PKR ${value}` : "")}
              parser={(value) => value?.replace(/[^0-9.]/g, "")}
            />
          </Form.Item>
          <Form.Item
            label="Date"
            name="date"
            rules={[{ required: true, message: "Please choose a date" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={2} placeholder="Optional note" />
          </Form.Item>
        </Form>
      </Modal>
      <DeleteConfirm
        open={!!del}
        onCancel={() => setDel(null)}
        onConfirm={async () => {
          try {
            await dispatch(
              deleteRecordThunk({ collection: "expenses", id: del.id }),
            ).unwrap();
            setDel(null);
            message.success("Transaction deleted.");
          } catch (error) {
            message.error(errorText(error, "Could not delete this transaction."));
            throw error;
          }
        }}
        title="Delete transaction?"
      />
    </>
  );
}
