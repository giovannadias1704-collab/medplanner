// Estrutura sugerida (Next.js / React)
// src/pages/terms.jsx
// src/pages/privacy.jsx
// src/pages/cookies.jsx

import React from "react";

export function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Termos de Uso — MedPlanner</h1>

      <section>
        <h2 className="text-xl font-semibold">1. Aceitação dos Termos</h2>
        <p>
          Ao acessar e utilizar a plataforma MedPlanner, o usuário declara ter lido,
          compreendido e concordado integralmente com estes Termos de Uso.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">2. Descrição do serviço</h2>
        <p>
          Plataforma digital destinada à organização de estudos, planejamento
          acadêmico, acompanhamento de desempenho e geração de conteúdos
          educacionais de apoio.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">3. Planos e pagamentos</h2>
        <p>
          Planos podem ser simulados dentro da plataforma e pagamentos são
          realizados diretamente ao responsável, fora do ambiente automatizado.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">9. Contato</h2>
        <p>E-mail: contato@medplanner.app</p>
      </section>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Política de Privacidade</h1>

      <section>
        <h2 className="text-xl font-semibold">Compromisso com a privacidade</h2>
        <p>
          Tratamos dados conforme a LGPD (Lei nº 13.709/2018), respeitando a
          privacidade dos usuários.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Dados coletados</h2>
        <ul className="list-disc pl-6">
          <li>Nome e e-mail</li>
          <li>Dados de uso da plataforma</li>
          <li>Informações técnicas de acesso</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Direitos do titular</h2>
        <p>
          O usuário pode solicitar acesso, correção ou exclusão de seus dados pelo
          e-mail de contato.
        </p>
      </section>
    </div>
  );
}

export function CookiesPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Política de Cookies</h1>

      <section>
        <h2 className="text-xl font-semibold">O que são cookies</h2>
        <p>
          Pequenos arquivos armazenados no dispositivo para manter sessão,
          preferências e melhorar a navegação.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Gerenciamento</h2>
        <p>
          O usuário pode bloquear ou apagar cookies pelo navegador, podendo afetar
          o funcionamento da plataforma.
        </p>
      </section>
    </div>
  );
}
