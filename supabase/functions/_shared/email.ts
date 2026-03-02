// Email service helper for Supabase Edge Functions
// Uses Resend for email delivery

import { Resend } from "https://esm.sh/resend@2.0.0";

// Initialize Resend with API key
const resend = new Resend("re_ituwisMc_PtQv1aMjxiTY1v3LZfD2XeLp");

export interface WelcomeEmailData {
  email: string;
  name: string;
  companyName?: string;
}

export interface RenewalEmailData {
  email: string;
  name: string;
  tokens: number;
}

export const sendWelcomeEmail = async (data: WelcomeEmailData): Promise<boolean> => {
  try {
    console.log(`[EMAIL] Sending welcome email to ${data.email}`);
    
    const emailContent = {
      to: data.email,
      subject: "Bem-vindo ao Colora! 🎨",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bem-vindo ao Colora</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
            .content { padding: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎨 Colora</div>
              <h1>Bem-vindo ao Colora!</h1>
            </div>
            
            <div class="content">
              <p>Olá ${data.name},</p>
              
              <p>Seja muito bem-vindo(a) ao Colora! Estamos muito felizes em ter você conosco.</p>
              
              <p>Sua conta foi criada com sucesso e você já pode começar a usar nossa plataforma de simulação de pinturas. 
              Para começar, acesse seu painel e defina sua senha de acesso.</p>
              
              <p><strong>Seus benefícios:</strong></p>
              <ul>
                <li>✅ 200 tokens mensais para simulações</li>
                <li>✅ Acesso a todas as cores e tintas</li>
                <li>✅ Simulações em alta qualidade</li>
                <li>✅ Suporte prioritário</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="https://colora.rogerio.work/dashboard" class="button">Acessar Meu Painel</a>
              </div>
              
              <p>Para fazer login, use o e-mail <strong>${data.email}</strong> e a senha que você definir no primeiro acesso.</p>
              
              <p>Se tiver qualquer dúvida, estamos aqui para ajudar!</p>
              
              <p>Um abraço,<br>Equipe Colora 🎨</p>
            </div>
            
            <div class="footer">
              <p>Este e-mail foi enviado para ${data.email} porque você se cadastrou no Colora.</p>
              <p>Se você não fez este cadastro, por favor ignore este e-mail.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    // Send email using Resend
    const { data: result, error } = await resend.emails.send({
      from: 'Colora <noreply@colora.rogerio.work>',
      to: [data.email],
      subject: emailContent.subject,
      html: emailContent.html
    });

    if (error) {
      console.error(`[EMAIL] Failed to send welcome email:`, error);
      return false;
    }

    console.log(`[EMAIL] Welcome email sent successfully:`, result);
    return true;
    
  } catch (error) {
    console.error(`[EMAIL] Error sending welcome email:`, error);
    return false;
  }
};

export const sendRenewalEmail = async (data: RenewalEmailData): Promise<boolean> => {
  try {
    console.log(`[EMAIL] Sending renewal email to ${data.email}`);
    
    const emailContent = {
      to: data.email,
      subject: "Seus tokens foram renovados! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tokens Renovados</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
            .content { padding: 20px 0; }
            .highlight { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎨 Colora</div>
              <h1>Seus tokens foram renovados!</h1>
            </div>
            
            <div class="content">
              <p>Olá ${data.name},</p>
              
              <p>Ótimas notícias! Sua assinatura do Colora foi renovada com sucesso.</p>
              
              <div class="highlight">
                <h3>🎉 Seus novos benefícios:</h3>
                <p><strong>${data.tokens} tokens</strong> disponíveis para simulações este mês</p>
                <p>Acesso total a todas as funcionalidades da plataforma</p>
              </div>
              
              <p>Seus tokens já estão disponíveis para uso. Que tal começar a simular novas pinturas?</p>
              
              <div style="text-align: center;">
                <a href="https://colora.rogerio.work/simulator" class="button">Começar a Simular</a>
              </div>
              
              <p>Lembre-se que você recebe ${data.tokens} tokens todos os meses para usar em nossas simulações de IA.</p>
              
              <p>Obrigado por continuar com a gente!</p>
              
              <p>Um abraço,<br>Equipe Colora 🎨</p>
            </div>
            
            <div class="footer">
              <p>Este e-mail foi enviado para ${data.email} porque você é um assinante do Colora.</p>
              <p>Gerencie sua assinatura acessando seu painel.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    // Send email using Resend
    const { data: result, error } = await resend.emails.send({
      from: 'Colora <noreply@colora.rogerio.work>',
      to: [data.email],
      subject: emailContent.subject,
      html: emailContent.html
    });

    if (error) {
      console.error(`[EMAIL] Failed to send renewal email:`, error);
      return false;
    }

    console.log(`[EMAIL] Renewal email sent successfully:`, result);
    return true;
    
  } catch (error) {
    console.error(`[EMAIL] Error sending renewal email:`, error);
    return false;
  }
};
