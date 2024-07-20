'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Upload, FileText, Activity, ListChecks } from 'lucide-react';
import dynamic from 'next/dynamic';

const DynamicBarChart = dynamic(() => import('@/components/DynamicBarChart'), { ssr: false });
const DynamicAreaChart = dynamic(() => import('@/components/DynamicAreaChart'), { ssr: false });

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessages, setStatusMessages] = useState([]);
  const ws = useRef(null);
  const statusEndRef = useRef(null);


  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8000/ws');
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status) {
        setStatusMessages((prev) => [...prev, data.status]);
      }
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  useEffect(() => {
    statusEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [statusMessages]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setUploadStatus('');
      } else {
        setFile(null);
        setUploadStatus('Please select a PDF file');
      }
    }
  };

  const handleUpload = async () => {
    if (file) {
      setIsLoading(true);
      setStatusMessages([]);
      setAnalysisResult(null);
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await fetch('http://localhost:8000/upload', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setUploadStatus(`File analyzed successfully`);
        setAnalysisResult(data);
      } catch (error) {
        console.error('Error uploading file:', error);
        setUploadStatus('Error analyzing file');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-4xl font-extrabold text-indigo-600 tracking-tight">
            Health<span className="text-gray-900">sync</span>
          </h1>
          <p className="text-gray-500 text-lg">Your personal health dashboard</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-12">
          <section>
            <Card className="overflow-hidden shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Upload Your Medical Report</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-indigo-300 border-dashed rounded-xl cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition duration-300 ease-in-out">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-12 h-12 mb-4 text-indigo-500" />
                        <p className="mb-2 text-xl font-semibold text-gray-700">Drop your file here</p>
                        <p className="text-sm text-gray-500">or click to select (PDF only, max 10MB)</p>
                      </div>
                      <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept=".pdf" />
                    </label>
                  </div>
                  {file && <p className="text-sm text-gray-600">Selected: {file.name}</p>}
                  <Button 
                    onClick={handleUpload} 
                    disabled={!file || isLoading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Upload and Analyze'
                    )}
                  </Button>
                </div>
                {uploadStatus && <p className="mt-4 text-sm font-medium text-indigo-600">{uploadStatus}</p>}
              </CardContent>
            </Card>
          </section>

          {statusMessages.length > 0 && (
            <section>
              <Card className="overflow-hidden shadow-lg">
                <CardContent className="p-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                    <Activity className="w-8 h-8 mr-3 text-indigo-500" />
                    Analysis Progress
                  </h2>
                  <div className="bg-indigo-50 p-6 rounded-lg h-64 overflow-y-auto">
                    {statusMessages.map((message, index) => (
                      <div key={index} className="mb-3 text-sm text-gray-700 flex items-start">
                        <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 mr-3"></div>
                        {message}
                      </div>
                    ))}
                    <div ref={statusEndRef} />
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {analysisResult && (
            <>
              <section>
                <Card className="overflow-hidden shadow-lg">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                      <FileText className="w-8 h-8 mr-3 text-indigo-500" />
                      Analysis Summary
                    </h2>
                    <p className="text-gray-700 text-lg leading-relaxed">{analysisResult.summary}</p>
                  </CardContent>
                </Card>
              </section>

              <section>
                <Card className="overflow-hidden shadow-lg">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                      <Activity className="w-8 h-8 mr-3 text-indigo-500" />
                      Abnormal Results
                    </h2>
                    <ul className="space-y-4">
                      {analysisResult.abnormal_results.map((result, index) => (
                        <li key={index} className="border-b border-indigo-100 pb-4">
                          <h3 className="text-xl font-semibold text-indigo-600 mb-2">{result.test_name}</h3>
                          <p className="text-gray-700">
                            Value: <span className="font-medium">{result.value}</span>
                            <span className="mx-2">|</span>
                            Normal Range: <span className="font-medium">{result.reference_range}</span>
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{result.interpretation}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>

              <section>
                <Card className="overflow-hidden shadow-lg">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                      <ListChecks className="w-8 h-8 mr-3 text-indigo-500" />
                      Recommendations
                    </h2>
                    <ul className="space-y-3">
                      {analysisResult.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-3 mt-0.5">
                            <span className="text-indigo-600 font-semibold text-sm">{index + 1}</span>
                          </div>
                          <p className="text-gray-700">{recommendation}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>

              <section>
                <Card className="overflow-hidden shadow-lg">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Statistics</h2>
                    {analysisResult.charts.map((chart, index) => (
                      <div key={index} className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">{chart.title}</h3>
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
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}