// ===================================================================
// CONFIGURAÇÃO DO FIREBASE
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
// DADOS PARA CHECKBOXES DINÂMICOS
// ===================================================================
const motivosOptions = ["Indisciplina", "Gazeando aula", "Faltoso", "Celular/Fone de ouvido", "Dificuldade de aprendizado", "Chegada tardia", "Não produz/participa", "Problema com notas"];
const acoesOptions = ["Diálogo com o Estudante", "Comunicado aos Responsáveis"];
const providenciasOptions = ["Solicitar comparecimento do responsável", "Advertência"];

// ===================================================================
// INICIALIZAÇÃO DA PÁGINA
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos da página
    const encaminhamentoForm = document.getElementById('encaminhamentoForm');
    const searchButton = document.getElementById('search-button'); // CORRIGIDO: Busca o BOTÃO correto
    const salvarEdicaoButton = document.getElementById('btnSalvarEdicao');
    const cancelarEdicaoButton = document.getElementById('btnCancelarEdicao');

    // Referências aos elementos do modal de professores
    const manageProfessorsBtn = document.getElementById('manage-professors-btn');
    const professorsModal = document.getElementById('professors-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const addProfessorBtn = document.getElementById('add-professor-btn');

    // Gera os checkboxes dinamicamente
    createCheckboxes('motivos-container', motivosOptions, 'motivo');
    createCheckboxes('acoes-container', acoesOptions, 'acao');
    createCheckboxes('providencias-container', providenciasOptions, 'providencia');

    // Adiciona os listeners (ouvintes)
    encaminhamentoForm.addEventListener('submit', saveRecord);
    searchButton.addEventListener('click', redirectToSearchResults); // CORRIGIDO: Usa 'click' no botão
    salvarEdicaoButton.addEventListener('click', updateRecord);
    cancelarEdicaoButton.addEventListener('click', resetForm);
    
    // Listeners do modal
    manageProfessorsBtn.addEventListener('click', openProfessorsModal);
    closeModalBtn.addEventListener('click', closeProfessorsModal);
    addProfessorBtn.addEventListener('click', saveNewProfessor);
    window.addEventListener('click', (event) => { // Fecha o modal se clicar fora
        if (event.target == professorsModal) {
            closeProfessorsModal();
        }
    });

    // Carrega dados iniciais
    loadCreators();
    loadProfessors();
    checkEditMode();
});

// ===================================================================
// FUNÇÕES DE GERENCIAMENTO DE PROFESSORES
// ===================================================================

function openProfessorsModal() {
    document.getElementById('professors-modal').style.display = 'block';
}

function closeProfessorsModal() {
    document.getElementById('professors-modal').style.display = 'none';
}

function loadProfessors() {
    const professorsRef = database.ref('professores');
    professorsRef.on('value', (snapshot) => {
        const professorsData = snapshot.val();
        const datalist = document.getElementById('professors-datalist');
        const modalList = document.getElementById('professors-list-modal');
        datalist.innerHTML = '';
        modalList.innerHTML = 'Carregando...';

        if (professorsData) {
            modalList.innerHTML = '';
            // Ordena os professores alfabeticamente
            const sortedProfessors = Object.entries(professorsData).sort(([, a], [, b]) => a.localeCompare(b));

            for (const [key, name] of sortedProfessors) {
                // Adiciona ao autocompletar
                const option = document.createElement('option');
                option.value = name;
                datalist.appendChild(option);

                // Adiciona à lista do modal
                const li = document.createElement('li');
                const nameSpan = document.createElement('span');
                nameSpan.textContent = name;
                const editBtn = document.createElement('button');
                editBtn.textContent = 'Editar';
                editBtn.className = 'edit-professor-btn';
                editBtn.onclick = () => editProfessor(key, name);
                li.appendChild(nameSpan);
                li.appendChild(editBtn);
                modalList.appendChild(li);
            }
        } else {
            modalList.innerHTML = '<li>Nenhum professor cadastrado.</li>';
        }
    });
}

function saveNewProfessor() {
    const newNameInput = document.getElementById('new-professor-name');
    const newName = newNameInput.value.trim();
    if (newName) {
        database.ref('professores').push(newName)
            .then(() => {
                newNameInput.value = ''; // Limpa o campo
                showStatusMessage('✅ Professor adicionado!', true);
            })
            .catch(handleFirebaseError);
    } else {
        alert('Por favor, digite o nome do professor.');
    }
}

function editProfessor(key, currentName) {
    const newName = prompt('Digite o novo nome para o professor:', currentName);
    if (newName && newName.trim() !== '' && newName.trim() !== currentName) {
        database.ref(`professores/${key}`).set(newName.trim())
            .then(() => {
                showStatusMessage('✅ Nome do professor atualizado!', true);
            })
            .catch(handleFirebaseError);
    }
}


// ===================================================================
// FUNÇÕES DO SISTEMA (Formulário Principal)
// ===================================================================

function createCheckboxes(containerId, options, groupName) {
    const container = document.getElementById(containerId);
    if (!container) return;

    options.forEach(option => {
        const div = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox'; checkbox.name = groupName; checkbox.value = option;
        const label = document.createElement('label');
        label.textContent = ` ${option}`; label.style.fontWeight = 'normal';
        div.appendChild(checkbox); div.appendChild(label);
        container.appendChild(div);
    });

    if (groupName === 'acao' || groupName === 'providencia') {
        const divOutros = document.createElement('div');
        const checkboxOutros = document.createElement('input');
        checkboxOutros.type = 'checkbox'; checkboxOutros.name = groupName; checkboxOutros.value = 'Outros'; checkboxOutros.id = `${groupName}-outros-check`;
        const labelOutros = document.createElement('label');
        labelOutros.htmlFor = checkboxOutros.id; labelOutros.textContent = ' Outros:'; labelOutros.style.fontWeight = 'normal';
        const textOutros = document.createElement('input');
        textOutros.type = 'text'; textOutros.id = `${groupName}-outros-text`; textOutros.placeholder = 'Especifique...'; textOutros.style.display = 'inline'; textOutros.style.width = '65%'; textOutros.disabled = true;
        checkboxOutros.addEventListener('change', function() {
            textOutros.disabled = !this.checked;
            if (this.checked) { textOutros.focus(); } else { textOutros.value = ''; }
        });
        divOutros.appendChild(checkboxOutros); divOutros.appendChild(labelOutros); divOutros.appendChild(textOutros);
        container.appendChild(divOutros);
    }
}

function redirectToSearchResults() {
    const params = new URLSearchParams();
    const estudante = document.getElementById('search-estudante').value;
    const professor = document.getElementById('search-professor').value;
    const data = document.getElementById('search-data').value;
    const registradoPor = document.getElementById('search-registrado').value;

    if (estudante) params.append('estudante', estudante);
    if (professor) params.append('professor', professor);
    if (data) params.append('data', data);
    if (registradoPor) params.append('registradoPor', registradoPor);

    window.location.href = `results.html?${params.toString()}`;
}

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
            setTimeout(() => {
                window.location.href = 'results.html';
            }, 1500);
        })
        .catch(handleFirebaseError)
        .finally(() => setLoadingState(false, 'Salvar Alterações', true));
}

function checkEditMode() {
    const params = new URLSearchParams(window.location.search);
    const recordId = params.get('editId');
    if (recordId) {
        const formTitle = document.getElementById('form-title');
        formTitle.textContent = "Editando Encaminhamento";
        showStatusMessage('Carregando dados...', false);
        document.getElementById('editId').value = recordId;
        database.ref(`encaminhamentos/${recordId}`).once('value')
            .then(snapshot => {
                const data = snapshot.val();
                if (data) {
                    populateForm(data);
                    switchToEditMode(true);
                    document.getElementById('status-message').style.display = 'none';
                } else {
                    showStatusMessage('❌ Erro: Registro não encontrado.', false);
                }
            })
            .catch(handleFirebaseError);
    }
}

function loadCreators() {
    const creators = ["Jênifer Berão", "Joyce Vitorino", "Flávia Almeida", "Jaqueline Cardoso"];
    const select = document.getElementById('registradoPor');
    select.innerHTML = '<option value="">Selecione seu nome</option>';
    creators.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}

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
    document.getElementById('encaminhamentoForm').reset();
    document.getElementById('form-title').textContent = 'Registrar Encaminhamento';
    switchToEditMode(false);
    // Limpa o ID da URL para não recarregar no modo de edição
    window.history.pushState({}, document.title, window.location.pathname);
}

function switchToEditMode(isEditing) {
    document.getElementById('btnRegistrar').style.display = isEditing ? 'none' : 'block';
    document.getElementById('editButtons').style.display = isEditing ? 'grid' : 'none';
}

function showStatusMessage(message, isSuccess) {
    const statusMessage = document.getElementById('status-message');
    statusMessage.textContent = message;
    statusMessage.className = isSuccess ? 'success' : 'error';
    statusMessage.style.display = 'block';
    // Aumenta o tempo da mensagem para 4 segundos
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 4000);
}

function handleFirebaseError(error) {
    console.error("Erro no Firebase: ", error);
    showStatusMessage(`❌ Erro de comunicação com o banco de dados: ${error.message}`, false);
}

function setLoadingState(isLoading, text, isEditing = false) {
    const button = isEditing ? document.getElementById('btnSalvarEdicao') : document.getElementById('btnRegistrar');
    button.disabled = isLoading;
    button.textContent = text;
}

function getCheckboxValues(name) {
    const selected = [];
    document.querySelectorAll(`input[name="${name}"]:checked`).forEach(checkbox => {
        if (checkbox.value === "Outros") {
            const outrosTexto = document.getElementById(`${name}-outros-text`);
            if (outrosTexto && outrosTexto.value) {
                selected.push("Outros: " + outrosTexto.value);
            }
        } else {
            selected.push(checkbox.value);
        }
    });
    return selected.join(', ');
}

function setCheckboxValues(name, valuesString) {
    if (!valuesString) return;
    const values = valuesString.split(', ');
    document.querySelectorAll(`input[name="${name}"]`).forEach(checkbox => {
        checkbox.checked = values.includes(checkbox.value);
        if (checkbox.value === "Outros") {
            const outrosValue = values.find(v => v.startsWith("Outros: "));
            if (outrosValue) {
                checkbox.checked = true;
                const textInput = document.getElementById(`${name}-outros-text`);
                if (textInput) {
                    textInput.value = outrosValue.replace("Outros: ", "");
                    textInput.disabled = false;
                }
            }
        }
    });
}


