# App de orçamento M3 Bombas — onde paramos (21/11/2026)

## O que é
App web (PWA) que substitui as planilhas "CÁLCULO DE PERDA DE CARGA.xls" e "Proposta Bomba Solar - Atualizada.xlsm".
O vendedor preenche só L (comprimento, m), Q (vazão, m³/h), D (diâmetro interno, mm) e Dn (desnível, m), além do cliente e km (pedido do Izaac em 21/11);
o app calcula a perda de carga e a AMT, lista os kits que atendem e gera o PDF da proposta.
Funciona sem internet depois de aberto uma vez com internet.

## Arquivos
- index.html — o app inteiro (HTML, CSS e JS num arquivo só)
- precos.json — kits (copiados da aba PRODUTOS da planilha) e valores fixos (módulo 950, estrutura 150/módulo, kit sup. 200, kit caneta 500, instalação 125/módulo, km 2,50, desconto à vista 5%, 5 h de sol, folga 20% na altura, perdas localizadas 5 mca)
- jspdf.umd.min.js — gerador de PDF (jsPDF 2.5.1), local para funcionar offline
- sw.js — service worker (cache offline). Ao mudar qualquer arquivo exceto precos.json, aumentar a VERSAO
- manifest.webmanifest, icon-192.png, icon-512.png — instalação na tela inicial
- header.jpg, foto.jpg — imagens da proposta (mesmas da planilha)

## Regras de cálculo (iguais à planilha)
- Velocidade = 354 × Q / D² (D em mm); limite 2,5009 m/s
- Perda de carga (Hazen-Williams, C=140) = 10,643 / (D/1000)^4,87 × ((Q/3600)/140)^1,852 × L
- AMT = perda + Dn + perdas localizadas (5 mca) — igual à aba "Bomba Centrífuga" da planilha
- Kit "atende" se: MCA máx ≥ AMT × (1+folga) e vazão/h (MCA=0) ≥ Q × 1000. O tipo (caneta/superfície) vem do kit escolhido
- Valores: produto + módulos×950 + estrutura×módulos + kit montagem (caneta ou superfície) + instalação (125×módulos) + km×2,50; à vista = total × 0,95
- Limitação: a tabela só tem vazão com altura zero (sem curva da bomba); a indicação de kit é um filtro inicial

## Testado
Exemplo: L 200 m, Q 3 m³/h, D 29 mm, Dn 50 m, 100 km,
kit "CANETA AT -1.500W- 2 CV- 4 PLACAS" → AMT 68,8 mca, total R$ 9.450,00 (4x), R$ 8.977,50 à vista. Igual à planilha.
Testado com internet desligada: abre, calcula, salva proposta e baixa PDF.

## Onde as coisas ficam
- Propostas: em cada aparelho (localStorage), botão "Exportar planilha (CSV)" na aba Propostas salvas
- Preços: precos.json do site; a aba Preços abre colocando #precos no fim do endereço e permite baixar um precos.json novo

## Próximos passos (pendentes)
1. Publicar no GitHub Pages: repositório izaacmartinsc-ops/orcamento-m3 (público), branch main, pasta raiz
2. Domínio: na HostGator (cPanel > Editor de Zona) criar CNAME  orcamento -> izaacmartinsc-ops.github.io
   e no GitHub (Settings > Pages) colocar o domínio personalizado orcamento.m3tech.com.br e marcar "Enforce HTTPS"
   (HTTPS é obrigatório para o modo offline). Criar o arquivo CNAME na raiz com: orcamento.m3tech.com.br
3. Instalar nos aparelhos do Izaac, Heitor e Marcos (abrir com internet e "Adicionar à tela inicial")
4. Opcional: juntar as propostas de todos num lugar só quando houver internet; curvas das bombas para indicação exata
