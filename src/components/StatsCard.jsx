export default function StatsCard({ title, value, subtitle, icon, trend, color = 'blue' }) {
  const colorClasses = {
    blue: {
      bg: 'from-blue-500 to-cyan-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconText: 'text-blue-600 dark:text-blue-400',
      trendUp: 'text-blue-600 dark:text-blue-400',
      trendDown: 'text-blue-600 dark:text-blue-400'
    },
    green: {
      bg: 'from-green-500 to-emerald-600',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconText: 'text-green-600 dark:text-green-400',
      trendUp: 'text-green-600 dark:text-green-400',
      trendDown: 'text-red-600 dark:text-red-400'
    },
    purple: {
      bg: 'from-purple-500 to-pink-600',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconText: 'text-purple-600 dark:text-purple-400',
      trendUp: 'text-purple-600 dark:text-purple-400',
      trendDown: 'text-purple-600 dark:text-purple-400'
    },
    orange: {
      bg: 'from-orange-500 to-red-600',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      iconText: 'text-orange-600 dark:text-orange-400',
      trendUp: 'text-orange-600 dark:text-orange-400',
      trendDown: 'text-orange-600 dark:text-orange-400'
    },
    red: {
      bg: 'from-red-500 to-rose-600',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconText: 'text-red-600 dark:text-red-400',
      trendUp: 'text-green-600 dark:text-green-400',
      trendDown: 'text-red-600 dark:text-red-400'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 hover-lift transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
          {typeof icon === 'string' ? (
            <span className="text-2xl">{icon}</span>
          ) : (
            icon
          )}
        </div>
        
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-bold ${
            trend.direction === 'up' ? colors.trendUp : colors.trendDown
          }`}>
            <span>{trend.direction === 'up' ? '↗' : '↘'}</span>
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          {title}
        </p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}