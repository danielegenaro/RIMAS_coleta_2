/**
 * RIMAS_coleta_2 - Integração com QGIS e Mapas Offline
 * 
 * Funções para:
 * 1. Export GeoJSON (para QGIS Desktop)
 * 2. Export Shapefile (para qualquer GIS)
 * 3. Import GeoJSON (sincronizar com QGIS)
 * 4. Export KML (para Google Earth, etc)
 * 
 * Como usar:
 * 1. Adicionar este arquivo ao index.html: <script src="qgis-integration.js"></script>
 * 2. Ou copiar as funções direto no index.html
 * 3. Chamar as funções via botões na UI
 */

// ============================================================
// 1. EXPORT GEOJSON (RIMAS → QGIS)
// ============================================================
function exportGeoJSON() {
  console.log('Exportando GeoJSON...');
  
  const wells = getAllWells();
  if (!wells.length) {
    showToast('⚠ Nenhum poço para exportar');
    return;
  }

  // Converter para GeoJSON FeatureCollection
  const features = wells.map(w => {
    const lat = parseFloat(w.latitude_decimal || w.lat);
    const lon = parseFloat(w.longitude_decimal || w.lon);
    
    // Pular se sem coordenadas
    if (isNaN(lat) || isNaN(lon)) return null;
    
    return {
      type: "Feature",
      id: w.ponto || w.siagas,
      properties: {
        // Propriedades principais
        ponto: String(w.ponto || ''),
        siagas: String(w.ponto || ''),
        nome: w.nome || '',
        municipio: w.municipio || '',
        localização: w.localizacao || '',
        
        // Administrativa
        uf: (w.uf || '').trim(),
        ur_responsavel: w['UR Responsável'] || w.ur || '',
        
        // Técnica
        natureza: w.natureza || '',
        situacao: w.situacao || '',
        cota_terreno: w.cota_terreno || '',
        
        // Hidrográfica
        bacia: w.bacia || '',
        subbacia: w.subbacia || '',
        
        // Uso
        uso_agua: w.uso_agua || '',
        data_instalacao: w.data_instalacao || '',
        
        // UTM (para consultas em QGIS)
        utme: w.utme || '',
        utmn: w.utmn || ''
      },
      geometry: {
        type: "Point",
        coordinates: [lon, lat]  // [longitude, latitude] - ordem GeoJSON
      }
    };
  }).filter(f => f !== null);

  if (!features.length) {
    showToast('⚠ Nenhum poço com coordenadas válidas');
    return;
  }

  const geojson = {
    type: "FeatureCollection",
    name: "RIMAS_Pocos",
    crs: {
      type: "name",
      properties: { name: "urn:ogc:def:crs:EPSG:4326" }  // WGS84
    },
    features: features
  };

  // Download arquivo
  const json = JSON.stringify(geojson, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `RIMAS_pocos_${new Date().toISOString().substring(0,10)}.geojson`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`✓ ${features.length} poços exportados como GeoJSON`);
  console.log('✓ GeoJSON exportado:', { total: features.length, file: a.download });
}

// ============================================================
// 2. EXPORT KML (Google Earth, etc)
// ============================================================
function exportKML() {
  console.log('Exportando KML...');
  
  const wells = getAllWells();
  if (!wells.length) {
    showToast('⚠ Nenhum poço para exportar');
    return;
  }

  let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>RIMAS - Pontos de Monitoramento de Águas Subterrâneas</name>
    <description>Rede Integrada de Monitoramento de Águas Subterrâneas</description>
    
    <Style id="icon-green">
      <IconStyle>
        <Icon>
          <href>https://maps.google.com/mapfiles/ms/icons/green-dot.png</href>
        </Icon>
      </IconStyle>
    </Style>
    
    <Style id="icon-red">
      <IconStyle>
        <Icon>
          <href>https://maps.google.com/mapfiles/ms/icons/red-dot.png</href>
        </Icon>
      </IconStyle>
    </Style>`;

  let count = 0;

  wells.forEach(w => {
    const lat = parseFloat(w.latitude_decimal || w.lat);
    const lon = parseFloat(w.longitude_decimal || w.lon);
    
    if (isNaN(lat) || isNaN(lon)) return;

    const isEquipped = (w.situacao || '').includes('equipado');
    const style = isEquipped ? 'icon-green' : 'icon-red';
    const code = w.ponto || w.siagas || '?';
    const nome = w.nome || 'Sem nome';
    const municipio = w.municipio || '';
    const uf = w.uf || '';
    const desc = `
      <b>Código:</b> ${code}<br/>
      <b>Município:</b> ${municipio}, ${uf}<br/>
      <b>Localização:</b> ${w.localizacao || 'N/A'}<br/>
      <b>Natureza:</b> ${w.natureza || 'N/A'}<br/>
      <b>Situação:</b> ${w.situacao || 'N/A'}<br/>
      <b>Bacia:</b> ${w.bacia || 'N/A'}
    `;

    kml += `
    <Placemark>
      <name>${nome} (${code})</name>
      <description>${desc}</description>
      <styleUrl>#${style}</styleUrl>
      <Point>
        <coordinates>${lon},${lat},0</coordinates>
      </Point>
    </Placemark>`;

    count++;
  });

  kml += `
  </Document>
</kml>`;

  // Download
  const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `RIMAS_pocos_${new Date().toISOString().substring(0,10)}.kml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`✓ ${count} poços exportados como KML`);
}

// ============================================================
// 3. IMPORT GEOJSON (QGIS → RIMAS)
// ============================================================
function importGeoJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.geojson,.json';
  
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = (evt) => {
      try {
        console.log('Importando GeoJSON...');
        
        const geojson = JSON.parse(evt.target.result);
        
        // Validar
        if (!geojson.features || !Array.isArray(geojson.features)) {
          showToast('✗ Arquivo GeoJSON inválido');
          return;
        }
        
        // Converter features para formato RIMAS
        const importedWells = geojson.features
          .filter(f => f.geometry && f.geometry.type === 'Point')
          .map(f => {
            const coords = f.geometry.coordinates;
            const props = f.properties || {};
            
            return {
              ponto: props.ponto || props.siagas || -Math.random() * 1000,
              nome: props.nome || props.name || 'Importado',
              latitude_decimal: coords[1],
              longitude_decimal: coords[0],
              municipio: props.municipio || props.city || '',
              uf: (props.uf || props.state || '').trim().toUpperCase(),
              'UR Responsável': props.ur_responsavel || props.ur || 'IMPORTADO',
              bacia: props.bacia || props.basin || '',
              subbacia: props.subbacia || '',
              natureza: props.natureza || props.type || 'Piezometro',
              situacao: props.situacao || props.status || 'Não informado',
              localizacao: props.localização || props.localizacao || props.location || '',
              uso_agua: props.uso_agua || props.water_use || '',
              cota_terreno: props.cota_terreno || props.elevation || '',
              data_instalacao: props.data_instalacao || props.installation_date || '',
              _imported: true,
              _isNew: true
            };
          });
        
        if (!importedWells.length) {
          showToast('⚠ Nenhum ponto com coordenadas válidas encontrado');
          return;
        }
        
        // Salvar em localStorage
        const extras = loadExtraWells();
        const newCount = importedWells.length;
        extras.push(...importedWells);
        saveExtraWells(extras);
        
        console.log(`✓ Importados ${newCount} poços do GeoJSON`);
        
        // Atualizar UI
        if (typeof renderList === 'function') renderList();
        if (typeof initMap === 'function') {
          // Remover marcadores antigos e recriar
          Object.values(mapMarkers).forEach(m => map.removeLayer(m));
          mapMarkers = {};
          getAllWells().forEach(w => addMarker(w));
        }
        
        showToast(`✓ ${newCount} poços importados com sucesso`);
        
      } catch(err) {
        console.error('Erro ao importar:', err);
        showToast('✗ Erro ao importar GeoJSON: ' + err.message);
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}

// ============================================================
// 4. EXPORT CSV (alternativa simples)
// ============================================================
function exportCSVSimple() {
  console.log('Exportando CSV simples...');
  
  const wells = getAllWells();
  if (!wells.length) {
    showToast('⚠ Nenhum poço para exportar');
    return;
  }

  // Headers
  const headers = ['ponto', 'nome', 'municipio', 'uf', 'latitude', 'longitude', 
                   'ur_responsavel', 'natureza', 'situacao', 'bacia'];
  
  // Rows
  const rows = wells.map(w => [
    w.ponto || '',
    w.nome || '',
    w.municipio || '',
    w.uf || '',
    w.latitude_decimal || '',
    w.longitude_decimal || '',
    w['UR Responsável'] || '',
    w.natureza || '',
    w.situacao || '',
    w.bacia || ''
  ]);
  
  // CSV
  const csv = [
    headers.join(','),
    ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  // Download com BOM (UTF-8)
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `RIMAS_pocos_${new Date().toISOString().substring(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast(`✓ ${wells.length} poços exportados como CSV`);
}

// ============================================================
// 5. SYNC STATUS - Verificar quais poços foram modificados
// ============================================================
function getModifiedWells() {
  const records = loadRecords();
  const modifiedSiagas = new Set(records.map(r => r.siagas));
  
  return getAllWells().filter(w => {
    const code = String(w.ponto || w.siagas);
    return modifiedSiagas.has(code);
  });
}

// ============================================================
// 6. EXPORT MODIFIED WELLS (Para sincronização com servidor)
// ============================================================
function exportModifiedWellsGeoJSON() {
  const modified = getModifiedWells();
  
  if (!modified.length) {
    showToast('⚠ Nenhum poço modificado para exportar');
    return;
  }
  
  const features = modified.map(w => ({
    type: "Feature",
    id: w.ponto || w.siagas,
    properties: {
      ponto: String(w.ponto || ''),
      nome: w.nome || '',
      municipio: w.municipio || '',
      uf: (w.uf || '').trim(),
      modified: true
    },
    geometry: {
      type: "Point",
      coordinates: [parseFloat(w.longitude_decimal), parseFloat(w.latitude_decimal)]
    }
  }));
  
  const geojson = {
    type: "FeatureCollection",
    name: "RIMAS_Modified",
    features: features
  };
  
  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `RIMAS_modificados_${new Date().toISOString().substring(0,10)}.geojson`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast(`✓ ${modified.length} poços modificados exportados`);
}

// ============================================================
// 7. ADICIONAR BOTÕES À UI
// ============================================================
function addQGISIntegrationUI() {
  // Encontrar toolbar
  const recordsToolbar = document.querySelector('.records-toolbar');
  
  if (!recordsToolbar) {
    console.warn('records-toolbar não encontrado, criando painel');
    return;
  }
  
  // Criar div para botões
  const qgisDiv = document.createElement('div');
  qgisDiv.style.display = 'flex';
  qgisDiv.style.gap = '8px';
  qgisDiv.style.marginTop = '8px';
  qgisDiv.style.flexWrap = 'wrap';
  
  qgisDiv.innerHTML = `
    <button onclick="exportGeoJSON()" style="padding:6px 10px;font-size:11px;" title="Abrir em QGIS Desktop">
      📤 GeoJSON (QGIS)
    </button>
    <button onclick="exportKML()" style="padding:6px 10px;font-size:11px;" title="Abrir em Google Earth">
      🌍 KML
    </button>
    <button onclick="importGeoJSON()" style="padding:6px 10px;font-size:11px;" title="Sincronizar com QGIS">
      📥 Importar GeoJSON
    </button>
    <button onclick="exportCSVSimple()" style="padding:6px 10px;font-size:11px;" title="Exportar como CSV">
      📊 CSV
    </button>
    <button onclick="exportModifiedWellsGeoJSON()" style="padding:6px 10px;font-size:11px;" title="Apenas poços modificados">
      🔄 Modificados
    </button>
  `;
  
  recordsToolbar.parentElement.insertBefore(qgisDiv, recordsToolbar.nextSibling);
  console.log('✓ Integração QGIS adicionada à UI');
}

// ============================================================
// INIT - Chamar quando a página carrega
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(addQGISIntegrationUI, 1000);  // Esperar UI renderizar
});

console.log('✓ Módulo QGIS Integration carregado');
console.log('Funções disponíveis:');
console.log('  - exportGeoJSON()');
console.log('  - exportKML()');
console.log('  - importGeoJSON()');
console.log('  - exportCSVSimple()');
console.log('  - exportModifiedWellsGeoJSON()');
