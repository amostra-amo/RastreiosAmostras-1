// ================= CONFIG =================
const API_URL = "http://127.0.0.1:8000/permissoes";

// cache
let cachePermissoes = null;

// ================= LOADING =================
function mostrarLoading() {
    document.body.classList.add("loading");
}

function esconderLoading() {
    document.body.classList.remove("loading");
}

// ================= API =================
async function obterPermissoes() {
    if (cachePermissoes) return cachePermissoes;

    try {
        console.log("🔄 Buscando permissões do backend...");

        const res = await fetch(API_URL + "?t=" + Date.now()); // 🔥 evita cache

        if (!res.ok) {
            throw new Error("Erro HTTP: " + res.status);
        }

        const data = await res.json();

        console.log("✅ Permissões carregadas:", data);

        // ================= 🔥 CONTROLE DE VERSÃO =================
        const versaoLocal = localStorage.getItem("versaoPermissoes");
        const usuario = localStorage.getItem("usuarioLogado");

        // 🔥 IGNORA logout para o admin master
        if (usuario !== "v.santos") {
            if (versaoLocal && data.versao && versaoLocal != data.versao) {
    console.warn("🔒 Permissões alteradas → forçando logout");

    localStorage.clear();

    if (!window.location.pathname.includes("index.html")) {
        window.location.href = "index.html";
    }

    return { usuarios: {} };
}
        }

        // salva nova versão
        if (data.versao) {
            localStorage.setItem("versaoPermissoes", data.versao);
        }

        // ========================================================

        cachePermissoes = data;
        return data;

    } catch (e) {
        console.warn("⚠️ Backend indisponível, usando fallback local");

        const local = localStorage.getItem("permissoes");

        if (local) {
            const parsed = JSON.parse(local);
            cachePermissoes = parsed;
            return parsed;
        }

        return { usuarios: {} };
    }
}

async function salvarPermissoes(data) {
    try {
        await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        console.log("💾 Permissões salvas no backend");

    } catch (e) {
        console.warn("⚠️ Salvando apenas local (offline)");
    }

    localStorage.setItem("permissoes", JSON.stringify(data));
    cachePermissoes = data;
}

// ================= PERMISSÃO =================
async function temPermissaoTela(usuario, tela) {

    const user = usuario?.trim().toLowerCase();


    // =========================================================
    // RASTREIO AMOSTRAS
    // REGRA FIXA: TODOS POSSUEM ACESSO
    // NÃO ESPERA A API
    // =========================================================

    if (tela === "rastreio_amostra") {
        return true;
    }


    // =========================================================
    // A PARTIR DAQUI PODE CONSULTAR AS PERMISSÕES
    // =========================================================

    const permissoes = await obterPermissoes();

    const acessoTotal =
        localStorage.getItem("acessoTotal") === "true";


    // SUPER ADMIN

    if (user === "v.santos") {
        return true;
    }


    // ACESSO TOTAL

    if (acessoTotal) {
        return true;
    }


    // PERMISSÕES INDIVIDUAIS

    const config = permissoes?.usuarios?.[user];

    if (!config) {
        return false;
    }

    if (config.telas?.includes("*")) {
        return true;
    }

    return config.telas?.includes(tela) || false;
}

// ================= MENU =================
// ================= MENU =================
// ================= MENU =================
async function controlarMenu() {

    const usuario = localStorage.getItem("usuarioLogado");

    const botoes = document.querySelectorAll("[data-tela]");

    // =====================================================
    // 1. COLOCA TODOS OS CARDS EM "AGUARDANDO SISTEMA"
    //    IMEDIATAMENTE
    // =====================================================

    botoes.forEach(btn => {

        const tela = btn.dataset.tela;

        // Rastreio não precisa esperar permissão
        if (tela === "rastreio_amostra") {
            btn.classList.remove("aguardando-permissao");
            btn.classList.remove("desativado");
            return;
        }

        // Card entra imediatamente em carregamento
        btn.classList.add("aguardando-permissao");
        btn.classList.remove("desativado");

        // Texto original
        const descricao = btn.querySelector(".card-description");

        if (descricao) {
            descricao.dataset.textoOriginal = descricao.textContent.trim();
            descricao.textContent = "Aguardando sistema";
        }

        // Troca a seta pelo spinner
        const arrow = btn.querySelector(".card-arrow");

        if (arrow) {
            arrow.classList.add("loading-icon");
            arrow.textContent = "↻";
        }
    });


    // =====================================================
    // 2. VERIFICA TODAS AS PERMISSÕES AO MESMO TEMPO
    // =====================================================

    const verificacoes = Array.from(botoes)
        .filter(btn => btn.dataset.tela !== "rastreio_amostra")
        .map(async btn => {

            const tela = btn.dataset.tela;

            try {

                const permitido =
                    await temPermissaoTela(usuario, tela);


                // =========================================
                // REMOVE ESTADO DE CARREGAMENTO
                // =========================================

                btn.classList.remove("aguardando-permissao");


                // =========================================
                // RESTAURA TEXTO ORIGINAL
                // =========================================

                const descricao =
                    btn.querySelector(".card-description");

                if (descricao && descricao.dataset.textoOriginal) {
                    descricao.textContent =
                        descricao.dataset.textoOriginal;
                }


                // =========================================
                // RESTAURA SETA
                // =========================================

                const arrow =
                    btn.querySelector(".card-arrow");

                if (arrow) {
                    arrow.classList.remove("loading-icon");
                    arrow.textContent = "→";
                }


                // =========================================
                // APLICA RESULTADO
                // =========================================

                if (!permitido) {

                    btn.classList.add("desativado");

                } else {

                    btn.classList.remove("desativado");
                }


            } catch (e) {

                console.error(
                    "Erro ao verificar permissão:",
                    tela,
                    e
                );

                btn.classList.remove("aguardando-permissao");

                btn.classList.add("desativado");


                const descricao =
                    btn.querySelector(".card-description");

                if (descricao) {
                    descricao.textContent =
                        descricao.dataset.textoOriginal ||
                        "Acesso indisponível";
                }


                const arrow =
                    btn.querySelector(".card-arrow");

                if (arrow) {
                    arrow.classList.remove("loading-icon");
                    arrow.textContent = "🔒";
                }
            }
        });


    // =====================================================
    // 3. AGUARDA TODAS AS CONSULTAS
    // =====================================================

    await Promise.all(verificacoes);
}

// ================= NAVEGAÇÃO =================
function protegerNavegacao() {
    const usuario = localStorage.getItem("usuarioLogado");

    const botoes = document.querySelectorAll("[data-tela]");

    botoes.forEach(btn => {
        btn.addEventListener("click", async function () {
            const tela = btn.dataset.tela;
            const link = btn.dataset.link;

            const permitido = await temPermissaoTela(usuario, tela);

            if (!permitido) {
                alert("Usuário sem permissão para acessar essa aba");
                return;
            }

            if (link) {
                window.location.href = link;
            }
        });
    });
}

// ================= PROTEÇÃO DE PÁGINA =================
async function protegerPagina() {
    const usuario = localStorage.getItem("usuarioLogado");

    const telaAtual = window.location.pathname
        .split("/")
        .pop()
        .replace(".html", "");

    console.log("📍 Tela atual:", telaAtual);

    // 🔥 NÃO BLOQUEIA TELA INICIAL
    if (telaAtual === "tela_inicio") return;

    const permitido = await temPermissaoTela(usuario, telaAtual);

    console.log("🔐 Permissão:", permitido);

    if (!permitido) {
        alert("Você não tem acesso a essa página.");
        window.location.href = "tela_inicio.html";
    }
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", async () => {

    if (window.__initPermissoesExecutado) return;

    window.__initPermissoesExecutado = true;

    mostrarLoading();

    try {

        // Primeiro organiza visualmente os cards
        // Rastreio fica liberado imediatamente
        // Os demais ficam aguardando
        await controlarMenu();


        // Depois ativa a proteção dos cliques
        protegerNavegacao();


        // Protege a página atual
        await protegerPagina();

    } catch (e) {

        console.error("❌ Erro geral:", e);

    } finally {

        esconderLoading();

    }

});
// ================= ACESSIBILIDADE =================

document.querySelectorAll("[data-tela]").forEach(btn => {

    btn.setAttribute("tabindex", "0");

    btn.addEventListener("keydown", e => {

        if (e.key === "Enter" || e.key === " ") {

            e.preventDefault();

            btn.click();
        }

    });

});

document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("fade-in");
});