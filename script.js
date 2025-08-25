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
// REFERÊNCIAS AOS ELEMENTOS DO HTML
// ===================================================================
const resultsTable = document.getElementById("results-table");
const loadingMessage = document.getElementById("loading-message");
const simpleReportButton = document.getElementById("simple-report-button");
const completeReportButton = document.getElementById("complete-report-button");
const resultsSummary = document.getElementById("results-summary");

let currentResults = []; // Armazena os resultados da busca atual

// ===================================================================
// FUNÇÕES DE INICIALIZAÇÃO
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    handleSearch();
    // Adiciona listeners para os dois botões de relatório
    simpleReportButton.addEventListener('click', () => generateReport('simple'));
    completeReportButton.addEventListener('click', () => generateReport('complete'));
});

// ===================================================================
// FUNÇÕES PRINCIPAIS
// ===================================================================

function handleSearch() {
    loadingMessage.style.display = 'block';
    resultsTable.innerHTML = '';

    const params = new URLSearchParams(window.location.search);
    const filters = {
        estudante: (params.get('estudante') || '').toLowerCase(),
        professor: (params.get('professor') || '').toLowerCase(),
        data: params.get('data') || '',
        registradoPor: (params.get('registradoPor') || '').toLowerCase()
    };
    
    let summaryText = Object.entries(filters)
        .filter(([key, value]) => value)
        .map(([key, value]) => `${key}: "${value}"`)
        .join(', ');
    resultsSummary.textContent = summaryText ? `Filtros aplicados: ${summaryText}` : "Mostrando os 10 registros mais recentes.";

    database.ref('encaminhamentos').orderByChild('dataEncaminhamento').once('value')
        .then(snapshot => {
            const data = snapshot.val();
            if (!data) {
                displayResults([]);
                loadingMessage.style.display = 'none';
                return;
            }

            let resultsArray = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })).reverse();

            const isSearchActive = filters.estudante || filters.professor || filters.data || filters.registradoPor;
            let finalResults;

            if (isSearchActive) {
                finalResults = resultsArray.filter(item => {
                    const estudanteItem = item.estudante ? item.estudante.toLowerCase() : '';
                    const professorItem = item.professor ? item.professor.toLowerCase() : '';
                    const registradoPorItem = item.registradoPor ? item.registradoPor.toLowerCase() : '';

                    const isEstudanteMatch = !filters.estudante || estudanteItem.includes(filters.estudante);
                    const isProfessorMatch = !filters.professor || professorItem.includes(filters.professor);
                    const isDataMatch = !filters.data || item.dataEncaminhamento === filters.data;
                    const isRegistradoMatch = !filters.registradoPor || registradoPorItem.includes(filters.registradoPor);
                    
                    return isEstudanteMatch && isProfessorMatch && isDataMatch && isRegistradoMatch;
                });
            } else {
                finalResults = resultsArray.slice(0, 10);
            }

            currentResults = finalResults;
            displayResults(finalResults);
            loadingMessage.style.display = 'none';
        })
        .catch(error => {
            loadingMessage.style.display = 'none';
            resultsTable.innerHTML = `<p style="color: red; font-weight: bold;">
                                        ERRO AO ACESSAR O BANCO DE DADOS:<br>
                                        ${error.message}<br><br>
                                        <strong>Possíveis causas:</strong><br>
                                        1. A configuração do Firebase (firebaseConfig) no arquivo results.js está incorreta.<br>
                                        2. As regras de segurança do Realtime Database não permitem a leitura.
                                      </p>`;
        });
}

function displayResults(results) {
    let tableHTML = `<table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Estudante</th>
                                <th>Professor</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>`;

    if (results.length === 0) {
        resultsTable.innerHTML = "<p>Nenhum registro encontrado com estes critérios.</p>";
        return;
    }

    results.forEach(item => {
        tableHTML += `<tr>
                        <td>${item.dataEncaminhamento || ''}</td>
                        <td>${item.estudante || ''}</td>
                        <td>${item.professor || ''}</td>
                        <td>${item.status || ''}</td>
                        <td>
                            <button class="edit-btn" onclick="redirectToEdit('${item.id}')">Ver/Editar</button>
                        </td>
                      </tr>`;
    });

    tableHTML += '</tbody></table>';
    resultsTable.innerHTML = tableHTML;
}

function redirectToEdit(recordId) {
    window.location.href = `index.html?editId=${recordId}`;
}

function generateReport(reportType) {
    if (currentResults.length === 0) {
        alert("Não há resultados para gerar um relatório.");
        return;
    }
    localStorage.setItem('searchResults', JSON.stringify(currentResults));
    localStorage.setItem('searchSummary', resultsSummary.textContent);
    localStorage.setItem('reportType', reportType); // Salva o tipo de relatório
    
    window.open('report.html', '_blank');
}
