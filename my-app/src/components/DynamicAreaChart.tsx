'use client'

import React from 'react'
import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, ResponsiveContainer } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface DynamicAreaChartProps {
  chartData: Array<{ [key: string]: number | string }>
  title: string
  description: string
  xAxisKey: string
  dataKeys: string[]
  trendPercentage?: number
  dateRange?: string
}

const DynamicAreaChart: React.FC<DynamicAreaChartProps> = ({
  chartData,
  title,
  description,
  xAxisKey,
  dataKeys,
  trendPercentage,
  dateRange,
}) => {
  const chartConfig: ChartConfig = dataKeys.reduce((config, key, index) => {
    config[key] = {
      label: key,
      color: `hsl(var(--chart-${index + 1}))`,
    }
    return config
  }, {} as ChartConfig)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={chartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => typeof value === 'string' ? value.slice(0, 3) : value}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              {dataKeys.map((key, index) => (
                <Area
                  key={key}
                  dataKey={key}
                  type="natural"
                  fill={`var(--color-${key})`}
                  fillOpacity={0.4}
                  stroke={`var(--color-${key})`}
                  stackId="a"
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            {trendPercentage && (
              <div className="flex items-center gap-2 font-medium leading-none">
                Trending {trendPercentage > 0 ? 'up' : 'down'} by {Math.abs(trendPercentage)}% this month 
                <TrendingUp className="h-4 w-4" />
              </div>
            )}
            {dateRange && (
              <div className="flex items-center gap-2 leading-none text-muted-foreground">
                {dateRange}
              </div>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

export default DynamicAreaChart