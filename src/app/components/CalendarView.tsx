import { motion } from "motion/react";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: Date;
  color: string;
}

const stickyColors = [
  "bg-yellow-100 border-yellow-200",
  "bg-pink-100 border-pink-200",
  "bg-blue-100 border-blue-200",
  "bg-green-100 border-green-200",
  "bg-purple-100 border-purple-200",
];

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([
    {
      id: "1",
      title: "프로젝트 마감",
      date: new Date(2026, 4, 28),
      color: stickyColors[0],
    },
    {
      id: "2",
      title: "팀 미팅",
      date: new Date(2026, 4, 29),
      color: stickyColors[1],
    },
    {
      id: "3",
      title: "학습 세션",
      date: new Date(2026, 4, 30),
      color: stickyColors[2],
    },
  ]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const getEventsForDate = (day: number) => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    return events.filter(
      (event) =>
        event.date.getDate() === day &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
    );
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const handleDateClick = (day: number) => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    setSelectedDate(date);
  };

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="w-full max-w-5xl mx-auto px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-gradient-to-br from-blue-50/40 via-cyan-50/30 to-teal-50/40 backdrop-blur-sm rounded-3xl p-8 border border-blue-100/50 shadow-lg relative overflow-hidden"
      >
        {/* Decorative background */}
        <div className="absolute top-0 left-1/4 w-48 h-48 bg-gradient-to-br from-cyan-200/10 to-blue-200/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-gradient-to-tr from-teal-200/10 to-sky-200/10 rounded-full blur-3xl" />
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-8 relative z-10">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="tracking-tight">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-2 mb-4 relative z-10">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 relative z-10">
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dayEvents = getEventsForDate(day);
            const isToday =
              day === new Date().getDate() &&
              currentDate.getMonth() === new Date().getMonth() &&
              currentDate.getFullYear() === new Date().getFullYear();

            return (
              <motion.button
                key={day}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDateClick(day)}
                className={`aspect-square rounded-2xl p-2 relative transition-all ${
                  isToday
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                } ${dayEvents.length > 0 ? "ring-2 ring-primary/20" : ""}`}
              >
                <span className="block mb-1">{day}</span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-1 justify-center">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="w-1.5 h-1.5 rounded-full bg-primary"
                      />
                    ))}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Event Sticky Notes */}
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 pt-8 border-t border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <h3>
                {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 일정
              </h3>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {events
                .filter(
                  (event) =>
                    event.date.getDate() === selectedDate.getDate() &&
                    event.date.getMonth() === selectedDate.getMonth() &&
                    event.date.getFullYear() === selectedDate.getFullYear()
                )
                .map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, rotate: -5 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`${event.color} p-4 rounded-xl border-2 shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1`}
                    style={{
                      transform: `rotate(${Math.random() * 4 - 2}deg)`,
                    }}
                  >
                    <p className="text-foreground/80">{event.title}</p>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
