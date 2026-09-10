/* =========================================================
   CONFIG
========================================================= */

const url =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7og0_9fNfXHoINFiE-s75rCPc-RIqAFLwcl8dQqMvEKXimWrMfgQz30QxPKul8_1Cf8RB4YSoizJy/pub?gid=0&single=true&output=csv";

let permissoes = {};

async function carregarPermissoes() {
    try {
        const resp = await fetch("./backend/permissoes.json");
        permissoes = await resp.json();

        console.log("Permissões carregadas:", permissoes);

    } catch (e) {
        console.error("Erro ao carregar permissões", e);
    }
}


/* =========================================================
   ESTADO
========================================================= */

let dados = [];
let dadosVendedora = [];
let csvCarregado = false;
let situacoesSelecionadas = [];

let tipoBusca = {
    value: "nota"
};


/* =========================================================
   ELEMENTOS
========================================================= */

const sistema = document.getElementById("sistema");

const campoBusca = document.getElementById("filtroBusca");
const resultado = document.getElementById("resultado");

const contador = document.getElementById("contador");
const boasVindas = document.getElementById("boasVindas");

const overlay = document.getElementById("overlayDetalhes");
const conteudoDetalhes =
    document.getElementById("conteudoDetalhes");

const btnAjudaSuporte =
    document.getElementById("btnAjudaSuporte");

const btnTipoBusca =
    document.getElementById("btnTipoBusca");

const menuTipoBusca =
    document.getElementById("menuTipoBusca");

const labelTipoBusca =
    document.getElementById("labelTipoBusca");

const btnAnalises =
    document.getElementById("btnAnalises");

const btnNotificacoes =
    document.getElementById("btnNotificacoes");

const contadorNotificacoes =
    document.getElementById("contadorNotificacoes");

const overlayNotificacoes =
    document.getElementById("overlayNotificacoes");

const listaNotificacoes =
    document.getElementById("listaNotificacoes");


/* =========================================================
   NOVA PESQUISA RETRÁTIL
   (abrir/fechar do painel e do overlay é controlado pelo
   script no final do rastreio_amostra.html)
========================================================= */


/* =========================================================
   DADOS DO LOGIN
========================================================= */

const dadosSalvos =
    localStorage.getItem("dadosFiltrados");

const usuarioLogado =
    localStorage.getItem("usuarioLogado");

const acessoTotal =
    localStorage.getItem("acessoTotal") === "true";


if (!dadosSalvos) {
    window.location.href = "index.html";
}


try {

    dadosVendedora = JSON.parse(dadosSalvos);

} catch (erro) {

    console.error(
        "Erro ao interpretar dadosFiltrados:",
        erro
    );

    localStorage.clear();
    window.location.href = "index.html";
}


/* =========================================================
   PERMISSÕES VISUAIS
========================================================= */

window.exibirCliente = true;
window.exibirRepresentante = true;
window.isAdmin = acessoTotal;


/* =========================================================
   INICIALIZA BUSCA
========================================================= */

if (campoBusca) {
    campoBusca.value = "";
}


/* =========================================================
   NOME DO VENDEDOR
========================================================= */

const usuarioOriginal =
    String(usuarioLogado || "")
        .trim()
        .toUpperCase();


const codigoVendedorLogado =
    usuarioOriginal.includes("-")
        ? usuarioOriginal.split("-").pop().trim()
        : usuarioOriginal;


const vendedorPlanilha =
    dadosVendedora.find(linha => {

        const codigoPlanilha =
            String(linha[22] || "")
                .trim()
                .toUpperCase();

        return codigoPlanilha === codigoVendedorLogado;

    });


const nomeVendedorLogado =
    String(
        vendedorPlanilha?.[23] || ""
    ).trim() ||
    codigoVendedorLogado;


console.log(
    "Usuário logado:",
    usuarioOriginal
);

console.log(
    "Código vendedor:",
    codigoVendedorLogado
);

console.log(
    "Nome encontrado na planilha:",
    nomeVendedorLogado
);


if (boasVindas) {

    boasVindas.innerHTML =
        `${saudacaoPorHorario()}
        <strong>${nomeVendedorLogado}</strong>
        <br>
        ${
            acessoTotal
                ? "Acesso total liberado."
                : "Abaixo, seus envios."
        }`;

}


/* =========================================================
   SUPERVISÃO
========================================================= */

async function aplicarFiltroSupervisao() {

    try {

        const usuario =
            localStorage
                .getItem("usuarioLogado")
                ?.trim()
                .toLowerCase();


        /* =================================================
           COORDENADORAS
        ================================================= */

        const coordenadores = [
            "jsantos"
        ];


        if (coordenadores.includes(usuario)) {

            console.log(
                "👑 USUÁRIO COORDENADOR:",
                usuario
            );


            const respostaCSV =
                await fetch(url);


            const texto =
                await respostaCSV.text();


            const parseado =
                Papa.parse(texto, {
                    skipEmptyLines: true
                });


            const linhas =
                parseado.data;


            dadosVendedora =
                linhas.filter((linha, index) => {

                    if (index === 0) {
                        return false;
                    }


                    const codigoVendedor =
                        String(linha[22] || "")
                            .trim()
                            .toUpperCase();


                    return codigoVendedor.startsWith("V");

                });


            console.log(
                "👑 Coordenadora - total de rastreios:",
                dadosVendedora.length
            );


            return;
        }


        /* =================================================
           SUPERVISÃO NORMAL
        ================================================= */

        const resp =
            await fetch(
                "./backend/permissoes.json"
            );


        const permissoesLocal =
            await resp.json();


        const usuarioConfig =
            permissoesLocal
                ?.usuarios?.[usuario];


        if (!usuarioConfig?.supervisao?.length) {

            console.log(
                "Usuário sem acesso especial"
            );

            return;
        }


        const codigosPermitidos =
            usuarioConfig.supervisao;


        console.log(
            "Códigos permitidos:",
            codigosPermitidos
        );


        const respostaCSV =
            await fetch(url);


        const texto =
            await respostaCSV.text();


        const parseado =
            Papa.parse(texto, {
                skipEmptyLines: true
            });


        const linhas =
            parseado.data;


        dadosVendedora =
            linhas.filter((linha, index) => {

                if (index === 0) {
                    return false;
                }


                const codigoVendedor =
                    String(linha[22] || "")
                        .trim()
                        .toUpperCase();


                return codigosPermitidos.some(
                    codigo =>
                        codigoVendedor.startsWith(
                            codigo
                        )
                );

            });


        console.log(
            "Total encontrados:",
            dadosVendedora.length
        );


    } catch (erro) {

        console.error(
            "Erro ao aplicar filtro:",
            erro
        );

    }

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

(async () => {

    await carregarPermissoes();

    await aplicarFiltroSupervisao();

    aplicarTemaEMarca(
        acessoTotal,
        dadosVendedora
    );

    await controlarMenu(
        usuarioLogado
    );

    controlarAnalytics(
        usuarioLogado
    );

    filtrar();

    atualizarNotificacoes();

})();


/* =========================================================
   PERMISSÕES
========================================================= */

function temPermissao(usuario, lista = []) {

    const user =
        usuario?.trim().toLowerCase();

    return lista.includes(user);
}


/* =========================================================
   FORMATAÇÃO
========================================================= */

function formatarAmostraDetalhe(i) {

    const tipo =
        normalizar(i[17] || "");


    if (tipo.includes("CARTELA")) {

        return `${i[16]} - ${i[15]}`;

    }


    return `${i[16]} - ${i[17]} - ${i[15]}`;

}


/* =========================================================
   MENU DE TIPO DE BUSCA
========================================================= */

function atualizarItemAtivoMenu() {

    if (!menuTipoBusca) return;


    menuTipoBusca
        .querySelectorAll(".menu-item")
        .forEach(item => {

            item.classList.toggle(
                "ativo",
                item.dataset.tipo ===
                    tipoBusca.value
            );

        });

}


/* =========================================================
   PEDIDOS PENDENTES
========================================================= */

function obterPedidosPendentes() {

    const mapa = new Map();


    dadosVendedora.forEach(l => {

        const situacao =
            normalizar(l[26] || "");


        if (!situacao.includes("PENDENTE")) {
            return;
        }


        const nota = l[0];


        if (!mapa.has(nota)) {
            mapa.set(nota, l);
        }

    });


    return [...mapa.values()];

}


/* =========================================================
   TIPO DE BUSCA PADRÃO
========================================================= */

(function initTipoBuscaPadrao() {

    if (tipoBusca) {
        tipoBusca.value = "nota";
    }


    if (labelTipoBusca) {
        labelTipoBusca.innerText =
            "Nota Fiscal";
    }


    if (campoBusca) {
        campoBusca.placeholder =
            "Digite a nota";
    }

})();


function atualizarPlaceholderBusca() {

    const placeholders = {

        nota: "Digite a nota",

        pedido: "Digite o Pedido",

        cliente: "Digite o Cliente",

        representante:
            "Digite o Representante"

    };


    if (!campoBusca) return;


    const tipo =
        tipoBusca.value;


    campoBusca.placeholder =
        placeholders[tipo] ||
        "Digite para buscar";

}


/* =========================================================
   ATUALIZA MENU DE BUSCA
========================================================= */

function atualizarMenuTipoBusca() {

    if (!menuTipoBusca) return;


    const itemRepresentante =
        menuTipoBusca.querySelector(
            '.menu-item[data-tipo="representante"]'
        );


    if (!itemRepresentante) return;


    if (window.exibirRepresentante) {

        itemRepresentante
            .classList
            .remove("oculto");

    } else {

        itemRepresentante
            .classList
            .add("oculto");


        if (
            tipoBusca.value ===
            "representante"
        ) {

            tipoBusca.value =
                "nota";


            labelTipoBusca.innerText =
                "Nota Fiscal";


            atualizarPlaceholderBusca();

        }

    }


    atualizarItemAtivoMenu();

}


/* =========================================================
   TIPO DE BUSCA
========================================================= */

if (btnTipoBusca) {

    btnTipoBusca.onclick = function (e) {

        e.stopPropagation();


        if (menuTipoBusca) {

            menuTipoBusca
                .classList
                .toggle("oculto");

        }


        atualizarItemAtivoMenu();

    };

}


/* =========================================================
   SELEÇÃO DO TIPO DE BUSCA
========================================================= */

if (menuTipoBusca) {

    menuTipoBusca
        .querySelectorAll(".menu-item")
        .forEach(item => {

            item.onclick = function () {

                const tipo =
                    item.dataset.tipo;


                tipoBusca.value =
                    tipo;


                const textoItem =
                    item.querySelector(
                        "span:not(.menu-icone)"
                    );

                labelTipoBusca.innerText =
                    textoItem
                        ? textoItem.innerText.trim()
                        : item.innerText.trim();


                atualizarPlaceholderBusca();


                if (campoBusca) {
                    campoBusca.value = "";
                }


                filtrar();


                atualizarItemAtivoMenu();


                menuTipoBusca
                    .classList
                    .add("oculto");


                /*
                   Mantém o foco no campo após
                   escolher o tipo.
                */
                if (campoBusca) {
                    campoBusca.focus();
                }

            };

        });

}


/* =========================================================
   CLIQUE FORA
========================================================= */

document.addEventListener(
    "click",
    function (e) {

        /*
           Menu de tipo de pesquisa
        */

        const dentroBusca =
            e.target.closest(
                ".campo-busca-wrapper"
            );


        if (!dentroBusca) {

            if (menuTipoBusca) {
                menuTipoBusca
                    .classList
                    .add("oculto");
            }

        }

    }
);


/* =========================================================
   ESC FECHA A PESQUISA
========================================================= */

document.addEventListener(
    "keydown",
    function (e) {

        if (e.key !== "Escape") {
            return;
        }


        /*
           Fecha menu de tipos
        */

        if (menuTipoBusca) {

            menuTipoBusca
                .classList
                .add("oculto");

        }

    }
);


/* =========================================================
   TEMA E MARCA
========================================================= */

function aplicarTemaEMarca(
    acessoTotal,
    dadosVendedora
) {

    console.log(
        "Aplicando tema..."
    );


    const logo =
        document.getElementById(
            "logoMarcaBox"
        );


    const usuarioAtual =
        localStorage
            .getItem("usuarioLogado")
            ?.trim()
            .toLowerCase();


    /*
       JSANTOS
    */

    if (usuarioAtual === "jsantos") {

        document.body.className = "";

        document.body.classList.add(
            "tema-quatrok"
        );


        if (logo) {

            logo.src =
                "/Imagens/4k BRANCO.png";

        }


        window.marcaLogada =
            "QUATROK";


        console.log(
            "🎨 Tema QUATROK aplicado para JSANTOS"
        );


        return;

    }


    /*
       ACESSO TOTAL
    */

    if (acessoTotal) {

        document.body.className = "";

        document.body.classList.add(
            "tema-direto"
        );


        if (logo) {

            logo.src =
                "/Imagens/Logo - Grupo 4k - Branco.png";

        }


        window.marcaLogada =
            "DIRETO";


        return;

    }


    /*
       SEM DADOS
    */

    if (!dadosVendedora.length) {

        document.body.className = "";

        document.body.classList.add(
            "tema-direto"
        );


        if (logo) {

            logo.src =
                "/Imagens/Logo - Grupo 4k - Branco.png";

        }


        window.marcaLogada =
            "DIRETO";


        return;

    }


    /*
       MARCA DA PLANILHA
    */

    const marca =
        (dadosVendedora[0][24] || "")
            .trim()
            .toUpperCase();


    document.body.className = "";


    if (marca.includes("QUATROK")) {

        document.body.classList.add(
            "tema-quatrok"
        );


        window.marcaLogada =
            "QUATROK";


        if (logo) {

            logo.src =
                "/Imagens/4k BRANCO.png";

        }

    }

    else if (marca.includes("LUARA")) {

        document.body.classList.add(
            "tema-luara"
        );


        window.marcaLogada =
            "LUARA";


        if (logo) {

            logo.src =
                "/Imagens/luara branco.png";

        }

    }

    else {

        document.body.classList.add(
            "tema-direto"
        );


        window.marcaLogada =
            "DIRETO";


        if (logo) {

            logo.src =
                "/Imagens/logo-direto.png";

        }

    }


    console.log(
        "DADOS VENDEDORA AQUI:",
        dadosVendedora
    );


    console.log(
        "MARCA:",
        dadosVendedora?.[0]?.[24]
    );

}


/* =========================================================
   UTIL
========================================================= */

function saudacaoPorHorario() {

    const h =
        new Date().getHours();


    if (h < 12) {
        return "Bom dia,";
    }


    if (h < 18) {
        return "Boa tarde,";
    }


    return "Boa noite,";

}


function hashSimples(str) {

    let h = 0;


    for (
        let i = 0;
        i < str.length;
        i++
    ) {

        h =
            (h << 5) -
            h +
            str.charCodeAt(i);


        h |= 0;

    }


    return h >>> 0;

}


const HASH_ADM =
    3872595084;


/* =========================================================
   ORDENAÇÃO
========================================================= */

function normalizarTextoOrdenacao(txt) {

    if (!txt) return "";


    const descricao =
        txt.replace(
            /^.*?-\s*.*?-\s*/,
            ""
        );


    return descricao
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim()
        .toUpperCase();

}


function normalizar(v) {

    return v
        ?.toString()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /\uFE0F/g,
            ""
        )
        .replace(
            /⚠/g,
            ""
        )
        .trim()
        .toUpperCase();

}


function parseDataBR(data) {

    if (!data) {
        return new Date(0);
    }


    const [
        dia,
        mes,
        ano
    ] = data.split("/");


    return new Date(
        ano,
        mes - 1,
        dia
    );

}


/* =========================================================
   SCROLL
========================================================= */

function travarScroll() {

    document.body.style.overflow =
        "hidden";

}


function liberarScroll() {

    document.body.style.overflow =
        "";

}


/* =========================================================
   NOTIFICAÇÕES
========================================================= */

function atualizarNotificacoes() {

    if (
        !btnNotificacoes ||
        !contadorNotificacoes
    ) {
        return;
    }


    const pendentes =
        dadosVendedora.filter(
            l =>
                normalizar(l[26])
                    .includes("PENDENTE")
        );


    const grupos =
        agruparPorRastreio(
            pendentes
        );


    contadorNotificacoes.innerText =
        grupos.length;


    const deveMostrarBotao =
        window.marcaLogada === "LUARA" ||
        grupos.length > 0;


    btnNotificacoes
        .classList
        .toggle(
            "oculto",
            !deveMostrarBotao
        );


    if (!listaNotificacoes) {
        return;
    }


    if (!grupos.length) {

        listaNotificacoes.innerHTML =
            "<p style='text-align:center'>Nenhuma notificação no momento.</p>";

        return;

    }


    listaNotificacoes.innerHTML = "";


    grupos.forEach(grupo => {

        const l = grupo[0];


        const notasUnicas =
            [
                ...new Set(
                    grupo.map(i => i[0])
                )
            ];


        const labelNota =
            notasUnicas.length === 1
                ? "Nota"
                : "Notas";


        const situacaoTexto =
            normalizar(l[25] || "");


        const div =
            document.createElement(
                "div"
            );


        let classeAlerta = "";


        if (
            situacaoTexto.includes(
                "AGUARDANDO RETIRADA"
            )
        ) {

            classeAlerta =
                "alerta-retirada";

        }


        div.className =
            `notificacao-item ${classeAlerta}`;


        div.innerHTML = `
            <strong>${labelNota}:</strong>
            ${notasUnicas.join(", ")}
            <br>

            <strong>Cliente:</strong>
            ${l[19]}
            <br>

            <strong>Situação:</strong>
            ${l[25]}
        `;


        div.onclick = () => {

            fecharNotificacoes();

            abrirDetalhes(grupo);

        };


        listaNotificacoes
            .appendChild(div);

    });

}


function mostrarAlerta(
    mensagem,
    tempo = 3000
) {

    const alerta =
        document.getElementById(
            "alertaTela"
        );


    if (!alerta) return;


    alerta.innerText =
        mensagem;


    alerta.classList.add(
        "show"
    );


    alerta.classList.remove(
        "oculto"
    );


    setTimeout(() => {

        alerta.classList.remove(
            "show"
        );


        setTimeout(() => {

            alerta.classList.add(
                "oculto"
            );

        }, 300);

    }, tempo);

}


/* =========================================================
   BOTÃO NOTIFICAÇÕES
========================================================= */

if (btnNotificacoes) {

    btnNotificacoes.onclick =
        function (e) {

            e.stopPropagation();


            const aberto =
                overlayNotificacoes
                    ?.classList
                    .contains("show");


            if (aberto) {

                fecharNotificacoes();

                return;

            }


            overlayNotificacoes
                .classList
                .remove("oculto");


            overlayNotificacoes
                .classList
                .add("show");


            const painelNotif =
                overlayNotificacoes
                    ?.querySelector(
                        ".painel-detalhes"
                    );


            if (painelNotif) {

                painelNotif
                    .classList
                    .add(
                        "modo-legenda"
                    );

            }


            travarScroll();

        };

}


document.addEventListener(
    "click",
    function (e) {

        if (!overlayNotificacoes) {
            return;
        }


        const clicouDentro =
            e.target.closest(
                "#overlayNotificacoes, #btnNotificacoes"
            );


        if (
            !clicouDentro &&
            overlayNotificacoes
                .classList
                .contains("show")
        ) {

            fecharNotificacoes();

        }

    }
);


function fecharNotificacoes() {

    if (!overlayNotificacoes) {
        return;
    }


    overlayNotificacoes
        .classList
        .add("oculto");


    overlayNotificacoes
        .classList
        .remove("show");


    const painel =
        overlayNotificacoes
            ?.querySelector(
                ".painel-detalhes"
            );


    if (painel) {

        painel.classList.remove(
            "modo-legenda"
        );

    }


    liberarScroll();

}


/* =========================================================
   FILTRO
========================================================= */

if (campoBusca) {

    campoBusca.oninput =
        function () {

            const temBusca =
                campoBusca.value
                    .trim()
                    .length > 5;


            document.body.classList.toggle(
                "modo-busca",
                temBusca
            );


            filtrar();

        };

}


/* =========================================================
   LIMPAR PESQUISA (BOTÃO "X")
========================================================= */

const btnLimparBusca =
    document.getElementById("btnLimparBusca");

if (btnLimparBusca && campoBusca) {

    btnLimparBusca.addEventListener(
        "click",
        function (e) {

            e.stopPropagation();

            campoBusca.value = "";

            document.body.classList.remove(
                "modo-busca"
            );

            filtrar();

            campoBusca.focus();

        }
    );

}


function filtrar() {

    let lista =
        [...dadosVendedora];


    const termo =
        campoBusca
            ? campoBusca.value.trim()
            : "";


    if (termo) {

        const tipo =
            tipoBusca.value;


        const termoNormalizado =
            normalizar(termo);


        lista =
            lista.filter(l => {

                switch (tipo) {

                    case "nota":

                        return normalizar(
                            l[0]
                        ).includes(
                            termoNormalizado
                        );


                    case "pedido":

                        return normalizar(
                            l[14]
                        ).includes(
                            termoNormalizado
                        );


                    case "cliente":

                        return normalizar(
                            l[18] || ""
                        ).includes(
                            termoNormalizado
                        );


                    case "representante":

                        return normalizar(
                            l[20]
                        ).includes(
                            termoNormalizado
                        );


                    default:

                        return false;

                }

            });

    }


    if (
        situacoesSelecionadas.length > 0
    ) {

        lista =
            lista.filter(l => {

                const situacao =
                    normalizar(l[26]);


                return situacoesSelecionadas
                    .some(status => {

                        if (
                            status ===
                            "ENTREGUE"
                        ) {

                            return situacao
                                .includes(
                                    "ENTREGUE"
                                );

                        }


                        if (
                            status ===
                            "RETORN"
                        ) {

                            return (
                                situacao.includes(
                                    "RETORN"
                                ) ||
                                situacao.includes(
                                    "DEVOL"
                                )
                            );

                        }


                        if (
                            status ===
                            "PENDENTE"
                        ) {

                            return situacao
                                .includes(
                                    "PENDENTE"
                                );

                        }


                        return false;

                    });

            });

    }


    renderizar(lista);

    atualizarCardsDashboard();

}


/* =========================================================
   DASHBOARD
========================================================= */

function atualizarCardsDashboard() {

    let entregue = 0;
    let pendente = 0;
    let retornado = 0;


    // =====================================================
    // CONTADORES DOS ÚLTIMOS 30 DIAS
    // =====================================================

    let entreguesUltimos30Dias = 0;
    let pendentesUltimos30Dias = 0;
    let retornadosUltimos30Dias = 0;


    const grupos =
        agruparPorRastreio(
            dadosVendedora
        );


    // =====================================================
    // DATA ATUAL
    // =====================================================

    const hoje =
        new Date();

    hoje.setHours(
        0, 0, 0, 0
    );


    // =====================================================
    // DATA DE 30 DIAS ATRÁS
    // =====================================================

    const trintaDiasAtras =
        new Date(hoje);

    trintaDiasAtras.setDate(
        hoje.getDate() - 29
    );


    grupos.forEach(grupo => {

        const linha =
            grupo[0];

        const situacao =
            normalizar(
                linha[26] || ""
            );


        if (
            situacao.includes(
                "PENDENTE"
            )
        ) {

            pendente++;

        }

        else if (
            situacao.includes(
                "ENTREGUE"
            )
        ) {

            entregue++;

        }

        else if (
            situacao.includes(
                "RETORN"
            ) ||
            situacao.includes(
                "DEVOL"
            )
        ) {

            retornado++;

        }


        // =================================================
        // VERIFICA SE ESTÁ NOS ÚLTIMOS 30 DIAS
        // =================================================

        const dataPostagem =
            parseDataBR(
                linha[5]
            );


        if (
            dataPostagem &&
            dataPostagem >= trintaDiasAtras &&
            dataPostagem <= hoje
        ) {

            if (
                situacao.includes(
                    "PENDENTE"
                )
            ) {

                pendentesUltimos30Dias++;

            }

            else if (
                situacao.includes(
                    "ENTREGUE"
                )
            ) {

                entreguesUltimos30Dias++;

            }

            else if (
                situacao.includes(
                    "RETORN"
                ) ||
                situacao.includes(
                    "DEVOL"
                )
            ) {

                retornadosUltimos30Dias++;

            }

        }

    });


    const elPendentes =
        document.getElementById(
            "totalPendentes"
        );


    const elEntregues =
        document.getElementById(
            "totalEntregues"
        );


    const elRetornados =
        document.getElementById(
            "totalRetornados"
        );


    const elTotal =
        document.getElementById(
            "totalGeral"
        );


    if (elPendentes) {
        elPendentes.innerText =
            pendente;
    }


    if (elEntregues) {
        elEntregues.innerText =
            entregue;
    }


    if (elRetornados) {
        elRetornados.innerText =
            retornado;
    }


    if (elTotal) {

        elTotal.innerText =
            grupos.length;

    }


    // =====================================================
    // ATUALIZA OS ÚLTIMOS 30 DIAS
    // =====================================================

    const elEnviosExtra =
        document.getElementById(
            "enviosUltimos30Dias"
        );

    const elEntreguesExtra =
        document.getElementById(
            "entreguesUltimos30Dias"
        );

    const elPendentesExtra =
        document.getElementById(
            "pendentesUltimos30Dias"
        );

    const elRetornadosExtra =
        document.getElementById(
            "retornadosUltimos30Dias"
        );


    if (elEnviosExtra) {
        elEnviosExtra.innerText =
            `${contarEnviosUltimos30Dias(grupos)} nos últimos 30 dias`;
    }


    if (elEntreguesExtra) {
        elEntreguesExtra.innerText =
            `${entreguesUltimos30Dias} nos últimos 30 dias`;
    }


    if (elPendentesExtra) {
        elPendentesExtra.innerText =
            `${pendentesUltimos30Dias} nos últimos 30 dias`;
    }


    if (elRetornadosExtra) {
        elRetornadosExtra.innerText =
            `${retornadosUltimos30Dias} nos últimos 30 dias`;
    }

}


/* =========================================================
   ÚLTIMOS 30 DIAS - TOTAL DE ENVIOS
========================================================= */

function contarEnviosUltimos30Dias(grupos) {

    const hoje =
        new Date();

    hoje.setHours(
        0, 0, 0, 0
    );


    const trintaDiasAtras =
        new Date(hoje);

    trintaDiasAtras.setDate(
        hoje.getDate() - 29
    );


    let total = 0;


    grupos.forEach(grupo => {

        const linha =
            grupo[0];

        const dataPostagem =
            parseDataBR(
                linha[5]
            );


        if (
            dataPostagem &&
            dataPostagem >= trintaDiasAtras &&
            dataPostagem <= hoje
        ) {

            total++;

        }

    });


    return total;

}


/* =========================================================
   CARDS DE STATUS
========================================================= */

document
    .querySelectorAll(".card-status")
    .forEach(card => {

        card.addEventListener(
            "click",
            () => {

                const status =
                    card.dataset.status;


                if (
                    status === "TOTAL"
                ) {

                    situacoesSelecionadas =
                        [];


                    document
                        .querySelectorAll(
                            ".card-status"
                        )
                        .forEach(c =>
                            c.classList.remove(
                                "ativo"
                            )
                        );


                    card.classList.add(
                        "ativo"
                    );

                }

                else {

                    situacoesSelecionadas =
                        [status];


                    document
                        .querySelectorAll(
                            ".card-status"
                        )
                        .forEach(c =>
                            c.classList.remove(
                                "ativo"
                            )
                        );


                    card.classList.add(
                        "ativo"
                    );

                }


                filtrar();

                atualizarCardsDashboard();

            }
        );

    });


/* =========================================================
   AGRUPAR
========================================================= */

function agruparPorRastreio(lista) {

    const mapa = {};


    lista.forEach(l => {

        const rastreio =
            l[1] ||
            "SEM_RASTREIO";


        if (!mapa[rastreio]) {

            mapa[rastreio] = [];

        }


        mapa[rastreio].push(l);

    });


    return Object.values(mapa);

}


/* =========================================================
   RENDER
========================================================= */

/* =========================================================
   LOGO SVG SEDEX
========================================================= */

let contadorSvgSedex = 0;

function criarLogoSedex(classe = "icone-envio") {

    contadorSvgSedex++;

    const gradienteId =
        `sedexBlue_${contadorSvgSedex}`;

    return `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 420 120"
            class="${classe}"
            role="img"
            aria-label="SEDEX"
        >

            <defs>
                <linearGradient
                    id="${gradienteId}"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                >
                    <stop
                        offset="0%"
                        stop-color="#003B7A"
                    />

                    <stop
                        offset="100%"
                        stop-color="#0066B3"
                    />
                </linearGradient>
            </defs>

            <!-- Linha superior -->
            <path
                d="M25 27
                   C85 10 145 10 205 27
                   C265 44 325 44 395 22"
                fill="none"
                stroke="#003B7A"
                stroke-width="8"
                stroke-linecap="round"
            />

            <!-- Linha inferior -->
            <path
                d="M25 93
                   C85 76 145 76 205 93
                   C265 110 325 110 395 88"
                fill="none"
                stroke="#0066B3"
                stroke-width="8"
                stroke-linecap="round"
            />

            <!-- Movimento -->
            <path
                d="M42 60
                   L75 42
                   L62 60
                   L75 78
                   Z"
                fill="#0066B3"
            />

            <!-- Texto SEDEX -->
            <text
                x="88"
                y="78"
                font-family="Arial, Helvetica, sans-serif"
                font-size="58"
                font-weight="900"
                font-style="italic"
                letter-spacing="-3"
                fill="url(#${gradienteId})"
            >
                SEDEX
            </text>

            <!-- Linha inferior da marca -->
            <path
                d="M95 88
                   H350"
                fill="none"
                stroke="#003B7A"
                stroke-width="4"
                stroke-linecap="round"
            />

        </svg>
    `;
}

function renderizar(lista) {

    if (!resultado) return;


    resultado.innerHTML = "";


    let grupos =
        agruparPorRastreio(lista);


    grupos.sort((a, b) => {

        const situacaoA =
            normalizar(
                a[0][25] || ""
            );


        const situacaoB =
            normalizar(
                b[0][25] || ""
            );


        const prioridadeA =
            situacaoA.includes(
                "AGUARDANDO RETIRADA"
            )
                ? 0
                : 1;


        const prioridadeB =
            situacaoB.includes(
                "AGUARDANDO RETIRADA"
            )
                ? 0
                : 1;


        if (
            prioridadeA !==
            prioridadeB
        ) {

            return (
                prioridadeA -
                prioridadeB
            );

        }


        const dataA =
            Math.max(
                ...a.map(
                    i =>
                        parseDataBR(i[5])
                )
            );


        const dataB =
            Math.max(
                ...b.map(
                    i =>
                        parseDataBR(i[5])
                )
            );


        return dataB - dataA;

    });


    grupos.forEach(grupo => {

        const l = grupo[0];


        const notasUnicas =
            [
                ...new Set(
                    grupo.map(
                        i => i[0]
                    )
                )
            ];


        const pedidosUnicos =
            [
                ...new Set(
                    grupo.map(
                        i => i[14]
                    )
                )
            ];


        const rastreio =
            l[1] ||
            "Não informado";


        const labelNota =
            notasUnicas.length === 1
                ? "Nota"
                : "Notas";


        const labelPedido =
            pedidosUnicos.length === 1
                ? "Pedido"
                : "Pedidos";


        const tipoEnvio =
            normalizar(
                l[2] || ""
            );


        let iconeEnvio = "";


        if (
            tipoEnvio.includes(
                "SEDEX PAG"
            )
        ) {

            iconeEnvio =
                `<img src="/Imagens/sedexcobrar.png"
                 class="icone-envio"
                 alt="SEDEX PAG. ENTREGA">`;

        }

        else if (
            tipoEnvio.includes(
                "SEDEX"
            )
        ) {

            iconeEnvio =
                `<img src="/Imagens/sedex.png"
                 class="icone-envio"
                 alt="SEDEX">`;

        }

        else if (
            tipoEnvio.includes(
                "PAC"
            )
        ) {

            iconeEnvio =
                `<img src="/Imagens/pac.png"
                 class="icone-envio"
                 alt="PAC">`;

        }


        const codigoCliente =
            l[18] || "-";


        const nomeCliente =
            l[19] ||
            l[7] ||
            "-";


        const numeroRepresentante =
            l[20] || "-";


        const nomeRepresentante =
            l[21] || "-";


        const card =
            document.createElement(
                "div"
            );


        const situacao =
            normalizar(
                l[26]
            );


        const situacaoTexto =
            normalizar(
                l[25]
            );


        const dataStatus =
            l[27];


        let faixaHTML = "";


        if (
            situacao.includes(
                "ENTREGUE"
            ) &&
            dataStatus
        ) {

            faixaHTML = `
                <div class="faixa-status entregue">
                    <span>ENTREGUE</span>
                    <small>${dataStatus}</small>
                </div>
            `;

        }

        else if (
            situacao.includes(
                "RETORN"
            ) ||
            situacao.includes(
                "DEVOL"
            )
        ) {

            faixaHTML = `
                <div class="faixa-status retornou">
                    <span>RETORNOU</span>
                    <small>${dataStatus || ""}</small>
                </div>
            `;

        }

        else if (
            situacao.includes(
                "PENDENTE"
            )
        ) {

            faixaHTML = `
                <div class="faixa-status pendente">
                    <span>PENDENTE</span>
                </div>
            `;

        }


        const temAlertaRetirada =
            situacaoTexto.includes(
                "AGUARDANDO RETIRADA"
            );


        let classeStatus =
            "outro";


        if (
            situacao.includes(
                "ENTREGUE"
            )
        ) {

            classeStatus =
                "entregue";

        }

        else if (
            situacao.includes(
                "PENDENTE"
            )
        ) {

            classeStatus =
                "pendente";

        }

        else if (
            situacao.includes(
                "RETORN"
            ) ||
            situacao.includes(
                "DEVOL"
            )
        ) {

            classeStatus =
                "retornado";

        }


        card.className =
            `card ${classeStatus}`;


        card.onclick = () =>
            abrirDetalhes(grupo);


        const codigoVendedorCard =
            l[22] || "-";


        const nomeVendedorCard =
            l[23] || "-";


        card.innerHTML = `

            ${faixaHTML}

            ${iconeEnvio}

            ${
                temAlertaRetirada
                    ? `<div class="alerta-retirada">
                         📦⛔
                       </div>`
                    : ""
            }

            <div class="linhacard">

                <div class="linha-info">

                    <strong>
                        ${labelNota}:
                    </strong>

                    <span>
                        ${notasUnicas.join(" / ")}
                    </span>

                </div>


                <div class="linha-info">

                    <strong>
                        ${labelPedido}:
                    </strong>

                    <span>
                        ${pedidosUnicos.join(" / ")}
                    </span>

                </div>


                <br>


                ${
                    window.isAdmin
                        ? `
                            <div class="card-vendedor">

                                <strong>
                                    Vendedor:
                                </strong>

                                ${codigoVendedorCard}
                                -
                                ${nomeVendedorCard}

                            </div>
                          `
                        : ""
                }


                <div class="cardcliente">

                    ${
                        window.exibirCliente
                            ? `
                                <strong>
                                    Cliente:
                                </strong>
                                ${nomeCliente}
                                <br>
                              `
                            : ""
                    }

                </div>


                <div class="cardrepresentante">

                    ${
                        window.exibirRepresentante
                            ? `
                                <span class="linha-representante">

                                    <strong>
                                        Representante:
                                    </strong>

                                    ${nomeRepresentante}

                                </span>

                                <br><br>
                              `
                            : ""
                    }

                </div>


                <div class="cardsituacao">

                    <strong>
                        Situação:
                    </strong>

                    <span class="situacao ${
                        temAlertaRetirada
                            ? "aguardando-retirada"
                            : ""
                    }">

                        ${l[25]}

                    </span>

                    <br>

                </div>


                <div class="linha-info">

                    <strong>
                        Itens:
                    </strong>

                    <span>
                        ${grupo.length}
                    </span>

                </div>

            </div>
        `;


        resultado.appendChild(card);

    });

}


/* =========================================================
   DETALHES
========================================================= */

function abrirDetalhes(grupo) {

    grupo.sort((a, b) => {

        return (
            prioridadeDescricao(a[17]) -
            prioridadeDescricao(b[17])
        );

    });


    const l = grupo[0];


    const notasUnicas =
        [
            ...new Set(
                grupo.map(
                    i => i[0]
                )
            )
        ];


    const pedidosUnicos =
        [
            ...new Set(
                grupo.map(
                    i => i[14]
                )
            )
        ];


    const labelNota =
        notasUnicas.length === 1
            ? "Nota Fiscal"
            : "Notas Fiscais";


    const labelPedido =
        pedidosUnicos.length === 1
            ? "Pedido"
            : "Pedidos";


    const tipoEnvio =
        normalizar(
            l[2] || ""
        );


    let iconeEnvioDetalhes = "";


    if (
        tipoEnvio.includes(
            "SEDEX PAG"
        )
    ) {

        iconeEnvioDetalhes =
            `<img
                src="/Imagens/sedexcobrar.png"
                class="icone-envio-detalhes"
                alt="SEDEX PAG. ENTREGA"
            >`;

    }

    else if (
        tipoEnvio.includes(
            "SEDEX"
        )
    ) {

        iconeEnvioDetalhes =
            `<img
                src="/Imagens/sedex.png"
                class="icone-envio-detalhes"
                alt="SEDEX"
            >`;

    }

    else if (
        tipoEnvio.includes(
            "PAC"
        )
    ) {

        iconeEnvioDetalhes =
            `<img
                src="/Imagens/pac.png"
                class="icone-envio-detalhes"
                alt="PAC"
            >`;

    }


    const uf =
        l[11] || "-";


    const estado =
        l[12] || "-";


    const codigoCliente =
        l[18] || "-";


    const nomeCliente =
        l[19] ||
        l[7] ||
        "-";


    const numeroRepresentante =
        l[20] || "-";


    const nomeRepresentante =
        l[21] || "-";


    const rastreio =
        l[1] ||
        "Não informado";


    const temScroll =
        grupo.length > 2;


    conteudoDetalhes.innerHTML = `

        <div class="detalhes-centro">

            ${iconeEnvioDetalhes}

            <h3>
                Detalhes
            </h3>


            <div class="linha-dupla">

                <span>

                    <strong>
                        ${labelNota}:
                    </strong>

                    ${notasUnicas.join(" / ")}

                </span>


                <span>

                    <strong>
                        ${labelPedido}:
                    </strong>

                    ${pedidosUnicos.join(" / ")}

                </span>

            </div>


            <div class="linha-rastreio-central">

                <strong>
                    Rastreio:
                </strong>

                <span>
                    ${rastreio}
                </span>

                ${
                    rastreio !==
                    "Não informado"
                        ? `
                            <button
                                onclick="rastrearCorreios('${rastreio}')"
                            >
                                📦 Rastrear
                            </button>
                          `
                        : ""
                }

            </div>


            ${
                window.exibirCliente
                    ? `
                        <p>

                            <strong>
                                Cliente:
                            </strong>

                            ${codigoCliente}
                            -
                            ${nomeCliente}

                        </p>
                      `
                    : ""
            }


            ${
                window.exibirRepresentante
                    ? `
                        <p class="linha-representante">

                            <strong>
                                Representante:
                            </strong>

                            ${numeroRepresentante}
                            -
                            ${nomeRepresentante}

                        </p>
                      `
                    : ""
            }


            ${
                window.exibirCliente
                    ? `
                        <p>

                            <strong>
                                Localização:
                            </strong>

                            ${uf}
                            /
                            ${estado}

                        </p>
                      `
                    : ""
            }


            <p>

                <strong>
                    Situação:
                </strong>

                <span class="situacao ${
                    normalizar(
                        l[25]
                    ).includes(
                        "AGUARDANDO RETIRADA"
                    )
                        ? "aguardando-retirada"
                        : ""
                }">

                    ${l[25]}

                </span>

            </p>


            <div class="linha-dupla">

                <span>
                    <strong>
                        Postagem:
                    </strong>

                    ${l[5] || "-"}
                </span>


                <span>
                    <strong>
                        Prazo:
                    </strong>

                    ${l[13] || "-"}
                </span>

            </div>


            <hr>


            <p>

                <div class="amenv">

                    <strong>
                        Amostras Enviadas
                    </strong>

                </div>

            </p>


            <ul class="lista-itens ${
                temScroll
                    ? "lista-scroll"
                    : ""
            }">

                ${
                    [...grupo]
                        .sort((a, b) => {

                            const p =
                                prioridadeDescricao(
                                    a[17]
                                ) -
                                prioridadeDescricao(
                                    b[17]
                                );


                            if (p !== 0) {
                                return p;
                            }


                            const da =
                                normalizarTextoOrdenacao(
                                    a[15]
                                );


                            const db =
                                normalizarTextoOrdenacao(
                                    b[15]
                                );


                            return da.localeCompare(
                                db,
                                "pt-BR"
                            );

                        })
                        .map(
                            i =>
                                `<li>
                                    ${formatarAmostraDetalhe(i)}
                                </li>`
                        )
                        .join("")
                }

            </ul>

        </div>

    `;


    const painel =
        overlay.querySelector(
            ".painel-detalhes"
        );


    if (painel) {

        painel.style.animation =
            "none";


        painel.offsetHeight;


        painel.style.animation =
            "";

    }


    overlay.classList.add(
        "show"
    );


    overlay.classList.remove(
        "oculto"
    );


    travarScroll();

}


/* =========================================================
   PRIORIDADE
========================================================= */

function prioridadeDescricao(texto) {

    const t =
        normalizar(
            texto || ""
        );


    if (
        t.includes("PILOTAGEM")
    ) {
        return 1;
    }


    if (
        t.includes("BANDEIRA")
    ) {
        return 2;
    }


    if (
        t.includes("CARTELA")
    ) {
        return 3;
    }


    return 99;

}


/* =========================================================
   FECHAR DETALHES
========================================================= */

function fecharDetalhes() {

    const painel =
        overlay.querySelector(
            ".painel-detalhes"
        );


    if (!painel) {
        return;
    }


    painel.classList.add(
        "saindo"
    );


    setTimeout(() => {

        overlay.classList.remove(
            "show"
        );


        overlay.classList.add(
            "oculto"
        );


        painel.classList.remove(
            "saindo"
        );


        liberarScroll();

    }, 300);

}


if (overlay) {

    overlay.addEventListener(
        "click",
        function (e) {

            if (
                e.target === overlay
            ) {

                fecharDetalhes();

            }

        }
    );

}


document.addEventListener(
    "keydown",
    function (e) {

        if (
            e.key === "Escape" &&
            overlay &&
            overlay.classList.contains(
                "show"
            )
        ) {

            fecharDetalhes();

        }

    }
);


/* =========================================================
   RASTREIO CORREIOS
========================================================= */

function rastrearCorreios(codigo) {

    if (
        navigator.clipboard &&
        navigator.clipboard.writeText
    ) {

        navigator.clipboard
            .writeText(codigo)
            .catch(erro => {

                console.warn(
                    "Não foi possível copiar o código:",
                    erro
                );

            });

    }


    window.open(
        `https://rastreamento.correios.com.br/app/index.php?objetos=${encodeURIComponent(codigo)}`,
        "_blank"
    );

}


/* =========================================================
   CONTROLE DO MENU
========================================================= */

async function controlarMenu(usuario) {

    const botoes =
        document.querySelectorAll(
            ".menu-btn"
        );


    const usuarioNormalizado =
        usuario
            ?.trim()
            .toLowerCase();


    for (
        const btn of botoes
    ) {

        const tela =
            btn.dataset.tela;


        let permitido =
            false;


        if (
            tela ===
            "rastreio_amostra"
        ) {

            permitido =
                true;

        }

        else {

            const listaPermissoes =
                permissoes
                    ?.telas?.[tela] ||
                [];


            permitido =
                temPermissao(
                    usuarioNormalizado,
                    listaPermissoes
                );

        }


        if (!permitido) {

            btn.classList.add(
                "desativado"
            );


            btn.onclick =
                function (e) {

                    e.preventDefault();


                    mostrarAlerta(
                        "Sem permissão para acessar"
                    );

                };

        }

        else {

            btn.classList.remove(
                "desativado"
            );


            btn.onclick =
                function () {

                    window.location.href =
                        btn.dataset.link;

                };

        }

    }

}


/* =========================================================
   ANALYTICS
========================================================= */

function controlarAnalytics(usuario) {

    const btn =
        document.getElementById(
            "btnAnalytics"
        );


    if (!btn) return;


    const temAcesso =
        temPermissao(
            usuario,
            permissoes.analytics
        );


    btn.classList.toggle(
        "oculto",
        !temAcesso
    );

}


/* =========================================================
   SIDEBAR
========================================================= */

function toggleMenu() {

    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    if (!sidebar) return;


    sidebar.classList.toggle(
        "ativa"
    );


    const overlaySidebar =
        document.querySelector(
            ".overlay-sidebar"
        );


    if (overlaySidebar) {

        overlaySidebar.classList.toggle(
            "ativo"
        );

    }

}


document.addEventListener(
    "click",
    function (e) {

        const sidebar =
            document.querySelector(
                ".sidebar"
            );


        const btn =
            document.querySelector(
                ".btn-menu"
            );


        if (!sidebar || !btn) {
            return;
        }


        if (
            !sidebar.contains(e.target) &&
            !btn.contains(e.target)
        ) {

            sidebar.classList.remove(
                "ativa"
            );


            const overlaySidebar =
                document.querySelector(
                    ".overlay-sidebar"
                );


            if (overlaySidebar) {

                overlaySidebar.classList.remove(
                    "ativo"
                );

            }

        }

    }
);


/* =========================================================
   MARCAÇÃO DA PÁGINA ATUAL
========================================================= */

const links =
    document.querySelectorAll(
        ".menu-btn"
    );


links.forEach(link => {

    if (
        link.href ===
        window.location.href
    ) {

        link.classList.add(
            "ativo"
        );

    }

});


const botoes =
    document.querySelectorAll(
        ".menu-btn"
    );


const paginaAtual =
    window.location.pathname;


botoes.forEach(btn => {

    if (

        (
            paginaAtual.includes(
                "rastreio_amostra.html"
            ) &&
            btn.textContent.includes(
                "Rastreio Amostras"
            )
        )

        ||

        (
            paginaAtual.includes(
                "analytics.html"
            ) &&
            btn.textContent.includes(
                "Análises de Amostras"
            )
        )

        ||

        (
            paginaAtual.includes(
                "retornos.html"
            ) &&
            btn.textContent.includes(
                "Retorno de Amostras"
            )
        )

        ||

        (
            paginaAtual.includes(
                "dash.html"
            ) &&
            btn.textContent.includes(
                "Dashboard"
            )
        )

    ) {

        btn.classList.add(
            "ativo"
        );

    }

});


/* =========================================================
   LOGOUT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const btnLogout =
            document.getElementById(
                "btnLogout"
            );


        if (!btnLogout) {
            return;
        }


        btnLogout.addEventListener(
            "click",
            () => {

                localStorage.clear();

                sessionStorage.clear();

                window.location.href =
                    "index.html";

            }
        );

    }
);