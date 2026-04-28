// ==========================================
// ESTADO GLOBAL
// ==========================================
let mockQuestions = []; 
let currentIndex = 0;
let correctCount = 0;
let incorrectCount = 0;
let currentMode = '';

// Elementos del DOM
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const continueBtn = document.getElementById('continue-btn');
const fileNameDisplay = document.getElementById('file-name-display');
const modeSelectionArea = document.getElementById('mode-selection');
const flashcardArea = document.getElementById('flashcard-area');
const resultsArea = document.getElementById('results-area');

// ==========================================
// 1. GESTIÓN DE ARCHIVOS
// ==========================================

// Muestra el nombre del archivo al seleccionarlo
window.updateFileName = function() {
    if (fileInput.files.length > 0) {
        fileNameDisplay.textContent = "📄 " + fileInput.files[0].name;
    }
};

// Enviar el PDF al servidor
continueBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) {
        alert("Por favor, selecciona un PDF primero.");
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    continueBtn.disabled = true;
    continueBtn.textContent = "Analizando PDF... ⏳";

    try {
        const response = await fetch('/api/process_pdf', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.questions && data.questions.length > 0) {
            mockQuestions = data.questions;
            alert(`¡Éxito! Hemos extraído ${mockQuestions.length} preguntas.`);
            
            uploadArea.style.display = 'none';
            modeSelectionArea.style.display = 'block';
        } else {
            alert(data.error || "No se detectaron preguntas en el PDF.");
            continueBtn.disabled = false;
            continueBtn.textContent = "Continuar ➔";
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión con el backend de Python.");
        continueBtn.disabled = false;
        continueBtn.textContent = "Continuar ➔";
    }
});

// ==========================================
// 2. SELECCIÓN DE MODO
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
// 3. RENDERIZADO DE CARTAS
// ==========================================
function renderCard() {
    const question = mockQuestions[currentIndex];
    const container = document.getElementById('card-container');
    
    document.getElementById('current-number').textContent = currentIndex + 1;
    document.getElementById('total-number').textContent = mockQuestions.length;

    container.innerHTML = `
        <div class="flashcard" id="main-card">
            <div class="card-inner">
                <div class="card-front">
                    <p class="question-text">${question.question}</p>
                    <div class="options-grid">
                        ${question.options.map(opt => {
                            const safeOpt = opt.replace(/'/g, "\\'");
                            return `<button class="option-btn" onclick="checkAnswer('${safeOpt}')">${opt}</button>`;
                        }).join('')}
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

// ==========================================
// 4. LÓGICA DE JUEGO
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

function showResults() {
    flashcardArea.style.display = 'none';
    resultsArea.style.display = 'block';
    document.getElementById('correct-res').textContent = correctCount;
    document.getElementById('incorrect-res').textContent = incorrectCount;
    const accuracy = Math.round((correctCount / mockQuestions.length) * 100);
    document.getElementById('accuracy-res').textContent = accuracy + "%";
}

window.restartApp = function() {
    window.location.reload();
};
