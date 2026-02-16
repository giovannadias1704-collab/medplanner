import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuickCaptureBar from '../src/components/QuickCaptureBar';
import { AppContext } from '../src/context/AppContext';

const mockAddEvent = jest.fn();
const mockAddTask = jest.fn();
const mockAddBill = jest.fn();

const mockContextValue = {
  addEvent: mockAddEvent,
  addTask: mockAddTask,
  addBill: mockAddBill
};

describe('QuickCaptureBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza o input corretamente', () => {
    render(
      <AppContext.Provider value={mockContextValue}>
        <QuickCaptureBar />
      </AppContext.Provider>
    );

    const input = screen.getByPlaceholderText(/Digite como você fala/i);
    expect(input).toBeInTheDocument();
  });

  test('permite digitar texto no input', () => {
    render(
      <AppContext.Provider value={mockContextValue}>
        <QuickCaptureBar />
      </AppContext.Provider>
    );

    const input = screen.getByPlaceholderText(/Digite como você fala/i);
    fireEvent.change(input, { target: { value: 'tenho prova amanhã' } });
    
    expect(input.value).toBe('tenho prova amanhã');
  });

  test('botão submit está desabilitado quando input está vazio', () => {
    render(
      <AppContext.Provider value={mockContextValue}>
        <QuickCaptureBar />
      </AppContext.Provider>
    );

    const button = screen.getByRole('button', { type: 'submit' });
    expect(button).toBeDisabled();
  });
});