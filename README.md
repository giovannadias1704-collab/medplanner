# 🩺 MedPlanner

> Planner web completo para estudantes de medicina com IA integrada

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.8-orange)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-5.1-purple)](https://vitejs.dev/)

## 📋 Sobre

MedPlanner é um planner web mobile-first desenvolvido especificamente para estudantes de medicina, com foco em metodologia PBL (Problem-Based Learning). O app integra IA (Google Gemini) para interpretação de comandos em linguagem natural, permitindo adicionar eventos, tarefas e compromissos digitando como você fala.

## ✨ Funcionalidades

### 🎯 Core
- **Dashboard Inteligente**: Top 3 prioridades, próximos eventos e pendências urgentes
- **IA Integrada**: Barra de captura rápida com parser de linguagem natural
- **Calendário Completo**: Visualização mensal com eventos organizados
- **Autenticação Firebase**: Login seguro com email/senha

### 📚 Específico para Medicina
- **Módulo PBL**: Casos clínicos, objetivos de aprendizagem e leituras
- **Gestão de Estudos**: Planejamento semanal e acompanhamento de conteúdo

### 💪 Saúde e Bem-estar
- **Academia**: Controle de treinos semanais
- **Alimentação**: Registro de refeições
- **Hidratação**: Meta de água diária com tracking
- **Peso**: Acompanhamento com histórico e gráficos

### 💰 Finanças
- **Contas a Pagar**: Alertas de vencimento
- **Contas Recorrentes**: Automação de mensalidades
- **Relatórios**: Visualização de gastos

### 🏠 Vida Pessoal
- **Tarefas Domésticas**: Checklist com progresso
- **Bem-estar**: Registro de humor, energia e sono
- **Observações Diárias**: Diário pessoal

### ⚙️ Configurações
- **Tema**: Modo claro/escuro
- **IA Configurável**: Modo automático ou com confirmação
- **Exportação de Dados**: Backup em JSON

## 🚀 Tecnologias

- **Frontend**: React 18.3 + Vite
- **Roteamento**: React Router DOM 6
- **Estilização**: Tailwind CSS 3.4
- **Ícones**: Heroicons
- **Backend**: Firebase (Auth + Firestore)
- **IA**: Google Gemini 1.5 Flash
- **Datas**: date-fns + chrono-node
- **PWA**: vite-plugin-pwa
- **Testes**: Jest + React Testing Library
- **CI/CD**: GitHub Actions
- **Deploy**: Vercel/Netlify

## 📦 Instalação Local

### Pré-requisitos

- Node.js 18+ ([Download](https://nodejs.org))
- npm 9+ (incluído no Node.js)
- Conta Firebase ([Criar](https://firebase.google.com))
- API Key do Gemini ([Obter](https://ai.google.dev))

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/SEU_USUARIO/medplanner.git
cd medplanner