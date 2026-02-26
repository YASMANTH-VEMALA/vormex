'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown, Flame, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { ActivityHeatmapDay, ActivityYearsResponse } from '@/types/profile';

interface ActivityCalendarProps {
  userId: string;
  activityData: ActivityHeatmapDay[];
  currentStreak: number;
  longestStreak: number;
  totalContributions?: number;
  onYearChange?: (year: number | null) => void;
  availableYears?: ActivityYearsResponse;
  isLoading?: boolean;
}

// Color levels for activity
const LEVEL_COLORS = {
  0: 'bg-gray-100 dark:bg-neutral-800 border-gray-300 dark:border-neutral-700',
  1: 'bg-emerald-900/60 border-emerald-800',
  2: 'bg-emerald-700/70 border-emerald-600',
  3: 'bg-emerald-500 border-emerald-400',
};

const LEVEL_COLORS_HOVER = {
  0: 'hover:bg-gray-200 dark:hover:bg-neutral-700',
  1: 'hover:bg-emerald-800',
  2: 'hover:bg-emerald-600',
  3: 'hover:bg-emerald-400',
};

export function ActivityCalendar({
  userId,
  activityData,
  currentStreak,
  longestStreak,
  totalContributions,
  onYearChange,
  availableYears,
  isLoading = false,
}: ActivityCalendarProps) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    day: ActivityHeatmapDay;
    x: number;
    y: number;
  } | null>(null);

  // Group activity data by weeks for the calendar grid
  const weeks = useMemo(() => {
    // 1. Determine date range
    let startDate: Date;
    let endDate: Date;
    const now = new Date();

    if (selectedYear) {
      // Specific year: Jan 1 to Dec 31
      startDate = new Date(selectedYear, 0, 1);
      endDate = new Date(selectedYear, 11, 31);

      // Don't show future dates if selected year is current year
      if (selectedYear === now.getFullYear()) {
        endDate = now;
      }
    } else {
      // Last 365 days (default)
      endDate = now;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 364); // approx 1 year
    }

    // 2. Create a map of activity data for O(1) lookup
    const activityMap = new Map<string, ActivityHeatmapDay>();
    if (activityData) {
      activityData.forEach(day => {
        // Normalize date to YYYY-MM-DD
        const dateStr = new Date(day.date).toISOString().split('T')[0];
        activityMap.set(dateStr, day);
      });
    }

    // 3. Generate all days in the range
    const weeksArray: ActivityHeatmapDay[][] = [];
    let currentWeek: ActivityHeatmapDay[] = [];

    // Normalize start date to start of day
    const iterDate = new Date(startDate);
    iterDate.setHours(0, 0, 0, 0);

    // Get day of week for start date (0 = Sunday, 1 = Monday, etc.)
    const startDayOfWeek = iterDate.getDay(); // 0-6

    // Pad the first week with empty spacers if needed
    // Usually calendar grids start on Sunday or Monday. Let's assume Sunday start (0).
    // If we want Monday start, we'd adjust. Let's stick to standard browser locale usually, but here fixed Sunday start is easiest.
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({
        date: '',
        activityCount: 0,
        isActive: false,
        level: 0,
      });
    }

    // Iterate through every day in range
    const loopEnd = new Date(endDate);
    loopEnd.setHours(23, 59, 59, 999);

    while (iterDate <= loopEnd) {
      const dateStr = iterDate.toISOString().split('T')[0];
      const foundDay = activityMap.get(dateStr);

      currentWeek.push({
        date: dateStr,
        activityCount: foundDay ? foundDay.activityCount : 0,
        isActive: foundDay ? foundDay.isActive : false,
        level: foundDay ? foundDay.level : 0,
        breakdown: foundDay?.breakdown, // preserve breakdown if it exists
      });

      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }

      // Next day
      iterDate.setDate(iterDate.getDate() + 1);
    }

    // Push remaining days
    if (currentWeek.length > 0) {
      weeksArray.push(currentWeek);
    }

    return weeksArray;
  }, [activityData, selectedYear]);

  const handleYearChange = (year: string) => {
    const yearNum = year === 'all' ? null : parseInt(year);
    setSelectedYear(yearNum);
    onYearChange?.(yearNum);
  };

  const handleDayHover = (
    day: ActivityHeatmapDay,
    event: React.MouseEvent
  ) => {
    if (!day.date) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipData({
      day,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const calculatedTotal =
    totalContributions ??
    activityData.reduce((sum, day) => sum + day.activityCount, 0);

  const monthLabels = useMemo(() => {
    if (!activityData || activityData.length === 0) return [];

    const months: { label: string; index: number }[] = [];
    let currentMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstDayWithDate = week.find((d) => d.date);
      if (firstDayWithDate) {
        const date = new Date(firstDayWithDate.date);
        const month = date.getMonth();
        if (month !== currentMonth) {
          months.push({
            label: date.toLocaleDateString('en-US', { month: 'short' }),
            index: weekIndex,
          });
          currentMonth = month;
        }
      }
    });

    return months;
  }, [weeks, activityData]);

  return (
    <Card className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-200 dark:border-neutral-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Activity</h2>
          <span className="text-gray-600 dark:text-neutral-400 text-xs sm:text-sm ml-1 sm:ml-2">
            {calculatedTotal} contributions
          </span>
        </div>

        {/* Year Selector */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Streak Stats */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-1.5 text-orange-400">
              <Flame className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="font-medium">{currentStreak}</span>
              <span className="text-gray-500 dark:text-neutral-500 hidden sm:inline">current</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 text-purple-400">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="font-medium">{longestStreak}</span>
              <span className="text-gray-500 dark:text-neutral-500 hidden sm:inline">longest</span>
            </div>
          </div>

          {/* Year Dropdown */}
          {onYearChange && availableYears && (
            <div className="relative">
              <select
                value={selectedYear ?? 'all'}
                onChange={(e) => handleYearChange(e.target.value)}
                className="appearance-none bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 pr-6 sm:pr-8 rounded-lg border border-gray-300 dark:border-neutral-700 focus:outline-none focus:border-neutral-600"
              >
                <option value="all">Last 365 days</option>
                {availableYears.years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                    {year === availableYears.joinedYear ? ' (Joined)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-neutral-500 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={`overflow-x-auto pb-2 transition-opacity duration-200 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Month Labels */}
        <div className="flex mb-2 ml-6 md:ml-8">
          {monthLabels.map((month, i) => (
            <div
              key={i}
              className="text-[10px] md:text-xs text-gray-500 dark:text-neutral-500"
              style={{
                position: 'relative',
                left: `${month.index * 10}px`,
                marginRight: i < monthLabels.length - 1 ? '0' : 'auto',
              }}
            >
              {month.label}
            </div>
          ))}
        </div>

        <div className="flex gap-0.5 md:gap-1">
          {/* Day Labels */}
          <div className="flex flex-col gap-0.5 md:gap-1 mr-1 md:mr-2 text-[10px] md:text-xs text-gray-500 dark:text-neutral-500">
            <span className="h-2 md:h-3"></span>
            <span className="h-2 md:h-3 hidden sm:block">Mon</span>
            <span className="h-2 md:h-3 sm:hidden">M</span>
            <span className="h-2 md:h-3"></span>
            <span className="h-2 md:h-3 hidden sm:block">Wed</span>
            <span className="h-2 md:h-3 sm:hidden">W</span>
            <span className="h-2 md:h-3"></span>
            <span className="h-2 md:h-3 hidden sm:block">Fri</span>
            <span className="h-2 md:h-3 sm:hidden">F</span>
            <span className="h-2 md:h-3"></span>
          </div>

          {/* Weeks */}
          <div className="flex gap-0.5 md:gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5 md:gap-1">
                {week.map((day, dayIndex) => (
                  <motion.div
                    key={`${weekIndex}-${dayIndex}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: weekIndex * 0.01 + dayIndex * 0.005,
                      duration: 0.2,
                    }}
                    onMouseEnter={(e) => handleDayHover(day, e)}
                    onMouseLeave={() => setTooltipData(null)}
                    className={`w-2 h-2 md:w-3 md:h-3 rounded-sm border cursor-pointer transition-colors ${LEVEL_COLORS[day.level]
                      } ${day.date ? LEVEL_COLORS_HOVER[day.level] : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 md:gap-2 mt-3 md:mt-4 text-[10px] md:text-xs text-gray-500 dark:text-neutral-500">
          <span>Less</span>
          {[0, 1, 2, 3].map((level) => (
            <div
              key={level}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-sm border ${LEVEL_COLORS[level as 0 | 1 | 2 | 3]
                }`}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltipData && tooltipData.day.date && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltipData.x,
            top: tooltipData.y - 10,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-gray-100 dark:bg-neutral-800 px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 shadow-xl">
            <p className="text-gray-900 dark:text-white text-sm font-medium">
              {tooltipData.day.activityCount} contributions
            </p>
            <p className="text-gray-600 dark:text-neutral-400 text-xs">
              {new Date(tooltipData.day.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            {tooltipData.day.breakdown && (
              <div className="mt-1 pt-1 border-t border-gray-300 dark:border-neutral-700 text-xs text-gray-500 dark:text-neutral-500">
                {tooltipData.day.breakdown.posts > 0 && (
                  <p>{tooltipData.day.breakdown.posts} posts</p>
                )}
                {tooltipData.day.breakdown.articles > 0 && (
                  <p>{tooltipData.day.breakdown.articles} articles</p>
                )}
                {tooltipData.day.breakdown.comments > 0 && (
                  <p>{tooltipData.day.breakdown.comments} comments</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

