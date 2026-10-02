# Catálogo coletivo

Um catálogo coletivo de livros lidos. Qualquer pessoa navega pelo catálogo; quem está logado marca livros como lidos, com data, nota e resenha. Os livros vêm do OpenLibrary.

Discussões e decisões em detalhe: [DISCUSSION.md](DISCUSSION.md).

## Como rodar

```sh
docker compose up
```

A aplicação sobe em http://localhost:3000. Na primeira execução o banco é criado, migrado e populado com dados de exemplo.

Usuários de exemplo (senha `password`): `cecilia@example.com`, `bruno@example.com`, `ana@example.com`.

Testes:

```sh
docker compose run --rm web bundle exec rspec
```

**Stack:** Ruby 3.3.9, Rails 8.1, PostgreSQL 16, React + TypeScript via Inertia.js (Vite, Tailwind), RSpec + WebMock, Pundit, Faraday, Kaminari.

## Decisões técnicas

### Cadastro duplicado de livros
Livros registrados no catálogo possuem uma identificação externa `external_id` única `unique` na tabela `books` que representa sua identificação no serviço externo (OpenLibrary). Esse valor é usado como referência para garantir que o mesmo livro não seja cadastrado duas vezes.

### Indisponibilidade ou resposta vazia do OpenLibrary
- **Resposta vazia** (status 200, nenhum resultado): o modal mostra "Nenhum livro encontrado".
- **Indisponível** (timeout, erro de conexão, 5xx, 429 ou JSON inválido): a busca responde 503 e o modal avisa que o OpenLibrary está fora do ar; adicionar um livro novo não cria nada.

### Acesso ao `/books.json`
Público: são os mesmos dados da página inicial, que já é pública. Somente leitura, sem dados de usuário, com os mesmos filtros e paginação da home e limite de 60 requisições por minuto.

```sh
curl "http://localhost:3000/books.json?q=tolkien&field=author"
```

### Edição do livro pelo usuário que o registrou
Na descrição do projeto é mencionado que Cecília volta à plataforma e faz edições o livro que registrou. Acredito que dados como titulo, ano de publicação, gênero deveriam ser somente leitura já que não parece fazer muito sentido alterá-los uma vez que são puxados da Open Library com dados já corretos.

Considerando isso, uma vez que o usuário registra um livro que não havia no catálogo, este passa a fazer parte do acervo, mesmo que o mesmo usuário remova dos seus livros lidos. Os dados abertos para edição ficam na tabela pivot, responsável pela associação entre `books` e `users`, e são eles: lido em (`read_on`), nota (`rate`) e resenha (`review`)

# A lista paginada de livros
Ela é ordenada por livros lidos mais recentemente, essa regra se dá por uma coluna chamada `last_read_at` na tabela `books`. Essa tabela é alimentada TODA vez que um livro novo é registrado. Eu escolhi ir por esse caminho pra manter uma consistência de dados na regra de ordenação. No futuro, em um cenário onde a gravação em disco seja muito pesada, é provavel que essa coluna deva ter seu dado computado através de um job, melhorando assim a performance em detrimento de consisntencia. 

### Arquitetura
- **Rails decide, React mostra**: dados, regras e permissões ficam no Rails; o React recebe tudo pronto como props do Inertia (inclusive se o usuário pode editar algo).
- **OpenLibrary pelo backend** (como sugerido, usando Faraday): o navegador envia só o `external_id` do livro escolhido e o servidor busca os dados de novo, garantindo integridade dos dados de cada livro.
- **Autenticação** nativa do Rails 8 ao invés de outra gem como Devise. Os controllers ficam no app, renderizando páginas pelo Inertia sem sobrescrever nada.
- **Autorização com Pundit**: como o livro é compartilhado, "editar/remover um livro" significa editar/remover a sua leitura, e só o dono pode fazer isso.
- **Filtros**: o select da busca escolhe o campo filtrado (Autor, Gênero ou Ano). A lista é ordenada pela leitura mais recente e paginada com Kaminari, 9 por página.


## Com mais tempo

1. Melhorar registro de usuário:
  - No formulário, pedir confirmação e complexidade de senha 
  - Confirmação por email
  - Recuperação de senha

2. Capas independentes do OpenLibrary, salvando elas num serviço próprio.

3. Adicionar outros serviços pra manter o app redundante em caso de indisponibilidade do OpenLibrary.

4. Modal de confirmação na hora de marcar como não lido e soft delete - hoje o sistema deleta o registro na tabela pivot mandando nota e resenha pro espaço.

5. Também atualizar `last_read_at` quando o usuário editar seu read_on para uma data mais recente que a atual. Ex.: A pessoa leu o livro de novo - deve mostrar no topo do catálogo.

## Uso de IA
Usei o Claude Code como meu par em pair-programming durante o projeto. 

- **Plan mode** para cada funcionalidade maior: a IA escrevia o plano e me fazia as perguntas em aberto; só depois da minha aprovação começava a programar.
- **Etapa por etapa**, revisando e fazendo o commit de cada etapa antes da próxima, com aprovação manual de cada comando e edição.
- **Skills**: `todo`, que registra as decisões e controla tarefas num arquivo `todo.txt`, e `rails-mentor`, que comenta o código sugerido para eu conseguir explicar cada linha.
- **Subtarefas em paralelo (/subtasks)** para dúvidas fora da etapa atual (por que chamar o OpenLibrary pelo backend, como guardar imagens no Rails, resumo da API do OpenLibrary).
- **Verificação** de cada etapa na aplicação rodando, além dos testes, o que pegou bugs que os testes não pegavam.

**Exemplo de sugestão incorreta da IA:** ao planejar os models, a IA propôs uma relação de 1-n entre usuários e livros. Isso guardaria o mesmo livro uma vez por leitor. Recusei e pedi um modelo n-n: `books` é um catálogo compartilhado e `readings` liga usuários e livros, com a data, a nota e a resenha de cada um. Essa decisão moldou o resto da aplicação.
