# Casa Orla | Catálogo demonstrativo

Abra o arquivo **dist/index.html** depois de baixar ou clonar o repositório. O catálogo funciona sem instalação ou servidor. As fotos, os produtos e os preços da Casa Orla são ilustrativos.

## Demonstração em um minuto

1. Clique em **Explorar catálogo** e escolha **Mesa posta**.
2. Busque por `ambar`, abra o produto e mostre como a ficha responde às dúvidas sobre material e capacidade.
3. Adicione o produto à lista e aumente a quantidade para duas unidades.
4. Use **Simular pedido** para mostrar a mensagem que o cliente poderia enviar, com itens, quantidades e subtotal.

## Adaptação para um cliente

1. Faça uma cópia da pasta. Confirme nome da empresa, categorias, canal de atendimento e os primeiros produtos.
2. Em **dist/catalogo.js**, edite marca, textos, foto de capa e produtos. Mantenha um `id` único e estável para cada produto. Informe o preço em centavos: `8990` aparece como **R$ 89,90**.
3. Coloque as fotos na pasta **dist/assets** e atualize os caminhos. Use fotos autorizadas pelo cliente, com enquadramento consistente. Em **dist/styles.css**, altere as cores nas variáveis do início do arquivo. Atualize o título, a descrição e os textos iniciais em **dist/index.html** para refletir a nova marca.
4. Para o fluxo de WhatsApp, preencha **whatsapp** com DDI, DDD e número, usando só dígitos, e troque **demonstracao** para `false`. O botão passa a abrir a conversa com a mensagem preenchida. A pessoa revisa a mensagem e decide se quer enviar.
5. Teste no celular a busca, os filtros, os preços, as quantidades e o botão com o contato oficial da loja. Publique os arquivos estáticos e abra o link publicado para repetir o teste.

A lista fica salva no navegador que a criou. O subtotal considera apenas os itens. Confirmação de estoque, frete, pagamento e entrega é feita no atendimento. A manutenção do catálogo é feita pelo arquivo de dados.

## Publicação pelo Netlify

Importe este repositório do GitHub e escolha a branch `main`. O arquivo
`netlify.toml` define `dist` como a pasta de publicação. Deixe o comando
de build em branco. Para testar localmente, abra `dist/index.html`.
