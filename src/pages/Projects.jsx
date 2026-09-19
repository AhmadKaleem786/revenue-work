import React, { useMemo, useState } from "react";
import {
  Button,
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
import { useDispatch, useSelector } from "react-redux";
import { deleteRecordThunk, saveRecordThunk } from "../store";
import { DeleteConfirm, EmptyState, PageHeader, money } from "../components/UI";
import { errorText } from "../utils/error";
import { Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { downloadExcel, exportFileName } from "../utils/excel";
import { ownershipShare } from "../utils/ownership";
const key = () => crypto.randomUUID();
export default function Projects() {
  const data = useSelector((s) => s.projects),
    expenses = useSelector((s) => s.expenses),
    statuses = useSelector((s) => s.projectStatuses) || [],
    user = useSelector((s) => s.auth),
    dispatch = useDispatch(),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(),
    [editing, setEditing] = useState(null),
    [del, setDel] = useState(null),
    [saving, setSaving] = useState(false),
    [form] = Form.useForm();
  const rows = useMemo(
    () =>
      data
        .filter(
          (x) =>
            (x.name + x.description)
              .toLowerCase()
              .includes(query.toLowerCase()) &&
            (!status || x.projectStatusId === status),
        )
        .map((p) => {
          const e = expenses.filter((x) => x.projectId === p.id),
            r = e
              .filter((x) => x.type === "Revenue")
              .reduce((a, x) => a + Number(x.amount), 0),
            expenseTotal = e
              .filter((x) => x.type === "Expense")
              .reduce((a, x) => a + Number(x.amount), 0);
          const receivable = e
            .filter((x) => x.type === "Revenue" && x.isReceived === false)
            .reduce((a, x) => a + Number(x.amount), 0);
          return { ...p, r, receivable, expenseTotal, netIncome: r - expenseTotal };
        }),
    [data, expenses, query, status],
  );
  const open = (x) => {
    setEditing(x || {});
    form.resetFields();
    form.setFieldsValue(
      x
        ? { ...x, ownershipShare: ownershipShare(x), createdDate: dayjs(x.createdDate) }
        : { createdDate: dayjs(), ownershipShare: 100 },
    );
  };
  const exportProjects = () =>
    downloadExcel({
      fileName: exportFileName(user?.name, "projects"),
      sheets: [
        {
          name: "Projects",
          rows: rows.map((project) => ({
            Project: project.name,
            Description: project.description || "",
            "Created Date": project.createdDate || "",
            "Ownership share": `${ownershipShare(project)}%`,
            Status:
              statuses.find((item) => item.id === project.projectStatusId)
                ?.name || "",
            Revenue: project.r,
            Receivable: project.receivable,
            Expenses: project.expenseTotal,
            "Net Income": project.netIncome,
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
        name: v.name,
        description: v.description || "",
        projectStatusId: v.projectStatusId,
        ownershipShare: Number(v.ownershipShare),
        createdDate: v.createdDate.format("YYYY-MM-DD"),
        id: editing.id || key(),
        createdAt: editing.createdAt || now,
        updatedAt: now,
        createdBy: user?.uid || "local-user",
      };
      await dispatch(
        saveRecordThunk({ collection: "projects", item, userId: user?.uid }),
      ).unwrap();
      setEditing(null);
      message.success(`Project ${editing.id ? "updated" : "created"}.`);
    } catch (error) {
      message.error(errorText(error, "Could not save this project."));
      throw error;
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="Track financial performance from kickoff to completion."
        action={
          <>
            <Button icon={<Download size={16} />} onClick={exportProjects}>
              Export Excel
            </Button>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => open()}
            >
              New project
            </Button>
          </>
        }
      />
      <Space className="table-search project-filters">
        <Input
          style={{ maxWidth: 300 }}
          prefix={<Search size={16} />}
          placeholder="Search projects"
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select
          allowClear
          placeholder="All statuses"
          style={{ width: 180, flex: "0 0 180px" }}
          value={status}
          onChange={setStatus}
          options={statuses.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
        />
      </Space>
      <Table
        className="data-table"
        rowKey="id"
        dataSource={rows}
        pagination={{ pageSize: 8 }}
        locale={{
          emptyText: (
            <EmptyState
              title="No projects yet"
              description="Start tracking your first project's financials."
              action={{
                label: "Create your first project",
                onClick: () => open(),
              }}
            />
          ),
        }}
        columns={[
          {
            title: "Project",
            dataIndex: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (v, r) => <Link to={"/projects/" + r.id}>{v}</Link>,
          },
          {
            title: "Revenue",
            dataIndex: "r",
            render: money,
            responsive: ["md"],
          },
          {
            title: "Status",
            dataIndex: "projectStatusId",
            render: (value) =>
              statuses.find((item) => item.id === value)?.name || "—",
          },
          {
            title: "Receivable",
            dataIndex: "receivable",
            render: money,
            responsive: ["xl"],
          },
          {
            title: "Expenses",
            dataIndex: "expenseTotal",
            render: money,
            responsive: ["lg"],
          },
          {
            title: "Net Income",
            dataIndex: "netIncome",
            render: (v) => (
              <Tag color={v >= 0 ? "green" : "red"}>{money(v)}</Tag>
            ),
          },
          { title: "Created", dataIndex: "createdDate", responsive: ["lg"] },
          {
            title: "Actions",
            width: 110,
            render: (_, r) => (
              <>
                <Button
                  type="text"
                  icon={<Pencil size={16} />}
                  onClick={() => open(r)}
                />
                <Button
                  danger
                  type="text"
                  icon={<Trash2 size={16} />}
                  onClick={() => setDel(r)}
                />
              </>
            ),
          },
        ]}
      />
      <Modal
        title={editing?.id ? "Edit project" : "New project"}
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
        okText={editing?.id ? "Save changes" : "Create"}
        cancelText="Cancel"
        width={520}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Project name"
            name="name"
            rules={[{ required: true, message: "Please enter a project name" }]}
          >
            <Input autoFocus placeholder="e.g. Q4 Renewal Campaign" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea
              rows={3}
              placeholder="Optional project description"
            />
          </Form.Item>
          <Form.Item
            label="Your ownership share"
            name="ownershipShare"
            extra="Dashboard financial reporting is calculated using this share."
            rules={[
              { required: true, message: "Please enter your ownership share" },
              { type: "number", min: 0, max: 100, message: "Share must be between 0% and 100%" },
            ]}
          >
            <InputNumber min={0} max={100} precision={2} addonAfter="%" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label="Project status"
            name="projectStatusId"
            rules={[
              { required: true, message: "Please select a project status" },
            ]}
          >
            <Select
              placeholder="Select a project status"
              options={statuses.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              notFoundContent="Create a project status first"
            />
          </Form.Item>
          <Form.Item
            label="Created date"
            name="createdDate"
            rules={[
              { required: true, message: "Please select a creation date" },
            ]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
      <DeleteConfirm
        open={!!del}
        onCancel={() => setDel(null)}
        onConfirm={async () => {
          try {
            await dispatch(
              deleteRecordThunk({
                collection: "projects",
                id: del.id,
                related: expenses
                  .filter((item) => item.projectId === del.id)
                  .map((item) => ({ collection: "expenses", id: item.id })),
              }),
            ).unwrap();
            setDel(null);
            message.success("Project deleted.");
          } catch (error) {
            message.error(errorText(error, "Could not delete this project."));
            throw error;
          }
        }}
        title="Delete project?"
      />
    </>
  );
}
