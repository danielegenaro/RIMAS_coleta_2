/**
 * 📊 RIMAS Coleta - Módulo de Exportação Completa
 * Exporta formulários com fotos em HTML, JSON e CSV
 * Funciona 100% offline, sem depender do Google
 */

class ExportadorFormularios {
  constructor() {
    this.formularios = [];
    this.carregarDoLocalStorage();
  }

  /**
   * Salvar formulário no localStorage
   */
  salvarFormulario(dados, fotos = []) {
    const formulario = {
      id: this.gerarID(),
      timestamp: new Date().toISOString(),
      data: dados.data || new Date().toLocaleDateString('pt-BR'),
      hora: dados.hora || new Date().toLocaleTimeString('pt-BR'),
      tecnico: dados.tecnico || 'Desconhecido',
      estacao: dados.estacao || '',
      na: dados.na || '',
      bateria: dados.bateria || '',
      status: dados.status || '',
      observacoes: dados.observacoes || '',
      fotosCount: fotos.length,
      fotos: fotos.map((foto, idx) => ({
        id: idx + 1,
        nome: `foto_${idx + 1}.jpg`,
        dataURL: foto // Armazenar como data URL
      }))
    };

    this.formularios.push(formulario);
    this.salvarNoLocalStorage();
    return formulario;
  }

  /**
   * Carregar formulários do localStorage
   */
  carregarDoLocalStorage() {
    try {
      const dados = localStorage.getItem('rimas_formularios_completos');
      this.formularios = dados ? JSON.parse(dados) : [];
    } catch (e) {
      console.error('Erro ao carregar formulários:', e);
      this.formularios = [];
    }
  }

  /**
   * Salvar formulários no localStorage
   */
  salvarNoLocalStorage() {
    try {
      localStorage.setItem('rimas_formularios_completos', JSON.stringify(this.formularios));
    } catch (e) {
      console.error('Erro ao salvar formulários (localStorage cheio?):', e);
    }
  }

  /**
   * Gerar ID único
   */
  gerarID() {
    return `FORM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 📊 EXPORTAR PARA HTML (Com fotos)
   */
  exportarHTML(formularioID = null) {
    const formularios = formularioID 
      ? [this.formularios.find(f => f.id === formularioID)]
      : this.formularios;

    if (!formularios.length) {
      alert('Nenhum formulário para exportar');
      return;
    }

    let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RIMAS Coleta - Relatório</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      color: #333;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #0066CC;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      color: #0066CC;
      font-size: 28px;
      margin-bottom: 5px;
    }
    
    .header p {
      color: #666;
      font-size: 14px;
    }
    
    .formulario {
      margin-bottom: 40px;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 5px;
      background: #fafafa;
      page-break-inside: avoid;
    }
    
    .secao {
      margin-bottom: 20px;
    }
    
    .secao-titulo {
      background: #0066CC;
      color: white;
      padding: 10px 15px;
      border-radius: 3px;
      font-weight: bold;
      margin-bottom: 15px;
      font-size: 14px;
    }
    
    .campo {
      display: grid;
      grid-template-columns: 200px 1fr;
      margin-bottom: 12px;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    
    .campo-label {
      font-weight: 600;
      color: #0066CC;
      font-size: 13px;
    }
    
    .campo-valor {
      color: #333;
      font-size: 13px;
    }
    
    .fotos {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    
    .foto-item {
      border: 1px solid #ddd;
      border-radius: 5px;
      overflow: hidden;
      background: white;
    }
    
    .foto-item img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      display: block;
    }
    
    .foto-item p {
      padding: 8px;
      font-size: 12px;
      text-align: center;
      color: #666;
    }
    
    .observacoes {
      background: #fff9e6;
      border-left: 4px solid #FFB600;
      padding: 15px;
      border-radius: 3px;
      font-size: 13px;
      line-height: 1.6;
    }
    
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #999;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .stat-box {
      background: #f0f8ff;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
      border-left: 4px solid #0066CC;
    }
    
    .stat-numero {
      font-size: 24px;
      font-weight: bold;
      color: #0066CC;
    }
    
    .stat-label {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 RIMAS COLETA - RELATÓRIO COMPLETO</h1>
      <p>Rede Integrada de Monitoramento das Águas Subterrâneas</p>
    </div>
`;

    // Estatísticas gerais
    const totalEstacoes = new Set(formularios.map(f => f.estacao)).size;
    const totalFotos = formularios.reduce((sum, f) => sum + f.fotosCount, 0);
    
    html += `
    <div class="stats">
      <div class="stat-box">
        <div class="stat-numero">${formularios.length}</div>
        <div class="stat-label">Formulários</div>
      </div>
      <div class="stat-box">
        <div class="stat-numero">${totalEstacoes}</div>
        <div class="stat-label">Estações</div>
      </div>
      <div class="stat-box">
        <div class="stat-numero">${totalFotos}</div>
        <div class="stat-label">Fotos</div>
      </div>
      <div class="stat-box">
        <div class="stat-numero">${new Date().toLocaleDateString('pt-BR')}</div>
        <div class="stat-label">Data Geração</div>
      </div>
    </div>
`;

    // Cada formulário
    formularios.forEach((form, idx) => {
      html += `
    <div class="formulario">
      <h2 style="color: #0066CC; margin-bottom: 15px;">Coleta #${idx + 1}</h2>
      
      <div class="secao">
        <div class="secao-titulo">👤 INFORMAÇÕES DO TÉCNICO</div>
        <div class="campo">
          <div class="campo-label">Técnico:</div>
          <div class="campo-valor">${form.tecnico}</div>
        </div>
        <div class="campo">
          <div class="campo-label">Data:</div>
          <div class="campo-valor">${form.data} às ${form.hora}</div>
        </div>
      </div>
      
      <div class="secao">
        <div class="secao-titulo">🌊 DADOS DA ESTAÇÃO</div>
        <div class="campo">
          <div class="campo-label">Código SIAGAS:</div>
          <div class="campo-valor">${form.estacao}</div>
        </div>
        <div class="campo">
          <div class="campo-label">Nível d'água (NA):</div>
          <div class="campo-valor">${form.na} m</div>
        </div>
        <div class="campo">
          <div class="campo-label">Bateria:</div>
          <div class="campo-valor">${form.bateria}%</div>
        </div>
        <div class="campo">
          <div class="campo-label">Status:</div>
          <div class="campo-valor">
            <span style="background: ${form.status === 'OK' ? '#00AA00' : '#FF6600'}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px;">
              ${form.status}
            </span>
          </div>
        </div>
      </div>
      
      ${form.observacoes ? `
      <div class="secao">
        <div class="secao-titulo">📝 OBSERVAÇÕES</div>
        <div class="observacoes">${form.observacoes}</div>
      </div>
      ` : ''}
      
      ${form.fotos && form.fotos.length > 0 ? `
      <div class="secao">
        <div class="secao-titulo">📸 FOTOS CAPTURADAS (${form.fotos.length})</div>
        <div class="fotos">
          ${form.fotos.map(foto => `
            <div class="foto-item">
              <img src="${foto.dataURL}" alt="${foto.nome}">
              <p>${foto.nome}</p>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    </div>
`;
    });

    html += `
    <div class="footer">
      <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
      <p>RIMAS Coleta v2.0.0 | Serviço Geológico do Brasil - CPRM</p>
      <p><em>Este relatório é uma visualização local dos dados coletados. Para sincronizar com sistemas centralizados, exporte em JSON.</em></p>
    </div>
  </div>
</body>
</html>
`;

    this.downloadArquivo(html, 'rimas-relatorio.html', 'text/html');
  }

  /**
   * 📋 EXPORTAR PARA JSON (Dados estruturados)
   */
  exportarJSON(formularioID = null) {
    const formularios = formularioID
      ? [this.formularios.find(f => f.id === formularioID)]
      : this.formularios;

    const json = {
      metadata: {
        versao: '2.0.0',
        app: 'RIMAS Coleta',
        dataExportacao: new Date().toISOString(),
        totalFormularios: formularios.length,
        totalFotos: formularios.reduce((sum, f) => sum + f.fotosCount, 0)
      },
      formularios: formularios
    };

    const jsonStr = JSON.stringify(json, null, 2);
    this.downloadArquivo(jsonStr, 'rimas-dados.json', 'application/json');
  }

  /**
   * 📊 EXPORTAR PARA CSV (Simples)
   */
  exportarCSV(formularioID = null) {
    const formularios = formularioID
      ? [this.formularios.find(f => f.id === formularioID)]
      : this.formularios;

    let csv = 'Data,Hora,Técnico,Estação,NA (m),Bateria (%),Status,Fotos,Observações\n';

    formularios.forEach(form => {
      const obs = (form.observacoes || '').replace(/"/g, '""');
      csv += `"${form.data}","${form.hora}","${form.tecnico}","${form.estacao}","${form.na}","${form.bateria}","${form.status}","${form.fotosCount}","${obs}"\n`;
    });

    this.downloadArquivo(csv, 'rimas-dados.csv', 'text/csv');
  }

  /**
   * Download de arquivo
   */
  downloadArquivo(conteudo, nomeArquivo, tipo) {
    const blob = new Blob([conteudo], { type: tipo });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Obter lista de formulários
   */
  obterFormularios() {
    return this.formularios;
  }

  /**
   * Limpar tudo (cuidado!)
   */
  limparTudo() {
    if (confirm('Tem certeza? Isso vai deletar todos os formulários salvos!')) {
      this.formularios = [];
      this.salvarNoLocalStorage();
      alert('Tudo apagado!');
    }
  }
}

// Instância global
const exportador = new ExportadorFormularios();
