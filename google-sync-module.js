```javascript
/**
 * 🔄 RIMAS Coleta - Google Sync Module
 * Gerencia autenticação OAuth2, sync de dados para Sheets e upload de fotos para Drive
 * 
 * Uso:
 * const sync = new GoogleSyncManager(GOOGLE_CONFIG);
 * await sync.initAuth();
 * await sync.syncFormData(formData, photos);
 */

class GoogleSyncManager {
  constructor(config) {
    this.config = config;
    this.accessToken = null;
    this.userEmail = null;
    this.isAuthenticated = false;
    this.lastSyncTime = localStorage.getItem('rimas_lastSyncTime') || null;
    this.syncHistory = JSON.parse(localStorage.getItem('rimas_syncHistory') || '[]');
  }

  /**
   * Inicializar Google Auth e carregar biblioteca
   */
  async initAuth() {
    return new Promise((resolve, reject) => {
      // Carregar Google Sign-In library
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        window.google.accounts.id.initialize({
          client_id: this.config.clientId,
          callback: (response) => this.handleCredentialResponse(response)
        });
        
        // Renderizar botão de login
        this.renderLoginButton();
        resolve(true);
      };
      
      script.onerror = () => reject(new Error('Falha ao carregar Google Sign-In'));
      document.head.appendChild(script);
    });
  }

  /**
   * Renderizar botão de login do Google
   */
  renderLoginButton() {
    const container = document.getElementById('google-signin-button');
    if (container) {
      window.google.accounts.id.renderButton(
        container,
        { theme: 'outline', size: 'large', text: 'signin_with' }
      );
    }
  }

  /**
   * Callback quando usuário faz login
   */
  async handleCredentialResponse(response) {
    try {
      // Decodificar JWT token
      const token = response.credential;
      const decodedToken = this.parseJwt(token);
      
      this.accessToken = token;
      this.userEmail = decodedToken.email;
      this.isAuthenticated = true;
      
      // Guardar em localStorage
      localStorage.setItem('rimas_accessToken', token);
      localStorage.setItem('rimas_userEmail', this.userEmail);
      
      // Atualizar UI
      this.updateAuthUI();
      
      console.log('✅ Autenticado como:', this.userEmail);
      return true;
    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      return false;
    }
  }

  /**
   * Decodificar JWT
   */
  parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  }

  /**
   * Atualizar UI com status de autenticação
   */
  updateAuthUI() {
    const loginBtn = document.getElementById('google-signin-button');
    const userInfo = document.getElementById('user-info');
    const syncBtn = document.getElementById('sync-button');
    
    if (this.isAuthenticated) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (userInfo) {
        userInfo.innerHTML = `✅ Conectado como: <strong>${this.userEmail}</strong>`;
        userInfo.style.display = 'block';
      }
      if (syncBtn) syncBtn.disabled = false;
    } else {
      if (loginBtn) loginBtn.style.display = 'block';
      if (userInfo) userInfo.style.display = 'none';
      if (syncBtn) syncBtn.disabled = true;
    }
  }

  /**
   * Sincronizar dados do formulário para Google Sheets
   */
  async syncFormData(formData, photos = []) {
    if (!this.isAuthenticated) {
      throw new Error('Usuário não autenticado. Faça login primeiro.');
    }

    try {
      console.log('🔄 Iniciando sync...');
      
      // 1. Upload de fotos
      const photoLinks = [];
      if (photos && photos.length > 0) {
        console.log(`📸 Uploadando ${photos.length} foto(s)...`);
        for (let i = 0; i < photos.length; i++) {
          const photoLink = await this.uploadPhotoToGoogleDrive(photos[i], formData);
          photoLinks.push(photoLink);
        }
      }

      // 2. Preparar dados para Sheets
      const rowData = this.prepareSheetRow(formData, photoLinks);

      // 3. Adicionar linha à Sheets
      await this.addRowToSheet(rowData);

      // 4. Atualizar histórico local
      const syncRecord = {
        timestamp: new Date().toISOString(),
        estacao: formData.estacao,
        tecnico: this.userEmail,
        status: 'success',
        fotosCount: photos.length
      };
      this.syncHistory.push(syncRecord);
      localStorage.setItem('rimas_syncHistory', JSON.stringify(this.syncHistory));
      this.lastSyncTime = new Date().toISOString();
      localStorage.setItem('rimas_lastSyncTime', this.lastSyncTime);

      console.log('✅ Sync concluído com sucesso!');
      return { success: true, rowData, photoLinks };

    } catch (error) {
      console.error('❌ Erro no sync:', error);
      throw error;
    }
  }

  /**
   * Upload de foto para Google Drive
   */
  async uploadPhotoToGoogleDrive(photoBlob, formData) {
    try {
      const technicianName = formData.tecnico || this.userEmail.split('@')[0];
      const stationCode = formData.estacao || 'SEM_CODIGO';
      const timestamp = new Date().toISOString().split('T')[0];
      
      const fileName = `${timestamp}_foto_${Date.now()}.jpg`;
      const folderPath = `RIMAS-COLETA-SUREG-SP/${technicianName}/${stationCode}/fotos`;

      // Criar metadados do arquivo
      const metadata = {
        name: fileName,
        mimeType: 'image/jpeg',
        parents: [await this.getOrCreateFolder(folderPath)]
      };

      // Criar FormData com arquivo
      const formDataUpload = new FormData();
      formDataUpload.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formDataUpload.append('file', photoBlob);

      // Upload via Google Drive API
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: formDataUpload
      });

      if (!response.ok) throw new Error(`Upload falhou: ${response.status}`);
      
      const result = await response.json();
      const photoLink = `https://drive.google.com/open?id=${result.id}`;
      
      console.log(`📸 Foto uploadada:`, photoLink);
      return photoLink;

    } catch (error) {
      console.error('❌ Erro ao fazer upload de foto:', error);
      throw error;
    }
  }

  /**
   * Obter ou criar pasta no Google Drive
   */
  async getOrCreateFolder(folderPath) {
    // Simplificado: retorna ID da pasta raiz
    // Em produção, implementar lógica para criar pastas automáticamente
    return 'root';
  }

  /**
   * Preparar linha de dados para Google Sheets
   */
  prepareSheetRow(formData, photoLinks) {
    return [
      new Date().toLocaleDateString('pt-BR'),  // Data
      new Date().toLocaleTimeString('pt-BR'),  // Hora
      this.userEmail,                           // Técnico
      formData.estacao || '',                   // Estação
      formData.na || '',                        // Nível d'água
      formData.bateria || '',                   // Bateria
      formData.status || '',                    // Status
      photoLinks.join(' | '),                   // Fotos (links)
      'OK',                                     // Status Sync
      new Date().toISOString()                  // Timestamp
    ];
  }

  /**
   * Adicionar linha à Google Sheets
   */
  async addRowToSheet(rowData) {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.config.sheetsId}/values/${this.config.sheetName}!A:Z:append?valueInputOption=USER_ENTERED&supportsAllDrives=true`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [rowData]
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erro Sheets: ${error.error.message}`);
      }

      const result = await response.json();
      console.log('📊 Dados adicionados à Sheets:', result);
      return result;

    } catch (error) {
      console.error('❌ Erro ao adicionar dados à Sheets:', error);
      throw error;
    }
  }

  /**
   * Obter histórico de syncs
   */
  getSyncHistory() {
    return this.syncHistory;
  }

  /**
   * Limpar dados de autenticação
   */
  logout() {
    this.accessToken = null;
    this.userEmail = null;
    this.isAuthenticated = false;
    localStorage.removeItem('rimas_accessToken');
    localStorage.removeItem('rimas_userEmail');
    this.updateAuthUI();
    console.log('✅ Desconectado');
  }

  /**
   * Verificar se está autenticado
   */
  isLoggedIn() {
    return this.isAuthenticated;
  }
}

// Exportar para uso
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GoogleSyncManager;
}
```
