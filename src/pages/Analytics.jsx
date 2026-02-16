import { useState } from 'react';

export default function Analytics() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📊 Análises
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize suas estatísticas de bem-estar
          </p>
        </div>

        {/* Seção de Sono */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            😴 Sono
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Média de sono</p>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">7.5h</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Qualidade</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">Boa</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Regularidade</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">85%</p>
            </div>
          </div>
        </div>

        {/* Seção de Exercícios */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            💪 Exercícios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Esta semana</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">3x</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Meta semanal</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">4x</p>
            </div>
            <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Frequência</p>
              <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">75%</p>
            </div>
          </div>
        </div>

        {/* Seção de Hidratação */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            💧 Hidratação
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Média diária</p>
              <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">2.1L</p>
            </div>
            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Meta</p>
              <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">2.5L</p>
            </div>
            <div className="bg-sky-50 dark:bg-sky-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Atingiu meta</p>
              <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">4/7</p>
            </div>
          </div>
        </div>

        {/* Seção de Peso */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            ⚖️ Peso
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Peso atual</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">--</p>
            </div>
            <div className="bg-lime-50 dark:bg-lime-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Variação</p>
              <p className="text-3xl font-bold text-lime-600 dark:text-lime-400">--</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Meta</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">--</p>
            </div>
          </div>
        </div>

        {/* Mensagem de desenvolvimento */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
          <p className="text-blue-800 dark:text-blue-300">
            🚀 <strong>Em desenvolvimento:</strong> Gráficos interativos e relatórios detalhados em breve!
          </p>
        </div>
      </div>
    </div>
  );
}