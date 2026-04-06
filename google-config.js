// 🔐 RIMAS Coleta - Google OAuth2 & Sheets Configuration
// ⚠️  NÃO COMPARTILHE ESTE ARQUIVO PUBLICAMENTE!

const GOOGLE_CONFIG = {
  clientId: '1084564114485-7i61d4526c1jossc5hcdirk2j9i27noq.apps.googleusercontent.com',
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
  ],
  sheetsId: '1QZ3gY5_R5Ui_ErfpC5T7QLBFKgaxShR_aQO3jQGJR20',
  sheetName: 'Sheet1',
  driveFolderId: 'RIMAS-COLETA-SUREG-SP',
  appName: 'RIMAS Coleta',
  version: '2.0.0',
  photosFolderTemplate: 'RIMAS-COLETA-SUREG-SP/{tecnicoNome}/{estacaoCodigo}/fotos'
};
