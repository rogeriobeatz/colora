const fs = require('fs');
const path = require('path');

// Simple HTML to PDF conversion using browser print functionality
const generatePDF = async () => {
  const markdownContent = fs.readFileSync('PLANO_MARKETING_COLORA.md', 'utf8');
  
  // Convert markdown to basic HTML
  let htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plano de Marketing - Colora</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            page-break-before: always;
        }
        h2 {
            color: #34495e;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 5px;
            margin-top: 30px;
        }
        h3 {
            color: #2c3e50;
            margin-top: 25px;
        }
        h4 {
            color: #7f8c8d;
            margin-top: 20px;
        }
        ul, ol {
            margin-bottom: 20px;
        }
        li {
            margin-bottom: 5px;
        }
        strong {
            color: #2c3e50;
        }
        code {
            background: #f8f9fa;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        blockquote {
            border-left: 4px solid #3498db;
            padding-left: 20px;
            margin: 20px 0;
            font-style: italic;
            color: #7f8c8d;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        .highlight {
            background-color: #fff3cd;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
        }
        .success {
            background-color: #d4edda;
            border-left: 4px solid #28a745;
        }
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
        }
        .danger {
            background-color: #f8d7da;
            border-left: 4px solid #dc3545;
        }
        @media print {
            body { margin: 0.5in; }
            h1 { page-break-before: always; }
            h2 { page-break-after: avoid; }
            ul, ol { page-break-inside: avoid; }
        }
    </style>
</head>
<body>`;

  // Simple markdown to HTML conversion
  htmlContent += markdownContent
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/^\* (.*)$/gim, '<li>$1</li>')
    .replace(/^- (.*)$/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/^\d+\. (.*)$/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>')
    .replace(/^-{3,}/g, '<hr>')
    .replace(/`([^`]*)`/g, '<code>$1</code>')
    .replace(/^> (.*)$/gim, '<blockquote>$1</blockquote>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');

  htmlContent += '</body></html>';

  // Write HTML file
  fs.writeFileSync('PLANO_MARKETING_COLORA.html', htmlContent);
  
  console.log('✅ Arquivo HTML gerado: PLANO_MARKETING_COLORA.html');
  console.log('📋 Para gerar PDF, abra o arquivo HTML no navegador e use "Imprimir" → "Salvar como PDF"');
  console.log('🌐 Ou use ferramentas online como https://html2pdf.com/');
};

generatePDF().catch(console.error);
