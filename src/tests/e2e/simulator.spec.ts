// Testes E2E para o fluxo do simulador
import { test, expect } from '@playwright/test';

test.describe('Simulator Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login automático
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should navigate to simulator', async ({ page }) => {
    await page.click('[data-testid="simulator-link"]');
    await page.waitForURL('/simulator');
    
    expect(page.locator('h1')).toContainText('Simulador');
  });

  test('should upload an image', async ({ page }) => {
    await page.goto('/simulator');
    
    // Upload de imagem
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-assets/test-image.jpg');
    
    // Verificar se a imagem foi carregada
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
  });

  test('should select aspect ratio', async ({ page }) => {
    await page.goto('/simulator');
    
    // Upload de imagem
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-assets/test-image.jpg');
    
    // Selecionar aspect ratio
    await page.click('[data-testid="aspect-ratio-1-1"]');
    
    // Verificar seleção
    await expect(page.locator('[data-testid="aspect-ratio-1-1"]')).toHaveClass('border-blue-500');
  });

  test('should crop image', async ({ page }) => {
    await page.goto('/simulator');
    
    // Upload de imagem
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-assets/test-image.jpg');
    
    // Abrir cropper
    await page.click('[data-testid="crop-button"]');
    
    // Verificar cropper
    await expect(page.locator('[data-testid="image-cropper"]')).toBeVisible();
    
    // Confirmar crop
    await page.click('[data-testid="confirm-crop"]');
    
    // Verificar imagem cortada
    await expect(page.locator('[data-testid="cropped-image"]')).toBeVisible();
  });

  test('should apply paint color', async ({ page }) => {
    await page.goto('/simulator');
    
    // Upload e crop
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-assets/test-image.jpg');
    await page.click('[data-testid="crop-button"]');
    await page.click('[data-testid="confirm-crop"]');
    
    // Selecionar cor
    await page.click('[data-testid="color-red"]');
    
    // Aplicar cor
    await page.click('[data-testid="apply-color"]');
    
    // Verificar loading
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Verificar resultado
    await expect(page.locator('[data-testid="painted-image"]')).toBeVisible({ timeout: 30000 });
  });

  test('should save project', async ({ page }) => {
    await page.goto('/simulator');
    
    // Completar fluxo básico
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-assets/test-image.jpg');
    await page.click('[data-testid="crop-button"]');
    await page.click('[data-testid="confirm-crop"]');
    await page.click('[data-testid="color-blue"]');
    await page.click('[data-testid="apply-color"]');
    
    // Salvar projeto
    await page.click('[data-testid="save-project"]');
    await page.fill('[data-testid="project-name"]', 'Test Project');
    await page.click('[data-testid="confirm-save"]');
    
    // Verificar sucesso
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    await page.goto('/simulator');
    
    // Tentar aplicar cor sem imagem
    await page.click('[data-testid="apply-color"]');
    
    // Verificar mensagem de erro
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Por favor, faça upload de uma imagem');
  });
});
