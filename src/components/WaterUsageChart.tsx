import React from "react";
import { Droplets } from "lucide-react";
import { SupportedLanguage } from "@/App";

interface WaterUsageData {
  name: string;
  current: number | string | null | undefined;
  recommended: number | string | null | undefined;
}

interface WaterUsageChartProps {
  data: WaterUsageData[];
  language: SupportedLanguage | "en" | "hi";
}

const labels = {
  en: {
    title: "Water Usage Summary",
    current: "Current Usage",
    recommended: "Recommended Usage",
    saved: "Estimated Savings",
    empty: "Water usage data is not available yet.",
  },
  hi: {
    title: "जल उपयोग सारांश",
    current: "वर्तमान उपयोग",
    recommended: "अनुशंसित उपयोग",
    saved: "अनुमानित बचत",
    empty: "जल उपयोग डेटा अभी उपलब्ध नहीं है।",
  },
};

const parseWaterAmount = (value: WaterUsageData["current"]): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
    if (match) {
      const parsed = Number(match[0]);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }

  return null;
};

const formatLiters = (value: number | null): string => {
  if (value === null) {
    return "-";
  }

  return `${Math.round(value).toLocaleString()} L`;
};

const WaterUsageChart: React.FC<WaterUsageChartProps> = ({ data, language }) => {
  const normalizedLanguage: "en" | "hi" = language === "hi" ? "hi" : "en";
  const activeLabels = labels[normalizedLanguage];
  const rows = (Array.isArray(data) ? data : [])
    .map((item) => {
      const current = parseWaterAmount(item.current);
      const recommended = parseWaterAmount(item.recommended);

      return {
        name: item.name,
        current,
        recommended,
        savings:
          current !== null && recommended !== null
            ? Math.max(current - recommended, 0)
            : null,
      };
    })
    .filter((item) => item.current !== null || item.recommended !== null);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-water/20 bg-water/5 p-5 text-center text-muted-foreground">
        {activeLabels.empty}
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-water/20 bg-white p-5 shadow-sm dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-2 text-water-dark">
        <Droplets className="h-5 w-5 text-water" />
        <h3 className="text-lg font-semibold">{activeLabels.title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="py-3 pr-4 font-medium"></th>
              <th className="py-3 pr-4 font-medium">{activeLabels.current}</th>
              <th className="py-3 pr-4 font-medium">
                {activeLabels.recommended}
              </th>
              <th className="py-3 font-medium">{activeLabels.saved}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.name} className="border-b last:border-0">
                <td className="py-3 pr-4 font-medium text-foreground">
                  {item.name}
                </td>
                <td className="py-3 pr-4">{formatLiters(item.current)}</td>
                <td className="py-3 pr-4">{formatLiters(item.recommended)}</td>
                <td className="py-3 text-green-700 dark:text-green-300">
                  {formatLiters(item.savings)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default WaterUsageChart;
