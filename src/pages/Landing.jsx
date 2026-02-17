import { ArrowRightIcon, CheckCircleIcon, SparklesIcon, ChartBarIcon, CalendarIcon, AcademicCapIcon, HeartIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { landingData } from '../config/landingData';

export default function Landing() {
  // ========== DETECTAR TEMA DO SISTEMA ==========
  useEffect(() => {
    const applySystemTheme = () => {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      console.log('🎨 Tema detectado:', isDarkMode ? 'Escuro' : 'Claro');
    };

    applySystemTheme();

    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
        console.log('🎨 Mudou para tema escuro');
      } else {
        document.documentElement.classList.remove('dark');
        console.log('🎨 Mudou para tema claro');
      }
    };

    darkModeQuery.addEventListener('change', handleChange);

    return () => {
      darkModeQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // ========== DADOS DA LANDING (importados de landingData.js) ==========
  
  // Mapear features com seus ícones
  const iconMap = [CalendarIcon, AcademicCapIcon, ChartBarIcon, HeartIcon];
  const features = landingData.features.map((feature, index) => ({
    ...feature,
    icon: iconMap[index]
  }));

  const benefits = landingData.benefits;

  const stats = [
    { value: landingData.stats.studentsActive.value, label: landingData.stats.studentsActive.label },
    { value: landingData.stats.satisfactionRate.value, label: landingData.stats.satisfactionRate.label },
    { value: landingData.stats.timeSaved.value, label: landingData.stats.timeSaved.label },
    { value: landingData.stats.averageRating.value, label: landingData.stats.averageRating.label },
  ];

  const testimonials = landingData.testimonials;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      
      {/* Header/Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">⚕️</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">MedPlanner</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/auth"
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/auth"
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
            >
              Começar Grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-6 animate-bounce">
            <SparklesIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              A plataforma completa para estudantes de medicina
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Organize seus estudos.<br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Potencialize resultados.
            </span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto">
            O MedPlanner é a ferramenta definitiva para estudantes de medicina que querem organizar sua rotina, gerenciar PBLs e acompanhar seu progresso acadêmico.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              to="/auth"
              className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-2xl hover:scale-105 flex items-center gap-2"
            >
              Começar Gratuitamente
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <Link
              to="/pricing"
              className="px-10 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-700 rounded-xl font-bold text-lg hover:border-indigo-600 dark:hover:border-indigo-400 transition-all"
            >
              Ver Planos
            </Link>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            ✓ 7 dias grátis • ✓ Sem cartão de crédito • ✓ Cancele quando quiser
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Recursos poderosos pensados especialmente para a rotina intensa de estudantes de medicina.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 hover:scale-105 transition-all border border-gray-200 dark:border-gray-700 shadow-lg"
              >
                <div className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Por que escolher o MedPlanner?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Mais de 500 estudantes de medicina já transformaram sua rotina acadêmica com nossa plataforma.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="w-full h-64 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <span className="text-6xl mb-4 block">📊</span>
                  <p className="text-gray-600 dark:text-gray-400 font-semibold">
                    Dashboard Preview
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              O que nossos alunos dizem
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Depoimentos reais de quem já transformou seus estudos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg"
              >
                <div className="text-5xl mb-4">{testimonial.avatar}</div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                  "{testimonial.text}"
                </p>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.course}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Pronto para organizar seus estudos?
          </h2>
          <p className="text-xl text-indigo-100 mb-10">
            Junte-se a centenas de estudantes que já estão alcançando melhores resultados.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-10 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-2xl"
          >
            Começar Agora - É Grátis
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
          <p className="text-indigo-200 text-sm mt-6">
            ✓ Sem cartão de crédito • ✓ 7 dias grátis • ✓ Suporte dedicado
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-3xl">⚕️</span>
            <span className="text-xl font-bold text-white">MedPlanner</span>
          </div>
          <p className="mb-6">
            A plataforma completa para estudantes de medicina organizarem seus estudos e alcançarem o sucesso.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <Link to="/pricing" className="hover:text-white transition-colors">Planos</Link>
            <Link to="/auth" className="hover:text-white transition-colors">Login</Link>
            <a href="https://wa.me/5571992883976" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Suporte</a>
          </div>
          <p className="text-xs mt-6">
            © 2024 MedPlanner. Todos os direitos reservados.
          </p>
        </div>
      </footer>

    </div>
  );
}