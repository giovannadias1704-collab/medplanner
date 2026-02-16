import { SparklesIcon } from '@heroicons/react/24/outline';

export default function InsightCard({ insights, title = "💡 Insights da Semana" }) {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl shadow-lg border-2 border-purple-200 dark:border-purple-800 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
          <SparklesIcon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>

      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div 
            key={index}
            className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl"
          >
            <span className="text-xl flex-shrink-0">✨</span>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {insight}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}