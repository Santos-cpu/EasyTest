from flask import Flask, request, jsonify
import PyPDF2
import re

app = Flask(__name__)

def extract_questions(text):
    questions = []
    # Buscamos patrones de "Número. Pregunta"
    raw_blocks = re.split(r'\n(\d+[\.\)])', text)
    
    for i in range(1, len(raw_blocks), 2):
        q_number = raw_blocks[i]
        q_content = raw_blocks[i+1] if i+1 < len(raw_blocks) else ""
        
        # Separamos las opciones A, B, C, D
        options = re.split(r'\n([a-dA-D][\.\)])', q_content)
        
        if len(options) > 1:
            pregunta_texto = options[0].strip()
            lista_opciones = []
            for j in range(1, len(options), 2):
                opt_label = options[j]
                opt_text = options[j+1].strip() if j+1 < len(options) else ""
                # Limpiamos posibles marcas de respuesta del texto
                opt_clean = opt_text.replace('✓', '').replace('✔', '').strip()
                lista_opciones.append(f"{opt_label} {opt_clean}")
            
            # Buscamos cuál es la correcta (donde estuviera el tick originalmente)
            correct_idx = 0
            for idx, raw_opt in enumerate(options[2::2]):
                if '✓' in raw_opt or '✔' in raw_opt:
                    correct_idx = idx
                    break

            questions.append({
                "question": pregunta_texto,
                "options": lista_opciones,
                "correctAnswer": lista_opciones[correct_idx] if lista_opciones else ""
            })
    return questions

@app.route('/api/process_pdf', methods=['POST'])
def process_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No se envió archivo"}), 400
    
    file = request.files['file']
    try:
        pdf_reader = PyPDF2.PdfReader(file)
        full_text = ""
        for page in pdf_reader.pages:
            full_text += page.extract_text() + "\n"
        
        extracted = extract_questions(full_text)
        
        return jsonify({
            "status": "success",
            "filename": file.filename,
            "questions": extracted
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def handler(request):
    return app(request.environ, lambda status, headers: None)
