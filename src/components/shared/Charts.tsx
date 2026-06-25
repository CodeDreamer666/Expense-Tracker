"use client";

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/money";

const colors = ["#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981", "#f43f5e", "#6366f1", "#14b8a6"];

export function ChartCard({
  title,
  detail,
  children,
}: {
  title: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <article className="min-h-80 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
      <h2 className="text-base font-black tracking-tight text-slate-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">{detail}</p>
      {children}
    </article>
  );
}

export function BudgetUsedChart({
  spent,
  remaining,
  percent,
  tone,
}: {
  spent: number;
  remaining: number;
  percent: number;
  tone: string;
}) {
  const data = [
    { name: "Spent", value: spent, fill: tone },
    { name: "Remaining", value: Math.max(0, remaining), fill: "#e2e8f0" },
  ];

  return (
    <div className="flex min-h-56 flex-col items-center gap-4 pt-4 sm:flex-row">
      <div className="h-52 w-full sm:w-3/5">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={52}
              outerRadius={75}
              paddingAngle={3}
            >
              {data.map((item) => (
                <Cell
                  key={item.name}
                  fill={item.fill}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatMoney(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full text-sm sm:w-2/5">
        <b className="mb-3 block text-lg font-black text-slate-950">
          {percent.toFixed(0)}% used
        </b>
        <p className="flex items-center gap-2 py-1 text-slate-500">
          <i
            className="size-2 rounded-full"
            style={{ background: tone }}
          />
          Spent
          <strong className="ml-auto text-slate-950">{formatMoney(spent)}</strong>
        </p>
        <p className="flex items-center gap-2 py-1 text-slate-500">
          <i className="size-2 rounded-full bg-slate-200" />
          Remaining
          <strong className="ml-auto text-slate-950">
            {formatMoney(Math.max(0, remaining))}
          </strong>
        </p>
      </div>
    </div>
  );
}

export function CategoryChart({ data }: { data: { name: string; amount: number }[] }) {
  return (
    <div className="mt-3 h-56">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            innerRadius={48}
            outerRadius={78}
          >
            {data.map((item, i) => (
              <Cell
                key={item.name}
                fill={colors[i % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatMoney(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DailyChart({ data }: { data: { day: number; amount: number }[] }) {
  return (
    <div className="mt-3 h-56">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart data={data}>
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            width={45}
            tickFormatter={(value) => `$${value}`}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value) => formatMoney(Number(value))}
            labelFormatter={(day) => `Day ${day}`}
          />
          <Bar
            dataKey="amount"
            fill="#0ea5e9"
            radius={[5, 5, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
