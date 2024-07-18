import React, { useState, useMemo, useEffect } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const DynamicBarChart = ({ chartData, title, description }) => {
  const [activeMetric, setActiveMetric] = useState('')

  const metrics = useMemo(() => {
    if (chartData.length === 0) return []
    return Object.keys(chartData[0]).filter(key => key !== 'label')
  }, [chartData])

  const totals = useMemo(() => {
    return metrics.reduce((acc, metric) => {
      acc[metric] = chartData.reduce((sum, dataPoint) => sum + (dataPoint[metric] || 0), 0)
      return acc
    }, {})
  }, [chartData, metrics])

  const chartConfig = useMemo(() => {
    return metrics.reduce((config, metric, index) => {
      config[metric] = {
        label: metric,
        color: `hsl(var(--chart-${index + 1}))`
      }
      return config
    }, {})
  }, [metrics])

  useEffect(() => {
    if (metrics.length > 0 && !activeMetric) {
      setActiveMetric(metrics[0])
    }
  }, [metrics, activeMetric])

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex">
          {metrics.map((metric) => (
            <button
              key={metric}
              data-active={activeMetric === metric}
              className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
              onClick={() => setActiveMetric(metric)}
            >
              <span className="text-xs text-muted-foreground">
                {chartConfig[metric].label}
              </span>
              <span className="text-lg font-bold leading-none sm:text-3xl">
                {totals[metric].toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background p-2 shadow rounded">
                      <p className="font-bold">{label}</p>
                      <p>{`${activeMetric}: ${payload[0].value}`}</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar
              dataKey={activeMetric}
              fill={chartConfig[activeMetric]?.color || 'hsl(var(--chart-1))'}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default DynamicBarChart