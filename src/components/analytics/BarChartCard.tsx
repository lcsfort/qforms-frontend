"use client";

import "./chartSetup";
import { Bar } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { useMemo } from "react";
import { ChartCard } from "./ChartCard";

interface BarLegendItem {
  key: string;
  color: string;
  label: string;
  value?: string;
}

interface BarChartCardProps {
  title: string;
  subtitle?: string;
  data: ChartData<"bar", number[], string>;
  empty?: boolean;
  emptyLabel?: string;
  hideXAxisLabels?: boolean;
  legendItems?: BarLegendItem[];
}

const baseOptions: ChartOptions<"bar"> = {
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
};

export function BarChartCard({
  title,
  subtitle,
  data,
  empty,
  emptyLabel,
  hideXAxisLabels = false,
  legendItems = [],
}: BarChartCardProps) {
  const options = useMemo<ChartOptions<"bar">>(
    () => ({
      ...baseOptions,
      scales: {
        ...baseOptions.scales,
        x: {
          ...(baseOptions.scales?.x ?? {}),
          ticks: {
            ...(baseOptions.scales?.x &&
            typeof baseOptions.scales.x === "object" &&
            "ticks" in baseOptions.scales.x
              ? (baseOptions.scales.x.ticks ?? {})
              : {}),
            display: !hideXAxisLabels,
          },
        },
      },
    }),
    [hideXAxisLabels],
  );

  return (
    <ChartCard title={title} subtitle={subtitle} empty={empty} emptyLabel={emptyLabel}>
      <div className="h-64">
        <Bar data={data} options={options} />
      </div>
      {legendItems.length > 0 ? (
        <div className="mt-4 space-y-2">
          {legendItems.map((item) => (
            <div
              key={item.key}
              className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
            >
              <div className="flex items-start gap-2 min-w-0">
                <span
                  className="mt-1 inline-block h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-xs text-[var(--foreground)] break-words">{item.label}</p>
              </div>
              {item.value ? (
                <span className="text-xs text-[var(--muted)] shrink-0">{item.value}</span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </ChartCard>
  );
}

