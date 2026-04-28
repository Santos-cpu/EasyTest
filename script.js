// ==========================================
// CONFIGURACIÓN Y ESTADO GLOBAL
// ==========================================
let mockQuestions = []; // Se llenará dinámicamente con el PDF
let currentIndex = 0;
let correctCount = 0;
let incorrectCount = 0;
let userAnswers = [];
let currentMode = '';

// Elementos del DOM
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const continueBtn = document.getElementById('continue-btn');
const modeSelectionArea = document.getElementById('mode-selection');
const flashcardArea = document.getElementById('flashcard-area');
const resultsArea = document.getElementById('results-area');

// ==========================================
// LÓGICA DE SUBIDA (CONEXIÓN CON PYTHON)
// ==========================================
continueBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) {
        alert("Por favor, selecciona un PDF primero.");
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    // Feedback visual de carga
    continueBtn.disabled = true;
    continueBtn.textContent = "Analizando contenido... ⏳";

    try {
        const response = await fetch('/api/process_pdf', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.questions && data.questions.length > 0) {
            // 1. Guardamos las preguntas reales del PDF
            mockQuestions = data.questions;
            
            // 2. Reiniciamos el estado para el nuevo test
            currentIndex = 0;
            correctCount = 0;
            incorrectCount = 0;
            userAnswers = new Array(mockQuestions.length).fill(null);

            console.log("Preguntas cargadas correctamente:", mockQuestions);
            alert(`¡Éxito! Hemos extraído ${mockQuestions.length} preguntas de tu archivo.`);
            
            // 3. Pasamos a la selección de modo
            uploadArea.style.display = 'none';
            modeSelectionArea.style.display = 'block';
        } else {
            const errorMsg = data.error || data.message || "No se detectaron preguntas. Revisa el formato del PDF.";
            alert("Atención: " + errorMsg);
            continueBtn.disabled = false;
            continueBtn.textContent = "Continuar ➔";
        }
    } catch (error) {
        console.error("Error en la petición:", error);
        alert("Error crítico: No se pudo conectar con el servidor de Python.");
        continueBtn.disabled = false;
        continueBtn.textContent = "Continuar ➔";
    }
});

// ==========================================
// SELECCIÓN DE MODO Y RENDERIZADO
// ==========================================
document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
        currentMode = card.dataset.mode;
        modeSelectionArea.style.display = 'none';
        flashcardArea.style.display = 'block';
        
        // Importante: Renderizamos la primera carta con los datos reales
        renderCard();
    });
});

function renderCard() {
    if (mockQuestions.length === 0) return;

    const question = mockQuestions[currentIndex];
    const container = document.getElementById('card-container');
    
    // Actualizar barra de progreso
    document.getElementById('current-number').textContent = currentIndex + 1;
    document.getElementById('total-number').textContent = mockQuestions.length;

    // Inyectar HTML de la carta
    container.innerHTML = `
        <div class="flashcard" id="main-card">
            <div class="card-inner">
                <div class="card-front">
                    <p class="question-text">${question.question}</p>
                    <div class="options-grid">
                        ${question.options.map((opt) => {
                            // Limpiamos comillas simples para evitar errores en el onclick
                            const safeOpt = opt.replace(/'/g, "\\'");
                            return `<button class="option-btn" onclick="checkAnswer('${safeOpt}')">${opt}</button>`;
                        }).join('')}
                    </div>
                </div>
                <div class="card-back">
                    <h3>Respuesta Correcta</h3>
                    <p class="correct-answer-text">${question.correctAnswer}</p>
                    <button class="next-btn" onclick="nextCard()">Siguiente Pregunta ➔</button>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// LÓGICA DEL JUEGO
// ==========================================
window.checkAnswer = function(selectedOption) {
    const card = document.getElementById('main-card');
    const correct = mockQuestions[currentIndex].correctAnswer;

    if (selectedOption === correct) {
        correctCount++;
    } else {
        incorrectCount++;
    }

    card.classList.add('is-flipped');
};

window.nextCard = function() {
    currentIndex++;
    if (currentIndex < mockQuestions.length) {
        renderCard();
    } else {
        showResults();
    }
};

// ==========================================
// FINALIZACIÓN
// ==========================================
function showResults() {
    flashcardArea.style.display = 'none';
    resultsArea.style.display = 'block';

    document.getElementById('correct-res').textContent = correctCount;
    document.getElementById('incorrect-res').textContent = incorrectCount;
    
    const accuracy = Math.round((correctCount / mockQuestions.length) * 100) || 0;
    document.getElementById('accuracy-res').textContent = accuracy + "%";
}

function restartApp() {
    window.location.reload();
}
