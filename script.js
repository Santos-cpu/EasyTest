let mockQuestions = [];
let currentIndex = 0;
let correctCount = 0;
let incorrectCount = 0;

// Navegación
function restartApp() { window.location.reload(); }
function backToModes() {
    document.getElementById('flashcard-area').style.display = 'none';
    document.getElementById('mode-selection').style.display = 'block';
}

function updateFileName() {
    const file = document.getElementById('file-input').files[0];
    if (file) document.getElementById('file-name-display').textContent = file.name;
}

document.getElementById('continue-btn').addEventListener('click', async () => {
    const fileInput = document.getElementById('file-input');
    if (!fileInput.files[0]) return alert("Sube un PDF");

    const btn = document.getElementById('continue-btn');
    btn.textContent = "Analizando...";
    btn.disabled = true;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        const response = await fetch('/api/process_pdf', { method: 'POST', body: formData });
        const data = await response.json();

        if (response.ok) {
            // LIMPIEZA DE DATOS: Quitamos ticks o marcas que Python haya traído por error
            mockQuestions = data.questions.map(q => ({
                ...q,
                options: q.options.map(opt => opt.replace(/✓|✔|\[x\]/gi, '').trim()),
                correctAnswer: q.correctAnswer.replace(/✓|✔|\[x\]/gi, '').trim()
            }));
            
            document.getElementById('upload-area').style.display = 'none';
            document.getElementById('mode-selection').style.display = 'block';
        }
    } catch (e) { alert("Error de servidor"); }
});

// Selección de Modo
document.querySelectorAll('.mode-item').forEach(item => {
    item.addEventListener('click', () => {
        document.getElementById('mode-selection').style.display = 'none';
        document.getElementById('flashcard-area').style.display = 'block';
        renderCard();
    });
});

function renderCard() {
    const q = mockQuestions[currentIndex];
    document.getElementById('current-number').textContent = currentIndex + 1;
    document.getElementById('total-number').textContent = mockQuestions.length;

    const container = document.getElementById('card-container');
    container.innerHTML = `
        <div class="flashcard" onclick="this.classList.toggle('is-flipped')">
            <div class="card-inner">
                <div class="card-front" onclick="event.stopPropagation()">
                    <p style="font-size: 1.2rem; line-height: 1.5;">${q.question}</p>
                    <div class="options-grid">
                        ${q.options.map(opt => `<button class="option-btn" onclick="checkAnswer('${opt.replace(/'/g, "\\'")}', event)">${opt}</button>`).join('')}
                    </div>
                </div>
                <div class="card-back">
                    <h3 style="color: #34d399; margin-bottom: 10px;">Respuesta Correcta</h3>
                    <p style="font-size: 1.1rem;">${q.correctAnswer}</p>
                    <button class="btn-primary" style="margin-top:20px; width:auto;" onclick="nextCard(event)">Siguiente ➔</button>
                </div>
            </div>
        </div>
    `;
}

function checkAnswer(ans, e) {
    e.stopPropagation(); // Evita que la carta gire al pulsar la opción
    const correct = mockQuestions[currentIndex].correctAnswer;
    if (ans === correct) correctCount++; else incorrectCount++;
    document.querySelector('.flashcard').classList.add('is-flipped');
}

function nextCard(e) {
    e.stopPropagation();
    currentIndex++;
    if (currentIndex < mockQuestions.length) renderCard(); else showResults();
}

function showResults() {
    document.getElementById('flashcard-area').style.display = 'none';
    document.getElementById('results-area').style.display = 'block';
    document.getElementById('correct-res').textContent = correctCount;
    document.getElementById('incorrect-res').textContent = incorrectCount;
    document.getElementById('accuracy-res').textContent = Math.round((correctCount/mockQuestions.length)*100) + "%";
}
