/**
 * Converte e-mail <-> e64 para a lista em src/data/participants.js.
 *
 *   npm run email -- alguem@wap.ind.br      → imprime o e64
 *   npm run email -- YWxndWVtQHdhcC5pbmQuYnI= → imprime o e-mail
 *
 * Base64 aqui não é segurança: é só para o repositório público não carregar
 * 30 endereços em texto plano, que é o que os coletores automáticos varrem.
 */
const arg = process.argv[2];

if (!arg) {
  console.error('Uso: npm run email -- alguem@wap.ind.br');
  process.exit(1);
}

if (arg.includes('@')) {
  console.log(Buffer.from(arg.trim(), 'utf8').toString('base64'));
} else {
  console.log(Buffer.from(arg.trim(), 'base64').toString('utf8'));
}
