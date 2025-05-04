document.addEventListener('DOMContentLoaded', () => {
    const loadingSection = document.getElementById('loading-section');
    const errorSection = document.getElementById('error-section');
    const errorMessage = document.getElementById('error-message');
    const agendaSection = document.getElementById('agenda-section');
    const sessionSection = document.getElementById('session-section');
    const agendaList = document.getElementById('agenda-list');
    const sessionList = document.getElementById('session-list');
    const createAgendaButton = document.getElementById('create-agenda-button');
    const newAgendaTitleInput = document.getElementById('new-agenda-title');
    const newAgendaDescriptionInput = document.getElementById('new-agenda-description');
    const agendaFeedback = document.getElementById('agenda-feedback');
    const openSessionButton = document.getElementById('open-session-button');
    const selectAgendaForSession = document.getElementById('select-agenda-for-session');
    const sessionDurationInput = document.getElementById('session-duration');
    const sessionOpenFeedback = document.getElementById('session-open-feedback');
    const voteModal = document.getElementById('vote-modal');
    const resultModal = document.getElementById('result-modal');
    const modalSessionId = document.getElementById('modal-session-id');
    const modalSessionIdDisplay = document.getElementById('modal-session-id-display');
    const modalAgendaTitle = document.getElementById('modal-agenda-title');
    const voterCpfInput = document.getElementById('voter-cpf');
    const voterNameInput = document.getElementById('voter-name');
    const voteModalFeedback = document.getElementById('vote-modal-feedback');
    const resultModalSessionId = document.getElementById('result-modal-session-id');
    const resultModalAgendaTitle = document.getElementById('result-modal-agenda-title');
    const resultDetails = document.getElementById('result-details');
    const resultModalFeedback = document.getElementById('result-modal-feedback');

    const API_BASE_URL = 'https://voting-challenge.onrender.com';
    const AGENDA_ENDPOINT = `${API_BASE_URL}/api/agenda`;
    const VOTING_ENDPOINT = `${API_BASE_URL}/api/voting`;
    const SESSION_ENDPOINT = `${API_BASE_URL}/api/voting/sessions`;
    const VOTE_ENDPOINT = `${API_BASE_URL}/api/vote`; 
    const RESULT_ENDPOINT = `${API_BASE_URL}/api/voting/result`;

    let agendas = []; 
    let sessions = []; 

    function showSection(sectionElement) {
        loadingSection.classList.add('hidden');
        errorSection.classList.add('hidden');
        agendaSection.classList.add('hidden');
        sessionSection.classList.add('hidden');
        sectionElement.classList.remove('hidden');
    }

    function showError(message = 'Ocorreu um erro ao processar sua solicitação.') {
        errorMessage.textContent = message;
        showSection(errorSection);
    }

     function showFeedback(element, message, type = 'info') {
        element.textContent = message;
        element.className = `feedback ${type}`;
        element.classList.remove('hidden');
    }

    async function makeApiCall(url, options = {}) {
        try {
            const response = await fetch(url, options);
            const responseData = await response.json().catch(() => null); 

            if (!response.ok) {
                const errorMsg = responseData?.message || responseData?.error || `Erro HTTP: ${response.status}`;
                 console.error(`API Error (${response.status}) on ${url}:`, responseData);
                throw new Error(errorMsg);
            }
            return responseData;
        } catch (error) {
            console.error(`Network or parsing error on ${url}:`, error);
             throw new Error(error.message || 'Falha na comunicação com a API.');
        }
    }

    function renderAgendas() {
        agendaList.innerHTML = ''; 
        selectAgendaForSession.innerHTML = '<option value="">-- Selecione uma Pauta --</option>';

        if (agendas.length === 0) {
            agendaList.innerHTML = '<p class="no-items">Nenhuma pauta cadastrada.</p>';
            return;
        }

        agendas.forEach(agenda => {
            const div = document.createElement('div');
            div.classList.add('list-item');
            div.innerHTML = `
                <div class="item-info">
                    <p><strong>${agenda.title || 'Título não informado'}</strong> (ID: ${agenda.id})</p>
                    <p class="description">${agenda.description || 'Sem descrição.'}</p>
                </div>
                <div class="item-actions">
                    </div>`; 
            agendaList.appendChild(div);

            const option = document.createElement('option');
            option.value = agenda.id;
            option.textContent = agenda.title || `Pauta ID: ${agenda.id}`;
            selectAgendaForSession.appendChild(option);
        });
    }

    function renderSessions() {
        sessionList.innerHTML = '';
        if (sessions.length === 0) {
            sessionList.innerHTML = '<p class="no-items">Nenhuma sessão de votação encontrada.</p>';
            return;
        }

        sessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

        sessions.forEach(session => {
            const agenda = agendas.find(a => a.id === session.agendaId);
            const agendaTitle = agenda?.title || 'Pauta não encontrada';
            const isSessionOpen = session.sessionStatus === 'OPEN' && new Date(session.endTime) > new Date();

            const div = document.createElement('div');
            div.classList.add('list-item');
            div.innerHTML = `
                <div class="item-info">
                    <p><strong>${agendaTitle}</strong> (Sessão ID: ${session.id})</p>
                     <p class="time">Início: ${new Date(session.startTime).toLocaleString('pt-BR')}</p>
                     <p class="time">Fim: ${new Date(session.endTime).toLocaleString('pt-BR')}</p>
                    <p class="status">Status: <span class="status-${session.sessionStatus}">${session.sessionStatus}</span> ${isSessionOpen ? '' : '(Encerrada)'}</p>
                </div>
                <div class="item-actions">
                    ${isSessionOpen ? `<button class="action-button vote-btn" data-session-id="${session.id}" data-agenda-title="${agendaTitle}">Votar</button>` : ''}
                    <button class="action-button result-btn" data-session-id="${session.id}" data-agenda-title="${agendaTitle}">Ver Resultado</button>
                </div>`;
            sessionList.appendChild(div);
        });

        sessionList.querySelectorAll('.vote-btn').forEach(btn => {
             btn.addEventListener('click', () => openVoteModal(btn.dataset.sessionId, btn.dataset.agendaTitle));
        });
        sessionList.querySelectorAll('.result-btn').forEach(btn => {
             btn.addEventListener('click', () => openResultModal(btn.dataset.sessionId, btn.dataset.agendaTitle));
        });
    }

     async function loadInitialData() {
        showSection(loadingSection);
        try {
            const [agendasData, sessionsData] = await Promise.all([
                makeApiCall(AGENDA_ENDPOINT),
                makeApiCall(VOTING_ENDPOINT)
            ]);

            agendas = agendasData || [];
            sessions = sessionsData || [];

            renderAgendas();
            renderSessions();

            showSection(agendaSection);
             sessionSection.classList.remove('hidden');

        } catch (error) {
             console.error("Erro ao carregar dados iniciais:", error);
             showError(`Falha ao carregar dados: ${error.message}`);
        }
    }

    async function handleCreateAgenda() {
        const title = newAgendaTitleInput.value.trim();
        const description = newAgendaDescriptionInput.value.trim();

        if (!title) {
            showFeedback(agendaFeedback, 'O título da pauta é obrigatório.', 'error');
            return;
        }

        createAgendaButton.disabled = true;
        showFeedback(agendaFeedback, 'Criando pauta...', 'info');

        try {
            const newAgenda = await makeApiCall(AGENDA_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description })
            });

            showFeedback(agendaFeedback, `Pauta "${newAgenda.title}" criada com sucesso!`, 'success');
            newAgendaTitleInput.value = '';
            newAgendaDescriptionInput.value = '';

            // Recarrega pautas e renderiza
            agendas.push(newAgenda);
            renderAgendas();

        } catch (error) {
             console.error("Erro ao criar pauta:", error);
             showFeedback(agendaFeedback, `Erro ao criar pauta: ${error.message}`, 'error');
        } finally {
            createAgendaButton.disabled = false;
        }
    }

     async function handleOpenSession() {
        const agendaId = selectAgendaForSession.value;
        const durationMinutes = parseInt(sessionDurationInput.value) || 1;

        if (!agendaId) {
            showFeedback(sessionOpenFeedback, 'Selecione uma pauta para abrir a sessão.', 'error');
            return;
        }

        openSessionButton.disabled = true;
        showFeedback(sessionOpenFeedback, 'Abrindo sessão...', 'info');

        try {
            const newSession = await makeApiCall(SESSION_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agendaId, durationMinutes })
            });

             showFeedback(sessionOpenFeedback, `Sessão ${newSession.id} aberta com sucesso para a pauta selecionada!`, 'success');
             sessionDurationInput.value = '1'; 
             selectAgendaForSession.value = '';

             sessions.push(newSession);
             renderSessions();

        } catch (error) {
             console.error("Erro ao abrir sessão:", error);
             showFeedback(sessionOpenFeedback, `Erro ao abrir sessão: ${error.message}`, 'error');
        } finally {
             openSessionButton.disabled = false;
        }
    }

    function openVoteModal(sessionId, agendaTitle) {
         modalSessionId.value = sessionId; 
         modalSessionIdDisplay.textContent = sessionId.substring(0, 8) + '...';
         modalAgendaTitle.textContent = agendaTitle;
         voterCpfInput.value = ''; 
         voterNameInput.value = '';
         voteModalFeedback.classList.add('hidden');
         voteModal.classList.remove('hidden');
         voterCpfInput.focus();
    }

    function closeVoteModal() {
         voteModal.classList.add('hidden');
    }

     async function submitVote(option) {
        const sessionId = modalSessionId.value;
        const cpf = voterCpfInput.value.trim();
        const name = voterNameInput.value.trim();

        if (!cpf || !name) {
             showFeedback(voteModalFeedback, 'CPF e Nome são obrigatórios para votar.', 'error');
             return;
        }

        voteModal.querySelectorAll('.vote-button').forEach(btn => btn.disabled = true);
        showFeedback(voteModalFeedback, 'Registrando voto...', 'info');

        try {
            const votePayload = {
                sessionId: sessionId,
                cpf: cpf,
                name: name,
                option: option
            };

            const result = await makeApiCall(VOTE_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(votePayload)
            });

            showFeedback(voteModalFeedback, result.message || 'Voto registrado com sucesso!', 'success');

            setTimeout(() => {
                closeVoteModal();
            }, 2000);


        } catch (error) {
            console.error("Erro ao votar:", error);
            showFeedback(voteModalFeedback, `Erro ao votar: ${error.message}`, 'error');
             voteModal.querySelectorAll('.vote-button').forEach(btn => btn.disabled = false);
        }
    }


     function openResultModal(sessionId, agendaTitle) {
         resultModalSessionId.textContent = sessionId.substring(0, 8) + '...';
         resultModalAgendaTitle.textContent = agendaTitle;
         resultModalFeedback.classList.add('hidden');
         resultDetails.innerHTML = '<p><em>Carregando resultados...</em></p>';
         resultModal.classList.remove('hidden');
         fetchAndRenderResults(sessionId);
    }

    function closeResultModal() {
         resultModal.classList.add('hidden');
    }

async function fetchAndRenderResults(sessionId) {
    showFeedback(resultModalFeedback, 'Buscando resultados...', 'info');
    try {
        const resultData = await makeApiCall(`${RESULT_ENDPOINT}/${sessionId}`);
        const statusOriginalApi = resultData.result;

        const statusTraduzido = translateStatus(statusOriginalApi);

        resultDetails.innerHTML = `
            <p><strong>Total de Votos:</strong> ${resultData.totalVotes !== undefined ? resultData.totalVotes : 'N/A'}</p>
            <p><strong>Votos SIM (Aprovar):</strong> ${resultData.yesVotes !== undefined ? resultData.yesVotes : 'N/A'}</p>
            <p><strong>Votos NÃO (Rejeitar):</strong> ${resultData.noVotes !== undefined ? resultData.noVotes : 'N/A'}</p>
            <p><strong>Resultado Final:</strong> <span class="result-highlight ${statusOriginalApi}">${statusTraduzido}</span></p>
        `;

        resultModalFeedback.classList.add('hidden');

    } catch (error) {
        console.error("Erro ao buscar resultados:", error);
        resultDetails.innerHTML = '';
        showFeedback(resultModalFeedback, `Erro ao buscar resultados: ${error.message}`, 'error');
    }
}

    createAgendaButton.addEventListener('click', handleCreateAgenda);
    openSessionButton.addEventListener('click', handleOpenSession);

    window.addEventListener('click', (event) => {
        if (event.target == voteModal) closeVoteModal();
        if (event.target == resultModal) closeResultModal();
    });
    window.addEventListener('keydown', (event) => {
         if (event.key === 'Escape') {
             closeVoteModal();
             closeResultModal();
         }
    });

    loadInitialData();

    window.closeVoteModal = closeVoteModal;
    window.closeResultModal = closeResultModal;
    window.submitVote = submitVote;

function translateStatus(status) {
    switch (status) {
        case 'SESSION_IN_PROGRESS':
            return 'Sessão em Andamento';
        case 'APPROVED':
            return 'APROVADA';
        case 'REJECTED':
            return 'REJEITADA';
        case 'TIE':
            return 'EMPATE';
        case 'SESSION_CLOSED_NO_VOTES':
             return 'Encerrada (Sem Votos)';
        default:
            console.warn(`Status não reconhecido para tradução: ${status}`);
            return status;
    }
}

});