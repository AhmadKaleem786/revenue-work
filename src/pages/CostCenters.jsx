import React, { useMemo, useState } from "react";
import { Button, Form, Input, Modal, Table, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { deleteRecordThunk, saveRecordThunk } from "../store";
import { DeleteConfirm, EmptyState, PageHeader } from "../components/UI";
import { errorText } from "../utils/error";
import { Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { downloadExcel } from "../utils/excel";
const key = () => crypto.randomUUID();
export default function CostCenters() {
  const data = useSelector((s) => s.costCenters) || [];
  const expenses = useSelector((s) => s.expenses) || [];
  const user = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [del, setDel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const filtered = useMemo(
    () =>
      data.filter((x) =>
        `${x.name || ""} ${x.description || ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [data, query],
  );
  const open = (x) => {
    setEditing(x || {});
    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue(x || { name: "", description: "" });
    }, 0);
  };
  const exportCostCenters = () =>
    downloadExcel({
      fileName: "revenueworks-cost-centers",
      sheets: [
        {
          name: "Cost Centers",
          rows: filtered.map((center) => {
            const transactions = expenses.filter(
              (expense) => expense.costCenterId === center.id,
            );
            const revenue = transactions
              .filter((expense) => expense.type === "Revenue")
              .reduce((sum, expense) => sum + Number(expense.amount), 0);
            const expenseTotal = transactions
              .filter((expense) => expense.type === "Expense")
              .reduce((sum, expense) => sum + Number(expense.amount), 0);
            return {
              "Cost Center": center.name,
              Description: center.description || "",
              Transactions: transactions.length,
              Revenue: revenue,
              Expenses: expenseTotal,
              "Net Income": revenue - expenseTotal,
            };
          }),
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
    if (
      data.some(
        (x) =>
          x.name?.toLowerCase() === v.name.toLowerCase() && x.id !== editing.id,
      )
    ) {
      message.error("A cost center with this name already exists.");
      return Promise.reject();
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const item = {
        name: v.name.trim(),
        description: v.description || "",
        id: editing.id || key(),
        createdAt: editing.createdAt || now,
        updatedAt: now,
        createdBy: user?.uid,
      };
      await dispatch(
        saveRecordThunk({ collection: "costCenters", item, userId: user?.uid }),
      ).unwrap();
      message.success(`Cost center ${editing.id ? "updated" : "created"}.`);
      setEditing(null);
    } catch (error) {
      message.error(errorText(error, "Could not save this cost center."));
      throw error;
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <PageHeader
        title="Cost centers"
        subtitle="Organize revenue and expenses by business unit."
        action={<><Button icon={<Download size={16} />} onClick={exportCostCenters}>Export Excel</Button><Button type="primary" icon={<Plus size={16} />} onClick={() => open()}>New cost center</Button></>}
      />
      <Input
        className="table-search"
        prefix={<Search size={16} />}
        placeholder="Search cost centers"
        onChange={(e) => setQuery(e.target.value)}
      />
      <Table
        className="data-table"
        rowKey="id"
        dataSource={filtered}
        pagination={{ pageSize: 8 }}
        locale={{
          emptyText: (
            <EmptyState
              title="No cost centers yet"
              description="Create one to categorize project transactions."
              action={{ label: "New cost center", onClick: () => open() }}
            />
          ),
        }}
        columns={[
          {
            title: "Name",
            dataIndex: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
          },
          {
            title: "Description",
            dataIndex: "description",
            responsive: ["sm"],
          },
          {
            title: "Actions",
            width: 110,
            render: (_, r) => (
              <>
                <Button
                  type="text"
                  aria-label="Edit"
                  icon={<Pencil size={16} />}
                  onClick={() => open(r)}
                />
                <Button
                  type="text"
                  danger
                  aria-label="Delete"
                  icon={<Trash2 size={16} />}
                  onClick={() => setDel(r)}
                />
              </>
            ),
          },
        ]}
      />
      <Modal
        title={editing?.id ? "Edit cost center" : "New cost center"}
        open={editing !== null}
        onCancel={() => {
          setEditing(null);
          form.resetFields();
        }}
        onOk={save}
        confirmLoading={saving}
        cancelButtonProps={{ disabled: saving }}
        closable={!saving}
        forceRender
        maskClosable={false}
        okText={editing?.id ? "Save changes" : "Create"}
        cancelText="Cancel"
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: "Please enter a cost center name" },
            ]}
          >
            <Input autoFocus placeholder="e.g. Marketing" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea
              rows={3}
              placeholder="Optional notes for this cost center"
            />
          </Form.Item>
        </Form>
      </Modal>
      <DeleteConfirm
        open={!!del}
        onCancel={() => setDel(null)}
        onConfirm={async () => {
          if (expenses.some((item) => item.costCenterId === del.id)) {
            message.error("This cost center is used by transactions.");
            return Promise.reject();
          }
          try {
            await dispatch(
              deleteRecordThunk({ collection: "costCenters", id: del.id }),
            ).unwrap();
            setDel(null);
            message.success("Cost center deleted.");
          } catch (error) {
            message.error(errorText(error, "Could not delete this cost center."));
            throw error;
          }
        }}
        title="Delete cost center?"
      />
    </>
  );
}
