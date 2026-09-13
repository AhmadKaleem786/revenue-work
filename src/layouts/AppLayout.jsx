import React, { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AutoComplete,
  Avatar,
  Button,
  Drawer,
  Dropdown,
  Input,
  Layout,
  Menu,
  Spin,
  Switch,
  theme,
} from "antd";
import {
  BarChart3,
  Building2,
  FolderKanban,
  LogOut,
  Menu as MenuIcon,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { BrandMark } from "../components/UI";
import { firebaseEnabled } from "../services/firebase/config";
import { signOutUser } from "../services/firebase/auth";
import { logout, resetWorkspace, toggleDark } from "../store";

const { Header, Sider, Content } = Layout;

function GlobalSearch() {
  const nav = useNavigate();
  const [value, setValue] = useState("");
  const projects = useSelector((s) => s.projects);
  const costCenters = useSelector((s) => s.costCenters);
  const expenses = useSelector((s) => s.expenses);

  const options = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    const group = (label, items) =>
      items.length ? [{ label, options: items }] : [];
    return [
      ...group(
        "Projects",
        projects
          .filter((item) =>
            `${item.name} ${item.description || ""}`.toLowerCase().includes(q),
          )
          .slice(0, 5)
          .map((item) => ({
            value: `/projects/${item.id}`,
            label: item.name,
          })),
      ),
      ...group(
        "Cost centers",
        costCenters
          .filter((item) =>
            `${item.name} ${item.description || ""}`.toLowerCase().includes(q),
          )
          .slice(0, 5)
          .map((item) => ({
            value: "/cost-centers",
            label: item.name,
          })),
      ),
      ...group(
        "Transactions",
        expenses
          .filter((item) =>
            `${item.description} ${item.notes || ""}`.toLowerCase().includes(q),
          )
          .slice(0, 5)
          .map((item) => ({
            value: `/projects/${item.projectId}`,
            label: item.description,
          })),
      ),
    ];
  }, [value, projects, costCenters, expenses]);

  return (
    <AutoComplete
      className="global-search"
      options={options}
      value={value}
      onChange={setValue}
      onSelect={(path) => {
        nav(path);
        setValue("");
      }}
    >
      <Input
        prefix={<Search size={16} />}
        placeholder="Search projects, expenses, cost centers"
        allowClear
      />
    </AutoComplete>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth);
  const dark = useSelector((s) => s.ui.dark);
  const dataReady = useSelector((s) => s.ui.dataReady);
  const { token } = theme.useToken();

  const go = (key) => {
    nav(key);
    setMobileOpen(false);
  };

  const items = [
    ["/dashboard", <BarChart3 size={16} />, "Dashboard"],
    ["/projects", <FolderKanban size={16} />, "Projects"],
    ["/cost-centers", <Building2 size={16} />, "Cost centers"],
  ].map(([key, icon, label]) => ({ key, icon, label }));

  return (
    <Layout className="shell">
      <Sider
        className="sidebar-nav app-sider"
        width={260}
        collapsedWidth={80}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme={dark ? "dark" : "light"}
      >
        <BrandMark name={user?.name} logo={user?.logo} collapsed={collapsed} />

        <Menu
          mode="inline"
          selectedKeys={[
            loc.pathname.startsWith("/projects/") ? "/projects" : loc.pathname,
          ]}
          items={items}
          onClick={({ key }) => go(key)}
          style={{ background: "transparent", color: "#fff" }}
          inlineCollapsed={collapsed}
        />
      </Sider>

      <Layout>
        <Header
          className="topbar"
          style={{ background: token.colorBgContainer }}
        >
          <Button
            className="mobile-menu"
            type="text"
            icon={<MenuIcon />}
            onClick={() => setMobileOpen(true)}
          />

          <GlobalSearch />

          <div className="top-actions">
            <div className="theme-toggle">
              <Sun size={14} />
              <Switch
                checked={dark}
                onChange={() => dispatch(toggleDark())}
                className="theme-switch"
              />
              <Moon size={14} />
            </div>

            <Dropdown
              menu={{
                items: [
                  {
                    key: "profile",
                    icon: <User size={15} />,
                    label: "Profile",
                  },
                  {
                    key: "settings",
                    icon: <Settings size={15} />,
                    label: "Settings",
                  },
                  { type: "divider" },
                  {
                    key: "logout",
                    icon: <LogOut size={15} />,
                    label: "Sign out",
                    danger: true,
                  },
                ],
                onClick: async ({ key }) => {
                  if (key !== "logout") {
                    go("/" + key);
                    return;
                  }
                  try {
                    if (firebaseEnabled) await signOutUser();
                  } finally {
                    dispatch(resetWorkspace());
                    dispatch(logout());
                  }
                },
              }}
              overlayClassName="profile-dropdown"
            >
              <button className="profile-trigger" type="button">
                <Avatar src={user?.logo} style={{ background: "var(--primary)" }}>
                  {user?.name?.[0] || "A"}
                </Avatar>
                <span className="profile-trigger__meta">
                  <strong>{user?.name || "Account"}</strong>
                  <small>{user?.email || "Workspace owner"}</small>
                </span>
              </button>
            </Dropdown>
          </div>
        </Header>

        <Content className="content">
          {dataReady ? (
            <Outlet />
          ) : (
            <div className="page-loader">
              <Spin size="large" />
            </div>
          )}
        </Content>
      </Layout>

      <Drawer
        className="mobile-drawer"
        placement="bottom"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        height="78vh"
        closeIcon={false}
        bodyStyle={{ padding: 0, background: "var(--panel)" }}
      >
        <div className="mobile-drawer__header">
          <BrandMark name={user?.name} logo={user?.logo} mobile />
          <Button
            type="text"
            icon={<X size={18} />}
            onClick={() => setMobileOpen(false)}
          />
        </div>

        <Menu
          mode="inline"
          selectedKeys={[
            loc.pathname.startsWith("/projects/") ? "/projects" : loc.pathname,
          ]}
          items={items}
          onClick={({ key }) => go(key)}
          style={{
            background: "transparent",
            color: dark ? "#e8fff7" : "#102a25",
            border: 0,
          }}
        />
      </Drawer>
    </Layout>
  );
}
