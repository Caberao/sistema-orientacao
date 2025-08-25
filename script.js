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
const criadores = ["Ana", "Beatriz", "Carlos", "Daniela"]; // Edite ou remova nomes
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
const formTitle = document.getElementById("form-title");

// ===================================================================
// FUNÇÕES DE INICIALIZAÇÃO
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    populateSelect('registradoPor', criadores);
    populateCheckboxes('motivos-container', 'motivo', motivos);
    populateCheckboxes('acoes-container', 'acao', acoes);
    populateCheckboxes('providencias-container', 'providencia', providencias);

    btnRegistrar.addEventListener('click', registrarEncaminhamento);
    searchButton.addEventListener('click', redirectToResults);
    btnSalvarEdicao.addEventListener('click', salvarAlteracoes);
    btnCancelarEdicao.addEventListener('click', resetForm);
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
// FUNÇÕES PRINCIPAIS
// ===================================================================

function registrarEncaminhamento(event) {
    event.preventDefault();
    const formData = getFormData();
    if (!formData.registradoPor) {
        alert("Por favor, selecione seu nome em 'Registrado por'.");
        return;
    }
    const newRecordRef = database.ref('encaminhamentos').push();
    newRecordRef.set(formData)
        .then(() => {
            showStatus("✅ Encaminhamento registrado com sucesso!", "success");
            resetForm();
        })
        .catch(error => { showStatus(`❌ Erro ao registrar: ${error.message}`, "error"); });
}

function redirectToResults() {
    const params = new URLSearchParams();
    const estudante = document.getElementById("search-estudante").value;
    const professor = document.getElementById("search-professor").value;
    const data = document.getElementById("search-data").value;
    const registradoPor = document.getElementById("search-registrado").value;

    if (estudante) params.append('estudante', estudante);
    if (professor) params.append('professor', professor);
    if (data) params.append('data', data);
    if (registradoPor) params.append('registradoPor', registradoPor);

    window.location.href = `results.html?${params.toString()}`;
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
        })
        .catch(error => { showStatus(`❌ Erro ao atualizar: ${error.message}`, "error"); });
}

// ===================================================================
// FUNÇÕES AUXILIARES
// ===================================================================

function getFormData() {
    // Esta função permanece a mesma da versão anterior
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

function resetForm() {
    form.reset();
    document.getElementById('editId').value = '';
    ['motivo', 'acao', 'providencia'].forEach(name => {
        document.querySelectorAll(`input[name=${name}]`).forEach(el => el.checked = false);
        const txt = document.getElementById(`${name}-outros-text`);
        if(txt) { txt.disabled = true; txt.value = ''; }
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
            if (textInput && textInput.value) { selected.push("Outros: " + textInput.value); }
        } else { selected.push(checkbox.value); }
    });
    return selected.join(", ");
}

function showStatus(message, type) {
    const statusDiv = document.getElementById("status-message");
    statusDiv.textContent = message;
    statusDiv.className = type;
    statusDiv.style.display = 'block';
    setTimeout(() => { statusDiv.style.display = 'none'; }, 4000);
}
