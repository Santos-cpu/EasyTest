// Referencias principales
const mainHeader = document.getElementById('main-header'); 
const pdfInput = document.getElementById('pdf-input');
const browseBtn = document.getElementById('browse-btn');
const fileNameDisplay = document.getElementById('file-name');
const continueBtn = document.getElementById('continue-btn');
const uploadArea = document.getElementById('upload-area');
const modeSelectionArea = document.getElementById('mode-selection-area');
const studyArea = document.getElementById('study-area');

// Referencias Barra de Carga
const loadingContainer = document.getElementById('loading-container');
const progressBarFill = document.getElementById('progress-bar-fill');
const loadingText = document.getElementById('loading-text');

// Navegación Global
const btnBackUpload = document.getElementById('btn-back-upload');
const btnExitTest = document.getElementById('btn-exit-test');

// Zona de Estudio
const questionCounter = document.getElementById('question-counter');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const scoreCorrectDisplay = document.getElementById('score-correct');
const scoreIncorrectDisplay = document.getElementById('score-incorrect');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

// Resultados
const resultsArea = document.getElementById('results-area');
const finalCorrect = document.getElementById('final-correct');
const finalIncorrect = document.getElementById('final-incorrect');
const mistakesReview = document.getElementById('mistakes-review'); 
const btnRestartMode = document.getElementById('btn-restart-mode');
const btnNewPdf = document.getElementById('btn-new-pdf');

// Modal Salida
const exitModal = document.getElementById('exit-modal');
const btnCancelExit = document.getElementById('btn-cancel-exit');
const btnConfirmExit = document.getElementById('btn-confirm-exit');
const modalCorrect = document.getElementById('modal-correct');
const modalIncorrect = document.getElementById('modal-incorrect');
const modalMistakes = document.getElementById('modal-mistakes');

// Estado Global
let mockQuestions = []; 
let currentIndex = 0;
let correctCount = 0;
let incorrectCount = 0;
let userAnswers = [];
let currentMode = 'estudio'; 

// ==========================================
// FLUJO DE SUBIDA E IA
// ==========================================
if (browseBtn) browseBtn.addEventListener('click', () => pdfInput.click());

if (pdfInput) {
    pdfInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type === "application/pdf") {
            fileNameDisplay.textContent = `Archivo: ${file.name}`;
            fileNameDisplay.style.color = "#ecf0f1"; 
            continueBtn.style.display = "block";
        }
    });
}

if (continueBtn) {
    continueBtn.addEventListener('click', async () => {
        const file = pdfInput.files[0];
        if (!file) return;

        // UI: Ocultar botón, resetear barra y mostrar contenedor de carga
        continueBtn.style.display = "none";
        progressBarFill.style.width = "0%";
        loadingContainer.style.display = "block";
        loadingText.textContent = "Leyendo el PDF...";

        // Simulación de progreso visual
        let progress = 0;
        const interval = setInterval(() => {
            if (progress < 90) {
                progress += Math.random() * 1.5;
                progressBarFill.style.width = `${progress}%`;
                
                if(progress > 25) loadingText.textContent = "Gemini IA analizando preguntas...";
                if(progress > 60) loadingText.textContent = "Redactando explicaciones inteligentes...";
                if(progress > 80) loadingText.textContent = "Finalizando estructura...";
            }
        }, 600);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/process_pdf', { method: 'POST', body: formData });
            const data = await response.json();

            if (response.ok && data.questions) {
                clearInterval(interval);
                progressBarFill.style.width = "100%";
                loadingText.textContent = "¡Análisis completado!";
                
                setTimeout(() => {
                    mockQuestions = data.questions;
                    userAnswers = new Array(mockQuestions.length).fill(null);
                    uploadArea.style.display = 'none';
                    loadingContainer.style.display = "none";
                    modeSelectionArea.style.display = 'block';
                }, 600);
            } else {
                throw new Error(data.error || "La IA no pudo procesar el PDF.");
            }
        } catch (error) {
            clearInterval(interval);
            alert("Error: " + error.message);
            loadingContainer.style.display = "none";
            continueBtn.style.display = "block";
        }
    });
}

// ==========================================
// NAVEGACIÓN Y MODAL
// ==========================================
if (btnBackUpload) {
    btnBackUpload.addEventListener('click', () => {
        modeSelectionArea.style.display = 'none';
        uploadArea.style.display = 'block';
        continueBtn.style.display = "block";
    });
}

function showExitModal() {
    if(!exitModal) return;
    modalCorrect.textContent = correctCount;
    modalIncorrect.textContent = incorrectCount;
    modalMistakes.innerHTML = '';
    
    if (incorrectCount > 0) {
        mockQuestions.forEach((q, i) => {
            if (userAnswers[i] !== null && userAnswers[i] !== q.correctAnswer) {
                const div = document.createElement('div');
                div.className = 'mistake-item';
                div.innerHTML = `
                    <p class="mistake-question">${i + 1}. ${q.question}</p>
                    <p class="mistake-wrong">❌ Tu respuesta: ${userAnswers[i]}</p>
                    <p class="mistake-correct">✅ Correcta: ${q.correctAnswer}</p>`;
                modalMistakes.appendChild(div);
            }
        });
    } else {
        modalMistakes.innerHTML = '<p style="text-align:center; color:#aaa;">Sin errores por ahora.</p>';
    }
    exitModal.style.display = 'flex';
}

function exitToModeSelection() {
    studyArea.style.display = 'none';
    resultsArea.style.display = 'none';
    modeSelectionArea.style.display = 'block';
    if(mainHeader) mainHeader.style.display = 'block'; 
    currentIndex = 0;
    correctCount = 0;
    incorrectCount = 0;
    userAnswers = new Array(mockQuestions.length).fill(null);
    scoreCorrectDisplay.textContent = '0';
    scoreIncorrectDisplay.textContent = '0';
}

if(btnExitTest) btnExitTest.addEventListener('click', showExitModal);
if(btnCancelExit) btnCancelExit.addEventListener('click', () => exitModal.style.display = 'none');
if(btnConfirmExit) btnConfirmExit.addEventListener('click', () => {
    exitModal.style.display = 'none';
    exitToModeSelection();
});

if(btnRestartMode) btnRestartMode.addEventListener('click', exitToModeSelection);
if(btnNewPdf) btnNewPdf.addEventListener('click', () => location.reload());

// MODOS
document.getElementById('mode-estudio-btn').onclick = () => startMode('estudio');
document.getElementById('mode-puntuacion-btn').onclick = () => startMode('puntuacion');
document.getElementById('mode-examen-btn').onclick = () => startMode('examen');
document.getElementById('mode-hardcore-btn').onclick = () => startMode('hardcore');

function startMode(mode) {
    currentMode = mode;
    modeSelectionArea.style.display = 'none';
    mainHeader.style.display = 'none'; 
    studyArea.style.display = 'block';
    loadQuestion();
}

// ==========================================
// LÓGICA DE JUEGO
// ==========================================
function loadQuestion() {
    const fb = document.getElementById('feedback-container');
    fb.style.display = 'none';
    btnPrev.disabled = (currentIndex === 0);
    
    if (currentIndex < mockQuestions.length) {
        const q = mockQuestions[currentIndex];
        questionCounter.textContent = `${currentIndex + 1} / ${mockQuestions.length}`;
        questionText.textContent = q.question;
        optionsContainer.innerHTML = '';
        
        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;
            
            if (userAnswers[currentIndex] !== null) {
                btn.disabled = true;
                if (opt === q.correctAnswer) btn.classList.add('correct-answer');
                else if (opt === userAnswers[currentIndex]) btn.classList.add('wrong-answer');
            } else {
                btn.onclick = () => checkAnswer(opt, q.correctAnswer, btn);
            }
            optionsContainer.appendChild(btn);
        });

        if (userAnswers[currentIndex] !== null) showExplanation(q);
    } else {
        showResults();
    }
}

function checkAnswer(opt, correct, btn) {
    userAnswers[currentIndex] = opt;
    const all = optionsContainer.querySelectorAll('.option-btn');
    all.forEach(b => b.disabled = true);
    
    if (opt === correct) {
        correctCount++;
        scoreCorrectDisplay.textContent = correctCount;
        btn.classList.add('correct-answer');
    } else {
        incorrectCount++;
        scoreIncorrectDisplay.textContent = incorrectCount;
        btn.classList.add('wrong-answer');
        all.forEach(b => { if(b.textContent === correct) b.classList.add('correct-answer'); });
    }
    showExplanation(mockQuestions[currentIndex]);
}

function showExplanation(q) {
    const fb = document.getElementById('feedback-container');
    fb.style.display = 'block';
    fb.innerHTML = `<div class="feedback-title">🔍 EXPLICACIÓN</div><div style="color:#d1d1d1;">${q.explanation || "No hay explicación disponible."}</div>`;
}

btnNext.onclick = () => { currentIndex++; loadQuestion(); };
btnPrev.onclick = () => { if(currentIndex > 0) { currentIndex--; loadQuestion(); } };

function showResults() {
    studyArea.style.display = 'none';
    resultsArea.style.display = 'flex';
    finalCorrect.textContent = correctCount;
    finalIncorrect.textContent = incorrectCount;
    mistakesReview.innerHTML = (incorrectCount > 0) ? '<h3>Repaso de errores:</h3>' : '<h3>¡Perfección! 🥇</h3>';
    
    if(incorrectCount > 0) {
        mockQuestions.forEach((q, i) => {
            if(userAnswers[i] !== q.correctAnswer) {
                const div = document.createElement('div');
                div.className = 'mistake-item';
                div.innerHTML = `<p>${i+1}. ${q.question}</p><p class="mistake-wrong">❌: ${userAnswers[i] || 'Vacio'}</p><p class="mistake-correct">✅: ${q.correctAnswer}</p>`;
                mistakesReview.appendChild(div);
            }
        });
    }
}
