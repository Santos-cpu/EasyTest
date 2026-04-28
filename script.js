// Referencias de subida y flujo de pantallas
const mainHeader = document.getElementById('main-header'); 
const pdfInput = document.getElementById('pdf-input');
const browseBtn = document.getElementById('browse-btn');
const fileNameDisplay = document.getElementById('file-name');
const continueBtn = document.getElementById('continue-btn');

const uploadArea = document.getElementById('upload-area');
const modeSelectionArea = document.getElementById('mode-selection-area');
const studyArea = document.getElementById('study-area');

// NUEVOS BOTONES DE NAVEGACIÓN GLOBAL
const btnBackUpload = document.getElementById('btn-back-upload');
const btnExitTest = document.getElementById('btn-exit-test');

// Referencias de Modos
const modeEstudioBtn = document.getElementById('mode-estudio-btn');
const modePuntuacionBtn = document.getElementById('mode-puntuacion-btn');
const modeExamenBtn = document.getElementById('mode-examen-btn');
const modeHardcoreBtn = document.getElementById('mode-hardcore-btn');

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

// Referencias Navegación Inferior
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

// Referencias Resultados Finales
const resultsArea = document.getElementById('results-area');
const finalCorrect = document.getElementById('final-correct');
const finalIncorrect = document.getElementById('final-incorrect');
const mistakesReview = document.getElementById('mistakes-review'); 
const btnRestartMode = document.getElementById('btn-restart-mode');
const btnNewPdf = document.getElementById('btn-new-pdf');

// Datos de prueba (Luego los borraremos cuando Python extraiga las reales)
const mockQuestions = [];

let currentIndex = 0;
let correctCount = 0;
let incorrectCount = 0;
let userAnswers = new Array(mockQuestions.length).fill(null);
let currentMode = 'estudio'; 

// --- LÓGICA DE NAVEGACIÓN ENTRE PANTALLAS ---

// 1. Subida
browseBtn.addEventListener('click', () => pdfInput.click());

pdfInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
        fileNameDisplay.textContent = `Archivo seleccionado: ${file.name}`;
        fileNameDisplay.style.color = "#ecf0f1"; 
        continueBtn.style.display = "block";
    } else {
        fileNameDisplay.textContent = "Por favor, selecciona un PDF válido.";
        fileNameDisplay.style.color = "#e74c3c";
        continueBtn.style.display = "none";
    }
});

// --- NUEVA CONEXIÓN AL BACKEND (PYTHON) ---
continueBtn.addEventListener('click', async () => {
    const file = pdfInput.files[0];
    if (!file) return;

    // Cambiamos el texto para dar feedback al usuario
    const originalText = continueBtn.textContent;
    continueBtn.textContent = "Analizando PDF... ⏳";
    continueBtn.disabled = true;

    // Preparamos el archivo para enviarlo
    const formData = new FormData();
    formData.append('file', file);

    try {
        // Enviamos el PDF a nuestro script de Python
        const response = await fetch('/api/process_pdf', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            // Si Python responde con éxito
            console.log("Respuesta de Python:", data);
            alert(`¡Éxito! Python ha leído el PDF.\nNombre: ${data.filename}\nPáginas: ${data.pages_counted}`);
            
            // Pasamos a la siguiente pantalla
            uploadArea.style.display = 'none';
            modeSelectionArea.style.display = 'block';
        } else {
            // Si Python devuelve un error (ej. archivo corrupto)
            alert("Error desde el servidor: " + data.error);
        }
    } catch (error) {
        // Si hay error de conexión
        console.error("Error de red:", error);
        alert("No se pudo conectar con Python. Probablemente estás abriendo el archivo localmente y el servidor no está encendido.");
        
        // SOLO PARA PRUEBAS: Permitimos avanzar aunque falle la conexión para que no te quedes bloqueado
        uploadArea.style.display = 'none';
        modeSelectionArea.style.display = 'block';
    } finally {
        // Restauramos el botón a su estado original
        continueBtn.textContent = originalText;
        continueBtn.disabled = false;
    }
});

// 2. Volver a subida desde selector de modo
btnBackUpload.addEventListener('click', () => {
    modeSelectionArea.style.display = 'none';
    uploadArea.style.display = 'block';
});

// 3. Salir del test y volver al selector (Función unificada)
function exitToModeSelection() {
    studyArea.style.display = 'none';
    resultsArea.style.display = 'none';
    modeSelectionArea.style.display = 'block';
    mainHeader.style.display = 'block'; 
    
    // Resetear variables del test
    currentIndex = 0;
    correctCount = 0;
    incorrectCount = 0;
    userAnswers = new Array(mockQuestions.length).fill(null);
    currentMode = 'estudio';
    
    // Resetear marcadores
    scoreCorrectDisplay.textContent = '0';
    scoreIncorrectDisplay.textContent = '0';
}

btnExitTest.addEventListener('click', exitToModeSelection);
btnRestartMode.addEventListener('click', exitToModeSelection);

btnNewPdf.addEventListener('click', () => {
    location.reload();
});

// --- ENRUTADOR DE MODOS ---
function startMode(selectedMode) {
    currentMode = selectedMode;
    modeSelectionArea.style.display = 'none';
    mainHeader.style.display = 'none'; 
    studyArea.style.display = 'block';

    if (currentMode !== 'estudio') {
        alert(`¡Has seleccionado el Modo ${currentMode.toUpperCase()}!\n\nLa interfaz visual está lista. Más adelante programaremos la lógica específica en JavaScript.\n\nPor ahora, funcionará con la lógica del Modo Estudio.`);
    }

    loadQuestion();
}

modeEstudioBtn.addEventListener('click', () => startMode('estudio'));
modePuntuacionBtn.addEventListener('click', () => startMode('puntuacion'));
modeExamenBtn.addEventListener('click', () => startMode('examen'));
modeHardcoreBtn.addEventListener('click', () => startMode('hardcore'));

// --- LÓGICA DE ESTUDIO ---
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
            
            btn.addEventListener('click', () => {
                checkAnswer(option, currentQ.correctAnswer, btn);
            });
            
            optionsContainer.appendChild(btn);
        });
        
    } else {
        studyArea.style.display = 'none';
        resultsArea.style.display = 'flex';
        finalCorrect.textContent = correctCount;
        finalIncorrect.textContent = incorrectCount;
        
        mistakesReview.innerHTML = '';
        
        if (incorrectCount > 0) {
            mistakesReview.innerHTML = '<h3 style="color: #aaa; margin-bottom: 15px; font-size: 18px;">Repaso de errores:</h3>';
            
            mockQuestions.forEach((q, index) => {
                const answer = userAnswers[index];
                
                if (answer !== null && answer !== q.correctAnswer) {
                    const mistakeDiv = document.createElement('div');
                    mistakeDiv.classList.add('mistake-item');
                    mistakeDiv.innerHTML = `
                        <p class="mistake-question">${index + 1}. ${q.question}</p>
                        <p class="mistake-answer mistake-wrong">❌ Tu respuesta: ${answer}</p>
                        <p class="mistake-answer mistake-correct">✅ Correcta: ${q.correctAnswer}</p>
                    `;
                    mistakesReview.appendChild(mistakeDiv);
                }
            });
        } else {
            mistakesReview.innerHTML = '<p style="color: #2ecc71; font-size: 18px; font-weight: bold; margin: 20px 0; text-align: center;">¡Perfecto! No has tenido ningún fallo. 🥇</p>';
        }
    }
}

function checkAnswer(selectedOption, correctAnswer, clickedBtn) {
    if (userAnswers[currentIndex] === null) {
        if (selectedOption === correctAnswer) {
            correctCount++;
            scoreCorrectDisplay.textContent = correctCount;
            feedbackTitle.textContent = "¡Correcto! ✅";
            feedbackTitle.style.color = "#2ecc71"; 
            feedbackMessage.textContent = "¡Muy bien hecho!";
            clickedBtn.classList.add('selected-correct');
        } else {
            incorrectCount++;
            scoreIncorrectDisplay.textContent = incorrectCount;
            feedbackTitle.textContent = "Incorrecto ❌";
            feedbackTitle.style.color = "#e74c3c";
            feedbackMessage.textContent = `La respuesta correcta era: ${correctAnswer}`;
            cardBack.classList.add('is-incorrect');
            clickedBtn.classList.add('selected-incorrect');
        }
        
        userAnswers[currentIndex] = selectedOption; 
    } else {
        if (selectedOption === correctAnswer) {
            feedbackTitle.textContent = "¡Correcto! ✅ (Ya puntuada)";
            feedbackTitle.style.color = "#2ecc71"; 
            feedbackMessage.textContent = "¡Muy bien hecho!";
            cardBack.classList.remove('is-incorrect');
        } else {
            feedbackTitle.textContent = "Incorrecto ❌ (Ya puntuada)";
            feedbackTitle.style.color = "#e74c3c";
            feedbackMessage.textContent = `La respuesta correcta era: ${correctAnswer}`;
            cardBack.classList.add('is-incorrect');
        }
    }
    
    flashcard.classList.add('is-flipped');
}

btnNext.addEventListener('click', () => {
    currentIndex++;
    loadQuestion();
});

btnPrev.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        loadQuestion();
    }
});
