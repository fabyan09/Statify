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

interface ReleasesByYearChartProps {
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

export function ReleasesByYearChart({ data }: ReleasesByYearChartProps) {
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
          <CardTitle>Releases by Year</CardTitle>
          <CardDescription>
            Number of releases per year across all types
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
              <linearGradient id="fillSingles" x1="0" y1="0" x2="0" y2="1">
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
              <linearGradient id="fillAlbums" x1="0" y1="0" x2="0" y2="1">
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
              <linearGradient id="fillCompilations" x1="0" y1="0" x2="0" y2="1">
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
              dataKey="compilations"
              type="natural"
              fill="url(#fillCompilations)"
              stroke="var(--color-compilations)"
              stackId="a"
            />
            <Area
              dataKey="albums"
              type="natural"
              fill="url(#fillAlbums)"
              stroke="var(--color-albums)"
              stackId="a"
            />
            <Area
              dataKey="singles"
              type="natural"
              fill="url(#fillSingles)"
              stroke="var(--color-singles)"
              stackId="a"
            />
            <ChartLegend content={(props) => <ChartLegendContent payload={props.payload} verticalAlign={props.verticalAlign} />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
