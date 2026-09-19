import React from "react";
import { Button, Card, Col, Row, Table, Tag } from "antd";
import {
  Banknote,
  Download,
  FolderKanban,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { PageHeader, StatCard, EmptyState, money } from "../components/UI";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  Pie,
  PieChart,
  Cell,
} from "recharts";
import { downloadExcel } from "../utils/excel";

export default function Dashboard() {
  const projects = useSelector((s) => s.projects);
  const expenses = useSelector((s) => s.expenses);
  const centers = useSelector((s) => s.costCenters);
  const statuses = useSelector((s) => s.projectStatuses) || [];
  const rev = expenses
    .filter((x) => x.type === "Revenue")
    .reduce((sum, x) => sum + Number(x.amount), 0);
  const expenseTotal = expenses
    .filter((x) => x.type === "Expense")
    .reduce((sum, x) => sum + Number(x.amount), 0);
  const rows = projects.map((project) => {
    const entries = expenses.filter((entry) => entry.projectId === project.id);
    const revenue = entries
      .filter((entry) => entry.type === "Revenue")
      .reduce((sum, entry) => sum + Number(entry.amount), 0);
    const expenseTotal = entries
      .filter((entry) => entry.type === "Expense")
      .reduce((sum, entry) => sum + Number(entry.amount), 0);
    return { ...project, revenue, expenseTotal, netIncome: revenue - expenseTotal };
  });
  const chart = rows.map((project) => ({
    name: project.name,
    revenue: project.revenue,
    expenses: project.expenseTotal,
  }));
  const statusChart = [
    ...statuses.map((status) => ({
      name: status.name,
      value: projects.filter((project) => project.projectStatusId === status.id).length,
    })),
    ...(projects.some((project) => !project.projectStatusId)
      ? [{ name: "Not set", value: projects.filter((project) => !project.projectStatusId).length }]
      : []),
  ].filter((item) => item.value > 0);
  const statusColors = ["#1677ff", "#0f6e56", "#7c3aed", "#ea580c", "#d4380d", "#08979c"];

  const exportDashboard = () =>
    downloadExcel({
      fileName: "revenueworks-dashboard",
      sheets: [
        {
          name: "Summary",
          rows: [
            {
              "Total Projects": projects.length,
              "Total Revenue": rev,
              "Total Expenses": expenseTotal,
              "Net Income": rev - expenseTotal,
            },
          ],
        },
        {
          name: "Projects",
          rows: rows.map((project) => ({
            Project: project.name,
            Description: project.description || "",
            Created: project.createdDate || "",
            Status: statuses.find((status) => status.id === project.projectStatusId)?.name || "",
            Revenue: project.revenue,
            Expenses: project.expenseTotal,
            "Net Income": project.netIncome,
          })),
        },
        {
          name: "Transactions",
          rows: expenses.map((expense) => ({
            Date: expense.date || "",
            Project: projects.find((project) => project.id === expense.projectId)
              ?.name || "",
            "Cost Center": centers.find(
              (center) => center.id === expense.costCenterId,
            )?.name || "",
            Description: expense.description || "",
            Type: expense.type || "",
            Amount: Number(expense.amount) || 0,
            Notes: expense.notes || "",
          })),
        },
        {
          name: "Cost Centers",
          rows: centers.map((center) => ({
            "Cost Center": center.name,
            Description: center.description || "",
          })),
        },
      ],
    });

  return (
    <>
      <PageHeader
        title="Good to see you"
        subtitle="Here’s your financial overview."
        action={
          <Button icon={<Download size={16} />} onClick={exportDashboard}>
            Export Excel
          </Button>
        }
      />
      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Total projects" value={projects.length} icon={<FolderKanban />} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Total revenue" value={money(rev)} icon={<Banknote />} color="green" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Total expenses" value={money(expenseTotal)} icon={<TrendingDown />} color="orange" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Net Income" value={money(rev - expenseTotal)} icon={<Wallet />} color="purple" />
        </Col>
      </Row>
      <Row gutter={[20, 20]} className="section">
        <Col xs={24} xl={12}>
          <Card title="Revenue vs. Expenses" className="chart-card">
            {chart.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chart}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => money(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#1677ff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ff9c6e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No financial data yet" description="Create a project and add transactions to see analytics." />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Projects by status" className="chart-card">
            {statusChart.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {statusChart.map((item, index) => <Cell key={item.name} fill={statusColors[index % statusColors.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => [value, "Projects"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No project statuses yet" description="Assign a status to projects to see this breakdown." />
            )}
          </Card>
        </Col>
        <Col xs={24}>
          <Card title="Projects">
            <Table
              size="small"
              dataSource={rows.slice(0, 5)}
              rowKey="id"
              pagination={false}
              locale={{
                emptyText: <EmptyState title="No projects yet" description="Your projects will appear here." />,
              }}
              columns={[
                {
                  title: "Project",
                  dataIndex: "name",
                  render: (value, record) => <Link to={`/projects/${record.id}`}>{value}</Link>,
                },
                {
                  title: "Net Income",
                  dataIndex: "netIncome",
                  render: (value) => <Tag color={value >= 0 ? "green" : "red"}>{money(value)}</Tag>,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}
