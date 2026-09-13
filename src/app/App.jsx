import React, { lazy, Suspense, useEffect } from "react";
import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ConfigProvider, Spin, message, theme } from "antd";
import { useDispatch, useSelector } from "react-redux";
import AppLayout from "../layouts/AppLayout";
import { firebaseEnabled } from "../services/firebase/config";
import { observeAuth } from "../services/firebase/auth";
import { listenToUserCollection } from "../services/firebase/data";
import {
  costCentersSlice,
  expensesSlice,
  login,
  logout,
  projectsSlice,
  resetWorkspace,
  setDataReady,
} from "../store";

const Auth = lazy(() => import("../pages/Auth")),
  Dashboard = lazy(() => import("../pages/Dashboard")),
  Projects = lazy(() => import("../pages/Projects")),
  ProjectDetails = lazy(() => import("../pages/ProjectDetails")),
  CostCenters = lazy(() => import("../pages/CostCenters")),
  Profile = lazy(() => import("../pages/Profile"));

const accentThemes = {
  emerald: { primary: "#0f6e56", darkPanel: "#0b2f27", darkBg: "#061f19" },
  ocean: { primary: "#1677ff", darkPanel: "#0b2747", darkBg: "#071a2f" },
  violet: { primary: "#7c3aed", darkPanel: "#211538", darkBg: "#171022" },
  sunset: { primary: "#ea580c", darkPanel: "#3a1d10", darkBg: "#27130b" },
};

const Guard = ({ children }) =>
  useSelector((s) => s.auth) ? children : <Navigate to="/login" replace />;

const onFirst = (always, once) => {
  let done = false;
  return (value) => {
    always(value);
    if (!done) {
      done = true;
      once();
    }
  };
};

export default function App() {
  const dark = useSelector((s) => s.ui.dark);
  const accent = useSelector((s) => s.ui.accent);
  const user = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const [authReady, setAuthReady] = useState(!firebaseEnabled);
  const activeTheme = accentThemes[accent] || accentThemes.emerald;

  useEffect(() => {
    document.body.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  useEffect(() => {
    document.body.dataset.accent = accent;
  }, [accent]);

  useEffect(() => {
    document.title = user?.name || "RevenueWorks";
    const icon = document.querySelector("link[rel~='icon']");
    if (icon) icon.href = user?.logo || "/favicon.svg";
  }, [user?.name, user?.logo]);

  useEffect(() => {
    if (!firebaseEnabled) return undefined;
    return observeAuth((profile) => {
      if (profile) {
        dispatch(login(profile));
        setAuthReady(true);
        return;
      }
      dispatch(resetWorkspace());
      dispatch(logout());
      setAuthReady(true);
    });
  }, [dispatch]);

  useEffect(() => {
    if (!firebaseEnabled || !user?.uid) {
      dispatch(setDataReady(true));
      return undefined;
    }
    dispatch(setDataReady(false));
    let remaining = 3;
    const markReady = () => {
      remaining -= 1;
      if (remaining <= 0) dispatch(setDataReady(true));
    };
    const listen = (name, set) =>
      listenToUserCollection(
        name,
        user.uid,
        onFirst((data) => dispatch(set(data)), markReady),
        onFirst(() => message.error(`Could not load ${name}.`), markReady),
      );
    const subscriptions = [
      listen("projects", projectsSlice.actions.set),
      listen("costCenters", costCentersSlice.actions.set),
      listen("expenses", expensesSlice.actions.set),
    ];
    return () => subscriptions.forEach((unsubscribe) => unsubscribe());
  }, [dispatch, user?.uid]);

  return (
    <ConfigProvider
      theme={{
        algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: activeTheme.primary,
          colorBgContainer: dark ? activeTheme.darkPanel : "#ffffff",
          colorBgLayout: dark ? activeTheme.darkBg : "#f7f4eb",
        },
      }}
    >
      {!authReady ? (
        <div className="page-loader">
          <Spin size="large" />
        </div>
      ) : (
      <Suspense
        fallback={
          <div className="page-loader">
            <Spin size="large" />
          </div>
        }
      >
        <Routes>
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route
            element={
              <Guard>
                <AppLayout />
              </Guard>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/cost-centers" element={<CostCenters />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Profile settings />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route
            path="*"
            element={
              <div className="not-found">
                <h1>404</h1>
                <p>This page does not exist.</p>
              </div>
            }
          />
        </Routes>
      </Suspense>
      )}
    </ConfigProvider>
  );
}
