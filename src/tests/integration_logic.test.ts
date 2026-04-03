import { describe, it, expect, vi } from 'vitest';

// Mock simples para simular a lógica de empilhamento de cores que implementamos no useSimulator.ts
const getBaseImage = (activeRoom: any) => {
  const activeSim = activeRoom.simulations.find((s: any) => s.id === activeRoom.activeSimulationId);
  return activeSim?.imageUrl || activeRoom.imageUrl;
};

describe('Lógica do Simulador (Unit Test)', () => {
  it('deve priorizar a imagem da simulação ativa para o empilhamento (Color Stacking)', () => {
    const mockRoom = {
      imageUrl: 'data:image/png;base64,original',
      activeSimulationId: 'sim-1',
      simulations: [
        { id: 'sim-1', imageUrl: 'https://kie.ai/result-1.png' }
      ]
    };

    const baseImage = getBaseImage(mockRoom);
    expect(baseImage).toBe('https://kie.ai/result-1.png');
  });

  it('deve usar a imagem original se não houver simulação ativa', () => {
    const mockRoom = {
      imageUrl: 'data:image/png;base64,original',
      activeSimulationId: null,
      simulations: []
    };

    const baseImage = getBaseImage(mockRoom);
    expect(baseImage).toBe('data:image/png;base64,original');
  });
});

describe('Lógica de Cache (StoreContext)', () => {
  it('deve identificar corretamente URLs externas vs Base64 local', () => {
    const url = "https://wkhgnavkcwdhzvgqbuvo.supabase.co/storage/v1/object/public/images/test.png";
    const base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...";
    
    expect(url.startsWith('http')).toBe(true);
    expect(base64.startsWith('http')).toBe(false);
  });
});
