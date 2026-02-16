import { formatDateBR, formatDateTimeBR } from '../utils/dateParser';
import { ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';

export default function EventCard({ event, onClick }) {
  const typeColors = {
    exam: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    pbl: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    workout: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    bill: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    task: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  };

  const colorClass = typeColors[event.type] || typeColors.default;

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 dark:text-white flex-1">
          {event.title}
        </h3>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${colorClass}`}>
          {event.type || 'evento'}
        </span>
      </div>

      {event.date && (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
          <ClockIcon className="h-4 w-4 mr-1" />
          {formatDateTimeBR(event.date, event.startTime)}
        </div>
      )}

      {event.location && (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
          <MapPinIcon className="h-4 w-4 mr-1" />
          {event.location}
        </div>
      )}

      {event.details && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
          {event.details}
        </p>
      )}
    </div>
  );
}