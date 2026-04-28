// Referencias principales
const mainHeader = document.getElementById('main-header'); 
const pdfInput = document.getElementById('pdf-input');
const browseBtn = document.getElementById('browse-btn');
const fileNameDisplay = document.getElementById('file-name');
const continueBtn = document.getElementById('continue-btn');

const uploadArea = document.getElementById('upload-area');
const modeSelectionArea = document.getElementById('mode-selection-area');
const studyArea = document.getElementById('study-area');

// Botones navegación global
const btnBackUpload = document.getElementById('btn-back-upload');
const btnExitTest = document.getElementById('btn-exit-test');

// Referencias de la zona de estudio
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

// Estado Global
let mockQuestions = []; 
let currentIndex = 0;
let correctCount = 0;
let incorrectCount = 0;
let userAnswers = [];
let currentMode = 'estudio'; 

// ==========================================
// FLUJO DE SUBIDA Y PYTHON
// ==========================================
if (browseBtn) browseBtn.addEventListener('click', () => pdfInput.click());

if (pdfInput) {
    pdfInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type === "application/pdf") {
            fileNameDisplay.textContent = `Archivo seleccionado: ${file.name}`;
            fileNameDisplay.style.color = "#ecf0f1"; 
            continueBtn.style.display = "block";
        }
    });
}

if (continueBtn) {
    continueBtn.addEventListener('click', async () => {
        const file = pdfInput.files[0];
        if (!file) return;

        continueBtn.textContent = "Analizando PDF... ⏳";
        continueBtn.disabled = true;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/process_pdf', { method: 'POST', body: formData });
            const data = await response.json();

            if (response.ok && data.questions && data.questions.length > 0) {
                mockQuestions = data.questions;
                userAnswers = new Array(mockQuestions.length).fill(null);
                uploadArea.style.display = 'none';
                modeSelectionArea.style.display = 'block';
            } else {
                alert(data.error || "No se detectaron preguntas.");
            }
        } catch (error) {
            alert("Error de conexión con el servidor.");
        } finally {
            continueBtn.textContent = "Continuar ➔";
            continueBtn.disabled = false;
        }
    });
}

// ==========================================
// NAVEGACIÓN DE PANTALLAS
// ==========================================
if (btnBackUpload) {
    btnBackUpload.addEventListener('click', () => {
        modeSelectionArea.style.display = 'none';
        uploadArea.style.display = 'block';
    });
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
    if(scoreCorrectDisplay) scoreCorrectDisplay.textContent = '0';
    if(scoreIncorrectDisplay) scoreIncorrectDisplay.textContent = '0';
}

if(btnExitTest) btnExitTest.addEventListener('click', exitToModeSelection);
if(btnRestartMode) btnRestartMode.addEventListener('click', exitToModeSelection);
if(btnNewPdf) btnNewPdf.addEventListener('click', () => location.reload());

// ACTIVACIÓN DE MODOS
const modeEstudioBtn = document.getElementById('mode-estudio-btn');
const modePuntuacionBtn = document.getElementById('mode-puntuacion-btn');
const modeExamenBtn = document.getElementById('mode-examen-btn');
const modeHardcoreBtn = document.getElementById('mode-hardcore-btn');

if(modeEstudioBtn) modeEstudioBtn.addEventListener('click', () => startMode('estudio'));
if(modePuntuacionBtn) modePuntuacionBtn.addEventListener('click', () => startMode('puntuacion'));
if(modeExamenBtn) modeExamenBtn.addEventListener('click', () => startMode('examen'));
if(modeHardcoreBtn) modeHardcoreBtn.addEventListener('click', () => startMode('hardcore'));

function startMode(selectedMode) {
    if(mockQuestions.length === 0) {
        alert("No hay preguntas cargadas. Sube un PDF primero.");
        return;
    }
    currentMode = selectedMode;
    modeSelectionArea.style.display = 'none';
    if(mainHeader) mainHeader.style.display = 'none'; 
    studyArea.style.display = 'block';
    loadQuestion();
}

// ==========================================
// LÓGICA DE JUEGO
// ==========================================
function loadQuestion() {
    // ASEGURAMOS QUE LA EXPLICACIÓN SE OCULTE AL CARGAR LA PREGUNTA
    const feedbackContainer = document.getElementById('feedback-container');
    if (feedbackContainer) {
        feedbackContainer.style.display = 'none';
        feedbackContainer.innerHTML = '';
    }
    
    if(btnPrev) btnPrev.disabled = (currentIndex === 0);
    
    if (currentIndex < mockQuestions.length) {
        const currentQ = mockQuestions[currentIndex];
        if(questionCounter) questionCounter.textContent = `${currentIndex + 1} / ${mockQuestions.length}`;
        if(questionText) questionText.textContent = currentQ.question;
        
        if(optionsContainer) {
            optionsContainer.innerHTML = '';
            
            currentQ.options.forEach(option => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.textContent = option;
                
                if (userAnswers[currentIndex] !== null) {
                    btn.disabled = true; 
                    if (option === currentQ.correctAnswer) {
                        btn.classList.add('correct-answer'); 
                    } else if (option === userAnswers[currentIndex]) {
                        btn.classList.add('wrong-answer'); 
                    }
                } else {
                    btn.addEventListener('click', () => checkAnswer(option, currentQ.correctAnswer, btn));
                }
                optionsContainer.appendChild(btn);
            });
        }
        
        // Solo la mostramos si la pregunta YA estaba respondida de antes
        if (userAnswers[currentIndex] !== null) {
            showExplanation(currentQ);
        }
        
    } else {
        showResults();
    }
}

function checkAnswer(selectedOption, correctAnswer, clickedBtn) {
    if (userAnswers[currentIndex] === null) {
        const currentQ = mockQuestions[currentIndex];
        
        const allBtns = optionsContainer.querySelectorAll('.option-btn');
        allBtns.forEach(btn => btn.disabled = true);
        
        if (selectedOption === correctAnswer) {
            correctCount++;
            if(scoreCorrectDisplay) scoreCorrectDisplay.textContent = correctCount;
            clickedBtn.classList.add('correct-answer'); 
        } else {
            incorrectCount++;
            if(scoreIncorrectDisplay) scoreIncorrectDisplay.textContent = incorrectCount;
            clickedBtn.classList.add('wrong-answer'); 
            
            allBtns.forEach(btn => {
                if (btn.textContent === correctAnswer) {
                    btn.classList.add('correct-answer');
                }
            });
        }
        
        userAnswers[currentIndex] = selectedOption; 
        
        // Mostrar explicación al contestar
        showExplanation(currentQ);
    }
}

function showExplanation(questionData) {
    const container = document.getElementById('feedback-container');
    if(!container) return;
    
    container.style.display = 'block'; // AQUÍ SE REVELA LA CAJA
    
    let explanationText = questionData.explanation 
        ? questionData.explanation 
        : "No hay una explicación adicional para esta pregunta en el PDF.";
    
    container.innerHTML = `
        <div class="feedback-title">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
            </svg>
            EXPLICACIÓN
        </div>
        <div style="font-size: 15px; line-height: 1.6; color: #d1d1d1;">
            ${explanationText}
        </div>
    `;
}

if(btnNext) {
    btnNext.addEventListener('click', () => {
        currentIndex++;
        loadQuestion();
    });
}

if(btnPrev) {
    btnPrev.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            loadQuestion();
        }
    });
}

function showResults() {
    studyArea.style.display = 'none';
    resultsArea.style.display = 'flex';
    if(finalCorrect) finalCorrect.textContent = correctCount;
    if(finalIncorrect) finalIncorrect.textContent = incorrectCount;
    
    if(mistakesReview) {
        mistakesReview.innerHTML = '';
        
        if (incorrectCount > 0) {
            mistakesReview.innerHTML = '<h3 style="color:#aaa;margin-bottom:15px;">Repaso de errores:</h3>';
            mockQuestions.forEach((q, i) => {
                if (userAnswers[i] !== q.correctAnswer) {
                    const div = document.createElement('div');
                    div.className = 'mistake-item';
                    div.innerHTML = `
                        <p class="mistake-question">${i + 1}. ${q.question}</p>
                        <p class="mistake-wrong">❌ Tu respuesta: ${userAnswers[i] || 'Sin responder'}</p>
                        <p class="mistake-correct">✅ Correcta: ${q.correctAnswer}</p>`;
                    mistakesReview.appendChild(div);
                }
            });
        } else {
            mistakesReview.innerHTML = '<p style="color:#2ecc71;font-weight:bold;text-align:center;">¡Puntuación perfecta! 🥇</p>';
        }
    }
}