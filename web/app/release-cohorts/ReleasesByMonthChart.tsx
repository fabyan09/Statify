"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CohortData {
  period: string;
  releases: number;
  avgPopularity: number;
  singles: number;
  albums: number;
  compilations: number;
}

interface ReleasesByMonthChartProps {
  data: CohortData[];
}

const chartConfig = {
  singles: {
    label: "Singles",
    color: "#3b82f6", // Bleu vif
  },
  albums: {
    label: "Albums",
    color: "#8b5cf6", // Violet
  },
  compilations: {
    label: "Compilations",
    color: "#ec4899", // Rose
  },
} satisfies ChartConfig

export function ReleasesByMonthChart({ data }: ReleasesByMonthChartProps) {
  const [timeRange, setTimeRange] = React.useState("36m")

  const filteredData = React.useMemo(() => {
    let monthsToShow = 36

    if (timeRange === "12m") {
      monthsToShow = 12
    } else if (timeRange === "24m") {
      monthsToShow = 24
    } else if (timeRange === "36m") {
      monthsToShow = 36
    }

    return data.slice(-monthsToShow)
  }, [data, timeRange])

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Releases by Month</CardTitle>
          <CardDescription>
            Monthly release patterns over time
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select a time range"
          >
            <SelectValue placeholder="Last 3 years" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="36m" className="rounded-lg">
              Last 3 years
            </SelectItem>
            <SelectItem value="24m" className="rounded-lg">
              Last 2 years
            </SelectItem>
            <SelectItem value="12m" className="rounded-lg">
              Last year
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[350px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillSinglesMonth" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-singles)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-singles)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillAlbumsMonth" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-albums)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-albums)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillCompilationsMonth" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-compilations)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-compilations)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="period"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const [year, month] = value.split("-")
                const date = new Date(parseInt(year), parseInt(month) - 1)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  year: "2-digit",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const [year, month] = value.toString().split("-")
                    const date = new Date(parseInt(year), parseInt(month) - 1)
                    return date.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="compilations"
              type="natural"
              fill="url(#fillCompilationsMonth)"
              stroke="var(--color-compilations)"
              stackId="a"
            />
            <Area
              dataKey="albums"
              type="natural"
              fill="url(#fillAlbumsMonth)"
              stroke="var(--color-albums)"
              stackId="a"
            />
            <Area
              dataKey="singles"
              type="natural"
              fill="url(#fillSinglesMonth)"
              stroke="var(--color-singles)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
