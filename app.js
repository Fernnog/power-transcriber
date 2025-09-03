// Elementos da página
const startRecordingBtn = document.getElementById('startRecording');
const stopRecordingBtn = document.getElementById('stopRecording');
const audioFileInput = document.getElementById('audioFile');
const transcriptionText = document.getElementById('transcription');
const copyButton = document.getElementById('copyButton');
const statusDiv = document.getElementById('status');

let mediaRecorder;
let audioChunks = [];

// --- LÓGICA DE GRAVAÇÃO ---
startRecordingBtn.addEventListener('click', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
    };
    
    mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        audioChunks = []; // Limpa para a próxima gravação
        sendAudioToServer(audioBlob);
    };
    
    mediaRecorder.start();
    statusDiv.textContent = 'Gravando...';
    startRecordingBtn.disabled = true;
    stopRecordingBtn.disabled = false;
});

stopRecordingBtn.addEventListener('click', () => {
    mediaRecorder.stop();
    statusDiv.textContent = 'Gravação finalizada. Enviando...';
    startRecordingBtn.disabled = false;
    stopRecordingBtn.disabled = true;
});

// --- LÓGICA DE UPLOAD ---
audioFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        sendAudioToServer(file);
    }
});

// --- FUNÇÃO PARA ENVIAR ÁUDIO AO BACKEND ---
async function sendAudioToServer(audioData) {
    statusDiv.textContent = 'Processando a transcrição... Por favor, aguarde.';
    transcriptionText.value = '';
    copyButton.disabled = true;

    const formData = new FormData();
    formData.append('audio', audioData);

    try {
        // ATENÇÃO: a URL '/transcribe' deve corresponder à rota no seu backend
        const response = await fetch('/transcribe', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Falha na resposta do servidor.');
        }

        const result = await response.json();
        
        transcriptionText.value = result.transcription;
        statusDiv.textContent = 'Transcrição concluída!';
        copyButton.disabled = false;

    } catch (error) {
        console.error('Erro ao transcrever:', error);
        statusDiv.textContent = 'Ocorreu um erro. Tente novamente.';
    }
}

// --- LÓGICA DO BOTÃO COPIAR ---
copyButton.addEventListener('click', () => {
    transcriptionText.select();
    navigator.clipboard.writeText(transcriptionText.value);
    alert('Texto copiado para a área de transferência!');
});
