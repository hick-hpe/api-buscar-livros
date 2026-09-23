const URL_API = "https://openlibrary.org/search.json";

/**
 * Parâmetros da API:
 *
 * q: termo da pesquisa
 *    Exemplo: "harry potter"
 *
 * limit: quantidade máxima de resultados
 *        Exemplo: 10
 *
 * page: número da página
 *       Exemplo: 2
 *
 * offset: posição inicial dos resultados
 *         Exemplo: 20
 *
 * fields: campos que queremos receber
 *         Exemplo: "title,author_name,first_publish_year"
 *
 * sort: ordenação dos resultados
 *       Exemplo: "new"
 *
 * lang: idioma preferido
 *       Exemplo: "pt"
 */

const formBusca = document.getElementById("form-busca");
const inputBusca = document.getElementById("input-busca");
const divSpinner = document.getElementById("spinner-wrap");
const divResultados = document.getElementById("resultados");
const divBuscarMais = document.getElementById("buscar-mais");

const LIMITE_POR_EXIBICAO = 12;

let paginaAtual = 1;
let buscaAtual = "";


/*
 * Realiza uma nova pesquisa.
 */
formBusca.addEventListener("submit", async (e) => {

    e.preventDefault();

    buscaAtual = inputBusca.value.trim();

    // Não faz busca se o campo estiver vazio
    if (!buscaAtual) {
        return;
    }

    if (buscaAtual.length < 3) {
        inputBusca.classList.add("is-invalid");
        return;
    }

    inputBusca.classList.remove("is-invalid");

    // Toda nova pesquisa começa na página 1
    paginaAtual = 1;

    // Mostra o spinner
    divSpinner.classList.remove("d-none");

    // Esconde o botão enquanto busca
    divBuscarMais.classList.add("d-none");

    try {

        await fazerBuscaSimples(buscaAtual, true);

    } finally {

        // Esconde o spinner quando terminar
        divSpinner.classList.add("d-none");

    }

});


/*
 * Busca uma página de resultados.
 */
async function fazerBuscaSimples(query, novaBusca = false) {

    try {

        const url =
            `${URL_API}?q=${encodeURIComponent(query)}` +
            `&limit=${LIMITE_POR_EXIBICAO}` +
            `&page=${paginaAtual}`;

        const response = await fetch(url);

        if (!response.ok) {
            const erro = await response.text();

            console.error("Resposta da API:", erro);

            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();

        console.log("Página:", paginaAtual);
        console.log("Total de resultados:", data.numFound);
        console.log("Livros recebidos:", data.docs);


        /*
         * Se for uma nova pesquisa,
         * apaga os resultados anteriores.
         */
        if (novaBusca) {

            if (data.numFound === 0) {

                divResultados.innerHTML = `
            <h2>Nenhum resultado encontrado para "${query}"</h2>
        `;

                divBuscarMais.classList.add("d-none");

                return;
            }

            divResultados.innerHTML = `
        <h2>${data.numFound} resultados para "${query}"</h2>

        <div
            id="lista-livros"
            class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
        </div>
    `;
        }


        /*
         * Pega a lista onde os livros serão colocados.
         */
        const listaLivros = document.getElementById("lista-livros");


        /*
         * Cria os cards dos livros e adiciona
         * ao final da lista existente.
         */
        listaLivros.insertAdjacentHTML(
            "beforeend",
            data.docs.map(criarCardLivro).join("")
        );


        /*
         * Verifica se ainda existem mais resultados.
         *
         * Exemplo:
         *
         * página 1 × 10 = 10
         *
         * se existem 100 resultados:
         *
         * 10 < 100 → ainda existem livros
         */
        if (
            paginaAtual * LIMITE_POR_EXIBICAO <
            data.numFound
        ) {

            divBuscarMais.classList.remove("d-none");

        } else {

            divBuscarMais.classList.add("d-none");

        }


        /*
         * Configura o tratamento das imagens
         * que não possuem capa.
         */
        configurarErrosDasCapas();

    } catch (err) {

        console.error("Erro ao buscar livros:", err);

    }

}


/*
 * Cria o HTML de um livro.
 */
function criarCardLivro(livro) {

    const autor =
        livro.author_name?.join(", ") ??
        "Autor desconhecido";

    const ano =
        livro.first_publish_year ??
        "Ano desconhecido";

    const edicoes =
        livro.edition_count ?? 0;

    return `
        <div class="col">

            <div class="card d-flex flex-row">

                ${livro.cover_i != null
            ? `
                        <img
                            src="https://covers.openlibrary.org/b/id/${livro.cover_i}-M.jpg?default=false"
                            alt="Capa de ${livro.title}"
                            class="capa-livro"
                        >
                    `
            : `
                        <div class="capa-livro capa-indisponivel">

                            <i class="bi bi-book fs-2"></i>

                            <span>
                                Sem capa
                            </span>

                        </div>
                    `
        }

                <div class="card-body">

                    <h5 class="card-title">
                        ${livro.title}
                    </h5>

                    <p class="card-text">
                        ${autor}
                    </p>

                    <p class="card-text">
                        ${ano} - ${edicoes} edições
                    </p>

                </div>

            </div>

        </div>
    `;
}


/*
 * Trata imagens de capas que não existem.
 */
function configurarErrosDasCapas() {

    document
        .querySelectorAll("img.capa-livro")
        .forEach((img) => {

            img.addEventListener("error", () => {

                const semCapa =
                    document.createElement("div");

                semCapa.className =
                    "capa-livro capa-indisponivel";

                semCapa.innerHTML = `
                    <i class="bi bi-book fs-2"></i>

                    <span>
                        Sem capa
                    </span>
                `;

                img.replaceWith(semCapa);

            });

        });

}


/*
 * Carrega o próximo bloco de resultados.
 */
divBuscarMais.addEventListener("click", async () => {

    // Passa para a próxima página
    paginaAtual++;

    // Esconde o botão enquanto carrega
    divBuscarMais.classList.add("d-none");

    // Mostra o spinner
    divSpinner.classList.remove("d-none");

    try {

        await fazerBuscaSimples(buscaAtual);

    } finally {

        // Esconde o spinner
        divSpinner.classList.add("d-none");

    }

});