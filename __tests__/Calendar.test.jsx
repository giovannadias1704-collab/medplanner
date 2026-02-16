import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Calendar from '../src/pages/Calendar';
import { AppContext } from '../src/context/AppContext';

const mockContextValue = {
  events: [
    {
      id: 1,
      title: 'Prova de Anatomia',
      date: '2026-02-20',
      startTime: '14:00',
      type: 'exam'
    }
  ]
};

describe('Calendar', () => {
  test('renderiza o título corretamente', () => {
    render(
      <BrowserRouter>
        <AppContext.Provider value={mockContextValue}>
          <Calendar />
        </AppContext.Provider>
      </BrowserRouter>
    );

    const heading = screen.getByText(/Calendário/i);
    expect(heading).toBeInTheDocument();
  });

  test('renderiza o botão "Hoje"', () => {
    render(
      <BrowserRouter>
        <AppContext.Provider value={mockContextValue}>
          <Calendar />
        </AppContext.Provider>
      </BrowserRouter>
    );

    const todayButton = screen.getByText(/Hoje/i);
    expect(todayButton).toBeInTheDocument();
  });

  test('renderiza os dias da semana', () => {
    render(
      <BrowserRouter>
        <AppContext.Provider value={mockContextValue}>
          <Calendar />
        </AppContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Dom/i)).toBeInTheDocument();
    expect(screen.getByText(/Seg/i)).toBeInTheDocument();
    expect(screen.getByText(/Ter/i)).toBeInTheDocument();
  });
});