# Arena Pass — plataforma demonstrativa de ingressos

Projeto de portfólio que simula uma plataforma de venda de ingressos de futebol com **estádio 3D interativo**.
Clubes, estádio, preços e disponibilidade são fictícios. Nenhuma venda, cadastro ou pagamento é realizado.

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/ para publicar
```

## Destaques

- **Estádio 3D procedural** (React Three Fiber + Three.js): gerado por código a partir de um perfil de arquibancada
  varrido ao longo de um retângulo arredondado — dois anéis, camarotes, cobertura translúcida, fachada e mais de 16 mil
  cadeiras instanciadas. Nada é imagem estática.
- **15 setores selecionáveis** (Norte, Sul, Leste, Oeste, cantos, anéis inferior/superior, VIP Prime e camarotes),
  com cores por estado (disponível, VIP, selecionado, esgotado) e transição suave de câmera.
- **Visão do assento**: a prévia no painel é renderizada na hora a partir de um assento do setor; o botão
  "Ver do assento em 3D" leva a câmera até lá e permite olhar ao redor.
- **Fluxo de compra simulado**: quantidade → mapa de assentos (com sugestão automática) → resumo com inteira/meia
  e taxa → confirmação com ingressos ilustrativos.
- **Agenda com filtros** por competição, adversário e preço, e uma **página por jogo** com preço de cada setor
  (dá para comprar sem passar pelo 3D).
- **Meus ingressos**: pedidos guardados no navegador, com impressão, arquivo de calendário (.ics) e cancelamento.
- **Sócio** (simulado) com desconto no resumo e guia **Dia de jogo** com portões, transporte e dúvidas.
- Mapa de assentos navegável pelas setas do teclado.
- Responsivo: painéis viram *bottom sheets* no celular e a câmera se adapta ao formato da tela.

## Estrutura

```
src/
  lib/geometry.js      geometria paramétrica do estádio (borda, perfis dos anéis)
  data/sectors.js      setores, layout das cadeiras, enquadramentos de câmera
  data/matches.js      times, jogos, preços e disponibilidade (determinísticos)
  data/content.js      portões, planos de sócio, dúvidas e retrospecto fictícios
  store.js, account.js compra em andamento (aba) e pedidos/plano (navegador)
  three/               cena 3D, câmera, captura da visão do setor, texturas
  pages/               Home, Jogo, Estádio, Assentos, Resumo, Confirmação, Meus ingressos, Guia, Sócio
```
