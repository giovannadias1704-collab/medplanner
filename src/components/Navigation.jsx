import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  CalendarIcon, 
  HeartIcon, 
  CurrencyDollarIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  BeakerIcon,
  ChartBarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: HomeIcon, label: 'Home' },
    { path: '/calendar', icon: CalendarIcon, label: 'Agenda' },
    { path: '/pbl', icon: BeakerIcon, label: 'PBL' },
    { path: '/study', icon: BookOpenIcon, label: 'Estudos' },
    { path: '/health', icon: HeartIcon, label: 'Saúde' },
    { path: '/finances', icon: CurrencyDollarIcon, label: 'Finanças' },
    { path: '/wellness', icon: HeartIcon, label: 'Bem-estar' },
    { path: '/analytics', icon: ChartBarIcon, label: 'Analytics' },
    { path: '/pricing', icon: SparklesIcon, label: 'Planos' },
    { path: '/settings', icon: Cog6ToothIcon, label: 'Config' },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav 
        className="hidden md:flex fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm"
        style={{ zIndex: 9999, pointerEvents: 'auto' }}
      >
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              to="/dashboard" 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10000 }}
            >
              <span className="text-2xl" style={{ pointerEvents: 'none' }}>⚕️</span>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white" style={{ pointerEvents: 'none' }}>
                MedPlanner
              </h1>
            </Link>
            
            {/* Menu Items */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10000 }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 font-semibold'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" style={{ pointerEvents: 'none' }} />
                    <span className="text-sm" style={{ pointerEvents: 'none' }}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl"
        style={{ zIndex: 9999, pointerEvents: 'auto' }}
      >
        {/* Primeira linha - 5 itens */}
        <div className="grid grid-cols-5 border-b border-gray-200 dark:border-gray-700">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10000 }}
                className={`flex flex-col items-center justify-center py-3 transition-all ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-700'
                }`}
              >
                <Icon className="w-6 h-6 mb-1 flex-shrink-0" strokeWidth={2} style={{ pointerEvents: 'none' }} />
                <span className="text-[10px] font-medium" style={{ pointerEvents: 'none' }}>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Segunda linha - 5 itens */}
        <div className="grid grid-cols-5">
          {navItems.slice(5).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10000 }}
                className={`flex flex-col items-center justify-center py-3 transition-all ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 active:bg-gray-100 dark:active:bg-gray-700'
                }`}
              >
                <Icon className="w-6 h-6 mb-1 flex-shrink-0" strokeWidth={2} style={{ pointerEvents: 'none' }} />
                <span className="text-[10px] font-medium" style={{ pointerEvents: 'none' }}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacers */}
      <div className="hidden md:block h-16" aria-hidden="true"></div>
      <div className="md:hidden h-[130px]" aria-hidden="true"></div>
    </>
  );
}