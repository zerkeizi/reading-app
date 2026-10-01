# Catálogo coletivo

Um catálogo coletivo de livros.

> English version: [README-ENG.md](README-ENG.md)

## Stack

- Ruby 3.3.9, Rails 8.1
- PostgreSQL 16
- React + TypeScript via Inertia.js, Vite, Tailwind CSS
- RSpec + WebMock
- Faraday (cliente HTTP do OpenLibrary)
- Pundit (autorização), Kaminari (paginação)
- Docker

## Como rodar

Requisitos: Docker e Docker Compose.

```sh
docker compose up
```

A aplicação fica disponível em http://localhost:3000. O banco de dados é criado e migrado automaticamente na inicialização por `bin/docker-dev-entrypoint`.

Comandos úteis:

```sh
docker compose run --rm web bin/rails <cmd>     # generators, migrations, console
docker compose run --rm web bundle install      # depois de alterar o Gemfile
docker compose run --rm web bundle exec rspec   # roda os testes
docker compose build                            # depois de alterar o Dockerfile.dev
```

### Dados de exemplo (seed)
usuários:
  - cecilia@example.com
  - bruno@example.com
  - ana@example.com

senha:
  - password

## Testes

```sh
docker compose run --rm web bundle exec rspec
```

O que está coberto (`spec/`):
- **Models**: validações, associações, o scope de busca `filter_by`, `last_read_at` mantido em sincronia, URLs das capas.
- **Policies**: regras do Pundit para dono / outro usuário / visitante (`BookPolicy`, `ReadingPolicy`).
- **Requests**: catálogo (filtros, paginação, estado de leitura), `/books.json`, página do livro, perfil, login, cadastro, leituras (create/update/destroy, posse) e o endpoint de busca de livros.
- **Integração com o OpenLibrary** (WebMock, nenhuma chamada HTTP real nos testes; fixtures JSON em `spec/fixtures/files/openlibrary/`): mapeamento dos resultados, resultado vazio, timeout / 500 / 429 / JSON inválido → indisponível, cache, importação por `external_id` (novo, existente, desconhecido, concorrente), 503 no endpoint de busca e nada criado quando o OpenLibrary está fora do ar.

## Decisões técnicas

### Cadastro duplicado de livros
Uma vez que um usuário registra um livro que não havia no catálogo como lido, ele passa a fazer parte do acervo. Dados como
Título, Data da publicação, Gênero são mantidos somente como leitura para todos, mesmo por quem o registrou pela primeira vez. Dados abertos para edição ficam na tabela pivot, responsável pela associação entre `books` e `users`, e são eles lido em (`read_on`), nota (`rate`) e resenha (`review`)

Livros registrados no catálogo possuem uma identificação única `external_id` `unique` na tabela `books` que representa sua identificação no serviço externo (OpenLibrary). Esse valor é usado como referência para garantir que dois livros não sejam duplicados

### Indisponibilidade ou resposta vazia do OpenLibrary
O OpenLibrary só é necessário para **buscar e adicionar livros novos**; o catálogo, as páginas de livro, os perfis, o `/books.json` e a adição de um livro que já está no catálogo funcionam apenas com os nossos dados.

- **Resultado vazio** (HTTP 200, `numFound: 0`) não é erro: o modal mostra "Nenhum livro encontrado".
- **Indisponível** (timeout de 3s para conectar / 5s para responder, erro de conexão, 5xx, 429/403, JSON inválido) vira um único erro, `OpenLibrary::Unavailable`. O endpoint de busca responde **503** com uma mensagem ("A busca do OpenLibrary está indisponível…"), exibida no modal em vez de uma lista vazia; adicionar um livro novo volta para a página anterior com um alerta e não cria nada.
- **Carga sobre o OpenLibrary**: ele permite de 1 a 3 requisições/s por aplicação. O cliente envia um `User-Agent` que identifica a aplicação, as buscas ficam **em cache por 12h** pelo título normalizado (falhas nunca vão para o cache), o modal espera o usuário parar de digitar (200 ms, a partir de 2 caracteres, cancelando requisições antigas) e o endpoint tem limite de requisições por usuário (30/min).
- As capas são carregadas direto do servidor de capas do OpenLibrary; enquanto ele estiver fora do ar, a interface mostra placeholders (ver "Com mais tempo").

### Nível de acesso ao `/books.json`
**Público**, porque são os mesmos dados que a página inicial pública já mostra ("qualquer pessoa que acessa a home encontra a lista"): mesmos filtros (`q`, `field`), mesma ordem e paginação (`page`, 9 por página), além de `external_id` e `last_read_at`. É somente leitura e **não tem dados de usuário** (nenhum `reading_id`, mesmo com login). Limitado a 60 requisições/min por cliente, apenas no formato JSON.

```sh
curl "http://localhost:3000/books.json?q=tolkien&field=author"
```

### Ambiente Docker local
O desenvolvimento usa `Dockerfile.dev` e `docker-compose.yml` próprios: o código é montado no container (bind mount), as gems ficam em um volume nomeado, o container roda com um usuário sem privilégios de root (UID 1000) e inclui Node para o Vite. O `Dockerfile` gerado pelo Rails fica intacto como imagem de produção.

A conexão com o banco é configurada por `DB_HOST` / `DB_USERNAME` / `DB_PASSWORD` em vez de `DATABASE_URL`, porque `DATABASE_URL` sobrescreveria o nome do banco de testes. Um entrypoint próprio remove um `tmp/pids/server.pid` antigo (ele persiste entre reinícios do container porque o código é montado do host) e roda `db:prepare`.

### Ruby 3.3.9 em vez de 3.3.0
O `rails new` fixou o Ruby 3.3.0 da máquina, que tem um bug no parser (corrigido na 3.3.1) que rejeita parâmetros anônimos `*`/`**` usados dentro de blocos. O ActionView do Rails 8.1 (`capture_helper.rb`) usa essa sintaxe, então a aplicação nem subia: `anonymous rest parameter is also used within block (SyntaxError)`. O Ruby foi atualizado para o patch mais recente da 3.3.

### Autenticação
Usa o gerador de autenticação nativo do Rails 8 em vez do Devise. Os controllers gerados ficam dentro da aplicação, então renderizar páginas Inertia a partir deles é trivial, enquanto os controllers e views ERB do Devise, que ficam dentro da gem, precisariam ser sobrescritos. O cadastro não vem no gerador e foi implementado à parte; uma coluna `name` foi adicionada a `users`.

Login e cadastro ficam em um modal em vez de páginas separadas, então o usuário nunca sai da página em que estava: os controllers redirecionam de volta e os erros de validação chegam pelos `errors` do Inertia. A página de login ERB gerada é mantida só como alternativa para visitantes que abrem uma URL protegida diretamente. `/profile` é um resource singular (sem id na URL), então só existe o seu próprio perfil.

### Autorização
Pundit em vez de CanCanCan: as policies são objetos Ruby simples e explícitos, fáceis de testar com RSpec, e as permissões podem ser enviadas ao React como props do Inertia. O CanCanCan concentra as regras em uma única classe `Ability` e depende do `load_and_authorize_resource`, mais implícito.

O desafio pede que só quem cadastrou possa editar ou remover um livro. Aqui um livro é compartilhado por vários leitores (ver a tabela pivô de leituras) e seus dados vêm do OpenLibrary, então "editar/remover um livro" significa editar/remover **a sua leitura** dele:

- `BookPolicy`: qualquer pessoa pode listar livros, usuários logados podem cadastrá-los, ninguém pode editá-los ou apagá-los.
- `ReadingPolicy`: só o dono pode alterar ou apagar uma leitura. Sem isso, qualquer usuário logado poderia trocar `/readings/:id` pelo id de outra pessoa (IDOR).
- `verify_authorized` roda depois de cada action dos controllers de recursos, então uma action que esquecer de chamar `authorize` falha de forma explícita em vez de ficar aberta silenciosamente.

### Nota (não pedida no desafio)

A nota de uma leitura vai de 0,5 a 5 em meios pontos (como no Letterboxd), armazenada como `decimal(2,1)`. O design mostra cinco botões quadrados; cada quadrado é dividido em duas metades clicáveis, então os cinco quadrados cobrem os dez valores e uma nota com meio ponto aparece como um quadrado preenchido pela metade. As props convertem a nota com `to_f`, porque o Rails serializa `BigDecimal` como string no JSON.

### Mapeamento dos dados do OpenLibrary
- `external_id` ← `key` (a chave da obra), `title` ← `title`, `publication_year` ← `first_publish_year`, `cover_id` ← `cover_i`.
- `author` ← **todos** os `author_name` unidos ("Neil Gaiman, Terry Pratchett"), para que o filtro por autor encontre o livro por qualquer um deles.
- `genre` ← a lista `subject` do OpenLibrary é ruidosa (lugares, prêmios, listas `nyt:`). Uma lista de gêneros permitidos converte os assuntos em gêneros em português, e **vence o gênero com mais assuntos correspondentes** (empates ficam com o gênero mais específico): O Hobbit tem 14 assuntos de fantasia e um "science fiction" perdido, então fica "Fantasia"; Duna fica "Ficção científica". "Fiction" puro é o último recurso ("Ficção"); sem correspondência → sem gênero.

### Busca, filtros e paginação do catálogo

O desafio pede filtros por autor, gênero e ano de publicação; o design tem uma única caixa de busca unida a um select. O select escolhe **por qual campo o texto filtra** (Autor / Gênero / Ano), então o requisito cabe no controle do design: autor e gênero aceitam correspondência parcial e ignoram maiúsculas/minúsculas (`ILIKE`, com `%`/`_` digitados pelo usuário escapados); o ano precisa ser exato. Os filtros ficam na URL (`?q=&field=`), então os resultados podem ser compartilhados e sobrevivem à paginação. A lista é ordenada pela leitura mais recente (`books.last_read_at`, mantido em sincronia quando leituras são criadas ou removidas) e paginada com Kaminari, 9 por página (a grade 3×3).

### Frontend (fase de wireframe)

As telas seguem um wireframe de baixa fidelidade: preto, cinzas e branco, títulos em Arial Black, sem cantos arredondados. Essas escolhas ficam em tokens do Tailwind (`@theme`: `bg-ink`, `font-heading`…) e em alguns componentes básicos (`Button`, `Cover`, `Avatar`, `RatingSquares`), então o estilo visual final pode substituí-los sem mexer nas páginas. Um único layout persistente (cabeçalho, mensagens, modais, botão "+") é definido uma vez em `createInertiaApp`. Os modais usam o `<dialog>` nativo (fundo escurecido, Esc e foco preso dentro do modal vêm do navegador). Os textos da interface estão em português.

### Testes

Só RSpec + fixtures do Rails + WebMock, mínimo de propósito. Valeria trocar ou acrescentar quando:

- **factory_bot**: os testes precisarem de muitas variações de registros por teste, ou as fixtures compartilhadas começarem a acoplar specs que não têm relação entre si.
- **shoulda-matchers**: houver muitos models com validações padrão.
- **faker**: for preciso um volume grande de dados de exemplo realistas.

Os generators estão configurados para não criar specs de view, helper e rota (nem helpers), já que as views são React.

## Com mais tempo

- **Recuperação de senha**: vem no gerador de autenticação do Rails 8, mas foi removida para manter o escopo focado, já que depende de envio de e-mail. Voltaria com uma visualização dos e-mails em desenvolvimento (ex.: `letter_opener_web`).
- **Capas independentes do OpenLibrary**: as capas são carregadas direto do OpenLibrary (`books.cover_id` → `covers.openlibrary.org`), então enquanto ele estiver fora do ar o catálogo mostra placeholders no lugar das capas. Próximos passos, em ordem de esforço:
  - ~~um placeholder na interface para capas ausentes ou que falharam~~ (feito: `Cover` mostra um placeholder no `onError`);
  - um job em segundo plano que baixa cada capa uma vez para o Active Storage quando o livro é criado, mantendo o `cover_id` para buscá-la de novo, para o catálogo funcionar totalmente sem o OpenLibrary;
  - armazenamento compartilhado (S3 ou similar) para essa cópia em produção, já que o disco local é de cada servidor/pod.

- **Mensagens de validação em português**: os textos da interface e as mensagens de flash estão em português, mas os erros de validação dos models ainda usam os padrões em inglês do Rails ("Name can't be blank"). Próximo passo: a gem `rails-i18n` com `pt-BR` como locale padrão.
- **Confirmação antes de "Marcar como não lido"**: um clique apaga a nota e a resenha da leitura; o design não tem etapa de confirmação.
- **Dados mais completos dos livros**: série, número de páginas, tags e descrição pela API de obras do OpenLibrary (o design mostra esses dados; hoje só os dados da busca são armazenados).
- **Content Security Policy**: o initializer de CSP do Rails ainda está todo comentado; ativá-lo (primeiro em modo report-only) exige as exceções do servidor de desenvolvimento do Vite.

<!-- TODO: outros itens deixados de fora ou feitos de outro jeito, e por que essa priorização -->

## Uso de IA
Usei o Claude Code (o agente de linha de comando da Anthropic) durante todo o projeto, como um par de programação que eu conduzia, não como piloto automático. Sou novo em Rails (minha experiência é com Node), então boa parte do uso foi para explicar as convenções do Rails e cada mudança antes de ela entrar no código. O fluxo de trabalho:

- **Contexto do projeto**: um `CLAUDE.md` resume o desafio, a stack e os comandos do Docker, para que cada sessão comece com o mesmo contexto.
- **Plan mode para funcionalidades**: em cada funcionalidade com várias etapas (autorização, implementação do wireframe, integração com o OpenLibrary), o agente primeiro escrevia um plano, me fazia as perguntas em aberto (por exemplo, como escolher um gênero a partir dos assuntos do OpenLibrary, ou o nível de acesso do `/books.json`) e só programava depois da minha aprovação.
- **Etapa por etapa, com commits entre elas**: os planos aprovados foram implementados uma etapa de cada vez; eu revisava cada etapa e fazia o commit antes da próxima, e pedia sugestões de agrupamento de commits quando uma mudança tocava vários assuntos.
- **Aprovação manual das ações**: cada comando e cada edição de arquivo precisava da minha aprovação, então eu podia interromper ou mudar o rumo, por exemplo recusando uma migration ("vamos manter o banco como está") ou uma etapa que eu queria fazer sozinho ("não faça você mesmo").
- **Skills próprias** (`.claude/skills/`):
  - `todo`: registra cada decisão (`// Decision:`), pergunta em aberto (`// Open:`) e ideia adiada (`// Later:`) no meu `todo.txt`, no meu próprio formato; é também de onde saiu a maior parte deste README;
  - `rails-mentor`: faz com que planos e códigos sugeridos venham com comentários explicando as DSLs do Rails, a sintaxe do Ruby e as convenções, para que eu consiga explicar cada linha.
- **Subtarefas / subagentes para perguntas paralelas**: perguntas que não faziam parte da etapa atual rodavam em paralelo, em sessões derivadas ou subagentes: por que o OpenLibrary deve ser chamado pelo backend, como imagens costumam ser armazenadas no Rails, resumo da documentação da API do OpenLibrary (`docs/openlib_api.md`), rascunho da estrutura deste README, agrupamento de mudanças em commits.
- **Verificação**: além do RSpec, o agente verificava cada etapa na aplicação rodando (curl e um navegador headless) e relatava o que via, o que pegou bugs que os testes não pegaram, como uma requisição da busca que cancelava o formulário de login.

### Exemplo: sugestão incorreta ou incompleta da IA
Ao planejar os models, a IA propôs um modelo **um-para-muitos** tirado ao pé da letra do enunciado: cada `Book` pertence ao usuário que o cadastrou (`books.user_id`), e só esse usuário pode editá-lo ou apagá-lo. Isso guardaria a mesma obra uma vez por leitor e transformaria "o mesmo livro lido por várias pessoas" em um monte de duplicatas. Recusei e pedi um modelo **muitos-para-muitos**: `books` é um catálogo compartilhado (uma linha por obra do OpenLibrary, `external_id` único) e `readings` é a tabela pivô entre usuários e livros, com os dados de cada usuário (data de leitura, nota, resenha). Essa decisão moldou o resto da aplicação: duplicatas são tratadas pela chave única da obra, "editar/remover um livro" virou editar/remover *a sua leitura* (garantido pelo Pundit em `Reading`) e o catálogo é ordenado pela leitura mais recente.

Outras vezes em que segui um caminho diferente do sugerido:
- **Nota**: a IA recomendou guardar as notas como inteiros de "meio ponto" (1–10) e, depois, uma migration para números inteiros de 1 a 5, para combinar com os cinco botões do design. Mantive a coluna `decimal(2,1)` e os meios pontos (0,5–5) e propus dividir cada um dos cinco quadrados do design em duas metades clicáveis: uma mudança só no frontend, sem migration.
- **Capas dos livros**: primeiro eu quis armazenar as capas localmente, para o catálogo não depender do OpenLibrary, e a IA planejou isso com Active Storage e um job em segundo plano. Pesando o armazenamento e a complexidade extras, voltei atrás e guardei só o `cover_id` no MVP, deixando a cópia local em "Com mais tempo".

## CI
<!-- TODO: pipeline do GitHub Actions rodando RuboCop e RSpec a cada push -->

## Kubernetes
<!-- TODO: manifests de exemplo de Deployment/Service e como aplicá-los -->
