// ==========================================
// 1. REFERENCIAS ORIGINALES (FUNCIONA_28_04)
// ==========================================
const mainHeader = document.getElementById('main-header'); 
const pdfInput = document.getElementById('pdf-input');
const browseBtn = document.getElementById('browse-btn');
const fileNameDisplay = document.getElementById('file-name');
const continueBtn = document.getElementById('continue-btn');

const uploadArea = document.getElementById('upload-area');
const modeSelectionArea = document.getElementById('mode-selection-area');
const studyArea = document.getElementById('study-area');

// Botones de navegación
const btnBackUpload = document.getElementById('btn-back-upload');
const btnExitTest = document.getElementById('btn-exit-test');

// Referencias de la zona de estudio
const flashcard = document.getElementById('flashcard');
const cardBack = document.querySelector('.card-back');
const questionCounter = document.getElementById('question-counter');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const feedbackTitle = document.getElementById('feedback-title');
const feedbackMessage = document.getElementById('feedback-message');
const scoreCorrectDisplay = document.getElementById('score-correct');
const scoreIncorrectDisplay = document.getElementById('score-incorrect');

const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

// Resultados Finales
const resultsArea = document.getElementById('results-area');
const finalCorrect = document.getElementById('final-correct');
const finalIncorrect = document.getElementById('final-incorrect');
const mistakesReview = document.getElementById('mistakes-review'); 
const btnRestartMode = document.getElementById('btn-restart-mode');
const btnNewPdf = document.getElementById('btn-new-pdf');

// ==========================================
// 2. ESTADO GLOBAL
// ==========================================
let mockQuestions = []; 
let currentIndex = 0;
let correctCount = 0;
let incorrectCount = 0;
let userAnswers = [];
let currentMode = 'estudio'; 

// ==========================================
// 3. FLUJO DE SUBIDA Y CONEXIÓN PYTHON
// ==========================================
browseBtn.onclick = () => pdfInput.click();

pdfInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
        fileNameDisplay.textContent = `Archivo seleccionado: ${file.name}`;
        fileNameDisplay.style.color = "#ecf0f1"; 
        continueBtn.style.display = "block";
    }
};

continueBtn.onclick = async () => {
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
            // Limpieza de símbolos raros del PDF (ticks, etc)
            mockQuestions = data.questions.map(q => ({
                ...q,
                options: q.options.map(opt => opt.replace(/✓|✔|\[x\]/gi, '').trim()),
                correctAnswer: q.correctAnswer.replace(/✓|✔|\[x\]/gi, '').trim()
            }));
            
            userAnswers = new Array(mockQuestions.length).fill(null);
            uploadArea.style.display = 'none';
            modeSelectionArea.style.display = 'block';
        } else {
            alert(data.error || "No se detectaron preguntas legibles.");
        }
    } catch (error) {
        alert("Error de conexión con el servidor.");
    } finally {
        continueBtn.textContent = "Continuar ➔";
        continueBtn.disabled = false;
    }
};

// ==========================================
// 4. NAVEGACIÓN ENTRE PANTALLAS
// ==========================================
btnBackUpload.onclick = () => {
    modeSelectionArea.style.display = 'none';
    uploadArea.style.display = 'block';
};

function exitToModeSelection() {
    studyArea.style.display = 'none';
    resultsArea.style.display = 'none';
    modeSelectionArea.style.display = 'block';
    mainHeader.style.display = 'block'; 
    currentIndex = 0;
    correctCount = 0;
    incorrectCount = 0;
    scoreCorrectDisplay.textContent = '0';
    scoreIncorrectDisplay.textContent = '0';
}

btnExitTest.onclick = exitToModeSelection;
btnRestartMode.onclick = exitToModeSelection;
btnNewPdf.onclick = () => location.reload();

// Activación de Modos
document.getElementById('mode-estudio-btn').onclick = () => startMode('estudio');
document.getElementById('mode-puntuacion-btn').onclick = () => startMode('puntuacion');
document.getElementById('mode-examen-btn').onclick = () => startMode('examen');
document.getElementById('mode-hardcore-btn').onclick = () => startMode('hardcore');

function startMode(selectedMode) {
    currentMode = selectedMode;
    modeSelectionArea.style.display = 'none';
    mainHeader.style.display = 'none'; 
    studyArea.style.display = 'block';
    loadQuestion();
}

// ==========================================
// 5. LÓGICA DE CARGA Y JUEGO
// ==========================================
function loadQuestion() {
    flashcard.classList.remove('is-flipped');
    cardBack.classList.remove('is-incorrect');
    btnPrev.disabled = (currentIndex === 0);
    
    if (currentIndex < mockQuestions.length) {
        const currentQ = mockQuestions[currentIndex];
        questionCounter.textContent = `(${currentIndex + 1}/${mockQuestions.length})`;
        questionText.textContent = currentQ.question;
        
        optionsContainer.innerHTML = '';
        currentQ.options.forEach(option => {
            const btn = document.createElement('button');
            btn.classList.add('option-btn');
            btn.textContent = option;
            btn.onclick = () => checkAnswer(option, currentQ.correctAnswer, btn);
            optionsContainer.appendChild(btn);
        });
    } else {
        showResults();
    }
}

function checkAnswer(selectedOption, correctAnswer, clickedBtn) {
    const currentQ = mockQuestions[currentIndex];
    
    if (userAnswers[currentIndex] === null) {
        if (selectedOption === correctAnswer) {
            correctCount++;
            scoreCorrectDisplay.textContent = correctCount;
            feedbackTitle.textContent = "¡Correcto! ✅";
            feedbackTitle.style.color = "#2ecc71";
            clickedBtn.classList.add('selected-correct');
            feedbackMessage.innerHTML = "¡Muy bien hecho!";
        } else {
            incorrectCount++;
            scoreIncorrectDisplay.textContent = incorrectCount;
            feedbackTitle.textContent = "Incorrecto ❌";
            feedbackTitle.style.color = "#e74c3c";
            cardBack.classList.add('is-incorrect');
            clickedBtn.classList.add('selected-incorrect');
            feedbackMessage.innerHTML = `La respuesta correcta era:<br><strong style="color:#ffffff; font-size:20px;">${correctAnswer}</strong>`;
        }
        
        // 🔴 EXPLICACIÓN CON NUEVO DISEÑO (Más grande, blanco puro y sin cursiva)
        if (currentQ.explanation) {
            feedbackMessage.innerHTML += `
                <div style="margin-top: 25px; padding-top: 25px; border-top: 1px solid #444; color: #ffffff; font-size: 19px; font-weight: 500; line-height: 1.6; text-align: center;">
                    <span style="font-size: 24px; margin-bottom: 10px; display: block;">💡</span>
                    ${currentQ.explanation}
                </div>
            `;
        }
        
        userAnswers[currentIndex] = selectedOption; 
    } else {
        // Lógica por si el usuario vuelve a hacer clic en una opción de una carta ya respondida
        if (selectedOption === correctAnswer) {
            feedbackTitle.textContent = "¡Correcto! ✅ (Ya puntuada)";
            feedbackTitle.style.color = "#2ecc71"; 
            feedbackMessage.innerHTML = "¡Muy bien hecho!";
            cardBack.classList.remove('is-incorrect');
        } else {
            feedbackTitle.textContent = "Incorrecto ❌ (Ya puntuada)";
            feedbackTitle.style.color = "#e74c3c";
            feedbackMessage.innerHTML = `La respuesta correcta era:<br><strong style="color:#ffffff; font-size:20px;">${correctAnswer}</strong>`;
            cardBack.classList.add('is-incorrect');
        }
        
        // Volvemos a inyectar la explicación para que no desaparezca
        if (currentQ.explanation) {
            feedbackMessage.innerHTML += `
                <div style="margin-top: 25px; padding-top: 25px; border-top: 1px solid #444; color: #ffffff; font-size: 19px; font-weight: 500; line-height: 1.6; text-align: center;">
                    <span style="font-size: 24px; margin-bottom: 10px; display: block;">💡</span>
                    ${currentQ.explanation}
                </div>
            `;
        }
    }
    
    flashcard.classList.add('is-flipped');
}

btnNext.onclick = () => {
    currentIndex++;
    loadQuestion();
};

btnPrev.onclick = () => {
    if (currentIndex > 0) {
        currentIndex--;
        loadQuestion();
    }
};

function showResults() {
    studyArea.style.display = 'none';
    resultsArea.style.display = 'flex';
    finalCorrect.textContent = correctCount;
    finalIncorrect.textContent = incorrectCount;
    
    mistakesReview.innerHTML = '';
    const accuracy = Math.round((correctCount / mockQuestions.length) * 100);
    
    if (incorrectCount > 0) {
        mistakesReview.innerHTML = `<h3 style="color:#aaa;margin-bottom:15px;">Repaso de errores (${accuracy}% precisión):</h3>`;
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
