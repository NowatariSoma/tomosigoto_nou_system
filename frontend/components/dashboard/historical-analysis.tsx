'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/inputs/select';
import { Download, Calendar, BarChart3, Search, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { historical } from '@/lib/api';
import { aggregateData, exportToCSV } from '@/lib/data-processing';
import type { HistoricalData, AggregatedData } from '@/types/worker';

export function HistoricalAnalysis() {
  const [data, setData] = useState<AggregatedData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Default to last 7 days
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [interval, setInterval] = useState('30'); // minutes

  const fetchHistoricalData = async () => {
    setIsLoading(true);
    try {
      const rawData: HistoricalData[] = await historical.getHistoricalData(startDate, endDate);
      const aggregated = aggregateData(rawData, parseInt(interval));
      setData(aggregated);
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const filename = `worker-data-${startDate}-to-${endDate}.csv`;
    exportToCSV(data, filename);
  };

  useEffect(() => {
    fetchHistoricalData();
  }, []);

  // Prepare chart data
  const chartData = data.map((item) => {
    return {
      time: new Date(item.timeRange).toLocaleDateString('ja-JP', { 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      red: item.averageCounts.red,
      other: item.averageCounts.other,
      no_helmet: item.averageCounts.no_helmet,
      total: item.averageCounts.total,
    };
  });

  // Calculate summary statistics
  const totalDataPoints = data.length;
  const averageTotal = data.length > 0 ? Math.round(data.reduce((sum, item) => sum + item.averageCounts.total, 0) / data.length) : 0;
  const maxTotal = data.length > 0 ? Math.max(...data.map(item => item.averageCounts.total)) : 0;
  const minTotal = data.length > 0 ? Math.min(...data.map(item => item.averageCounts.total)) : 0;

  return (
    <div className="w-full animate-fade-in">
      {/* Search Controls */}
      <Card className="card-elevated mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-gray-80">
            <Calendar className="h-5 w-5" />
            <span>検索条件</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="start-date" className="text-gray-70 font-medium">開始日</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-gray-70 font-medium">終了日</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-70 font-medium">集計間隔</Label>
              <Select value={interval} onValueChange={setInterval}>
                <SelectTrigger className="input-field mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10分</SelectItem>
                  <SelectItem value="30">30分</SelectItem>
                  <SelectItem value="60">1時間</SelectItem>
                  <SelectItem value="720">12時間</SelectItem>
                  <SelectItem value="1440">24時間</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={fetchHistoricalData} 
                disabled={isLoading}
                className="btn-primary flex-1"
              >
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? '検索中...' : '検索'}
              </Button>
              <Button
                onClick={handleExport}
                disabled={data.length === 0}
                className="btn-secondary"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Chart */}
      <Card className="card-elevated">
        <CardHeader className="pb-4">
          <CardTitle className="text-gray-80">作業員数推移</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[50vh]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12, fill: '#666' }}
                  stroke="#ccc"
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#666' }}
                  stroke="#ccc"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="red" 
                  stroke="#f83e3e" 
                  strokeWidth={2}
                  name="赤ヘルメット"
                  dot={{ fill: '#f83e3e', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="other" 
                  stroke="#ffd338" 
                  strokeWidth={2}
                  name="その他"
                  dot={{ fill: '#ffd338', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="no_helmet" 
                  stroke="#999999" 
                  strokeWidth={2}
                  name="未装着"
                  dot={{ fill: '#999999', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#333333" 
                  strokeWidth={3}
                  name="総計"
                  dot={{ fill: '#333333', strokeWidth: 2, r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 