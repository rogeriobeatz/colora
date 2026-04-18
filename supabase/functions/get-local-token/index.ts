import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  // Esta função retorna HTML que pode ser executado no browser para pegar o token
  
  const html = `<!DOCTYPE html>
<html>
<head>
    <title>Get Supabase Token</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        button { margin: 10px; padding: 10px; cursor: pointer; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; white-space: pre-wrap; }
    </style>
</head>
<body>
    <h1>Supabase Token Helper</h1>
    <button onclick="getToken()">Get Token</button>
    <button onclick="testToken()">Test Token</button>
    <pre id="output">Clique em "Get Token" para buscar o token...</pre>
    
    <script>
        function getToken() {
            try {
                const output = document.getElementById('output');
                output.textContent = 'Buscando token...';
                
                // Tenta pegar do localStorage
                const supabaseAuth = localStorage.getItem('supabase.auth.token');
                if (supabaseAuth) {
                    const parsed = JSON.parse(supabaseAuth);
                    const token = parsed.currentSession?.access_token;
                    if (token) {
                        output.textContent = 'Token encontrado: ' + token.substring(0, 50) + '...\\n\\nToken completo (copie):\\n' + token;
                        return token;
                    }
                }
                
                // Tenta pegar de outros formatos
                let found = false;
                const keys = Object.keys(localStorage);
                for (let key of keys) {
                    if (key.includes('supabase') || key.includes('auth')) {
                        const value = localStorage.getItem(key);
                        if (!found) {
                            output.textContent = 'Procurando em chaves relacionadas:\\n';
                            found = true;
                        }
                        output.textContent += key + ': ' + (value ? value.substring(0, 100) + '...' : 'null') + '\\n';
                    }
                }
                
                if (!found) {
                    output.textContent = 'Token não encontrado no localStorage.\\n\\nChaves encontradas:\\n' + keys.join(', ');
                }
            } catch (error) {
                document.getElementById('output').textContent = 'Erro: ' + error.message;
            }
        }
        
        function testToken() {
            const token = prompt('Cole o token aqui:');
            if (!token) return;
            
            const output = document.getElementById('output');
            output.textContent = 'Testando token...';
            
            fetch('https://wkhgnavkcwdhzvgqbuvo.supabase.co/functions/v1/get-token', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({})
            })
            .then(r => r.json())
            .then(data => {
                output.textContent = 'Token test result:\\n' + JSON.stringify(data, null, 2);
            })
            .catch(error => {
                output.textContent = 'Erro no teste: ' + error.message;
            });
        }
    </script>
</body>
</html>`;
  
  return new Response(html, {
    headers: { "Content-Type": "text/html" }
  });
});
