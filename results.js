// ===================================================================
// PASSO 1: CONFIGURAÇÃO DO FIREBASE (JÁ INSERIDA)
// ===================================================================
const firebaseConfig = {
    apiKey: "AIzaSyD4zcaOhAoSOa7qgLRCS1UJlAjUZdQaiBM",
    authDomain: "sistema-de-orientacao.firebaseapp.com",
    databaseURL: "https://sistema-de-orientacao-default-rtdb.firebaseio.com",
    projectId: "sistema-de-orientacao",
    storageBucket: "sistema-de-orientacao.appspot.com",
    messagingSenderId: "931283448046",
    appId: "1:931283448046:web:b9e81772112943533443ff"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ===================================================================
// REFERÊNCIAS E VARIÁVEIS DE ESTADO DA PAGINAÇÃO
// ===================================================================
const resultsTable = document.getElementById("results-table");
const loadingMessage = document.getElementById("loading-message");
const simpleReportButton = document.getElementById("simple-report-button");
const completeReportButton = document.getElementById("complete-report-button");
const resultsSummary = document.getElementById("results-summary");
const paginationContainer = document.getElementById("pagination-container");

let allResults = [];      // Armazena TODOS os resultados da busca para relatórios e paginação
let currentPage = 1;      // Página atual
const recordsPerPage = 10; // Quantidade de registros por página

// ===================================================================
// FUNÇÕES DE INICIALIZAÇÃO
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    handleSearch();
    simpleReportButton.addEventListener('click', () => generateReport('simple'));
    completeReportButton.addEventListener('click', () => generateReport('complete'));
});

// ===================================================================
// FUNÇÕES DE BUSCA E RENDERIZAÇÃO (VERSÃO COM DIAGNÓSTICO)
// ===================================================================

function handleSearch() {
    loadingMessage.style.display = 'block';
    resultsTable.innerHTML = '';
    paginationContainer.innerHTML = ''; // Limpa a paginação antiga
    resultsSummary.innerHTML = ''; // Limpa o sumário para o diagnóstico

    const params = new URLSearchParams(window.location.search);
    const filters = {
        estudante: (params.get('estudante') || '').toLowerCase(),
        professor: (params.get('professor') || '').toLowerCase(),
        data: params.get('data') || '',
        registradoPor: (params.get('registradoPor') || '').toLowerCase()
    };
    
    // Mostra os filtros que estão sendo usados para diagnóstico
    let debugInfo = [`<strong>Diagnóstico:</strong> Filtros aplicados: ${JSON.stringify(filters)}`];

    database.ref('encaminhamentos').once('value')
        .then(snapshot => {
            const data = snapshot.val();
            if (!data) {
                debugInfo.push("Firebase não retornou dados.");
                resultsSummary.innerHTML = debugInfo.join('<br>');
                displayNoResults();
                return;
            }

            let resultsArray = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
            
            debugInfo.push(`Total de registros no Firebase: ${resultsArray.length}`);
            
            resultsArray.sort((a, b) => {
                const dateA = a.dataEncaminhamento ? new Date(a.dataEncaminhamento) : new Date(0);
                const dateB = b.dataEncaminhamento ? new Date(b.dataEncaminhamento) : new Date(0);
                return dateB - dateA;
            });

            const isSearchActive = filters.estudante || filters.professor || filters.data || filters.registradoPor;

            if (isSearchActive) {
                allResults = resultsArray.filter(item => {
                    // Lógica de filtro mais segura, convertendo tudo para string
                    const isEstudanteMatch = !filters.estudante || (item.estudante || '').toString().toLowerCase().includes(filters.estudante);
                    const isProfessorMatch = !filters.professor || (item.professor || '').toString().toLowerCase().includes(filters.professor);
                    const isDataMatch = !filters.data || (item.dataEncaminhamento || '').toString() === filters.data;
                    const isRegistradoMatch = !filters.registradoPor || (item.registradoPor || '').toString().toLowerCase().includes(filters.registradoPor);
                    return isEstudanteMatch && isProfessorMatch && isDataMatch && isRegistradoMatch;
                });
                debugInfo.push(`Registros encontrados após o filtro: ${allResults.length}`);
            } else {
                allResults = resultsArray;
                debugInfo.push("Nenhum filtro ativo, mostrando todos os registros.");
            }
            
            // Adiciona o log de diagnóstico ao sumário
            resultsSummary.innerHTML = debugInfo.join('<br>');
            currentPage = 1; 
            renderPage(currentPage);
            loadingMessage.style.display = 'none';
        })
        .catch(handleFirebaseError);
}

function renderPage(page) {
    currentPage = page;
    const totalPages = Math.ceil(allResults.length / recordsPerPage);

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

    const start = (currentPage - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    const paginatedItems = allResults.slice(start, end);

    displayResults(paginatedItems, start);
    renderPaginationControls(totalPages);
}

function displayResults(results, startIndex) {
    if (results.length === 0) {
        displayNoResults();
        return;
    }
    
    // Constrói o texto do sumário e adiciona abaixo do diagnóstico
    const summaryText = `<br>Mostrando registros ${startIndex + 1} a ${startIndex + results.length} de ${allResults.length} encontrado(s).`;
    if (!resultsSummary.innerHTML.includes(summaryText)) {
        resultsSummary.innerHTML += summaryText;
    }

    let tableHTML = `<table><thead><tr><th>Data</th><th>Estudante</th><th>Professor</th><th>Status</th><th>Ações</th></tr></thead><tbody>`;
    results.forEach(item => {
        tableHTML += `<tr>
                        <td>${item.dataEncaminhamento || ''}</td>
                        <td>${item.estudante || ''}</td>
                        <td>${item.professor || ''}</td>
                        <td>${item.status || ''}</td>
                        <td><button class="edit-btn" onclick="redirectToEdit('${item.id}')">Ver/Editar</button></td>
                      </tr>`;
    });
    tableHTML += '</tbody></table>';
    resultsTable.innerHTML = tableHTML;
}

// ===================================================================
// LÓGICA PARA CRIAR OS BOTÕES DE PAGINAÇÃO
// ===================================================================
function renderPaginationControls(totalPages) {
    paginationContainer.innerHTML = '';
    if (totalPages <= 1) return;

    paginationContainer.innerHTML += `<button class="pagination-btn" onclick="renderPage(1)" ${currentPage === 1 ? 'disabled' : ''}>Primeiro</button>`;
    paginationContainer.innerHTML += `<button class="pagination-btn" onclick="renderPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>&laquo; Anterior</button>`;

    const pagesToShow = [];
    if (totalPages <= 5) {
        for(let i=1; i<=totalPages; i++) pagesToShow.push(i);
    } else {
        pagesToShow.push(1);
        if (currentPage > 3) pagesToShow.push('...');
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            pagesToShow.push(i);
        }
        if (currentPage < totalPages - 2) pagesToShow.push('...');
        pagesToShow.push(totalPages);
    }

    [...new Set(pagesToShow)].forEach(page => {
        if (page === '...') {
            paginationContainer.innerHTML += `<span class="pagination-btn ellipsis">...</span>`;
        } else {
            paginationContainer.innerHTML += `<button class="pagination-btn ${page === currentPage ? 'active' : ''}" onclick="renderPage(${page})">${page}</button>`;
        }
    });

    paginationContainer.innerHTML += `<button class="pagination-btn" onclick="renderPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Próximo &raquo;</button>`;
    paginationContainer.innerHTML += `<button class="pagination-btn" onclick="renderPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>Último</button>`;
}


// ===================================================================
// FUNÇÕES AUXILIARES E DE RELATÓRIO
// ===================================================================
function generateReport(reportType) {
    if (allResults.length === 0) {
        alert("Não há resultados para gerar um relatório.");
        return;
    }
    try {
        localStorage.setItem('searchResults', JSON.stringify(allResults));
        localStorage.setItem('reportType', reportType);
        
        const reportWindow = window.open('report.html', '_blank');
        if (!reportWindow) {
            alert('Seu navegador bloqueou a abertura da nova janela. Por favor, desative o bloqueador de pop-ups para este site.');
        }
    } catch (e) {
        alert("Ocorreu um erro ao tentar gerar o relatório: " + e.message);
    }
}

function redirectToEdit(recordId) {
    window.location.href = `index.html?editId=${recordId}`;
}

function displayNoResults() {
    loadingMessage.style.display = 'none';
    resultsTable.innerHTML = "<p>Nenhum registro encontrado com estes critérios.</p>";
}

function handleFirebaseError(error) {
    loadingMessage.style.display = 'none';
    resultsTable.innerHTML = `<p style="color: red; font-weight: bold;">ERRO AO ACESSAR O BANCO DE DADOS:<br>${error.message}</p>`;
    resultsSummary.innerHTML += `<br><strong style="color:red;">Falha na conexão com o Firebase.</strong>`;
}

