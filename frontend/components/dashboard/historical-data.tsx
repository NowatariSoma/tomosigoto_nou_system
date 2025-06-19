'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/forms/button';
import { Input } from '@/components/ui/inputs/input';
import { Label } from '@/components/ui/inputs/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/inputs/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/data-display/table';
import { Download, Search, Calendar } from 'lucide-react';
import { historical } from '@/lib/api';
import { aggregateData, exportToCSV } from '@/lib/data-processing';
import type { HistoricalData, AggregatedData } from '@/types/worker';

export function HistoricalData() {
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
  const [interval, setInterval] = useState('60'); // minutes

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

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historical Data Analysis
          </div>
          <Button
            onClick={handleExport}
            disabled={data.length === 0}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[120px]">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="min-w-[140px]">
            <Label>Interval</Label>
            <Select value={interval} onValueChange={setInterval}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="720">12 hours</SelectItem>
                <SelectItem value="1440">1 day</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchHistoricalData} disabled={isLoading}>
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? 'Loading...' : 'Search'}
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time Period</TableHead>
                <TableHead className="text-center">Readings</TableHead>
                <TableHead className="text-center text-red-600">Red</TableHead>
                <TableHead className="text-center text-yellow-600">Other</TableHead>
                <TableHead className="text-center text-gray-600">No Helmet</TableHead>
                <TableHead className="text-center font-semibold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No data available for the selected period
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {new Date(item.timeRange).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">{item.totalReadings}</TableCell>
                    <TableCell className="text-center">{item.averageCounts.red}</TableCell>
                    <TableCell className="text-center">{item.averageCounts.other}</TableCell>
                    <TableCell className="text-center">{item.averageCounts.no_helmet}</TableCell>
                    <TableCell className="text-center font-semibold">{item.averageCounts.total}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}