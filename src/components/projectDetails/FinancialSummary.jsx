import React from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import { StatCard, money } from "../UI";

export function FinancialSummary({ viewLabel, revenue, expenses, receivable, netIncome }) {
  const cards = [
    { title: `${viewLabel} revenue`, value: revenue, icon: <Plus />, color: "green" },
    { title: `${viewLabel} expenses`, value: expenses, icon: <Trash2 />, color: "orange" },
    { title: `${viewLabel} receivable`, value: receivable, icon: <Download />, color: "orange" },
    { title: `${viewLabel} net income`, value: netIncome, icon: <Plus />, color: "purple" },
  ];

  return (
    <div className="stats-row">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} value={money(card.value)} />
      ))}
    </div>
  );
}
