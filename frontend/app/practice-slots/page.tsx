'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';

interface ScheduleItem {
  time: string;
  duration?: string;
  activity: string;
  columns: string[];
}

const scheduleData: ScheduleItem[] = [
  {
    time: '19:00',
    duration: '(5)',
    activity: '集合・挨拶',
    columns: ['', '', '', '', '']
  },
  {
    time: '19:05',
    duration: '(10)',
    activity: '女子準備',
    columns: ['', '男子準備', '', '', '']
  },
  {
    time: '19:05',
    duration: '(20)',
    activity: '○○パート\n××パート\n△△パート',
    columns: [
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート'
    ]
  },
  {
    time: '19:35',
    duration: '(15)',
    activity: '○○パート\n××パート\n△△パート',
    columns: [
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート'
    ]
  },
  {
    time: '19:50',
    duration: '(20)',
    activity: '○○パート\n××パート\n△△パート',
    columns: [
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート'
    ]
  },
  {
    time: '20:10',
    duration: '(15)',
    activity: '○○パート\n××パート\n△△パート',
    columns: [
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート'
    ]
  },
  {
    time: '20:25',
    duration: '(20)',
    activity: '○○パート\n××パート\n△△パート',
    columns: [
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート',
      '○○パート\n××パート\n△△パート'
    ]
  },
  {
    time: '20:45',
    duration: '',
    activity: '集合・整上坊・挨拶',
    columns: ['', '', '', '', '']
  }
];

const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export default function TrainingSchedule() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 4, 26)); // May 26, 2024
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);


  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false);
  };

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  };

  const getWeekday = (date: Date) => {
    return weekdays[date.getDay()];
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const formatCellContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <div key={index} className="text-xs leading-tight">
        {line}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex">
      {/* Sidebar */}
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={handleMobileSidebarClose}
      />
      <div className="flex-1">
        <div className="max-w-6xl mx-auto">
          {/* Header with Date Navigation */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">

            <div className="flex items-center justify-center mb-4">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
              >
                <ChevronLeft className="w-6 h-6 text-blue-600" />
              </button>
              
              <div className="mx-8 px-12 py-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full text-white font-medium text-lg shadow-md">
                {formatDate(currentDate)}
              </div>
              
              <button
                onClick={() => navigateDate('next')}
                className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
              >
                <ChevronRight className="w-6 h-6 text-blue-600" />
              </button>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <th className="px-4 py-3 text-left font-medium">時間</th>
                    <th className="px-4 py-3 text-center font-medium border-l border-blue-400">XX</th>
                    <th className="px-4 py-3 text-center font-medium border-l border-blue-400">XX</th>
                    <th className="px-4 py-3 text-center font-medium border-l border-blue-400">XX</th>
                    <th className="px-4 py-3 text-center font-medium border-l border-blue-400">XX</th>
                    <th className="px-4 py-3 text-center font-medium border-l border-blue-400">XX</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleData.map((item, index) => (
                    <tr
                      key={index}
                      className={`border-b border-gray-200 hover:bg-blue-50 transition-colors duration-150 ${
                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                      }`}
                    >
                      <td className="px-4 py-4 font-medium text-blue-700 bg-blue-50 border-r border-gray-200">
                        <div className="flex items-center">
                          <span className="text-sm font-bold">{item.time}</span>
                          {item.duration && (
                            <span className="text-xs text-gray-600 ml-1">{item.duration}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-700 border-r border-gray-200">
                        {formatCellContent(item.activity)}
                      </td>
                      {item.columns.map((column, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-4 py-4 text-xs text-gray-700 border-r border-gray-200 last:border-r-0"
                        >
                          {formatCellContent(column)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Information */}
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
              正規練習 {formatDate(currentDate)}（{getWeekday(currentDate)}）
            </h2>
            
            <div className="space-y-3 text-sm text-gray-600 max-w-4xl mx-auto">
              <p className="leading-relaxed">
                <span className="font-medium">大会：</span>
                川端康成記念 ◯◯パート：◯◯練習ミーティング　要記録パート：◯◯指導、去川◯◯優勝パート：◯◯平泳ぎ◯◯キック　要記録パート：◯◯指導、山東◯◯　
                ◯◯練習営業
              </p>
              
              <div className="mt-4">
                <h3 className="font-medium text-gray-800 mb-2">今日の練習:</h3>
                <ul className="space-y-1 text-xs">
                  <li>・4/30,5/3,7月-◯◯競泳ことばかりをやり切り◯◯開始山口の練習</li>
                  <li>・6/8こう◯◯日～◯◯練習◯◯要塞と◯◯こと◯◯開始山口の練習</li>
                  <li>・◯◯DG各種時間を2交代制の山口の、設備、◯◯練習</li>
                  <li>・山口7-◯◯練習◯◯パート　◯◯春～◯◯練習記録◯◯パート　◯◯-◯◯練習パート　◯◯未定を◯◯練習を進めてください</li>
                  <li>・◯◯練習の練習の記録「◯◯上場」を◯◯そう◯◯練習の山口先を◯◯春てください</li>
                  <li>・◯◯練習山口指導◯◯の練習、◯◯フリップ◯◯サブハーション◯◯フリップ、◯◯こう</li>
                  <li className="text-red-600">
                    ◯◯◯◯サブ→◯◯春→◯◯練習そうそう→◯◯こう◯◯フリップ練習◯◯に◯◯こう◯◯練習営業です。◯◯てください
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}