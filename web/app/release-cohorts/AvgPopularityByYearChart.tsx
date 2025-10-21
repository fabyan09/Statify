"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

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

interface AvgPopularityByYearChartProps {
  data: CohortData[];
}

const chartConfig = {
  avgPopularity: {
    label: "Average Popularity",
    color: "#10b981", // Vert émeraude
  },
} satisfies ChartConfig

export function AvgPopularityByYearChart({ data }: AvgPopularityByYearChartProps) {
  const [timeRange, setTimeRange] = React.useState("all")

  const filteredData = React.useMemo(() => {
    if (timeRange === "all") return data

    const currentYear = new Date().getFullYear()
    let yearsToShow = 10

    if (timeRange === "5y") {
      yearsToShow = 5
    } else if (timeRange === "10y") {
      yearsToShow = 10
    } else if (timeRange === "20y") {
      yearsToShow = 20
    }

    return data.filter((item) => {
      const year = parseInt(item.period)
      return year >= currentYear - yearsToShow
    })
  }, [data, timeRange])

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Average Popularity by Year</CardTitle>
          <CardDescription>
            How popularity trends over time
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select a time range"
          >
            <SelectValue placeholder="All time" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">
              All time
            </SelectItem>
            <SelectItem value="20y" className="rounded-lg">
              Last 20 years
            </SelectItem>
            <SelectItem value="10y" className="rounded-lg">
              Last 10 years
            </SelectItem>
            <SelectItem value="5y" className="rounded-lg">
              Last 5 years
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
              <linearGradient id="fillAvgPopularity" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-avgPopularity)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-avgPopularity)"
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
            />
            <YAxis
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => `Year ${value}`}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="avgPopularity"
              type="natural"
              fill="url(#fillAvgPopularity)"
              stroke="var(--color-avgPopularity)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
