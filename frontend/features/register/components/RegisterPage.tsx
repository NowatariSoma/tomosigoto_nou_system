'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/forms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Separator } from '@/components/ui/layout/separator';
import RoomSelection from './RoomSelection';
import DateTimeSelection from './DateTimeSelection';
import { Room, Member, TimeSlot, DateSelection as DateSelectionType } from '../types';

export default function RegisterPage() {
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([
    { id: '347', name: '347' },
    { id: '537', name: '537' },
    { id: '538', name: '538' }
  ]);
  
  const [date, setDate] = useState<DateSelectionType>({
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

  const addRoom = (newRooms: Room[]) => {
    setSelectedRooms(newRooms);
  };

  return (
    <div className="space-y-8">
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
  );
}