# Nuvem da equipe com login

A nuvem é a planilha Google **Propostas M3 Bombas** (conta da M3). O app manda para ela cada proposta
salva, lê os preços e confere o login. Sem internet, o app continua salvando no aparelho e envia depois.

## Como funciona o acesso
- Cada pessoa entra com **usuário e senha** (tela de login ao abrir o app). Não existe mais senha no link.
- **Vendedor** vê só as propostas dele. **Administrador** vê as de todos e tem a aba **Administração**
  (usuários, valores fixos e kits), que salva para a equipe toda.
- As propostas antigas (de antes do login) ficam com quem aparece como vendedor nelas.
- O aparelho fica logado (até 1 ano). Ao trocar a senha ou desativar alguém, o acesso dessa pessoa cai na hora.
- Ao tocar em **Sair**, o aparelho apaga a cópia local das propostas (elas continuam na nuvem).
  Se alguma ainda não subiu, o app não deixa sair até a internet voltar.

## Atualizar o código da nuvem (quando o app mudar)
1. Abra o projeto do Apps Script da planilha (Extensões > Apps Script, ou script.google.com).
2. Apague tudo em `Código.gs` e cole o conteúdo de `nuvem/Codigo.gs` deste repositório.
3. Na linha `const ADMIN_SENHA_INICIAL = 'TROQUE-ESTA-SENHA';`, coloque a senha do primeiro acesso do
   administrador (só letras e números). Ela só vale enquanto a aba **Usuarios** estiver vazia.
4. Salve e publique como **Implantar > Gerenciar implantações > lápis > Versão: Nova versão > Implantar**.
   O endereço (`/exec`) continua o mesmo.

## Primeiro acesso
1. Abra o app e entre com usuário **izaac** e a senha do passo 3. A aba **Usuarios** é criada com você
   como administrador.
2. Em **Administração > Usuários**, crie os vendedores (usuário, nome que sai no PDF, senha) e passe a
   senha para cada um.
3. Troque a sua senha ali mesmo (toque no seu usuário, digite a senha nova, Salvar).

## Bom saber
- Na planilha, a coluna `json` da aba Propostas é a proposta completa: não edite nem apague.
- A aba **Usuarios** guarda só um código da senha (não a senha). Não edite à mão.
- A aba **Config** guarda os preços salvos pela Administração. Vale o mais recente entre ela e o
  arquivo `precos.json` do site.
- Se alguém editar a mesma proposta em dois aparelhos, fica a versão salva por último.
