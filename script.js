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
// REFERÊNCIAS AOS ELEMENTOS DO FORMULÁRIO
// ===================================================================
const encaminhamentoForm = document.getElementById('encaminhamentoForm');
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
    // Adiciona os listeners (ouvintes de eventos) aos botões
    encaminhamentoForm.addEventListener('submit', saveRecord);
    salvarEdicaoButton.addEventListener('click', updateRecord);
    cancelarEdicaoButton.addEventListener('click', resetForm);

    // Carrega a lista de criadores e verifica se está em modo de edição
    loadCreators();
    checkEditMode();
});

// ===================================================================
// FUNÇÕES PRINCIPAIS (SALVAR, ATUALIZAR, CARREGAR)
// ===================================================================

/**
 * Salva um novo encaminhamento no Firebase.
 * @param {Event} e - O evento de submit do formulário.
 */
function saveRecord(e) {
    e.preventDefault(); // Impede o recarregamento da página

    const newRecord = getFormData();
    if (!newRecord.registradoPor) {
        alert("Por favor, selecione seu nome em 'Registrado por'.");
        return;
    }

    // Cria uma nova chave única no Firebase
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

/**
 * Atualiza um encaminhamento existente no Firebase.
 */
function updateRecord() {
    const params = new URLSearchParams(window.location.search);
    const recordId = params.get('editId');
    if (!recordId) return;

    const updatedRecord = getFormData();
    
    setLoadingState(true, 'Atualizando...', true);
    database.ref(`encaminhamentos/${recordId}`).update(updatedRecord)
        .then(() => {
            showStatusMessage('✅ Encaminhamento atualizado com sucesso!', true);
            // Redireciona para a página de busca para ver o resultado atualizado
            setTimeout(() => { window.location.href = 'results.html'; }, 1500);
        })
        .catch(handleFirebaseError)
        .finally(() => setLoadingState(false, 'Salvar Alterações', true));
}

/**
 * Verifica se a página foi carregada com um ID para edição.
 */
function checkEditMode() {
    const params = new URLSearchParams(window.location.search);
    const recordId = params.get('editId');

    if (recordId) {
        formTitle.textContent = "Editando Encaminhamento";
        showStatusMessage('Carregando dados para edição...', false);

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

/**
 * Carrega a lista de criadores.
 */
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
// FUNÇÕES AUXILIARES (MANIPULAÇÃO DE FORMULÁRIO E ESTADO)
// ===================================================================

/**
 * Coleta todos os dados do formulário e retorna um objeto.
 * @returns {object} - O objeto com os dados do encaminhamento.
 */
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

/**
 * Preenche o formulário com dados existentes para edição.
 * @param {object} data - Os dados do registro.
 */
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

/**
 * Reseta o formulário para o estado inicial.
 */
function resetForm() {
    encaminhamentoForm.reset();
    formTitle.textContent = 'Registrar Encaminhamento';
    switchToEditMode(false);
    // Limpa a URL para remover o ID de edição
    window.history.pushState({}, document.title, window.location.pathname);
}

/**
 * Alterna a visibilidade dos botões de registrar e editar.
 * @param {boolean} isEditing - True se estiver em modo de edição.
 */
function switchToEditMode(isEditing) {
    registrarButton.style.display = isEditing ? 'none' : 'block';
    editButtonsContainer.style.display = isEditing ? 'grid' : 'none';
}

/**
 * Mostra uma mensagem de status (sucesso ou erro) abaixo do formulário.
 * @param {string} message - A mensagem a ser exibida.
 * @param {boolean} isSuccess - True para mensagem de sucesso, false para erro.
 */
function showStatusMessage(message, isSuccess) {
    statusMessage.textContent = message;
    statusMessage.className = isSuccess ? 'success' : 'error';
    statusMessage.style.display = 'block';
    setTimeout(() => { statusMessage.style.display = 'none'; }, 4000);
}

/**
 * Lida com erros do Firebase, mostrando uma mensagem clara.
 * @param {Error} error - O objeto de erro do Firebase.
 */
function handleFirebaseError(error) {
    console.error("Erro no Firebase: ", error);
    showStatusMessage(`❌ Erro de comunicação com o banco de dados: ${error.message}`, false);
}

/**
 * Configura o estado de carregamento dos botões.
 * @param {boolean} isLoading - True se estiver carregando.
 * @param {string} text - O texto a ser exibido no botão.
 * @param {boolean} isEditing - True se for o botão de edição.
 */
function setLoadingState(isLoading, text, isEditing = false) {
    const button = isEditing ? salvarEdicaoButton : registrarButton;
    button.disabled = isLoading;
    button.textContent = text;
}

/**
 * Funções auxiliares para checkboxes.
 */
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
