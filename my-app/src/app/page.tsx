'use client'

import { useState, useEffect, useRef } from 'react'
import { Logo } from '@/components/Logo'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'

const DynamicBarChart = dynamic(() => import('@/components/DynamicBarChart'), { ssr: false })
const DynamicAreaChart = dynamic(() => import('@/components/DynamicAreaChart'), { ssr: false })

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessages, setStatusMessages] = useState<string[]>([])
  const ws = useRef<WebSocket | null>(null)
  const statusEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8000/ws')
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.status) {
        setStatusMessages((prev) => [...prev, data.status])
      }
    }

    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [])

  useEffect(() => {
    statusEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [statusMessages])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile)
        setUploadStatus('')
      } else {
        setFile(null)
        setUploadStatus('Please select a PDF file')
      }
    }
  }

  const handleUpload = async () => {
    if (file) {
      setIsLoading(true)
      setStatusMessages([])
      setAnalysisResult(null)
      const formData = new FormData()
      formData.append('file', file)
      try {
        const response = await fetch('http://localhost:8000/upload', {
          method: 'POST',
          body: formData,
        })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setUploadStatus(`File analyzed successfully`)
        setAnalysisResult(data)
      } catch (error) {
        console.error('Error uploading file:', error)
        setUploadStatus('Error analyzing file')
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <main className="container mx-auto py-16 px-4">
      <Logo />
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Upload Medical Report (PDF only)</h2>
          <Input type="file" accept=".pdf" onChange={handleFileChange} className="mb-4" />
          <Button onClick={handleUpload} disabled={!file || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Upload and Analyze'
            )}
          </Button>
          {uploadStatus && <p className="mt-2">{uploadStatus}</p>}
        </CardContent>
      </Card>

      {statusMessages.length > 0 && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Analysis Progress</h2>
            <div className="bg-gray-100 p-4 rounded-md h-64 overflow-y-auto">
              {statusMessages.map((message, index) => (
                <div key={index} className="mb-2">
                  {message}
                </div>
              ))}
              <div ref={statusEndRef} />
            </div>
          </CardContent>
        </Card>
      )}
      {analysisResult && (
        <>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Analysis Summary</h2>
              <p>{analysisResult.summary}</p>
            </CardContent>
          </Card>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Abnormal Results</h2>
              <ul>
                {analysisResult.abnormal_results.map((result: any, index: number) => (
                  <li key={index} className="mb-2">
                    <strong>{result.test_name}:</strong> {result.value} (Normal Range: {result.reference_range})
                    <br />
                    <em>{result.interpretation}</em>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Recommendations</h2>
              <ul>
                {analysisResult.recommendations.map((recommendation: string, index: number) => (
                  <li key={index} className="mb-2">{recommendation}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Charts</h2>
              {analysisResult.charts.map((chart: any, index: number) => (
                <div key={index} className="mb-8">
                  {chart.chart_type === 'bar' && (
                    <DynamicBarChart
                      chartData={chart.data}
                      title={chart.title}
                      description={`Showing ${chart.title} data`}
                    />
                  )}
                  {chart.chart_type === 'area' && (
                    <DynamicAreaChart
                      chartData={chart.data}
                      title={chart.title}
                      description={`Showing ${chart.title} data`}
                      xAxisKey={chart.x_axis_key}
                      dataKeys={chart.data_keys}
                      trendPercentage={chart.trend_percentage}
                      dateRange={chart.date_range}
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </main>
  )
}