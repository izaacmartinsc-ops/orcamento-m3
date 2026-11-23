// Nuvem da equipe M3 Bombas: guarda as propostas do app de orçamento numa planilha Google.
// Cole este código em Extensões > Apps Script da planilha "Propostas M3 Bombas".
// Passo a passo completo em nuvem/COMO-ATIVAR.md (no repositório do app).

// 1) Troque pela senha da equipe (a mesma que vai no link enviado aos vendedores).
const CHAVE = 'TROQUE-ESTA-CHAVE';

const ABA = 'Propostas';
const COLS = ['id', 'numero', 'criadoEm', 'atualizadoEm', 'vendedor', 'cliente', 'cidade', 'tipo',
  'kitNome', 'qtd', 'total', 'vista', 'json'];
const COL_JSON = COLS.indexOf('json') + 1;

function aba_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(ABA);
  if (!sh) {
    sh = ss.insertSheet(ABA);
    sh.appendRow(COLS);
    sh.setFrozenRows(1);
    sh.getRange('A:D').setNumberFormat('@'); // id, número e datas como texto
  }
  return sh;
}

function resposta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function lerTodas_(sh) {
  const n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, COL_JSON, n - 1, 1).getValues().map(function (r) {
    try { return JSON.parse(r[0]); } catch (e) { return null; }
  });
}

// Lista todas as propostas da equipe.
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.chave !== CHAVE) return resposta_({ ok: false, erro: 'chave' });
  return resposta_({ ok: true, propostas: lerTodas_(aba_()).filter(Boolean) });
}

// Recebe propostas novas ou alteradas (pelo id). A versão mais recente vence.
function doPost(e) {
  let corpo;
  try { corpo = JSON.parse(e.postData.contents); } catch (x) { return resposta_({ ok: false, erro: 'json' }); }
  if (corpo.chave !== CHAVE) return resposta_({ ok: false, erro: 'chave' });
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = aba_();
    const atuais = lerTodas_(sh);
    const linhaDe = {};
    atuais.forEach(function (p, i) { if (p && p.id) linhaDe[p.id] = i + 2; });
    let gravadas = 0;
    (corpo.propostas || []).forEach(function (p) {
      if (!p || !p.id) return;
      delete p.sync;
      const quando = p.atualizadoEm || p.criadoEm || '';
      const linha = COLS.map(function (c) {
        if (c === 'json') return JSON.stringify(p);
        const v = p[c];
        return v == null ? '' : v;
      });
      const existe = linhaDe[p.id];
      if (existe) {
        const velha = atuais[existe - 2] || {};
        if ((velha.atualizadoEm || velha.criadoEm || '') > quando) return; // a da nuvem é mais nova
        sh.getRange(existe, 1, 1, COLS.length).setValues([linha]);
      } else {
        sh.appendRow(linha);
        linhaDe[p.id] = sh.getLastRow();
      }
      gravadas++;
    });
    return resposta_({ ok: true, gravadas: gravadas });
  } finally {
    lock.releaseLock();
  }
}
