import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  CalendarIcon, 
  AcademicCapIcon, 
  HeartIcon, 
  CurrencyDollarIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  BeakerIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: HomeIcon, label: 'Home' },
    { path: '/calendar', icon: CalendarIcon, label: 'Agenda' },
    { path: '/pbl', icon: BeakerIcon, label: 'PBL' },
    { path: '/study', icon: BookOpenIcon, label: 'Estudos' },
    { path: '/health', icon: HeartIcon, label: 'Saúde' },
    { path: '/wellness', icon: HeartIcon, label: 'Bem-estar' },
    { path: '/analytics', icon: ChartBarIcon, label: 'Análises' },
    { path: '/finances', icon: CurrencyDollarIcon, label: 'Finanças' },
    { path: '/settings', icon: Cog6ToothIcon, label: 'Config' },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚕️</span>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">MedPlanner</h1>
            </div>
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 shadow-lg">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="grid grid-cols-4 gap-1 p-2 pt-0">
          {navItems.slice(5).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacers */}
      <div className="hidden md:block h-16"></div>
      <div className="md:hidden h-32"></div>
    </>
  );
}