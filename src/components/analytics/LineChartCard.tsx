"use client";

import "./chartSetup";
import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { ChartCard } from "./ChartCard";

interface LineChartCardProps {
  title: string;
  subtitle?: string;
  data: ChartData<"line", number[], string>;
  empty?: boolean;
  emptyLabel?: string;
}

const options: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#6B7280" },
    },
    y: {
      beginAtZero: true,
      ticks: { color: "#6B7280", precision: 0 },
      grid: { color: "rgba(107,114,128,0.15)" },
    },
  },
  elements: {
    line: {
      tension: 0.3,
      borderWidth: 2,
    },
    point: {
      radius: 2,
      hoverRadius: 4,
    },
  },
};

export function LineChartCard({ title, subtitle, data, empty, emptyLabel }: LineChartCardProps) {
  return (
    <ChartCard title={title} subtitle={subtitle} empty={empty} emptyLabel={emptyLabel}>
      <div className="h-64">
        <Line data={data} options={options} />
      </div>
    </ChartCard>
  );
}

