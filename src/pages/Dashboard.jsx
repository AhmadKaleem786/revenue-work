import React from "react";
import { Button, Card, Col, Row, Table, Tag } from "antd";
import {
  Banknote,
  Download,
  FolderKanban,
  Clock3,
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
import { downloadExcel, exportFileName } from "../utils/excel";
import { ownedAmount, ownershipShare } from "../utils/ownership";

export default function Dashboard() {
  const projects = useSelector((s) => s.projects);
  const expenses = useSelector((s) => s.expenses);
  const centers = useSelector((s) => s.costCenters);
  const statuses = useSelector((s) => s.projectStatuses) || [];
  const user = useSelector((s) => s.auth);
  const rows = projects.map((project) => {
    const entries = expenses.filter((entry) => entry.projectId === project.id);
    const revenue = entries
      .filter((entry) => entry.type === "Revenue")
      .reduce((sum, entry) => sum + Number(entry.amount), 0);
    const expenseTotal = entries
      .filter((entry) => entry.type === "Expense")
      .reduce((sum, entry) => sum + Number(entry.amount), 0);
    const receivable = entries
      .filter((entry) => entry.type === "Revenue" && entry.isReceived === false)
      .reduce((sum, entry) => sum + Number(entry.amount), 0);
    const share = ownershipShare(project);
    return {
      ...project,
      share,
      revenue: ownedAmount(revenue, project),
      receivable: ownedAmount(receivable, project),
      expenseTotal: ownedAmount(expenseTotal, project),
      netIncome: ownedAmount(revenue - expenseTotal, project),
    };
  });
  const rev = rows.reduce((sum, project) => sum + project.revenue, 0);
  const expenseTotal = rows.reduce((sum, project) => sum + project.expenseTotal, 0);
  const receivable = rows.reduce((sum, project) => sum + project.receivable, 0);
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
      fileName: exportFileName(user?.name, "dashboard"),
      sheets: [
        {
          name: "Summary",
          rows: [
            {
              "Total Projects": projects.length,
              "My Revenue": rev,
              Receivable: receivable,
              "My Expenses": expenseTotal,
              "My Net Income": rev - expenseTotal,
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
            "Ownership share": `${project.share}%`,
            "My Revenue": project.revenue,
            Receivable: project.receivable,
            "My Expenses": project.expenseTotal,
            "My Net Income": project.netIncome,
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
            "Payment Status": expense.type === "Revenue" ? (expense.isReceived === false ? "Receivable" : "Received") : "N/A",
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
        <Col xs={24} sm={12}>
          <StatCard title="Total projects" value={projects.length} icon={<FolderKanban />} />
        </Col>
        <Col xs={24} sm={12}>
          <StatCard title="My net income" value={money(rev - expenseTotal)} icon={<Wallet />} color="purple" />
        </Col>
      </Row>
      <Row gutter={[20, 20]} className="section">
        <Col xs={24} sm={8}>
          <StatCard title="My revenue" value={money(rev)} icon={<Banknote />} color="green" />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title="Receivable" value={money(receivable)} icon={<Clock3 />} color="orange" />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title="My expenses" value={money(expenseTotal)} icon={<TrendingDown />} color="orange" />
        </Col>
      </Row>
      <Row gutter={[20, 20]} className="section">
        <Col xs={24} xl={12}>
          <Card title="My revenue vs. expenses" className="chart-card">
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
                  title: "Receivable",
                  dataIndex: "receivable",
                  render: money,
                  responsive: ["md"],
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
