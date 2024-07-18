'use client'

import { useState, useEffect } from 'react'
import { Charts } from '../components/Charts'
import { Logo } from '../components/Logo'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'

export default function Home() {
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [pdfContent, setPdfContent] = useState('')

  useEffect(() => {
    fetch('http://localhost:8000/')
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => console.error('Error:', error))
  }, [])

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
        setUploadStatus(`File uploaded successfully: ${data.filename}`)
        setPdfContent(data.content)
      } catch (error) {
        console.error('Error uploading file:', error)
        setUploadStatus('Error uploading file')
      }
    }
  }

  return (
    <main className="container mx-auto py-16 px-4">
      <Logo />
      <div className="mt-8 mb-16">
        <h2 className="text-2xl font-bold">Backend Response:</h2>
        <p>{message}</p>
      </div>
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Upload Medical Report (PDF only)</h2>
          <Input type="file" accept=".pdf" onChange={handleFileChange} className="mb-4" />
          <Button onClick={handleUpload} disabled={!file}>Upload</Button>
          {uploadStatus && <p className="mt-2">{uploadStatus}</p>}
        </CardContent>
      </Card>
      {pdfContent && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">PDF Content</h2>
            <div className="max-h-96 overflow-y-auto bg-gray-100 p-4 rounded">
              <pre>{pdfContent}</pre>
            </div>
          </CardContent>
        </Card>
      )}
      <Charts />
    </main>
  )
}