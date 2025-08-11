'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Plus, Calendar, Users } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import RoomSelection from '@/components/ui/noh/register/room-selection';
import DateTimeSelection from '@/components/ui/noh/register/date-time-selection';

interface Room {
  id: string;
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
    { id: '347', name: '347' },
    { id: '537', name: '537' },
    { id: '538', name: '538' }
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

  const removeRoom = (roomId: string) => {
    setSelectedRooms(selectedRooms.filter(room => room.id !== roomId));
  };

  const addRoom = () => {
    const newRoomNumber = Math.floor(Math.random() * 900) + 100;
    setSelectedRooms([...selectedRooms, { id: newRoomNumber.toString(), name: newRoomNumber.toString() }]);
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
        <RoomSelection 
          selectedRooms={selectedRooms}
          onAddRoom={addRoom}
          onRemoveRoom={removeRoom}
        />
        <Separator className="my-8" />

        <DateTimeSelection
          date={date}
          timeSlot={timeSlot}
          dayOfWeek={dayOfWeek}
          onDateChange={setDate}
          onTimeSlotChange={setTimeSlot}
          onDayOfWeekChange={setDayOfWeek}
        />

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