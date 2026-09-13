import React from "react";
import { Alert, Button, Card, Form, Input, Typography, message } from "antd";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Formik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../store";
import { firebaseEnabled } from "../services/firebase/config";
import { signIn, signUp } from "../services/firebase/auth";
import { LogoPicker } from "../components/UI";
import { fileToDataUrl } from "../utils/file";
import { errorText } from "../utils/error";

const validation = (signup) =>
  Yup.object({
    name: signup ? Yup.string().required("Business name is required") : Yup.string(),
    email: Yup.string()
      .email("Enter a valid email")
      .required("Email is required"),
    password: Yup.string()
      .min(8, "At least 8 characters")
      .required("Password is required"),
    confirm: signup
      ? Yup.string()
          .oneOf([Yup.ref("password")], "Passwords must match")
          .required("Confirm your password")
      : Yup.string(),
  });

const Field = ({
  label,
  name,
  values,
  errors,
  touched,
  onChange,
  password = false,
  placeholder,
}) => (
  <Form.Item
    label={label}
    validateStatus={touched[name] && errors[name] ? "error" : ""}
    help={touched[name] && errors[name]}
  >
    {password ? (
      <Input.Password
        name={name}
        value={values[name]}
        onChange={onChange}
        placeholder={placeholder}
      />
    ) : (
      <Input
        name={name}
        value={values[name]}
        onChange={onChange}
        placeholder={placeholder}
      />
    )}
  </Form.Item>
);

export default function Auth({ mode }) {
  const signup = mode === "signup",
    dispatch = useDispatch(),
    nav = useNavigate(),
    user = useSelector((s) => s.auth);
  if (user) return <Navigate to="/dashboard" />;
  const submit = async (v, { setSubmitting }) => {
    try {
      const existing = JSON.parse(localStorage.getItem("rw-user") || "null");
      const profile = firebaseEnabled
        ? await (signup ? signUp(v) : signIn(v.email, v.password))
        : {
            uid: existing?.uid || "local-user",
            name: signup ? v.name : existing?.name || v.email.split("@")[0],
            email: v.email,
            logo: signup
              ? v.logoFile
                ? await fileToDataUrl(v.logoFile)
                : ""
              : existing?.logo || "",
          };
      dispatch(login(profile));
      message.success(signup ? "Account created. Welcome!" : "Welcome back!");
      nav("/dashboard");
    } catch (error) {
      message.error(errorText(error));
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <main className="auth">
      <section className="auth-copy">
        <div className="brand">
          <span>R</span>RevenueWorks
        </div>
        <div>
          <h1>Financial clarity for every project.</h1>
          <p>
            Track revenue, manage deductions, and understand performance at a
            glance.
          </p>
        </div>
      </section>
      <section className="auth-form">
        <Card>
          <Typography.Title level={2}>
            {signup ? "Create your account" : "Welcome back"}
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            {signup
              ? "Set up your business workspace to start managing finances."
              : "Sign in to your workspace."}
          </Typography.Paragraph>
          {!firebaseEnabled && (
            <Alert
              type="info"
              showIcon
              message="Demo mode"
              description="Data is stored in this browser until Firebase is configured."
            />
          )}
          <Formik
            initialValues={{
              name: "",
              email: "",
              password: "",
              confirm: "",
              logoFile: null,
            }}
            validationSchema={validation(signup)}
            onSubmit={submit}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleSubmit,
              isSubmitting,
              setFieldValue,
            }) => (
              <Form layout="vertical" onFinish={() => handleSubmit()}>
                {signup && (
                  <>
                    <Field
                      label="Business name"
                      name="name"
                      {...{ values, errors, touched, onChange: handleChange }}
                      placeholder="Acme Construction"
                    />
                    <LogoPicker
                      file={values.logoFile}
                      onChange={(file) => setFieldValue("logoFile", file)}
                    />
                  </>
                )}
                <Field
                  label="Email"
                  name="email"
                  {...{ values, errors, touched, onChange: handleChange }}
                  placeholder="you@company.com"
                />
                <Field
                  label="Password"
                  name="password"
                  {...{ values, errors, touched, onChange: handleChange }}
                  password
                  placeholder="At least 8 characters"
                />
                {signup && (
                  <Field
                    label="Confirm password"
                    name="confirm"
                    {...{ values, errors, touched, onChange: handleChange }}
                    password
                  />
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={isSubmitting}
                  block
                >
                  {signup ? "Create account" : "Sign in"}
                </Button>
              </Form>
            )}
          </Formik>
          <div className="auth-switch">
            {signup ? "Already have an account?" : "New to RevenueWorks?"}{" "}
            <Link to={signup ? "/login" : "/signup"}>
              {signup ? "Sign in" : "Create an account"}
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
