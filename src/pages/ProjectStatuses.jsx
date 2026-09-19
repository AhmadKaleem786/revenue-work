import React, { useMemo, useState } from "react";
import { Button, Form, Input, Modal, Table, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { deleteRecordThunk, saveRecordThunk } from "../store";
import { DeleteConfirm, EmptyState, PageHeader } from "../components/UI";
import { errorText } from "../utils/error";
import { Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { downloadExcel, exportFileName } from "../utils/excel";

const key = () => crypto.randomUUID();

export default function ProjectStatuses() {
  const data = useSelector((s) => s.projectStatuses);
  const projects = useSelector((s) => s.projects);
  const user = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [del, setDel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const filtered = useMemo(
    () => data.filter((item) => `${item.name || ""} ${item.description || ""}`.toLowerCase().includes(query.toLowerCase())),
    [data, query],
  );
  const open = (item) => {
    setEditing(item || {});
    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue(item || { name: "", description: "" });
    }, 0);
  };
  const save = async () => {
    let values;
    try { values = await form.validateFields(); } catch { return; }
    if (data.some((item) => item.name?.toLowerCase() === values.name.trim().toLowerCase() && item.id !== editing.id)) {
      message.error("A project status with this name already exists.");
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const item = {
        id: editing.id || key(), name: values.name.trim(), description: values.description || "",
        createdAt: editing.createdAt || now, updatedAt: now, createdBy: user?.uid,
      };
      await dispatch(saveRecordThunk({ collection: "projectStatuses", item, userId: user?.uid })).unwrap();
      setEditing(null);
      message.success(`Project status ${editing.id ? "updated" : "created"}.`);
    } catch (error) {
      message.error(errorText(error, "Could not save this project status."));
      throw error;
    } finally { setSaving(false); }
  };
  return <>
    <PageHeader title="Project statuses" subtitle="Define the stages used to track your projects."
      action={<><Button icon={<Download size={16} />} onClick={() => downloadExcel({ fileName: exportFileName(user?.name, "project-statuses"), sheets: [{ name: "Project Statuses", rows: filtered.map((item) => ({ Status: item.name, Description: item.description || "", Projects: projects.filter((project) => project.projectStatusId === item.id).length })) }] })}>Export Excel</Button><Button type="primary" icon={<Plus size={16} />} onClick={() => open()}>New project status</Button></>} />
    <Input className="table-search" prefix={<Search size={16} />} placeholder="Search project statuses" onChange={(event) => setQuery(event.target.value)} />
    <Table className="data-table" rowKey="id" dataSource={filtered} pagination={{ pageSize: 8 }} locale={{ emptyText: <EmptyState title="No project statuses yet" description="Create statuses such as Planned, Active, or Complete." action={{ label: "New project status", onClick: () => open() }} /> }} columns={[
      { title: "Name", dataIndex: "name", sorter: (a, b) => a.name.localeCompare(b.name) },
      { title: "Description", dataIndex: "description", responsive: ["sm"] },
      { title: "Projects", render: (_, item) => projects.filter((project) => project.projectStatusId === item.id).length },
      { title: "Actions", width: 110, render: (_, item) => <><Button type="text" aria-label="Edit" icon={<Pencil size={16} />} onClick={() => open(item)} /><Button type="text" danger aria-label="Delete" icon={<Trash2 size={16} />} onClick={() => setDel(item)} /></> },
    ]} />
    <Modal title={editing?.id ? "Edit project status" : "New project status"} open={editing !== null} onCancel={() => { setEditing(null); form.resetFields(); }} onOk={save} confirmLoading={saving} cancelButtonProps={{ disabled: saving }} closable={!saving} forceRender maskClosable={false} okText={editing?.id ? "Save changes" : "Create"} width={520}>
      <Form form={form} layout="vertical"><Form.Item label="Name" name="name" rules={[{ required: true, message: "Please enter a project status name" }]}><Input autoFocus placeholder="e.g. Active" /></Form.Item><Form.Item label="Description" name="description"><Input.TextArea rows={3} placeholder="Optional notes for this project status" /></Form.Item></Form>
    </Modal>
    <DeleteConfirm open={!!del} onCancel={() => setDel(null)} onConfirm={async () => {
      if (projects.some((project) => project.projectStatusId === del.id)) { message.error("This project status is used by projects."); return Promise.reject(); }
      try { await dispatch(deleteRecordThunk({ collection: "projectStatuses", id: del.id })).unwrap(); setDel(null); message.success("Project status deleted."); }
      catch (error) { message.error(errorText(error, "Could not delete this project status.")); throw error; }
    }} title="Delete project status?" />
  </>;
}
