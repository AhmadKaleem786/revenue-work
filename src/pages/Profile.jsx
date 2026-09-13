import React, { useState } from "react";
import { Button, Card, Form, Input, Radio, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { LogoPicker, PageHeader } from "../components/UI";
import { setAccent, setDark, updateProfile } from "../store";
import { firebaseEnabled } from "../services/firebase/config";
import { updateUserProfile } from "../services/firebase/auth";
import { saveLocalLogo } from "../utils/localLogo";
import { errorText } from "../utils/error";

const accentOptions = [
  { value: "emerald", label: "Emerald", color: "#0f6e56" },
  { value: "ocean", label: "Ocean", color: "#1677ff" },
  { value: "violet", label: "Violet", color: "#7c3aed" },
  { value: "sunset", label: "Sunset", color: "#ea580c" },
];

export default function Profile({ settings }) {
  const user = useSelector((s) => s.auth);
  const dark = useSelector((s) => s.ui.dark);
  const accent = useSelector((s) => s.ui.accent);
  const dispatch = useDispatch();
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (values) => {
    setSaving(true);
    try {
      const logo = logoFile
        ? await saveLocalLogo(user.uid, logoFile)
        : user.logo || "";
      if (logoFile) dispatch(updateProfile({ logo }));
      const next = firebaseEnabled
        ? await updateUserProfile(user, {
            name: values.name,
            password: values.password,
            logoFile,
          })
        : {
            name: values.name,
            logo,
          };
      dispatch(updateProfile(next));
      setLogoFile(null);
      message.success("Profile saved.");
    } catch (error) {
      message.error(errorText(error, "Could not save your profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={settings ? "Settings" : "Your profile"}
        subtitle={
          settings
            ? "Manage your workspace preferences."
            : "Keep your business details current."
        }
      />
      <Card className="profile-card">
        {settings ? (
          <div className="appearance-settings">
            <h3>Appearance</h3>
            <p>Choose how RevenueWorks looks on this browser.</p>
            <Form layout="vertical">
              <Form.Item label="Color mode">
                <Radio.Group
                  value={dark ? "dark" : "light"}
                  onChange={(event) =>
                    dispatch(setDark(event.target.value === "dark"))
                  }
                  optionType="button"
                  buttonStyle="solid"
                  options={[
                    { label: "Light", value: "light" },
                    { label: "Dark", value: "dark" },
                  ]}
                />
              </Form.Item>
              <Form.Item label="Accent color">
                <Radio.Group
                  className="accent-options"
                  value={accent}
                  onChange={(event) => dispatch(setAccent(event.target.value))}
                >
                  {accentOptions.map((option) => (
                    <Radio.Button key={option.value} value={option.value}>
                      <i style={{ background: option.color }} />
                      {option.label}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </Form.Item>
            </Form>
          </div>
        ) : (
          <Form layout="vertical" initialValues={user} onFinish={save}>
            <Form.Item
              name="name"
              label="Business name"
              rules={[{ required: true, message: "Business name is required" }]}
            >
              <Input placeholder="Acme Construction" />
            </Form.Item>
            <LogoPicker
              value={user?.logo}
              file={logoFile}
              onChange={setLogoFile}
            />
            <Form.Item name="email" label="Email">
              <Input disabled />
            </Form.Item>
            <Form.Item name="password" label="New password">
              <Input.Password placeholder="Leave blank to keep your password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              Save changes
            </Button>
          </Form>
        )}
      </Card>
    </>
  );
}
