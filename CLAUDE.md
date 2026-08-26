# Instruções do projeto — Rodízio 1x1 · The Five Behaviors

Site estático que organiza os encontros 1x1 da liderança WAP em cima do
relatório comparativo The Five Behaviors (conduzido pela Long Vision).
30 gestores, todos com todos: **435 encontros**.

## Comandos

```bash
npm install          # uma vez
npm run dev          # servidor local em http://localhost:5173
npm test             # invariantes do rodízio (obrigatório antes de commitar)
npm run build:css    # gera assets/app.css a partir de src/styles/app.css
npm run watch:css    # o mesmo, em modo observação, durante o desenvolvimento
npm run check        # test + build
```

Sem bundler e sem framework: são ES modules nativos. `npm run dev` existe
porque `import` não funciona em `file://` — não abra o `index.html` clicando.

## Arquitetura

```
index.html            estrutura fixa (header, nav, dialogs). Não gera conteúdo.
config.js             o que a área de People edita: datas, link do Drive, driver de storage
src/
  data/participants.js  os 30 gestores. Fonte da verdade dos ids.
  core/schedule.js      round-robin, datas, organizadores. Puro, sem DOM. É o que os testes cobrem.
  core/store.js         persistência plugável: local | firebase | memory
  core/integrations.js  deep links do Teams, .ics, .csv
  ui/icons.js           SVGs inline (nunca emoji como ícone)
  ui/format.js          datas pt-BR e escape de HTML
  ui/views.js           cada tela é `(S) => string`. Sem estado próprio.
  app.js                estado S, ações em window.App, ciclo de render
  styles/app.css        fonte do CSS (compilado para assets/app.css)
```

Fluxo: `config.js` + `store` → estado `S` → `rebuild()` monta o plano →
`render()` desenha a view. Toda ação muda `S`, persiste e chama `render()`.

## Invariantes que não podem quebrar

Estão em `tests/schedule.test.mjs`. Se você mexer em `core/schedule.js`,
rode os testes antes de qualquer coisa.

1. Cada par de participantes se encontra **exatamente uma vez** no programa.
2. Dentro de uma rodada **ninguém aparece em dois encontros** — é o que permite
   as 15 duplas acontecerem em paralelo no mesmo horário.
3. Cada par tem **um único organizador**, e a carga de convites fica equilibrada.
4. `pairKey(a,b)` é sempre `menor-maior`. Os registros de encontros concluídos
   são gravados por essa chave: mudar o formato **apaga o histórico de todo mundo**.
5. Ids em `participants.js` são permanentes. Nunca reaproveite o id de quem saiu —
   use "Desativar" na interface, que preserva o histórico.

## Padrão visual (WAP × WAAW by ALOK)

- Tipografia: **Segoe UI Variable** com os fallbacks já definidos em `app.css`.
  Nunca Inter, Roboto ou Poppins.
- Cores de marca: amarelo WAP `#FFB400`, âmbar de acento `#FFB023`, lima WAAW `#D7FF1A`.
  Base grafite/preto. Os tokens estão em `:root` — use as variáveis, não hex solto.
- **Marca ≠ semáforo.** Sucesso é `#4ADE80`, aviso `#FBBF24`, crítico `#F87171`.
  O lima de marca nunca significa "concluído".
- Estado nunca depende só de cor: sempre cor + ícone + rótulo (funciona no modo B&W
  e para daltônicos).
- Ícones: SVG inline em `ui/icons.js`. **Nunca emoji** como ícone de UI.
- Motion: só `transform` e `opacity`, 120–300ms, e `prefers-reduced-motion` respeitado.

## Cuidados ao editar

- **Escape de HTML**: qualquer texto que venha do usuário (notas, e-mails corrigidos)
  passa por `esc()` de `ui/format.js` antes de entrar num template.
- **Fuso**: datas são strings `YYYY-MM-DD` de ponta a ponta, justamente para não
  esbarrar em `Date` e fuso. O `.ics` converte para UTC assumindo São Paulo em
  UTC−3 fixo (o Brasil não tem horário de verão desde 2019). Se isso mudar,
  ajuste `TZ_HOURS`/`TZ_OFFSET` em `core/integrations.js`.
- **Deep link do Teams**: o formato é o documentado pela Microsoft. Não invente
  parâmetros — `location`, por exemplo, não é suportado.
- **Handlers inline** (`onclick="App.x()"`) são intencionais neste tamanho de app.
  Se as telas crescerem, migre para delegação de eventos em vez de misturar os dois.
- **GitHub Pages serve em subcaminho** (`/nome-do-repo/`): todos os caminhos são
  relativos. Nunca use `/assets/...` com barra inicial.

## Escopo do produto

Se pedirem para mudar quem encontra quem (por exemplo, só Diretoria × Gerência
em vez de todos com todos), o ponto de alteração é a lista passada para
`buildPlan()` em `app.js` — e aí `buildRounds` precisa de uma variante bipartida,
com testes novos. Não force o round-robin atual a fazer isso.
