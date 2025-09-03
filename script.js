// ===================================================================
// CONFIGURAÇÃO DO FIREBASE (JÁ INSERIDA)
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
// REFERÊNCIAS AOS ELEMENTOS DA PÁGINA
// ===================================================================
const encaminhamentoForm = document.getElementById('encaminhamentoForm');
const searchForm = document.getElementById('searchForm');
const formTitle = document.getElementById('form-title');
const registrarButton = document.getElementById('btnRegistrar');
const editButtonsContainer = document.getElementById('editButtons');
const salvarEdicaoButton = document.getElementById('btnSalvarEdicao');
const cancelarEdicaoButton = document.getElementById('btnCancelarEdicao');
const statusMessage = document.getElementById('status-message');

// ===================================================================
// INICIALIZAÇÃO DA PÁGINA
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Adiciona os listeners (ouvintes) para os formulários e botões
    encaminhamentoForm.addEventListener('submit', saveRecord);
    searchForm.addEventListener('submit', redirectToSearchResults);
    salvarEdicaoButton.addEventListener('click', updateRecord);
    cancelarEdicaoButton.addEventListener('click', resetForm);

    loadCreators();
    checkEditMode(); // Verifica se a página foi aberta para editar um registro
});

// ===================================================================
// FUNÇÃO DE BUSCA
// ===================================================================
function redirectToSearchResults(e) {
    e.preventDefault(); // Impede o envio padrão do formulário
    const params = new URLSearchParams();
    
    // Pega os valores dos campos de busca
    const estudante = document.getElementById('search-estudante').value;
    const professor = document.getElementById('search-professor').value;
    const data = document.getElementById('search-data').value;
    const registradoPor = document.getElementById('search-registrado').value;

    // Adiciona os valores aos parâmetros da URL, apenas se não estiverem vazios
    if (estudante) params.append('estudante', estudante);
    if (professor) params.append('professor', professor);
    if (data) params.append('data', data);
    if (registradoPor) params.append('registradoPor', registradoPor);

    // Redireciona para a página de resultados com os filtros na URL
    window.location.href = `results.html?${params.toString()}`;
}


// ===================================================================
// FUNÇÕES DE CADASTRO E EDIÇÃO (sem alterações)
// ===================================================================
function saveRecord(e) {
    e.preventDefault();
    const newRecord = getFormData();
    if (!newRecord.registradoPor) {
        alert("Por favor, selecione seu nome em 'Registrado por'.");
        return;
    }
    const newRecordRef = database.ref('encaminhamentos').push();
    setLoadingState(true, 'Salvando...');
    newRecordRef.set(newRecord)
        .then(() => {
            showStatusMessage('✅ Encaminhamento registrado com sucesso!', true);
            resetForm();
        })
        .catch(handleFirebaseError)
        .finally(() => setLoadingState(false, 'Registrar Encaminhamento'));
}

function updateRecord() {
    const recordId = document.getElementById('editId').value;
    if (!recordId) return;
    const updatedRecord = getFormData();
    setLoadingState(true, 'Atualizando...', true);
    database.ref(`encaminhamentos/${recordId}`).update(updatedRecord)
        .then(() => {
            showStatusMessage('✅ Encaminhamento atualizado com sucesso!', true);
            setTimeout(() => { window.location.href = 'results.html'; }, 1500);
        })
        .catch(handleFirebaseError)
        .finally(() => setLoadingState(false, 'Salvar Alterações', true));
}

function checkEditMode() {
    const params = new URLSearchParams(window.location.search);
    const recordId = params.get('editId');
    if (recordId) {
        formTitle.textContent = "Editando Encaminhamento";
        showStatusMessage('Carregando dados...', false);
        document.getElementById('editId').value = recordId;
        database.ref(`encaminhamentos/${recordId}`).once('value')
            .then(snapshot => {
                const data = snapshot.val();
                if (data) {
                    populateForm(data);
                    switchToEditMode(true);
                    statusMessage.style.display = 'none';
                } else {
                    showStatusMessage('❌ Erro: Registro não encontrado.', false);
                }
            })
            .catch(handleFirebaseError);
    }
}

function loadCreators() {
    const creators = ["Jênifer Berão", "Joyce Vitorino", "Flávia Almeida"];
    const select = document.getElementById('registradoPor');
    select.innerHTML = '<option value="">Selecione seu nome</option>';
    creators.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}

// ===================================================================
// FUNÇÕES AUXILIARES (sem alterações)
// ===================================================================
function getFormData() {
    return {
        dataEncaminhamento: document.getElementById('dataEncaminhamento').value,
        professor: document.getElementById('professor').value,
        estudante: document.getElementById('estudante').value,
        turma: document.getElementById('turma').value,
        motivos: getCheckboxValues('motivo'),
        detalhesMotivo: document.getElementById('detalhesMotivo').value,
        acoesTomadas: getCheckboxValues('acao'),
        detalhesAcao: document.getElementById('detalhesAcao').value,
        numeroTelefone: document.getElementById('numeroTelefone').value,
        horarioLigacao: document.getElementById('horarioLigacao').value,
        statusLigacao: document.getElementById('statusLigacao').value,
        recadoCom: document.getElementById('recadoCom').value,
        providencias: getCheckboxValues('providencia'),
        solicitacaoComparecimento: document.getElementById('solicitacaoComparecimento').value,
        status: document.getElementById('status').value,
        outrasInformacoes: document.getElementById('outrasInformacoes').value,
        registradoPor: document.getElementById('registradoPor').value
    };
}

function populateForm(data) {
    document.getElementById('dataEncaminhamento').value = data.dataEncaminhamento || '';
    document.getElementById('professor').value = data.professor || '';
    document.getElementById('estudante').value = data.estudante || '';
    document.getElementById('turma').value = data.turma || '';
    setCheckboxValues('motivo', data.motivos);
    document.getElementById('detalhesMotivo').value = data.detalhesMotivo || '';
    setCheckboxValues('acao', data.acoesTomadas);
    document.getElementById('detalhesAcao').value = data.detalhesAcao || '';
    document.getElementById('numeroTelefone').value = data.numeroTelefone || '';
    document.getElementById('horarioLigacao').value = data.horarioLigacao || '';
    document.getElementById('statusLigacao').value = data.statusLigacao || '';
    document.getElementById('recadoCom').value = data.recadoCom || '';
    setCheckboxValues('providencia', data.providencias);
    document.getElementById('solicitacaoComparecimento').value = data.solicitacaoComparecimento || '';
    document.getElementById('status').value = data.status || '';
    document.getElementById('outrasInformacoes').value = data.outrasInformacoes || '';
    document.getElementById('registradoPor').value = data.registradoPor || '';
}

function resetForm() {
    encaminhamentoForm.reset();
    formTitle.textContent = 'Registrar Encaminhamento';
    switchToEditMode(false);
    // Limpa o parâmetro 'editId' da URL sem recarregar a página
    window.history.pushState({}, document.title, window.location.pathname);
}

function switchToEditMode(isEditing) {
    registrarButton.style.display = isEditing ? 'none' : 'block';
    editButtonsContainer.style.display = isEditing ? 'grid' : 'none';
}

function showStatusMessage(message, isSuccess) {
    statusMessage.textContent = message;
    statusMessage.className = isSuccess ? 'success' : 'error';
    statusMessage.style.display = 'block';
    setTimeout(() => { statusMessage.style.display = 'none'; }, 4000);
}

function handleFirebaseError(error) {
    console.error("Erro no Firebase: ", error);
    showStatusMessage(`❌ Erro de comunicação com o banco de dados: ${error.message}`, false);
}

function setLoadingState(isLoading, text, isEditing = false) {
    const button = isEditing ? salvarEdicaoButton : registrarButton;
    button.disabled = isLoading;
    button.textContent = text;
}

function getCheckboxValues(name) {
    const selected = [];
    document.querySelectorAll(`input[name="${name}"]:checked`).forEach(checkbox => {
        selected.push(checkbox.value);
    });
    return selected.join(', ');
}

function setCheckboxValues(name, valuesString) {
    if (!valuesString) return;
    const values = valuesString.split(', ');
    document.querySelectorAll(`input[name="${name}"]`).forEach(checkbox => {
        checkbox.checked = values.includes(checkbox.value);
    });
}
