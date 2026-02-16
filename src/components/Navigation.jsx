import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  CalendarIcon, 
  BookOpenIcon,
  AcademicCapIcon,
  HeartIcon, 
  CurrencyDollarIcon,
  HomeModernIcon,
  SparklesIcon,
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';

export default function Navigation() {
  const navItems = [
    { to: '/dashboard', icon: HomeIcon, label: 'Hoje' },
    { to: '/calendar', icon: CalendarIcon, label: 'Calendário' },
    { to: '/pbl', icon: BookOpenIcon, label: 'PBL' },
    { to: '/study', icon: AcademicCapIcon, label: 'Estudos' },
    { to: '/health', icon: HeartIcon, label: 'Saúde' },
    { to: '/finances', icon: CurrencyDollarIcon, label: 'Finanças' },
    { to: '/home', icon: HomeModernIcon, label: 'Casa' },
    { to: '/wellness', icon: SparklesIcon, label: 'Bem-estar' },
    { to: '/settings', icon: Cog6ToothIcon, label: 'Config' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-safe z-50">
      <div className="max-w-7xl mx-auto px-2">
        <div className="grid grid-cols-4 gap-1">
          {navItems.slice(0, 4).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-1 text-xs transition-colors ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`h-6 w-6 mb-1 ${isActive ? 'stroke-2' : 'stroke-1'}`} />
                  <span className="font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
        
        {/* Segunda linha (scroll horizontal se necessário) */}
        <div className="flex overflow-x-auto gap-1 pb-1 pt-1 border-t border-gray-100 dark:border-gray-700 scrollbar-hide">
          {navItems.slice(4).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center py-1.5 px-3 text-xs whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`h-5 w-5 mb-0.5 ${isActive ? 'stroke-2' : 'stroke-1'}`} />
                  <span className="font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}