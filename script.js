// ==========================================
// CONFIGURACIÓN Y ESTADO GLOBAL
// ==========================================
let mockQuestions = []; // Se llenará con la respuesta del servidor
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
// LÓGICA DE SUBIDA (FETCH AL BACKEND)
// ==========================================
continueBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) {
        alert("Por favor, selecciona un PDF primero.");
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    // Feedback visual
    continueBtn.disabled = true;
    continueBtn.textContent = "Analizando PDF... ⏳";

    try {
        const response = await fetch('/api/process_pdf', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.questions && data.questions.length > 0) {
            // Limpiamos y llenamos el array con preguntas reales
            mockQuestions = data.questions;
            
            // Inicializamos el estado del juego
            currentIndex = 0;
            correctCount = 0;
            incorrectCount = 0;
            userAnswers = new Array(mockQuestions.length).fill(null);

            alert(`¡Éxito! Hemos extraído ${mockQuestions.length} preguntas.`);
            
            // Cambiamos de pantalla
            uploadArea.style.display = 'none';
            modeSelectionArea.style.display = 'block';
        } else {
            alert(data.error || "No se encontraron preguntas legibles en el PDF. Intenta con otro formato.");
            continueBtn.disabled = false;
            continueBtn.textContent = "Continuar ➔";
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Hubo un error de conexión con el servidor.");
        continueBtn.disabled = false;
        continueBtn.textContent = "Continuar ➔";
    }
});

// ==========================================
// SELECCIÓN DE MODO
// ==========================================
document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
        currentMode = card.dataset.mode;
        modeSelectionArea.style.display = 'none';
        flashcardArea.style.display = 'block';
        renderCard();
    });
});

// ==========================================
// RENDERIZADO DE FLASHCARDS
// ==========================================
function renderCard() {
    const question = mockQuestions[currentIndex];
    const container = document.getElementById('card-container');
    
    // Actualizar progreso
    document.getElementById('current-number').textContent = currentIndex + 1;
    document.getElementById('total-number').textContent = mockQuestions.length;

    // Limpiar contenedor
    container.innerHTML = `
        <div class="flashcard" id="main-card">
            <div class="card-inner">
                <div class="card-front">
                    <p class="question-text">${question.question}</p>
                    <div class="options-grid">
                        ${question.options.map((opt, i) => `
                            <button class="option-btn" onclick="checkAnswer('${opt.replace(/'/g, "\\'")}')">${opt}</button>
                        `).join('')}
                    </div>
                </div>
                <div class="card-back">
                    <h3>Respuesta Correcta</h3>
                    <p>${question.correctAnswer}</p>
                    <button class="next-btn" onclick="nextCard()">Siguiente Pregunta ➔</button>
                </div>
            </div>
        </div>
    `;
}

function checkAnswer(selectedOption) {
    const card = document.getElementById('main-card');
    const correct = mockQuestions[currentIndex].correctAnswer;

    if (selectedOption === correct) {
        correctCount++;
    } else {
        incorrectCount++;
    }

    // Girar la carta para mostrar la respuesta
    card.classList.add('is-flipped');
}

function nextCard() {
    currentIndex++;
    if (currentIndex < mockQuestions.length) {
        renderCard();
    } else {
        showResults();
    }
}

// ==========================================
// PANTALLA DE RESULTADOS
// ==========================================
function showResults() {
    flashcardArea.style.display = 'none';
    resultsArea.style.display = 'block';

    document.getElementById('correct-res').textContent = correctCount;
    document.getElementById('incorrect-res').textContent = incorrectCount;
    
    const accuracy = Math.round((correctCount / mockQuestions.length) * 100);
    document.getElementById('accuracy-res').textContent = accuracy + "%";
}

function restartApp() {
    location.reload();
}
