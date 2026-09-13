import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Empty,
  Form,
  message,
  Modal,
  Typography,
  Upload,
} from "antd";
import { ImagePlus, Plus } from "lucide-react";
import { isAllowedLogo } from "../utils/file";

export const PageHeader = ({ title, subtitle, action }) => (
  <div className="page-header">
    <div>
      <Typography.Title level={2}>{title}</Typography.Title>
      {subtitle && (
        <Typography.Text type="secondary">{subtitle}</Typography.Text>
      )}
    </div>
    {action}
  </div>
);

export const StatCard = ({ title, value, icon, color = "blue" }) => (
  <Card className="stat-card">
    <div>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
    <div className={`stat-icon ${color}`}>{icon}</div>
  </Card>
);

export const EmptyState = ({
  title = "Nothing here yet",
  description,
  action,
}) => (
  <Empty
    description={
      <>
        <b>{title}</b>
        <br />
        <span>{description}</span>
      </>
    }
    image={Empty.PRESENTED_IMAGE_SIMPLE}
  >
    {action && (
      <Button type="primary" icon={<Plus size={16} />} onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </Empty>
);

export const DeleteConfirm = ({
  open,
  onCancel,
  onConfirm,
  title = "Delete this item?",
}) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) setLoading(false);
  }, [open]);

  const confirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={confirm}
      confirmLoading={loading}
      cancelButtonProps={{ disabled: loading }}
      closable={!loading}
      maskClosable={!loading}
      okText="Delete"
      okButtonProps={{ danger: true }}
      title={title}
    >
      This action cannot be undone.
    </Modal>
  );
};

export const money = (value = 0) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(value);

export const DEFAULT_LOGO = "/revenueworks_logo.svg";

export function BrandMark({ name, logo, collapsed, mobile }) {
  const title = name || "RevenueWorks";
  return (
    <div className={`brand${mobile ? " brand--mobile" : ""}`}>
      <div className={`brand__icon${logo ? " brand__icon--custom" : ""}`}>
        <img src={logo || DEFAULT_LOGO} alt={title} />
      </div>
      {!collapsed && (
        <div className="brand__copy">
          <strong>{title}</strong>
          <span>Financial OS</span>
        </div>
      )}
    </div>
  );
}

export function LogoPicker({ value, file, onChange }) {
  const [preview, setPreview] = useState(value || "");

  useEffect(() => {
    if (!file) {
      setPreview(value || "");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, value]);

  return (
    <Form.Item label="Business logo">
      <Upload
        accept="image/*"
        maxCount={1}
        showUploadList={false}
        beforeUpload={(next) => {
          const error = isAllowedLogo(next);
          if (error) {
            message.error(error);
            return Upload.LIST_IGNORE;
          }
          onChange(next);
          return false;
        }}
      >
        <button type="button" className="logo-picker">
          {preview ? (
            <img src={preview} alt="Business logo preview" />
          ) : (
            <ImagePlus size={22} />
          )}
          <span>{preview ? "Change logo" : "Upload logo"}</span>
        </button>
      </Upload>
    </Form.Item>
  );
}
