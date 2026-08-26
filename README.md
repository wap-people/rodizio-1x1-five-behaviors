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

O repositório é `wap-people/rodizio-1x1-five-behaviors` e o site fica em
`https://wap-people.github.io/rodizio-1x1-five-behaviors/`.

Primeira vez:

```bash
git remote add origin https://github.com/wap-people/rodizio-1x1-five-behaviors.git
git push -u origin main
```

O próprio workflow liga o Pages no primeiro deploy (`enablement: true`), então
não é preciso mexer em Settings. Se por algum motivo falhar ali, o caminho
manual é **Settings → Pages → Source: GitHub Actions**.

A partir daí, todo push na `main` roda os testes, compila o CSS e publica. Se
alguma invariante do rodízio quebrar, o deploy não acontece — o site no ar
continua sendo a última versão que passou.

O workflow publica um diretório `_site` montado com `index.html`, `config.js`,
`assets/` e `src/` — só o que o navegador precisa. Publicar a raiz levaria junto
o `node_modules` instalado pelo `npm ci` e estouraria o limite do artefato.

---

## Privacidade dos dados das pessoas

O repositório é público e o site também. Vale saber exatamente o que isso expõe.

**O que está no repositório:** os 30 nomes, os cargos e o nível (Diretoria,
Head, Gerência). É informação equivalente à que já está no LinkedIn de cada um.

**O que não está:** nenhum e-mail em texto plano. Os endereços ficam em Base64
no campo `e64` de `src/data/participants.js`, decodificados só na hora de montar
o `mailto:` ou o link do Teams.

Seja honesto sobre o que isso resolve e o que não resolve:

- **Resolve** a coleta automática. Robôs de harvesting varrem HTML e código
  procurando o padrão `alguma-coisa@dominio`. Uma busca por `wap.ind.br` no
  código do repositório ou no fonte da página não devolve nenhum endereço. É o
  que evita a lista virar insumo de disparo de phishing em massa.
- **Não resolve** alguém decidido. Quem abrir o `participants.js` e decodificar
  o Base64 tem os 30 endereços em um minuto. Base64 não é criptografia.

**Proteção de verdade, se as notas dos 1x1 forem sensíveis:** fechar o site
atrás de login. O caminho é o Firebase Authentication com provedor Microsoft (o
tenant da WAP já é Entra ID) e a regra do Firestore trocada para
`if request.auth != null`. Aí nem os e-mails nem as notas ficam acessíveis sem
uma conta @wap.ind.br. Custa uma tela de login e um registro de app no Entra ID
— o que exige o TI.

Para gerar o `e64` de alguém que entrar depois:

```bash
npm run email -- fulano.sobrenome@wap.ind.br
```

O mesmo comando faz o caminho inverso: passe o `e64` e ele devolve o e-mail.

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

**Alguém entrou na liderança** → gere o e-mail codificado com
`npm run email -- fulano@wap.ind.br` e adicione a linha em
`src/data/participants.js` com um id novo (nunca reaproveite id antigo).
Depois `npm test` e push.

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
  data/participants.js     os 30 gestores (e-mails em Base64)
  core/schedule.js         round-robin, datas, organizadores (puro e testado)
  core/store.js            persistência: local | firebase | memory
  core/integrations.js     Teams, .ics, .csv
  ui/                      ícones, formatação, views
  app.js                   estado, ações, render
  styles/app.css           fonte do CSS
scripts/email.mjs          e-mail <-> Base64
tests/schedule.test.mjs    invariantes do rodízio e da lista de pessoas
.github/workflows/         testes + deploy no Pages
```
