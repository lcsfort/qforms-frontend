"use client";

import "./chartSetup";
import { Doughnut } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { ChartCard } from "./ChartCard";

interface DonutChartCardProps {
  title: string;
  subtitle?: string;
  data: ChartData<"doughnut", number[], string>;
  empty?: boolean;
  emptyLabel?: string;
}

const options: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        color: "#6B7280",
        boxWidth: 12,
      },
    },
  },
  cutout: "65%",
};

export function DonutChartCard({ title, subtitle, data, empty, emptyLabel }: DonutChartCardProps) {
  return (
    <ChartCard title={title} subtitle={subtitle} empty={empty} emptyLabel={emptyLabel}>
      <div className="h-64">
        <Doughnut data={data} options={options} />
      </div>
    </ChartCard>
  );
}

