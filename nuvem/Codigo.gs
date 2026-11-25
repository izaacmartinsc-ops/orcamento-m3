// Nuvem do app de orçamento M3 Bombas: login, propostas e preços numa planilha Google.
// Fica em Extensões > Apps Script da planilha "Propostas M3 Bombas".
// Depois de mudar este código: Implantar > Gerenciar implantações > lápis > Versão: Nova versão > Implantar.

// PRIMEIRO acesso: enquanto a aba Usuarios estiver vazia, o usuário "izaac" entra com a senha que
// digitar (mínimo 4 caracteres) e vira administrador com essa senha. Depois disso, só valem os usuários da aba.
const ADMIN_USUARIO = 'izaac';

const ABA = 'Propostas';
const COLS = ['id', 'numero', 'criadoEm', 'atualizadoEm', 'vendedor', 'cliente', 'cidade', 'tipo',
  'kitNome', 'qtd', 'total', 'vista', 'json', 'usuario'];
const COL_JSON = COLS.indexOf('json') + 1;
const ABA_CONFIG = 'Config';
const ABA_USU = 'Usuarios';
const COLS_USU = ['usuario', 'nome', 'perfil', 'ativo', 'sal', 'hash', 'versao', 'criadoEm'];
const VALIDADE_SESSAO_DIAS = 365;

// ---------- utilidades
function resposta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function hex_(bytes) {
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}
function hashSenha_(sal, senha) {
  return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, sal + '|' + senha, Utilities.Charset.UTF_8));
}
function segredo_() {
  const props = PropertiesService.getScriptProperties();
  let s = props.getProperty('SEGREDO');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('SEGREDO', s); }
  return s;
}
function assinar_(texto) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(texto, segredo_())).replace(/=+$/, '');
}

// ---------- usuários
function abaUsu_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(ABA_USU);
  if (!sh) {
    sh = ss.insertSheet(ABA_USU);
    sh.appendRow(COLS_USU);
    sh.setFrozenRows(1);
    sh.getRange('A:H').setNumberFormat('@');
  }
  return sh;
}
function lerUsuarios_() {
  const sh = abaUsu_();
  const n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, COLS_USU.length).getValues().map(function (r, i) {
    const u = {}; COLS_USU.forEach(function (c, j) { u[c] = String(r[j]); }); u.linha = i + 2;
    u.ativo = u.ativo !== 'nao'; return u;
  }).filter(function (u) { return u.usuario; });
}
function gravarUsuario_(u) {
  const sh = abaUsu_();
  const linha = COLS_USU.map(function (c) { return c === 'ativo' ? (u.ativo ? 'sim' : 'nao') : (u[c] == null ? '' : String(u[c])); });
  if (u.linha) sh.getRange(u.linha, 1, 1, COLS_USU.length).setValues([linha]);
  else sh.appendRow(linha);
}
function publico_(u) { return { usuario: u.usuario, nome: u.nome, perfil: u.perfil, ativo: u.ativo }; }
function criarToken_(u) {
  const exp = Date.now() + VALIDADE_SESSAO_DIAS * 864e5;
  const corpo = u.usuario + '.' + u.versao + '.' + exp;
  return corpo + '.' + assinar_(corpo);
}
// Confere o token e devolve o usuário (ativo), ou null.
function sessao_(token) {
  if (!token) return null;
  const p = String(token).split('.');
  if (p.length !== 4) return null;
  const corpo = p[0] + '.' + p[1] + '.' + p[2];
  if (assinar_(corpo) !== p[3] || Number(p[2]) < Date.now()) return null;
  const u = lerUsuarios_().filter(function (x) { return x.usuario === p[0]; })[0];
  if (!u || !u.ativo || String(u.versao) !== p[1]) return null;
  return u;
}

// ---------- propostas
function aba_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(ABA);
  if (!sh) {
    sh = ss.insertSheet(ABA);
    sh.appendRow(COLS);
    sh.setFrozenRows(1);
    sh.getRange('A:D').setNumberFormat('@');
  }
  if (sh.getRange(1, COLS.length).getValue() !== 'usuario') sh.getRange(1, COLS.length).setValue('usuario');
  return sh;
}
function lerTodas_(sh) {
  const n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, COL_JSON, n - 1, 1).getValues().map(function (r) {
    try { return JSON.parse(r[0]); } catch (e) { return null; }
  });
}
// Dono da proposta: o usuário que salvou; nas antigas (antes do login), o nome do vendedor.
function eDono_(p, u) {
  if (!p) return false;
  if (p.usuario) return p.usuario === u.usuario;
  return String(p.vendedor || '').toLowerCase() === String(u.nome || '').toLowerCase();
}

// ---------- preços e configurações (célula A2 da aba Config)
function lerPrecos_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_CONFIG);
  if (!sh) return null;
  try { return JSON.parse(sh.getRange('A2').getValue()); } catch (e) { return null; }
}
function gravarPrecos_(precos) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(ABA_CONFIG);
  if (!sh) sh = ss.insertSheet(ABA_CONFIG);
  sh.getRange('A1').setValue('Preços e configurações do app (gravados pela aba Administração). Não edite a célula A2 à mão.');
  sh.getRange('A2').setValue(JSON.stringify(precos));
  sh.getRange('A3').setValue('Última alteração: ' + precos.atualizadoEm);
}

function doGet() {
  return resposta_({ ok: true, app: 'M3 Bombas', versao: 2 });
}

// Todas as chamadas do app chegam aqui: { acao, token, ... }
function doPost(e) {
  let c;
  try { c = JSON.parse(e.postData.contents); } catch (x) { return resposta_({ ok: false, erro: 'json' }); }
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return resposta_(acao_(c)); }
  catch (x) { return resposta_({ ok: false, erro: 'falha', detalhe: String(x && x.message || x) }); }
  finally { lock.releaseLock(); }
}

function acao_(c) {
  if (c.acao === 'login') {
    const usuario = String(c.usuario || '').trim().toLowerCase();
    const senha = String(c.senha || '');
    let todos = lerUsuarios_();
    if (!todos.length && usuario === ADMIN_USUARIO && senha.length >= 4) {
      const sal = Utilities.getUuid();
      gravarUsuario_({ usuario: usuario, nome: 'Izaac', perfil: 'admin', ativo: true, sal: sal, hash: hashSenha_(sal, senha), versao: '1', criadoEm: new Date().toISOString() });
      todos = lerUsuarios_();
    }
    const u = todos.filter(function (x) { return x.usuario === usuario; })[0];
    if (!u || !u.ativo || hashSenha_(u.sal, senha) !== u.hash) return { ok: false, erro: 'login' };
    return { ok: true, token: criarToken_(u), usuario: publico_(u) };
  }

  if (c.acao === 'precos') {  // leitura dos preços: qualquer usuário logado
    if (!sessao_(c.token)) return { ok: false, erro: 'sessao' };
    return { ok: true, precos: lerPrecos_() };
  }

  const u = sessao_(c.token);
  if (!u) return { ok: false, erro: 'sessao' };
  const admin = u.perfil === 'admin';

  if (c.acao === 'eu') return { ok: true, usuario: publico_(u) };

  if (c.acao === 'listar') {
    const todas = lerTodas_(aba_()).filter(Boolean);
    return { ok: true, usuario: publico_(u), propostas: admin ? todas : todas.filter(function (p) { return eDono_(p, u); }) };
  }

  if (c.acao === 'salvar') {
    const sh = aba_();
    const atuais = lerTodas_(sh);
    const linhaDe = {};
    atuais.forEach(function (p, i) { if (p && p.id) linhaDe[p.id] = i + 2; });
    let gravadas = 0;
    (c.propostas || []).forEach(function (p) {
      if (!p || !p.id) return;
      delete p.sync;
      const existe = linhaDe[p.id];
      const velha = existe ? (atuais[existe - 2] || {}) : null;
      if (velha && !admin && !eDono_(velha, u)) return;          // vendedor não altera proposta de outro
      if (!velha) { if (!(admin && p.usuario)) { p.usuario = u.usuario; p.vendedor = u.nome; } }
      else if (velha.usuario) { p.usuario = velha.usuario; p.vendedor = velha.vendedor; }
      else { p.vendedor = velha.vendedor; p.usuario = eDono_(velha, u) ? u.usuario : ''; }
      const quando = p.atualizadoEm || p.criadoEm || '';
      if (velha && (velha.atualizadoEm || velha.criadoEm || '') > quando) return; // a da nuvem é mais nova
      const linha = COLS.map(function (col) {
        if (col === 'json') return JSON.stringify(p);
        const v = p[col]; return v == null ? '' : v;
      });
      if (existe) sh.getRange(existe, 1, 1, COLS.length).setValues([linha]);
      else { sh.appendRow(linha); linhaDe[p.id] = sh.getLastRow(); }
      gravadas++;
    });
    return { ok: true, gravadas: gravadas };
  }

  if (c.acao === 'trocarSenha') {
    if (hashSenha_(u.sal, String(c.atual || '')) !== u.hash) return { ok: false, erro: 'senha' };
    if (String(c.nova || '').length < 4) return { ok: false, erro: 'curta' };
    u.sal = Utilities.getUuid(); u.hash = hashSenha_(u.sal, String(c.nova)); u.versao = String(Number(u.versao || 1) + 1);
    gravarUsuario_(u);
    return { ok: true, token: criarToken_(u), usuario: publico_(u) };
  }

  // ---------- daqui para baixo, só administrador
  if (!admin) return { ok: false, erro: 'admin' };

  if (c.acao === 'salvarPrecos') {
    const precos = c.precos;
    if (!precos || !precos.config || !precos.produtos || !precos.produtos.length) return { ok: false, erro: 'precos' };
    precos.atualizadoEm = new Date().toISOString();
    gravarPrecos_(precos);
    return { ok: true, atualizadoEm: precos.atualizadoEm };
  }

  if (c.acao === 'usuarios') return { ok: true, usuarios: lerUsuarios_().map(publico_) };

  if (c.acao === 'salvarUsuario') {
    const d = c.dados || {};
    const usuario = String(d.usuario || '').trim().toLowerCase();
    if (!/^[a-z0-9._-]{2,30}$/.test(usuario)) return { ok: false, erro: 'usuario' };
    const todos = lerUsuarios_();
    let alvo = todos.filter(function (x) { return x.usuario === usuario; })[0];
    if (!alvo) {
      if (String(d.senha || '').length < 4) return { ok: false, erro: 'curta' };
      alvo = { usuario: usuario, versao: '1', criadoEm: new Date().toISOString() };
    }
    if (alvo.usuario === u.usuario && (d.perfil === 'vendedor' || d.ativo === false)) return { ok: false, erro: 'proprio' };
    if (d.nome != null) alvo.nome = String(d.nome).trim() || usuario;
    if (d.perfil === 'admin' || d.perfil === 'vendedor') alvo.perfil = d.perfil;
    if (!alvo.perfil) alvo.perfil = 'vendedor';
    if (d.ativo != null) { if (alvo.ativo !== !!d.ativo) alvo.versao = String(Number(alvo.versao || 1) + 1); alvo.ativo = !!d.ativo; }
    if (alvo.ativo == null) alvo.ativo = true;
    if (d.senha) {
      if (String(d.senha).length < 4) return { ok: false, erro: 'curta' };
      alvo.sal = Utilities.getUuid(); alvo.hash = hashSenha_(alvo.sal, String(d.senha));
      alvo.versao = String(Number(alvo.versao || 1) + 1);  // derruba quem estava logado com a senha antiga
    }
    gravarUsuario_(alvo);
    const r = { ok: true, usuarios: lerUsuarios_().map(publico_) };
    if (alvo.usuario === u.usuario) { r.token = criarToken_(alvo); r.usuario = publico_(alvo); }  // o próprio admin continua logado
    return r;
  }

  return { ok: false, erro: 'acao' };
}
