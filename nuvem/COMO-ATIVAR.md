# Como ativar a nuvem da equipe (uma vez só, uns 10 minutos)

A nuvem é uma planilha Google na conta do Izaac. O app manda para ela cada proposta salva e
puxa as propostas de todos. Sem internet, o app continua salvando no aparelho e envia depois.
É grátis.

## 1. Criar a planilha
1. No computador, abra https://sheets.google.com com a conta da M3 (a que vai ser dona dos dados).
2. Clique em **Em branco** e dê o nome **Propostas M3 Bombas**.

## 2. Colar o código
1. Na planilha, menu **Extensões > Apps Script**. Abre uma aba nova com um arquivo `Código.gs`.
2. Apague tudo o que estiver lá e cole o conteúdo do arquivo `nuvem/Codigo.gs` deste repositório.
3. Na linha `const CHAVE = 'TROQUE-ESTA-CHAVE';`, troque `TROQUE-ESTA-CHAVE` por uma senha da equipe,
   só com letras e números, sem espaço (exemplo: `bombasM3x2026`). Guarde essa senha.
4. Clique no disquete (**Salvar projeto**).

## 3. Publicar (implantar)
1. Botão azul **Implantar > Nova implantação**.
2. Na engrenagem ao lado de "Selecione o tipo", escolha **App da Web**.
3. Preencha:
   - **Executar como:** Eu (sua conta)
   - **Quem pode acessar:** Qualquer pessoa
4. Clique em **Implantar**. O Google pede autorização: **Autorizar acesso**, escolha a sua conta.
   Se aparecer "O Google não verificou este app", clique em **Avançado** e depois em
   **Acessar Propostas M3 Bombas (não seguro)**. É normal: o app é seu e só mexe nesta planilha.
5. Copie o **URL do app da Web** (termina em `/exec`) e mande para o Claude no projeto.
   O Claude coloca esse endereço no app e publica.

"Qualquer pessoa" só quer dizer que o app consegue falar com a planilha sem login do Google.
Sem a senha da equipe, ninguém lê nem grava nada.

## 4. Ligar cada aparelho
Depois que o Claude avisar que publicou, mande para cada vendedor este link (troque SENHA pela sua):

    https://izaacmartinsc-ops.github.io/orcamento-m3/#nuvem=SENHA

Ao abrir uma vez, o aparelho guarda a senha e o link fica limpo. Também dá para digitar a senha
na aba **Propostas salvas**, no campo "Chave da equipe".

As propostas que cada aparelho já tinha sobem sozinhas na primeira vez.

## Bom saber
- A planilha mostra uma linha por proposta (número, data, vendedor, cliente, kit, total). A última
  coluna (`json`) é a proposta completa: não edite nem apague essa coluna.
- Se alguém editar a mesma proposta em dois aparelhos, fica a versão salva por último.
- Para trocar a senha: mude a linha `CHAVE` no Apps Script, salve e faça
  **Implantar > Gerenciar implantações > lápis > Versão: Nova versão > Implantar**.
  Depois mande o link novo para a equipe.
- Se mudar o código do Apps Script, sempre publique como **Nova versão** (passo acima),
  senão o endereço continua rodando o código antigo.
