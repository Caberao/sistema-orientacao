// ===================================================================
// PASSO 1: COLE A CONFIGURAÇÃO DO FIREBASE AQUI
// ===================================================================
const firebaseConfig = {
  apiKey: "AIzaSyD4zcaOhAoSOa7qgLRCS1UJlAjUZdQaiBM",
  authDomain: "sistema-de-orientacao.firebaseapp.com",
  databaseURL: "https://sistema-de-orientacao-default-rtdb.firebaseio.com",
  projectId: "sistema-de-orientacao",
  storageBucket: "sistema-de-orientacao.firebasestorage.app",
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
// FUNÇÕES DE BUSCA E RENDERIZAÇÃO
// ===================================================================

function handleSearch() {
    loadingMessage.style.display = 'block';
    resultsTable.innerHTML = '';
    paginationContainer.innerHTML = ''; // Limpa a paginação antiga

    const params = new URLSearchParams(window.location.search);
    const filters = {
        estudante: (params.get('estudante') || '').toLowerCase(),
        professor: (params.get('professor') || '').toLowerCase(),
        data: params.get('data') || '',
        registradoPor: (params.get('registradoPor') || '').toLowerCase()
    };
    
    database.ref('encaminhamentos').orderByChild('dataEncaminhamento').once('value')
        .then(snapshot => {
            const data = snapshot.val();
            if (!data) {
                displayNoResults();
                return;
            }

            let resultsArray = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })).reverse(); // Ordem decrescente (mais novo primeiro)

            const isSearchActive = filters.estudante || filters.professor || filters.data || filters.registradoPor;

            if (isSearchActive) {
                allResults = resultsArray.filter(item => {
                    const isEstudanteMatch = !filters.estudante || (item.estudante || '').toLowerCase().includes(filters.estudante);
                    const isProfessorMatch = !filters.professor || (item.professor || '').toLowerCase().includes(filters.professor);
                    const isDataMatch = !filters.data || item.dataEncaminhamento === filters.data;
                    const isRegistradoMatch = !filters.registradoPor || (item.registradoPor || '').toLowerCase().includes(filters.registradoPor);
                    return isEstudanteMatch && isProfessorMatch && isDataMatch && isRegistradoMatch;
                });
            } else {
                allResults = resultsArray; // Sem filtros, pega todos os resultados
            }

            currentPage = 1; // Sempre volta para a primeira página após uma nova busca
            renderPage(currentPage);
            loadingMessage.style.display = 'none';
        })
        .catch(handleFirebaseError);
}

function renderPage(page) {
    currentPage = page;
    if (currentPage < 1) currentPage = 1;
    const totalPages = Math.ceil(allResults.length / recordsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    const paginatedItems = allResults.slice(start, end);

    displayResults(paginatedItems);
    renderPaginationControls(totalPages);
}

function displayResults(results) {
    if (results.length === 0) {
        displayNoResults();
        return;
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

    // Botões Primeiro e Voltar
    paginationContainer.innerHTML += `<button class="pagination-btn" onclick="renderPage(1)" ${currentPage === 1 ? 'disabled' : ''}>Primeiro</button>`;
    paginationContainer.innerHTML += `<button class="pagination-btn" onclick="renderPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>&laquo; Anterior</button>`;

    // Lógica para os números das páginas
    const pagesToShow = [];
    pagesToShow.push(1);
    if (currentPage > 3) pagesToShow.push('...');
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        if (i > 1 && i < totalPages) pagesToShow.push(i);
    }
    if (currentPage < totalPages - 2) pagesToShow.push('...');
    if (totalPages > 1) pagesToShow.push(totalPages);

    // Remove duplicados e cria os botões
    [...new Set(pagesToShow)].forEach(page => {
        if (page === '...') {
            paginationContainer.innerHTML += `<span class="pagination-btn ellipsis">...</span>`;
        } else {
            paginationContainer.innerHTML += `<button class="pagination-btn ${page === currentPage ? 'active' : ''}" onclick="renderPage(${page})">${page}</button>`;
        }
    });

    // Botões Próximo e Último
    paginationContainer.innerHTML += `<button class="pagination-btn" onclick="renderPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Próximo &raquo;</button>`;
    paginationContainer.innerHTML += `<button class="pagination-btn" onclick="renderPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>Último</button>`;
}


// ===================================================================
// FUNÇÕES AUXILIARES E DE RELATÓRIO (GARANTEM QUE O RELATÓRIO É COMPLETO)
// ===================================================================
function generateReport(reportType) {
    if (allResults.length === 0) { // Usa a lista completa de resultados
        alert("Não há resultados para gerar um relatório.");
        return;
    }
    try {
        localStorage.setItem('searchResults', JSON.stringify(allResults)); // Envia a lista completa
        localStorage.setItem('reportType', reportType);
        
        const reportWindow = window.open('report.html', '_blank');
        if (!reportWindow) {
            alert('Seu navegador bloqueou a abertura da nova janela. Por favor, desative o bloqueador de pop-ups.');
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
    resultsSummary.textContent = "Nenhum resultado para a busca atual.";
}

function handleFirebaseError(error) {
    loadingMessage.style.display = 'none';
    resultsTable.innerHTML = `<p style="color: red; font-weight: bold;">ERRO AO ACESSAR O BANCO DE DADOS:<br>${error.message}</p>`;
}

