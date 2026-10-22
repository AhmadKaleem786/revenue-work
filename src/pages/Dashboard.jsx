import React, { useMemo, useState } from "react";
import { Button, Card, Col, Row, Segmented, Table, Tag } from "antd";
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
import { isCompanyTransaction, transactionTotals } from "../utils/finance";
import { ownedAmount, ownershipShare } from "../utils/ownership";

export default function Dashboard() {
  const projects = useSelector((s) => s.projects);
  const expenses = useSelector((s) => s.expenses);
  const centers = useSelector((s) => s.costCenters);
  const statuses = useSelector((s) => s.projectStatuses) || [];
  const user = useSelector((s) => s.auth);
  const [financialView, setFinancialView] = useState("share");
  const showShare = financialView === "share";
  const viewLabel = showShare ? "My" : "Total";
  const companyEntries = useMemo(
    () => expenses.filter(isCompanyTransaction),
    [expenses],
  );
  const company = useMemo(
    () => transactionTotals(companyEntries),
    [companyEntries],
  );
  const rows = useMemo(
    () =>
      projects.map((project) => {
        const entries = expenses.filter(
          (entry) =>
            !isCompanyTransaction(entry) && entry.projectId === project.id,
        );
        const totals = transactionTotals(entries);
        const display = (amount) =>
          showShare ? ownedAmount(amount, project) : amount;
        return {
          ...project,
          share: ownershipShare(project),
          revenue: display(totals.revenue),
          receivable: display(totals.receivable),
          expenseTotal: display(totals.expenses),
          netIncome: display(totals.netIncome),
        };
      }),
    [expenses, projects, showShare],
  );
  const rev =
    rows.reduce((sum, project) => sum + project.revenue, 0) + company.revenue;
  const expenseTotal =
    rows.reduce((sum, project) => sum + project.expenseTotal, 0) +
    company.expenses;
  const receivable =
    rows.reduce((sum, project) => sum + project.receivable, 0) +
    company.receivable;
  const netIncome =
    rows.reduce((sum, project) => sum + project.netIncome, 0) +
    company.netIncome;
  const chart = [
    ...rows.map((project) => ({
      name: project.name,
      revenue: project.revenue,
      expenses: project.expenseTotal,
      receivable: project.receivable,
    })),
    ...(companyEntries.length
      ? [
          {
            name: "Company",
            revenue: company.revenue,
            expenses: company.expenses,
            receivable: company.receivable,
          },
        ]
      : []),
  ];
  const overviewRows = [
    ...(companyEntries.length
      ? [
          {
            id: "company",
            name: "Company",
            receivable: company.receivable,
            netIncome: company.netIncome,
            isCompany: true,
          },
        ]
      : []),
    ...rows.slice(0, 5),
  ];
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
              "Financial view": showShare ? "My share" : "Total",
              [`${viewLabel} Revenue`]: rev,
              [`${viewLabel} Receivable`]: receivable,
              [`${viewLabel} Expenses`]: expenseTotal,
              [`${viewLabel} Net Income`]: netIncome,
              "Company Revenue": company.revenue,
              "Company Receivable": company.receivable,
              "Company Expenses": company.expenses,
              "Company Net Income": company.netIncome,
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
            [`${viewLabel} Revenue`]: project.revenue,
            [`${viewLabel} Receivable`]: project.receivable,
            [`${viewLabel} Expenses`]: project.expenseTotal,
            [`${viewLabel} Net Income`]: project.netIncome,
          })),
        },
        {
          name: "Transactions",
          rows: expenses.map((expense) => ({
            Date: expense.date || "",
            Scope: isCompanyTransaction(expense) ? "Company" : "Project",
            Project: isCompanyTransaction(expense)
              ? "Company"
              : projects.find((project) => project.id === expense.projectId)
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
      <div className="financial-view-control">
        <span>
          {showShare
            ? "Project figures use your ownership share. Company transactions are counted in full."
            : "Project figures use the full amount of every project. Company transactions are counted in full."}
        </span>
        <Segmented
          value={financialView}
          onChange={setFinancialView}
          options={[
            { label: "My share", value: "share" },
            { label: "Total", value: "full" },
          ]}
        />
      </div>
      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12}>
          <StatCard title="Total projects" value={projects.length} icon={<FolderKanban />} />
        </Col>
        <Col xs={24} sm={12}>
          <StatCard title={`${viewLabel} net income`} value={money(netIncome)} icon={<Wallet />} color="purple" />
        </Col>
      </Row>
      <Row gutter={[20, 20]} className="section">
        <Col xs={24} sm={8}>
          <StatCard title={`${viewLabel} revenue`} value={money(rev)} icon={<Banknote />} color="green" />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title={`${viewLabel} receivable`} value={money(receivable)} icon={<Clock3 />} color="orange" />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title={`${viewLabel} expenses`} value={money(expenseTotal)} icon={<TrendingDown />} color="orange" />
        </Col>
      </Row>
      <Row gutter={[20, 20]} className="section">
        <Col xs={24} xl={12}>
          <Card title={`${viewLabel} revenue vs. expenses`} className="chart-card">
            {chart.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chart}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => money(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#1677ff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ff9c6e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="receivable" name="Receivable" fill="#faad14" radius={[4, 4, 0, 0]} />
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
              dataSource={overviewRows}
              rowKey="id"
              pagination={false}
              locale={{
                emptyText: <EmptyState title="No projects yet" description="Your projects will appear here." />,
              }}
              columns={[
                {
                  title: "Project",
                  dataIndex: "name",
                  sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
                  render: (value, record) =>
                    record.isCompany ? (
                      <Link to="/company-transactions">{value}</Link>
                    ) : (
                      <Link to={`/projects/${record.id}`}>{value}</Link>
                    ),
                },
                {
                  title: `${viewLabel} receivable`,
                  dataIndex: "receivable",
                  sorter: (a, b) => a.receivable - b.receivable,
                  render: money,
                  responsive: ["md"],
                },
                {
                  title: `${viewLabel} net income`,
                  dataIndex: "netIncome",
                  sorter: (a, b) => a.netIncome - b.netIncome,
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
