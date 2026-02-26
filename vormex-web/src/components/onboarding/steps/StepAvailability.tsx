'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  initialData?: Record<string, unknown>;
  onComplete: (data: Record<string, unknown>) => void;
  saving: boolean;
}

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning', time: '6am - 12pm', emoji: '🌅' },
  { id: 'afternoon', label: 'Afternoon', time: '12pm - 5pm', emoji: '☀️' },
  { id: 'evening', label: 'Evening', time: '5pm - 9pm', emoji: '🌆' },
  { id: 'night', label: 'Night Owl', time: '9pm - 2am', emoji: '🌙' },
  { id: 'flexible', label: 'Flexible', time: 'Anytime works', emoji: '🔄' },
];

const HOURS = [
  { id: 2, label: '1-2 hrs/week' },
  { id: 5, label: '3-5 hrs/week' },
  { id: 10, label: '5-10 hrs/week' },
  { id: 20, label: '10+ hrs/week' },
];

const COMM_PREFS = [
  { id: 'chat', label: 'Text Chat', emoji: '💬' },
  { id: 'voice', label: 'Voice Calls', emoji: '📞' },
  { id: 'video', label: 'Video Calls', emoji: '📹' },
  { id: 'in_person', label: 'In Person', emoji: '🤝' },
];

export default function StepAvailability({ initialData, onComplete, saving }: Props) {
  const [availability, setAvailability] = useState<string>((initialData?.availability as string) || '');
  const [hours, setHours] = useState<number>((initialData?.hoursPerWeek as number) || 0);
  const [commPref, setCommPref] = useState<string>((initialData?.communicationPref as string) || '');

  const canContinue = availability !== '';

  return (
    <div className="space-y-6">
      {/* Time preference */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
          When are you most active?
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {TIME_SLOTS.map((slot, i) => (
            <motion.button
              key={slot.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setAvailability(slot.id)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                availability === slot.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300'
              } ${slot.id === 'flexible' ? 'col-span-2' : ''}`}
            >
              <span className="text-xl">{slot.emoji}</span>
              <span className={`block font-medium text-sm mt-1 ${
                availability === slot.id ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-800 dark:text-neutral-200'
              }`}>{slot.label}</span>
              <span className="text-xs text-neutral-500">{slot.time}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Hours per week */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
          Time for networking & learning
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {HOURS.map(h => (
            <button
              key={h.id}
              onClick={() => setHours(h.id)}
              className={`py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                hours === h.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                  : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Communication preference */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
          Preferred way to connect
        </h3>
        <div className="flex gap-2">
          {COMM_PREFS.map(p => (
            <button
              key={p.id}
              onClick={() => setCommPref(p.id)}
              className={`flex-1 py-2.5 rounded-xl border-2 text-center transition-all ${
                commPref === p.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
              }`}
            >
              <span className="text-lg block">{p.emoji}</span>
              <span className={`text-xs font-medium block mt-0.5 ${
                commPref === p.id ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-500'
              }`}>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <motion.button
        onClick={() => onComplete({ availability, hoursPerWeek: hours || undefined, communicationPref: commPref || undefined })}
        disabled={!canContinue || saving}
        className={`w-full py-4 rounded-2xl font-semibold text-white transition-all ${
          canContinue && !saving
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/25'
            : 'bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed'
        }`}
        whileTap={canContinue ? { scale: 0.98 } : {}}
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Finding your matches...
          </span>
        ) : (
          'Find My Matches'
        )}
      </motion.button>
    </div>
  );
}
