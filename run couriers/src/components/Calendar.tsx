import  { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowLeft, Clock } from 'lucide-react';

interface CalendarProps {
  onSelectDate: (date: Date) => void;
  selectedDate: Date | null;
  onBack: () => void;
}

export function Calendar({ onSelectDate, selectedDate, onBack }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(selectedDate);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return tempSelectedDate?.toDateString() === date.toDateString();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateClick = (date: Date) => {
    if (isPastDate(date)) return;
    setTempSelectedDate(date);
  };

  const handleConfirm = () => {
    if (!tempSelectedDate) return;
    
    // Parse the time string and add it to the selected date
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const dateWithTime = new Date(tempSelectedDate);
    dateWithTime.setHours(hours, minutes);
    
    onSelectDate(dateWithTime);
  };

  const renderCalendarDays = () => {
    const days = [];
    let dayCount = 1;

    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < firstDayOfMonth) || dayCount > daysInMonth) {
          week.push(<td key={`empty-${i}-${j}`} className="p-2"></td>);
        } else {
          const currentDayDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            dayCount
          );

          week.push(
            <td key={dayCount} className="p-2">
              <button
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                  ${isPastDate(currentDayDate)
                    ? 'text-gray-300 cursor-not-allowed'
                    : isSelected(currentDayDate)
                    ? 'bg-blue-600 text-white'
                    : isToday(currentDayDate)
                    ? 'bg-blue-100 text-blue-600'
                    : 'hover:bg-gray-100'
                  }`}
                onClick={() => handleDateClick(currentDayDate)}
                disabled={isPastDate(currentDayDate)}
              >
                {dayCount}
              </button>
            </td>
          );
          dayCount++;
        }
      }
      if (dayCount <= daysInMonth) {
        days.push(<tr key={i}>{week}</tr>);
      }
    }
    return days;
  };

  // Generate time options in 15-minute intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        const time = `${formattedHour}:${formattedMinute}`;
        options.push(
          <option key={time} value={time}>
            {hour > 12 ? (hour - 12) : hour}:{formattedMinute} {hour >= 12 ? 'PM' : 'AM'}
          </option>
        );
      }
    }
    return options;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">
              Select Delivery Date & Time
            </h2>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <div className="space-x-2">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <table className="w-full">
        <thead>
          <tr>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <th key={day} className="p-2 text-sm font-medium text-gray-600">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{renderCalendarDays()}</tbody>
      </table>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center mb-3">
          <Clock className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">Select Delivery Time</h3>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Time:
            </label>
            <select
              id="deliveryTime"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {generateTimeOptions()}
            </select>
          </div>
          
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">Selected Date & Time:</p>
            <p className="font-medium text-blue-800">
              {tempSelectedDate ? (
                <>
                  {tempSelectedDate.toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                  {' '}at{' '}
                  {selectedTime.split(':')[0].padStart(2, '0')}:{selectedTime.split(':')[1]}
                </>
              ) : (
                'Please select a date'
              )}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-blue-50 p-3 rounded-md text-sm text-blue-800">
        <p><span className="font-medium">Note:</span> Bookings can be modified for up to 30 minutes after submission.</p>
        <p className="mt-1">After that, the booking will be automatically confirmed.</p>
      </div>
      
      <div className="mt-6 flex justify-between">
        <button 
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        
        <button
          onClick={handleConfirm}
          disabled={!tempSelectedDate}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Confirm Selection
        </button>
      </div>
    </div>
  );
}
 