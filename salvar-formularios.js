/**
 * 💾 RIMAS Coleta - Salvar Formulários Automaticamente
 * Salva cada formulário preenchido no localStorage
 */

class GerenciadorFormularios {
  constructor() {
    this.formularios = [];
    this.carregarDoLocalStorage();
  }

  /**
   * Salvar um formulário completo
   */
  salvarFormulario(dados) {
    console.log('💾 Salvando formulário...', dados);
    
    const formulario = {
      id: this.gerarID(),
      timestamp: new Date().toISOString(),
      data: dados.data || new Date().toLocaleDateString('pt-BR'),
      hora: dados.hora || new Date().toLocaleTimeString('pt-BR'),
      tecnico: dados.tecnico || 'Usuário',
      estacao: dados.estacao || '',
      na: dados.na || '',
      bateria: dados.bateria || '',
      status: dados.status || '',
      observacoes: dados.observacoes || '',
      fotosCount: dados.fotosCount || 0,
      fotos: dados.fotos || []
    };

    this.formularios.push(formulario);
    this.salvarNoLocalStorage();
    console.log('✅ Formulário salvo!', formulario);
    return formulario;
  }

  /**
   * Salvar com fotos (versão completa)
   */
  salvarFormularioComFotos(dados, fotoBlobs = []) {
    const fotos = [];
    
    // Converter fotos para data URLs
    let contador = 0;
    
    fotoBlobs.forEach((blob, idx) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        fotos.push({
          id: idx + 1,
          nome: `foto_${idx + 1}.jpg`,
          dataURL: e.target.result,
          size: blob.size
        });
        contador++;
        
        // Se todas as fotos foram convertidas
        if (contador === fotoBlobs.length) {
          dados.fotos = fotos;
          dados.fotosCount = fotos.length;
          this.salvarFormulario(dados);
        }
      };
      reader.readAsDataURL(blob);
    });
    
    // Se não tem fotos, salvar direto
    if (fotoBlobs.length === 0) {
      this.salvarFormulario(dados);
    }
  }

  /**
   * Gerar ID único
   */
  gerarID() {
    return `FORM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Carregar do localStorage
   */
  carregarDoLocalStorage() {
    try {
      const dados = localStorage.getItem('rimas_formularios_salvos');
      this.formularios = dados ? JSON.parse(dados) : [];
      console.log(`📊 Carregados ${this.formularios.length} formulários do localStorage`);
    } catch (e) {
      console.error('Erro ao carregar:', e);
      this.formularios = [];
    }
  }

  /**
   * Salvar no localStorage
   */
  salvarNoLocalStorage() {
    try {
      localStorage.setItem('rimas_formularios_salvos', JSON.stringify(this.formularios));
      console.log(`💾 ${this.formularios.length} formulários salvos no localStorage`);
    } catch (e) {
      console.error('localStorage cheio ou erro:', e);
      alert('⚠️ Aviso: localStorage cheio! Exporte e limpe antes de continuar.');
    }
  }

  /**
   * Obter todos os formulários
   */
  obterTodos() {
    return this.formularios;
  }

  /**
   * Contar total
   */
  contarFormularios() {
    return this.formularios.length;
  }

  /**
   * Limpar tudo (com confirmação)
   */
  limparTudo() {
    if (confirm(`Tem certeza? Isso vai deletar ${this.formularios.length} formulários!`)) {
      this.formularios = [];
      this.salvarNoLocalStorage();
      alert('✅ Tudo apagado!');
    }
  }

  /**
   * Exportar lista para debug
   */
  debug() {
    console.table(this.formularios);
  }
}

// Instância global
const gerenciador = new GerenciadorFormularios();
