# Rodízio 1x1 · The Five Behaviors — WAP

Sistema de agendamento e acompanhamento dos encontros 1x1 entre os 30 líderes da
WAP, a partir do relatório comparativo **The Five Behaviors** conduzido pela
**Long Vision**.

Todos com todos são **435 encontros**. Em vez de deixar cada pessoa marcar por
conta própria, o sistema gera um **rodízio round-robin**: 29 rodadas, 15 duplas
em paralelo por rodada, sem nenhum choque de agenda. Cada pessoa tem exatamente
um encontro por rodada e, ao fim, conversou com os 29 colegas.

---

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:5173
```

`npm run dev` é necessário porque o projeto usa ES modules nativos — abrir o
`index.html` com dois cliques (`file://`) não funciona.

```bash
npm test         # valida as invariantes do rodízio
npm run build:css
```

---

## Publicando no GitHub Pages

1. Crie o repositório e suba o código:

```bash
git init
git add .
git commit -m "Rodizio 1x1 Five Behaviors"
git branch -M main
git remote add origin https://github.com/<org>/<repo>.git
git push -u origin main
```

2. No GitHub: **Settings → Pages → Source: GitHub Actions**.

3. Pronto. Todo push na `main` roda os testes, compila o CSS e publica. Se algum
   teste do rodízio falhar, o deploy não acontece.

O endereço fica em `https://<org>.github.io/<repo>/`.

> **Repositório público expõe nomes e e-mails corporativos.** Se isso for um
> problema, use repositório privado — mas o GitHub Pages a partir de repositório
> privado exige plano Enterprise. As alternativas são hospedar na intranet, ou
> publicar em repositório público sem os dados reais e carregar `participants.js`
> de outra origem.

---

## Onde ficam os dados

O `driver` em `config.js` decide:

| driver | Compartilhado? | Precisa configurar? |
|---|---|---|
| `local` (padrão) | Não — cada pessoa vê só os próprios registros | Nada |
| `firebase` | Sim — painel único, em tempo real | Projeto Firebase |

Para uma dinâmica de 30 pessoas, `local` só serve para testar. **Quem vai usar de
verdade quer o `firebase`**, senão o gestor A não enxerga o que o gestor B marcou.

### Ligando o Firestore (10 minutos, plano gratuito)

1. Em [console.firebase.google.com](https://console.firebase.google.com), crie um
   projeto e depois um app **Web**. Copie o objeto `firebaseConfig`.
2. **Build → Firestore Database → Criar banco**, modo produção.
3. Em `config.js`, cole as chaves e troque o driver:

```js
storage: {
  driver: 'firebase',
  firebase: {
    apiKey: 'AIza…',
    authDomain: 'seu-projeto.firebaseapp.com',
    projectId: 'seu-projeto',
    storageBucket: 'seu-projeto.appspot.com',
    messagingSenderId: '000000000000',
    appId: '1:000000000000:web:abc123',
    collection: 'rodizio',
    document: 'estado'
  }
}
```

4. Em **Firestore → Regras**, cole:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rodizio/estado {
      allow read, write: if true;
    }
  }
}
```

**Leia isto antes de usar essa regra:** ela libera leitura e escrita para
qualquer pessoa que conheça a URL. Para uma dinâmica interna com link não
divulgado, costuma ser aceitável — mas não é segurança de verdade, e os dados
gravados são nomes, e-mails corporativos e notas dos 1x1. Se as notas puderem
ser sensíveis, ative Firebase Authentication com login Microsoft (o tenant da
WAP já é Entra ID) e troque a regra por `if request.auth != null`. Vale
conversar com o TI antes de subir.

Se o Firestore estiver mal configurado ou fora do ar, o sistema avisa na tela e
continua funcionando em modo local em vez de quebrar.

---

## Uso no dia a dia

**Meus 1x1** — sua agenda pessoal: com quem, quando, quem dispara o convite,
o que já foi feito. Filtros por em aberto, próximos, atrasados e concluídos.

**Rodízio** — as 29 rodadas com data, progresso e os pares de cada uma.

**Matriz geral** — todos × todos num mapa de calor. Clicar numa célula registra
o encontro.

**Participantes** — ranking de progresso, correção de e-mail e ativar/desativar
quem entra ou sai do programa.

**Configuração** — datas, horário, duração, link dos relatórios e exportações.

### Sobre o Teams

O botão **Teams** abre a tela de novo agendamento **já preenchida** com título,
convidado, data, horário e a pauta dos Five Behaviors — a pessoa confere e envia,
e o link da reunião é gerado pelo próprio Teams.

Criar a reunião sem nenhum clique exigiria o Microsoft Graph com app registrado
no Entra ID, consentimento de administrador e um backend para guardar o segredo —
nada disso cabe em site estático. O caminho do deep link entrega quase o mesmo
resultado sem depender do TI.

Para não gerar convite duplicado, cada par tem **um organizador definido pelo
sistema**, com a carga distribuída (entre 13 e 17 convites por pessoa). O `.ics`
serve para reservar os horários na agenda; ele não cria a sala.

---

## Manutenção

**Alguém entrou na liderança** → adicione em `src/data/participants.js` com um id
novo (nunca reaproveite id antigo) e faça o push.

**Alguém saiu** → use *Desativar* na tela Participantes. O histórico é preservado
e o rodízio se recalcula.

**Mudar datas ou horário** → tela Configuração, ou os `defaults` em `config.js`.

**Zerar tudo para um novo ciclo** → *Configuração → Zerar todos os registros*.

Detalhes de arquitetura e as regras que não podem ser quebradas estão em
[`CLAUDE.md`](./CLAUDE.md).

---

## Estrutura

```
index.html                 estrutura fixa da página
config.js                  configuração da implantação
assets/                    logos + app.css compilado
src/
  data/participants.js     os 30 gestores
  core/schedule.js         round-robin, datas, organizadores (puro e testado)
  core/store.js            persistência: local | firebase | memory
  core/integrations.js     Teams, .ics, .csv
  ui/                      ícones, formatação, views
  app.js                   estado, ações, render
  styles/app.css           fonte do CSS
tests/schedule.test.mjs    invariantes do rodízio
.github/workflows/         testes + deploy no Pages
```
