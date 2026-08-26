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
npm run email -- <x> # e-mail <-> Base64 do campo e64
```

Sem bundler e sem framework: são ES modules nativos. `npm run dev` existe
porque `import` não funciona em `file://` — não abra o `index.html` clicando.

## Arquitetura

```
index.html            estrutura fixa (header, nav, dialogs). Não gera conteúdo.
config.js             o que a área de People edita: datas, link do Drive, driver de storage
src/
  data/participants.js  os 30 gestores. Fonte da verdade dos ids. E-mails em `e64` (Base64).
                        `mail(p)` e o unico ponto de decodificacao.
  core/schedule.js      round-robin, slots (data+hora), organizadores. Puro, sem DOM. É o que os testes cobrem.
  core/firebase.js      carrega o SDK uma vez so (Firestore e Auth compartilham a instancia)
  core/store.js         persistência plugável: local | firebase | memory
  core/auth.js          login sem senha por link de e-mail; barra fora de @wap.ind.br
  core/integrations.js  deep links do Teams, .ics, .csv
  ui/icons.js           SVGs inline (nunca emoji como ícone)
  ui/format.js          datas pt-BR e escape de HTML
  ui/views.js           cada tela é `(S) => string`. Sem estado próprio.
  app.js                estado S, ações em window.App, ciclo de render
  styles/app.css        fonte do CSS (compilado para assets/app.css)
```

Fluxo: `boot()` resolve o login → `start()` monta `config.js` + `store` →
estado `S` → `rebuild()` monta o plano → `render()` desenha a view.
Toda ação muda `S`, persiste e chama `render()`.

`boot()` so exige login quando o driver e `firebase`. Se o SDK nao carregar
(CDN bloqueada), cai para modo local **sem** tela de login: prender a pessoa
num login que nao vai funcionar e pior que nao compartilhar.

## Invariantes que não podem quebrar

Estão em `tests/schedule.test.mjs`. Se você mexer em `core/schedule.js`,
rode os testes antes de qualquer coisa.

1. Cada par de participantes se encontra **exatamente uma vez** no programa.
2. Dentro de uma rodada **ninguém aparece em dois encontros** — é o que permite
   as 15 duplas acontecerem em paralelo no mesmo horário.
3. Cada par tem **um único organizador**, e a carga de convites fica equilibrada.
3b. Cada rodada tem **uma data E um horário** (`plan[k].time`). Com dois
   horários por dia, `cfg.time` deixou de existir — quem usar o horário global
   no lugar do horário da rodada agenda tudo no mesmo turno e derruba a
   invariante 2 na prática, mesmo com os pares corretos.
4. `pairKey(a,b)` é sempre `menor-maior`. Os registros de encontros concluídos
   são gravados por essa chave: mudar o formato **apaga o histórico de todo mundo**.
5. Ids em `participants.js` são permanentes. Nunca reaproveite o id de quem saiu —
   use "Desativar" na interface, que preserva o histórico.
6. **Nenhum e-mail em texto plano no repositório.** O campo é `e64` (Base64) e
   só `mail(p)` decodifica; todo o resto do sistema lê via `S.mailOf(id)`.
   Não é segurança — é para o código público não virar lista de phishing
   (o raciocínio inteiro está em "Privacidade" no README). Gere com
   `npm run email -- <endereco>`.
7. **E-mails não se repetem.** Endereço duplicado manda o 1x1 de uma pessoa
   para outra — foi o defeito que veio na planilha de origem. Há teste.
8. **Chamada ao Firestore sempre com timeout.** O SDK nao rejeita quando o
   backend esta inacessivel: repete para sempre e o app fica no "Carregando"
   eternamente, sem que nenhum try/catch rode. Use `withTimeout` de
   `core/firebase.js`.
9. **Escrita que falha nao pode falhar calada.** Se `saveStatus`/`saveConfig`
   engolir o erro, o gestor clica em Registrar 1x1, nada acontece e o registro
   some. O store cai para local, avisa por toast e preserva o dado.
10. **`requireLogin` em config.js e a regra do Firestore andam juntos.** Sao
   as duas pontas do mesmo acordo: login com regra aberta e atrito sem
   protecao; regra fechada sem login trava todo mundo na primeira leitura.
   Mexeu em um, mexa no outro. Hoje: `false` + regra aberta, por decisao da
   area de People.
11. **`email_verified` na regra fechada nao e enfeite.** O Firebase obriga
   o provedor E-mail/senha ligado junto com o link; sem essa clausula qualquer
   um se cadastra com senha num endereco corporativo inventado e le as notas.

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
