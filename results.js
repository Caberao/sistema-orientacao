// ===================================================================
// PASSO 1: COLE A CONFIGURAÇÃO DO FIREBASE AQUI
// ===================================================================
const firebaseConfig = {
    apiKey: "COLE_SUA_API_KEY_AQUI",
    authDomain: "COLE_SEU_AUTH_DOMAIN_AQUI",
    databaseURL: "COLE_SUA_DATABASE_URL_AQUI",
    projectId: "COLE_SEU_PROJECT_ID_AQUI",
    storageBucket: "COLE_SEU_STORAGE_BUCKET_AQUI",
    messagingSenderId: "COLE_SEU_MESSAGING_SENDER_ID_AQUI",
    appId: "COLE_SEU_APP_ID_AQUI"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ===================================================================
// REFERÊNCIAS AOS ELEMENTOS DO HTML
// ===================================================================
const resultsTable = document.getElementById("results-table");
const loadingMessage = document.getElementById("loading-message");
const printButton = document.getElementById("print-button");
const resultsSummary = document.getElementById("results-summary");

let currentResults = []; // Armazena os resultados da busca atual

// ===================================================================
// FUNÇÕES DE INICIALIZAÇÃO
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    handleSearch();
    printButton.addEventListener('click', generateReport);
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
    
    // Cria um resumo da busca para exibição
    let summaryText = Object.entries(filters)
        .filter(([key, value]) => value) // Filtra apenas os que têm valor
        .map(([key, value]) => `${key}: "${value}"`)
        .join(', ');
    resultsSummary.textContent = summaryText ? `Filtros aplicados: ${summaryText}` : "Mostrando os registros mais recentes.";


    database.ref('encaminhamentos').orderByChild('dataEncaminhamento').once('value', snapshot => {
        const data = snapshot.val();
        let resultsArray = [];
        if (data) {
            resultsArray = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })).reverse(); // Inverte para mostrar os mais recentes primeiro
        }

        const filteredResults = resultsArray.filter(item => {
            const isEstudanteMatch = !filters.estudante || (item.estudante && item.estudante.toLowerCase().includes(filters.estudante));
            const isProfessorMatch = !filters.professor || (item.professor && item.professor.toLowerCase().includes(filters.professor));
            const isDataMatch = !filters.data || item.dataEncaminhamento === filters.data;
            const isRegistradoMatch = !filters.registradoPor || (item.registradoPor && item.registradoPor.toLowerCase().includes(filters.registradoPor));
            return isEstudanteMatch && isProfessorMatch && isDataMatch && isRegistradoMatch;
        });
        
        // Se a busca for vazia, mostra os 10 mais recentes
        const finalResults = (filters.estudante || filters.professor || filters.data || filters.registradoPor) ? filteredResults : resultsArray.slice(0, 10);

        currentResults = finalResults; // Salva os resultados para impressão
        displayResults(finalResults);
        loadingMessage.style.display = 'none';
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
    // Redireciona para a página principal, passando o ID do registro para edição
    window.location.href = `index.html?editId=${recordId}`;
}

function generateReport() {
    if (currentResults.length === 0) {
        alert("Não há resultados para gerar um relatório.");
        return;
    }
    // Salva os dados no localStorage para a página de impressão poder acessá-los
    localStorage.setItem('searchResults', JSON.stringify(currentResults));
    localStorage.setItem('searchSummary', resultsSummary.textContent);
    
    // Abre a página de relatório em uma nova aba
    window.open('report.html', '_blank');
}
