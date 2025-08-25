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
// CONFIGURAÇÕES DO FORMULÁRIO
// ===================================================================
const criadores = ["Jênifer Berão", "Joyce Vitorino", "Flávia Almeida"]; // Edite ou remova nomes
const motivos = ["Indisciplina", "Gazeando aula", "Faltoso", "Celular/Fone de ouvido", "Dificuldade de aprendizado", "Chegada tardia", "Não produz/participa", "Problema com notas"];
const acoes = ["Diálogo com o Estudante", "Comunicado aos Responsáveis"];
const providencias = ["Solicitar comparecimento do responsável", "Advertência"];

// ===================================================================
// REFERÊNCIAS AOS ELEMENTOS DO HTML
// ===================================================================
const form = document.getElementById("encaminhamentoForm");
const btnRegistrar = document.getElementById("btnRegistrar");
const editButtons = document.getElementById("editButtons");
const btnSalvarEdicao = document.getElementById("btnSalvarEdicao");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");
const searchButton = document.getElementById("search-button");
const resultsTable = document.getElementById("results-table");
const loadingMessage = document.getElementById("loading-message");
const formTitle = document.getElementById("form-title");

// ===================================================================
// FUNÇÕES DE INICIALIZAÇÃO
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Preenche os selects e checkboxes dinamicamente
    populateSelect('registradoPor', criadores);
    populateCheckboxes('motivos-container', 'motivo', motivos);
    populateCheckboxes('acoes-container', 'acao', acoes);
    populateCheckboxes('providencias-container', 'providencia', providencias);

    // Adiciona os listeners (ouvintes de eventos)
    btnRegistrar.addEventListener('click', registrarEncaminhamento);
    searchButton.addEventListener('click', handleSearch);
    btnSalvarEdicao.addEventListener('click', salvarAlteracoes);
    btnCancelarEdicao.addEventListener('click', resetForm);

    // Carrega os dados iniciais
    handleSearch();
});

function populateSelect(elementId, options) {
    const select = document.getElementById(elementId);
    select.innerHTML = '<option value="">Selecione seu nome</option>';
    options.forEach(optionText => {
        const option = document.createElement('option');
        option.value = optionText;
        option.textContent = optionText;
        select.appendChild(option);
    });
}

function populateCheckboxes(containerId, name, options) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    options.forEach(optionText => {
        const div = document.createElement('div');
        div.innerHTML = `<input type="checkbox" name="${name}" value="${optionText}"> ${optionText}`;
        container.appendChild(div);
    });
    // Adiciona a opção "Outros"
    const divOutros = document.createElement('div');
    divOutros.innerHTML = `<input type="checkbox" name="${name}" value="Outros" id="${name}-outros-check">
                         <label for="${name}-outros-check" style="font-weight: normal;">Outros:</label>
                         <input type="text" id="${name}-outros-text" placeholder="Especifique..." style="display:inline; width: 65%;" disabled>`;
    container.appendChild(divOutros);
    document.getElementById(`${name}-outros-check`).addEventListener('change', function() {
        document.getElementById(`${name}-outros-text`).disabled = !this.checked;
    });
}


// ===================================================================
// FUNÇÕES PRINCIPAIS (CRUD - Create, Read, Update, Delete)
// ===================================================================

function registrarEncaminhamento(event) {
    event.preventDefault();
    const formData = getFormData();
    if (!formData.registradoPor) {
        alert("Por favor, selecione seu nome em 'Registrado por'.");
        return;
    }

    // Gera um ID único para o novo registro
    const newRecordRef = database.ref('encaminhamentos').push();
    
    newRecordRef.set(formData)
        .then(() => {
            showStatus("✅ Encaminhamento registrado com sucesso!", "success");
            resetForm();
            handleSearch();
        })
        .catch(error => {
            showStatus(`❌ Erro ao registrar: ${error.message}`, "error");
        });
}

function handleSearch() {
    loadingMessage.style.display = 'block';
    resultsTable.innerHTML = '';

    const filters = {
        estudante: document.getElementById("search-estudante").value.toLowerCase(),
        professor: document.getElementById("search-professor").value.toLowerCase(),
        data: document.getElementById("search-data").value,
        registradoPor: document.getElementById("search-registrado").value.toLowerCase()
    };

    database.ref('encaminhamentos').once('value', snapshot => {
        const data = snapshot.val();
        let resultsArray = [];
        if (data) {
            resultsArray = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
        }

        const filteredResults = resultsArray.filter(item => {
            const isEstudanteMatch = !filters.estudante || item.estudante.toLowerCase().includes(filters.estudante);
            const isProfessorMatch = !filters.professor || item.professor.toLowerCase().includes(filters.professor);
            const isDataMatch = !filters.data || item.dataEncaminhamento === filters.data;
            const isRegistradoMatch = !filters.registradoPor || item.registradoPor.toLowerCase().includes(filters.registradoPor);
            return isEstudanteMatch && isProfessorMatch && isDataMatch && isRegistradoMatch;
        }).sort((a, b) => new Date(b.dataEncaminhamento) - new Date(a.dataEncaminhamento)); // Ordena por data

        displayResults(filteredResults);
        loadingMessage.style.display = 'none';
    });
}

function salvarAlteracoes(event) {
    event.preventDefault();
    const recordId = document.getElementById('editId').value;
    if (!recordId) return;

    const formData = getFormData();
    
    database.ref('encaminhamentos/' + recordId).update(formData)
        .then(() => {
            showStatus("✅ Registro atualizado com sucesso!", "success");
            resetForm();
            handleSearch();
        })
        .catch(error => {
            showStatus(`❌ Erro ao atualizar: ${error.message}`, "error");
        });
}

// ===================================================================
// FUNÇÕES AUXILIARES
// ===================================================================

function getFormData() {
    return {
        dataEncaminhamento: document.getElementById("dataEncaminhamento").value,
        professor: document.getElementById("professor").value,
        estudante: document.getElementById("estudante").value,
        turma: document.getElementById("turma").value,
        motivos: getCheckboxValues('motivo'),
        detalhesMotivo: document.getElementById("detalhesMotivo").value,
        acoesTomadas: getCheckboxValues('acao'),
        detalhesAcao: document.getElementById("detalhesAcao").value,
        numeroTelefone: document.getElementById("numeroTelefone").value,
        horarioLigacao: document.getElementById("horarioLigacao").value,
        statusLigacao: document.getElementById("statusLigacao").value,
        recadoCom: document.getElementById("recadoCom").value,
        providencias: getCheckboxValues('providencia'),
        solicitacaoComparecimento: document.getElementById("solicitacaoComparecimento").value,
        status: document.getElementById("status").value,
        outrasInformacoes: document.getElementById("outrasInformacoes").value,
        registradoPor: document.getElementById("registradoPor").value
    };
}

function displayResults(results) {
    let tableHTML = `<table>
                        <tr>
                            <th>Data</th>
                            <th>Estudante</th>
                            <th>Professor</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>`;

    if (results.length === 0) {
        resultsTable.innerHTML = "<p>Nenhum registro encontrado.</p>";
        return;
    }

    results.forEach(item => {
        tableHTML += `<tr>
                        <td>${item.dataEncaminhamento}</td>
                        <td>${item.estudante}</td>
                        <td>${item.professor}</td>
                        <td>${item.status}</td>
                        <td>
                            <button class="edit-btn" onclick="iniciarEdicao('${item.id}')">Editar</button>
                        </td>
                      </tr>`;
    });

    tableHTML += '</table>';
    resultsTable.innerHTML = tableHTML;
}

function iniciarEdicao(recordId) {
    database.ref('encaminhamentos/' + recordId).once('value', snapshot => {
        const data = snapshot.val();
        if (!data) {
            showStatus("❌ Erro: Registro não encontrado.", "error");
            return;
        }

        // Preenche os campos normais
        document.getElementById('editId').value = recordId;
        document.getElementById('dataEncaminhamento').value = data.dataEncaminhamento;
        document.getElementById('professor').value = data.professor;
        document.getElementById('estudante').value = data.estudante;
        document.getElementById('turma').value = data.turma;
        document.getElementById('detalhesMotivo').value = data.detalhesMotivo;
        document.getElementById('detalhesAcao').value = data.detalhesAcao;
        document.getElementById('numeroTelefone').value = data.numeroTelefone;
        document.getElementById('horarioLigacao').value = data.horarioLigacao;
        document.getElementById('statusLigacao').value = data.statusLigacao;
        document.getElementById('recadoCom').value = data.recadoCom;
        document.getElementById('solicitacaoComparecimento').value = data.solicitacaoComparecimento;
        document.getElementById('status').value = data.status;
        document.getElementById('outrasInformacoes').value = data.outrasInformacoes;
        document.getElementById('registradoPor').value = data.registradoPor;

        // Preenche os checkboxes
        setCheckboxValues('motivo', data.motivos);
        setCheckboxValues('acao', data.acoesTomadas);
        setCheckboxValues('providencia', data.providencias);
        
        // Altera a UI para o modo de edição
        formTitle.textContent = "Editando Registro";
        btnRegistrar.style.display = 'none';
        editButtons.style.display = 'grid';
        window.scrollTo(0, 0); // Rola a página para o topo
    });
}

function resetForm() {
    form.reset();
    document.getElementById('editId').value = '';
    
    ['motivo', 'acao', 'providencia'].forEach(name => {
        document.querySelectorAll(`input[name=${name}]`).forEach(el => el.checked = false);
        const txt = document.getElementById(`${name}-outros-text`);
        if(txt) {
            txt.disabled = true;
            txt.value = '';
        }
    });

    formTitle.textContent = "Registrar Encaminhamento";
    btnRegistrar.style.display = 'block';
    editButtons.style.display = 'none';
    showStatus("", "");
}

function getCheckboxValues(name) {
    const selected = [];
    document.querySelectorAll(`input[name="${name}"]:checked`).forEach(checkbox => {
        if (checkbox.value === "Outros") {
            const textInput = document.getElementById(`${name}-outros-text`);
            if (textInput && textInput.value) {
                selected.push("Outros: " + textInput.value);
            }
        } else {
            selected.push(checkbox.value);
        }
    });
    return selected.join(", ");
}

function setCheckboxValues(name, valuesString) {
    if (!valuesString) return;
    const values = valuesString.split(", ");
    document.querySelectorAll(`input[name="${name}"]`).forEach(checkbox => {
        checkbox.checked = values.includes(checkbox.value);

        if (checkbox.value === "Outros") {
            const outrosValue = values.find(v => v.startsWith("Outros: "));
            if (outrosValue) {
                checkbox.checked = true;
                const textInput = document.getElementById(`${name}-outros-text`);
                textInput.value = outrosValue.replace("Outros: ", "");
                textInput.disabled = false;
            }
        }
    });
}

function showStatus(message, type) {
    const statusDiv = document.getElementById("status-message");
    statusDiv.textContent = message;
    statusDiv.className = type; // 'success' or 'error'
    statusDiv.style.display = 'block';
    setTimeout(() => { statusDiv.style.display = 'none'; }, 4000);
}

