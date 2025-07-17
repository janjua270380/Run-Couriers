import    { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Package } from 'lucide-react';

interface InlineCalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  selectedTime: string;
  onTimeChange: (time: string) => void;
  parcelCount: number;
  onParcelCountChange: (count: number) => void;
}

export function InlineCalendar({ 
  selectedDate, 
  onSelectDate,
  selectedTime, 
  onTimeChange,
  parcelCount,
  onParcelCountChange
}: InlineCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
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
    return selectedDate?.toDateString() === date.toDateString();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateClick = (date: Date) => {
    if (isPastDate(date)) return;
    onSelectDate(date);
  };

  const renderCalendarDays = () => {
    const days = [];
    let dayCount = 1;

    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < firstDayOfMonth) || dayCount > daysInMonth) {
          week.push(<td key={`empty-${i}-${j}`} className="p-1"></td>);
        } else {
          const currentDayDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            dayCount
          );

          week.push(
            <td key={dayCount} className="p-1 text-center">
              <button
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors
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
      } else if (i === 0) {
        // If we've completed the month in the first row, still push it
        days.push(<tr key={i}>{week}</tr>);
      }
    }
    return days;
  };

  // Generate time options in 30-minute intervals
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
    <div className="space-y-4">
      <div className="bg-white p-3 rounded-md border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <div className="space-x-1">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1 hover:bg-gray-100 rounded-full"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="p-1 hover:bg-gray-100 rounded-full"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <table className="w-full table-fixed text-xs">
          <thead>
            <tr>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <th key={day} className="p-1 text-xs font-medium text-gray-600">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{renderCalendarDays()}</tbody>
        </table>
        
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-gray-500">
            {selectedDate ? (
              <span className="text-blue-600 font-medium">
                Selected: {selectedDate.toLocaleDateString()}
              </span>
            ) : (
              "Select a collection date"
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center bg-white p-3 rounded-md border border-gray-200">
        <div className="flex-1">
          <label htmlFor="delivery-time" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Clock className="w-4 h-4 text-blue-600" />
            Collection Time
          </label>
          <select
            id="delivery-time"
            value={selectedTime}
            onChange={(e) => onTimeChange(e.target.value)}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {generateTimeOptions()}
          </select>
        </div>
      </div>
      
      <div className="flex items-center bg-white p-3 rounded-md border border-gray-200">
        <div className="flex-1">
          <label htmlFor="parcel-count" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Package className="w-4 h-4 text-blue-600" />
            Number of Parcels
          </label>
          <div className="flex items-center">
            <button 
              onClick={() => onParcelCountChange(Math.max(1, parcelCount - 1))}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-l"
            >
              -
            </button>
            <input
              id="parcel-count"
              type="number"
              min="1"
              value={parcelCount}
              onChange={(e) => onParcelCountChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full py-2 px-3 border-t border-b border-gray-300 text-center"
            />
            <button 
              onClick={() => onParcelCountChange(parcelCount + 1)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-r"
            >
              +
            </button>
          </div>
                     <p className="text-xs text-gray-500 mt-1">Enter the total number of parcels for collection</p>
 
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mt-1">
        <p>✓ You can modify or cancel your booking for up to 30 minutes after confirmation</p>
      </div>
    </div>
  );
}
 