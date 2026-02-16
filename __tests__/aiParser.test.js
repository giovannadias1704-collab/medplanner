import { parseUserInput } from '../src/services/aiParser';

describe('aiParser', () => {
  test('deve retornar erro para texto muito curto', async () => {
    const result = await parseUserInput('a');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('deve retornar sucesso para texto válido', async () => {
    const result = await parseUserInput('tenho prova de anatomia amanhã');
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  test('deve detectar tipo "exam" corretamente', async () => {
    const result = await parseUserInput('prova de biologia');
    expect(result.success).toBe(true);
    expect(result.data.payload.type).toBe('exam');
  });

  test('deve detectar tipo "bill" corretamente', async () => {
    const result = await parseUserInput('pagar conta de luz');
    expect(result.success).toBe(true);
    expect(result.data.payload.type).toBe('bill');
  });

  test('deve detectar tipo "workout" corretamente', async () => {
    const result = await parseUserInput('treino de academia');
    expect(result.success).toBe(true);
    expect(result.data.payload.type).toBe('workout');
  });

  test('deve extrair valor monetário corretamente', async () => {
    const result = await parseUserInput('pagar 150 reais');
    expect(result.success).toBe(true);
    expect(result.data.payload.amount).toBe(150);
  });
});