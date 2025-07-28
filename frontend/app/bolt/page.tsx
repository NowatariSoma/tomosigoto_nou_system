'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Plus, Calendar, Clock, Users } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';

interface Room {
  id: number;
  name: string;
}

interface Member {
  id: number;
  name: string;
  available: boolean;
  timeSlot: string;
}

interface TimeSlot {
  start: string;
  end: string;
}

export default function BoltPage(){

  const [selectedRooms, setSelectedRooms] = useState<Room[]>([
    { id: 347, name: '347' },
    { id: 537, name: '537' },
    { id: 538, name: '538' }
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  
  const [date, setDate] = useState({
    month: '19',
    day: '19'
  });
  
  const [timeSlot, setTimeSlot] = useState<TimeSlot>({
    start: '19:00',
    end: '20:40'
  });
  
  const [dayOfWeek, setDayOfWeek] = useState('何曜日');
  
  const [members] = useState<Member[]>([
    { id: 1, name: '日 一回生', available: true, timeSlot: '10:00 ~ 12:00' },
    { id: 2, name: '田 二回生', available: false, timeSlot: '10:00 ~ 12:00' }
  ]);

  const removeRoom = (roomId: number) => {
    setSelectedRooms(selectedRooms.filter(room => room.id !== roomId));
  };

  const addRoom = () => {
    const newRoomNumber = Math.floor(Math.random() * 900) + 100;
    setSelectedRooms([...selectedRooms, { id: newRoomNumber, name: newRoomNumber.toString() }]);
  };

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-white flex">
    {/* Sidebar */}
    <Sidebar 
      isMobileOpen={isMobileSidebarOpen}
      onMobileClose={handleMobileSidebarClose}
    />
    
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex-1">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6 px-8 shadow-lg">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Calendar className="h-8 w-8" />
          登録
        </h1>
      </div>

      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Room Selection */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              部屋
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {selectedRooms.map((room) => (
                <Badge
                  key={room.id}
                  variant="outline"
                  className="px-4 py-2 text-base border-2 border-blue-200 bg-white  transition-colors"
                >
                  <button
                    onClick={() => removeRoom(room.id)}
                    className="mr-2 hover:text-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {room.name}
                </Badge>
              ))}
              <Button
                onClick={addRoom}
                variant="outline"
                size="sm"
                className="border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-100 transition-all"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Date and Time Selection */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              日時
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Selection */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Input
                  value={date.month}
                  onChange={(e) => setDate({ ...date, month: e.target.value })}
                  className="w-20 text-center border-2 border-blue-200 focus:border-blue-500"
                />
                <span className="text-gray-600 font-medium">月</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={date.day}
                  onChange={(e) => setDate({ ...date, day: e.target.value })}
                  className="w-20 text-center border-2 border-blue-200 focus:border-blue-500"
                />
                <span className="text-gray-600 font-medium">日</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  className="w-24 text-center border-2 border-blue-200 focus:border-blue-500"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-blue-100 border-blue-200 hover:bg-green-100"
                >
                  カレンダー
                </Button>
              </div>
            </div>

            {/* Time Selection */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Input
                  value={timeSlot.start.split(':')[0]}
                  onChange={(e) => setTimeSlot({ 
                    ...timeSlot, 
                    start: `${e.target.value}:${timeSlot.start.split(':')[1]}` 
                  })}
                  className="w-20 text-center border-2 border-blue-200 focus:border-blue-500"
                />
                <span className="text-gray-600">:</span>
                <Input
                  value={timeSlot.start.split(':')[1]}
                  onChange={(e) => setTimeSlot({ 
                    ...timeSlot, 
                    start: `${timeSlot.start.split(':')[0]}:${e.target.value}` 
                  })}
                  className="w-20 text-center border-2 border-blue-200 focus:border-blue-500"
                />
              </div>
              <span className="text-gray-600 font-medium">〜</span>
              <div className="flex items-center gap-2">
                <Input
                  value={timeSlot.end.split(':')[0]}
                  onChange={(e) => setTimeSlot({ 
                    ...timeSlot, 
                    end: `${e.target.value}:${timeSlot.end.split(':')[1]}` 
                  })}
                  className="w-20 text-center border-2 border-blue-200 focus:border-blue-500"
                />
                <span className="text-gray-600">:</span>
                <Input
                  value={timeSlot.end.split(':')[1]}
                  onChange={(e) => setTimeSlot({ 
                    ...timeSlot, 
                    end: `${timeSlot.end.split(':')[0]}:${e.target.value}` 
                  })}
                  className="w-20 text-center border-2 border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Attendance Section */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-gray-800">欠席</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="w-fit bg-blue-50 border-blue-200 hover:bg-blue-100"
            >
              直近の履歴
            </Button>
          </CardHeader>
        </Card>

        {/* Members Section */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <CardTitle className="text-xl">メンバー</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {members.map((member, index) => (
              <div key={member.id} className={`p-6 ${index !== members.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                      member.available 
                        ? 'bg-green-500 border-green-500' 
                        : 'bg-gray-800 border-gray-800'
                    }`}>
                      {member.available && <span className="text-white text-sm">✓</span>}
                      {!member.available && <span className="text-white text-sm">■</span>}
                    </div>
                    <span className="font-medium text-gray-800">{member.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${
                      member.available ? 'text-red-600' : 'text-gray-400'
                    }`}>
                      時間
                    </span>
                    <span className={`font-mono ${
                      member.available ? 'text-red-600' : 'text-gray-400'
                    }`}>
                      {member.timeSlot}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className="p-6 text-center">
              <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                さらに表示...
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center py-8">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6 rounded-full shadow-lg">
            登録する
          </Button>
        </div>
      </div>
    </div>
  </div>
  );
}