document.addEventListener("DOMContentLoaded", function () {

    // ============================================================
    // ELEMENTOS DO LOGIN
    // ============================================================

    const formLogin = document.getElementById("formLogin");
    const erroLogin = document.getElementById("erroLogin");

    const usuariosFullAccess = ["v.santos"];


    // ============================================================
    // PLANILHA
    // ============================================================

    const urlCSV =
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7og0_9fNfXHoINFiE-s75rCPc-RIqAFLwcl8dQqMvEKXimWrMfgQz30QxPKul8_1Cf8RB4YSoizJy/pub?gid=0&single=true&output=csv";


    // ============================================================
    // LOGIN NORMAL - PROTHEUS
    // ============================================================

    formLogin.addEventListener("submit", async function (e) {

        e.preventDefault();


        const usuario =
            document.getElementById("usuarioLogin").value.trim();


        const senha =
            document.getElementById("senhaLogin").value.trim();


        erroLogin.innerText =
            "Validando login...";


        const acessoTotal =
            usuariosFullAccess.includes(
                usuario.toLowerCase()
            );


        try {

            const resposta = await fetch(
                "http://127.0.0.1:8000/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        username: usuario,
                        password: senha
                    })
                }
            );


            let data = {};

            let codigo = null;


            try {

                data = await resposta.json();

                codigo =
                    data?.seller_code || null;

            } catch {

                codigo = null;

            }


            // ====================================================
            // ERRO 401
            // ====================================================

            if (resposta.status === 401) {

                erroLogin.innerText =
                    "Usuário ou senha inválidos.";

                return;
            }


            // ====================================================
            // ERRO 404
            // ====================================================

            if (
                resposta.status === 404 &&
                !acessoTotal
            ) {

                erroLogin.innerText =
                    "Usuário sem código de vendedor.";

                return;
            }


            // ====================================================
            // CARREGAR PLANILHA
            // ====================================================

            erroLogin.innerText =
                "Carregando pedidos...";


            Papa.parse(
                urlCSV,
                {

                    download: true,

                    skipEmptyLines: true,


                    complete: function (res) {

                        const dados =
                            res.data.slice(1);


                        let dadosFiltrados = [];


                        // ====================================================
                        // ACESSO TOTAL
                        // ====================================================

                        if (acessoTotal) {

                            dadosFiltrados =
                                dados;

                        }


                        // ====================================================
                        // ACESSO DO VENDEDOR
                        // ====================================================

                        else {

                            dadosFiltrados =
                                dados.filter(
                                    function (linha) {

                                        return (
                                            normalizarCodigo(
                                                linha[22]
                                            ) ===
                                            normalizarCodigo(
                                                codigo
                                            )
                                        );

                                    }
                                );

                        }


                        // ====================================================
                        // NENHUM REGISTRO
                        // ====================================================

                        if (
                            !acessoTotal &&
                            dadosFiltrados.length === 0
                        ) {

                            erroLogin.innerText =
                                "Nenhum registro encontrado para este vendedor.";

                            return;
                        }


                        // ====================================================
                        // SALVAR DADOS
                        // ====================================================

                        localStorage.setItem(
                            "dadosFiltrados",
                            JSON.stringify(
                                dadosFiltrados
                            )
                        );


                        localStorage.setItem(
                            "usuarioLogado",
                            usuario
                        );


                        localStorage.setItem(
                            "codigoVendedor",
                            codigo || ""
                        );


                        localStorage.setItem(
                            "acessoTotal",
                            acessoTotal
                        );


                        // ====================================================
                        // REDIRECIONAMENTO
                        // ====================================================

                        window.location.href =
                            "tela_inicio.html";

                    },


                    error: function (erro) {

                        console.error(
                            "Erro ao carregar planilha:",
                            erro
                        );


                        erroLogin.innerText =
                            "Erro ao carregar planilha.";

                    }

                }
            );

        }


        // ========================================================
        // ERRO DE CONEXÃO COM BACKEND
        // ========================================================

        catch (erro) {

            console.error(
                "Erro no login:",
                erro
            );


            erroLogin.innerText =
                "Servidor indisponível. Utilize o acesso por código de vendedor.";

        }

    });


    // ============================================================
    // ACESSO POR CÓDIGO DE VENDEDOR
    // ============================================================

    const codigoInput =
        document.getElementById(
            "codigoVendedorLogin"
        );
        if (codigoInput) {
    codigoInput.addEventListener("input", function () {
        this.value = this.value.toUpperCase();
    });
}


    const btnCodigo =
        document.getElementById(
            "btnAcessarCodigo"
        );


    const erroCodigo =
        document.getElementById(
            "erroCodigoVendedor"
        );


    // ============================================================
    // VERIFICAR SE OS ELEMENTOS EXISTEM
    // ============================================================

    if (
        !codigoInput ||
        !btnCodigo ||
        !erroCodigo
    ) {

        console.error(
            "Elementos do modo contingência não encontrados."
        );

    }


    // ============================================================
    // BOTÃO DE ACESSO POR CÓDIGO
    // ============================================================

    else {

        btnCodigo.addEventListener(
            "click",
            function () {

                const codigoDigitado =
                  codigoInput.value.trim().toUpperCase();


                // ====================================================
                // VALIDAR CAMPO
                // ====================================================

                if (!codigoDigitado) {

                    erroCodigo.innerText =
                        "Digite o código do vendedor.";

                    return;
                }


                // ====================================================
                // LIMPAR MENSAGEM
                // ====================================================

                erroCodigo.style.color =
                    "";

                erroCodigo.innerText =
                    "Consultando vendedor...";


                btnCodigo.disabled = true;


                // ====================================================
                // CONSULTAR PLANILHA
                // ====================================================

                Papa.parse(
                    urlCSV,
                    {

                        download: true,

                        skipEmptyLines: true,


                        complete: function (res) {

                            console.log(
                                "================================="
                            );

                            console.log(
                                "MODO CONTINGÊNCIA"
                            );

                            console.log(
                                "================================="
                            );


                            // ==================================================
                            // VERIFICAR RETORNO
                            // ==================================================

                            console.log(
                                "Linhas recebidas:",
                                res.data.length
                            );


                            if (
                                !res.data ||
                                res.data.length <= 1
                            ) {

                                console.error(
                                    "A planilha não retornou registros."
                                );


                                erroCodigo.innerText =
                                    "A planilha não retornou dados.";


                                btnCodigo.disabled =
                                    false;


                                return;
                            }


                            // ==================================================
                            // CABEÇALHO
                            // ==================================================

                            console.log(
                                "Cabeçalho:",
                                res.data[0]
                            );


                            console.log(
                                "Quantidade de colunas:",
                                res.data[0].length
                            );


                            // ==================================================
                            // DADOS
                            // ==================================================

                            const dados =
                                res.data.slice(1);


                            console.log(
                                "Quantidade de registros:",
                                dados.length
                            );


                            console.log(
                                "Código digitado:",
                                codigoDigitado
                            );


                            console.log(
                                "Código normalizado:",
                                normalizarCodigo(
                                    codigoDigitado
                                )
                            );


                            // ==================================================
                            // DEBUG DA PRIMEIRA LINHA
                            // ==================================================

                            if (
                                dados.length > 0
                            ) {

                                console.log(
                                    "Primeira linha:",
                                    dados[0]
                                );


                                console.log(
                                    "Valor da coluna 22:",
                                    dados[0][22]
                                );

                            }


                            // ==================================================
                            // FILTRAR PELO CÓDIGO
                            //
                            // linha[22] = 23ª coluna
                            // ==================================================

                            const dadosFiltrados =
                                dados.filter(
                                    function (linha) {

                                        const codigoPlanilha =
                                            normalizarCodigo(
                                                linha[22]
                                            );


                                        const codigoInformado =
                                            normalizarCodigo(
                                                codigoDigitado
                                            );


                                        return (
                                            codigoPlanilha ===
                                            codigoInformado
                                        );

                                    }
                                );


                            // ==================================================
                            // RESULTADO
                            // ==================================================

                            console.log(
                                "Código pesquisado:",
                                normalizarCodigo(
                                    codigoDigitado
                                )
                            );


                            console.log(
                                "Registros encontrados:",
                                dadosFiltrados.length
                            );


                            // ==================================================
                            // CÓDIGO NÃO ENCONTRADO
                            // ==================================================

                            if (
                                dadosFiltrados.length === 0
                            ) {

                                console.warn(
                                    "Código não encontrado na coluna 23."
                                );


                                // ==============================================
                                // MOSTRAR ALGUNS CÓDIGOS PARA DEBUG
                                // ==============================================

                                console.log(
                                    "Exemplos encontrados na coluna 23:"
                                );


                                dados
                                    .slice(0, 10)
                                    .forEach(
                                        function (
                                            linha,
                                            indice
                                        ) {

                                            console.log(
                                                indice,
                                                "=>",
                                                linha[22]
                                            );

                                        }
                                    );


                                erroCodigo.innerText =
                                    "Código de vendedor não encontrado.";


                                btnCodigo.disabled =
                                    false;


                                return;
                            }


                            // ==================================================
                            // VENDEDOR ENCONTRADO
                            // ==================================================

                            console.log(
                                "================================="
                            );

                            console.log(
                                "VENDEDOR ENCONTRADO!"
                            );

                            console.log(
                                "Código:",
                                codigoDigitado
                            );

                            console.log(
                                "Rastreios encontrados:",
                                dadosFiltrados.length
                            );

                            console.log(
                                "================================="
                            );
                            


                            // ==================================================
                            // SALVAR RASTREIOS
                            // ==================================================

                            localStorage.setItem(
                                "dadosFiltrados",
                                JSON.stringify(
                                    dadosFiltrados
                                )
                            );


                            // ==================================================
                            // IDENTIFICAÇÃO DO USUÁRIO
                            // ==================================================

                            localStorage.setItem(
                                "usuarioLogado",
                                "VENDEDOR-" +
                                normalizarCodigo(
                                    codigoDigitado
                                )
                            );


                            // ==================================================
                            // SALVAR CÓDIGO
                            // ==================================================

                            localStorage.setItem(
                                "codigoVendedor",
                                normalizarCodigo(
                                    codigoDigitado
                                )
                            );


                            // ==================================================
                            // NÃO POSSUI ACESSO TOTAL
                            // ==================================================

                            localStorage.setItem(
                                "acessoTotal",
                                "false"
                            );


                            // ==================================================
                            // MENSAGEM
                            // ==================================================

                            erroCodigo.style.color =
                                "#80ff80";


                            erroCodigo.innerText =
                                "Vendedor encontrado. Carregando rastreios...";


                            // ==================================================
                            // REDIRECIONAMENTO
                            // ==================================================

                            setTimeout(
                                function () {

                                    window.location.href =
                                        "tela_inicio.html";

                                },
                                300
                            );

                        },


                        // ======================================================
                        // ERRO AO ACESSAR PLANILHA
                        // ======================================================

                        error: function (erro) {

                            console.error(
                                "Erro PapaParse:",
                                erro
                            );


                            erroCodigo.innerText =
                                "Não foi possível acessar a planilha.";


                            btnCodigo.disabled =
                                false;

                        }

                    }
                );

            }
        );


        // ============================================================
        // ENTER NO CAMPO DE CÓDIGO
        // ============================================================

        codigoInput.addEventListener(
            "keydown",
            function (e) {

                if (
                    e.key === "Enter"
                ) {

                    e.preventDefault();

                    btnCodigo.click();

                }

            }
        );

    }


    // ============================================================
    // NORMALIZAÇÃO DO CÓDIGO
    // ============================================================

    function normalizarCodigo(valor) {

        if (
            valor === null ||
            valor === undefined
        ) {

            return "";

        }


        return String(valor)
            .trim()
            .replace(/\s+/g, "")
            .replace(
                /^0+(?=\d)/,
                ""
            );

    }


    // ============================================================
    // MOSTRAR / OCULTAR SENHA
    // ============================================================

    const toggle =
        document.getElementById(
            "toggleSenha"
        );


    const senha =
        document.getElementById(
            "senhaLogin"
        );


    const eye =
        document.getElementById(
            "iconEye"
        );


    const eyeOff =
        document.getElementById(
            "iconEyeOff"
        );


    if (
        toggle &&
        senha &&
        eye &&
        eyeOff
    ) {

        toggle.addEventListener(
            "click",
            function () {

                const isPassword =
                    senha.type === "password";


                senha.type =
                    isPassword
                        ? "text"
                        : "password";


                eye.style.display =
                    isPassword
                        ? "none"
                        : "block";


                eyeOff.style.display =
                    isPassword
                        ? "block"
                        : "none";

            }
        );

    }

});