'use client'

import { useState } from 'react'
import { Charts } from '../components/Charts'
import { Logo } from '../components/Logo'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import dynamic from 'next/dynamic'

const DynamicChart = dynamic(() => import('../components/DynamicChart'), { ssr: false })

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [analysisResult, setAnalysisResult] = useState<any>(null)

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
          <Button onClick={handleUpload} disabled={!file}>Upload and Analyze</Button>
          {uploadStatus && <p className="mt-2">{uploadStatus}</p>}
        </CardContent>
      </Card>
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
                  <h3 className="text-xl font-semibold mb-2">{chart.title}</h3>
                  <DynamicChart type={chart.chart_type} data={chart.data} />
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </main>
  )
}