import React from "react";
import { Checkbox, Col, DatePicker, Form, Input, InputNumber, Modal, Row, Select } from "antd";
import { TRANSACTION_TYPE } from "../../utils/finance";

export function TransactionFormModal({ editing, form, centers, saving, onCancel, onSave }) {
  return (
    <Modal
      title={editing?.id ? "Edit transaction" : "Add transaction"}
      open={editing !== null}
      onCancel={onCancel}
      onOk={onSave}
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
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Cost center" name="costCenterId" rules={[{ required: true, message: "Cost center is required" }]}>
              <Select placeholder="Select a cost center" options={centers.map((center) => ({ value: center.id, label: center.name }))} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Date" name="date" rules={[{ required: true, message: "Please choose a date" }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Description" name="description" rules={[{ required: true, message: "Description is required" }]}>
          <Input placeholder="Transaction purpose" />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item label="Type" name="type" rules={[{ required: true, message: "Please select a transaction type" }]}>
              <Select options={Object.values(TRANSACTION_TYPE).map((value) => ({ value, label: value }))} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Amount" name="amount" rules={[{ required: true, message: "Please enter an amount" }, { type: "number", min: 0.01, message: "Amount must be greater than 0" }]}>
              <InputNumber min={0.01} step={0.01} style={{ width: "100%" }} formatter={(value) => (value ? `PKR ${value}` : "")} parser={(value) => value?.replace(/[^0-9.]/g, "")} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item noStyle shouldUpdate={(previous, current) => previous.type !== current.type}>
          {({ getFieldValue }) => getFieldValue("type") === TRANSACTION_TYPE.REVENUE && (
            <Form.Item name="isReceived" valuePropName="checked">
              <Checkbox>Payment has been received</Checkbox>
            </Form.Item>
          )}
        </Form.Item>
        <Form.Item label="Notes" name="notes">
          <Input.TextArea rows={2} placeholder="Optional note" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
