from flask import Flask, request, jsonify
import PyPDF2
import re

app = Flask(__name__)

def extract_questions_from_text(text):
    """
    Lógica básica para segmentar el texto en preguntas.
    Busca patrones como '1. Pregunta' y opciones 'A) ...'
    """
    questions = []
    # Dividimos por números seguidos de punto o paréntesis (ej: "1." o "1)")
    raw_blocks = re.split(r'\n(\d+[\.\)])', text)
    
    # El primer bloque suele ser encabezado, lo saltamos
    for i in range(1, len(raw_blocks), 2):
        q_number = raw_blocks[i]
        q_content = raw_blocks[i+1] if i+1 < len(raw_blocks) else ""
        
        # Intentamos separar la pregunta de las opciones (A, B, C, D)
        # Buscamos letras seguidas de paréntesis o punto
        options = re.split(r'\n([a-dA-D][\.\)])', q_content)
        
        if len(options) > 1:
            pregunta_texto = options[0].strip()
            lista_opciones = []
            for j in range(1, len(options), 2):
                opt_letter = options[j]
                opt_text = options[j+1].strip() if j+1 < len(options) else ""
                lista_opciones.append(f"{opt_letter} {opt_text}")
            
            # Por ahora, como no sabemos la correcta, marcamos la primera como placeholder
            # En la siguiente fase usaremos IA para detectar la correcta de verdad
            questions.append({
                "question": pregunta_texto,
                "options": lista_opciones,
                "correctAnswer": lista_opciones[0] if lista_opciones else ""
            })
    
    return questions

@app.route('/api/process_pdf', methods=['POST'])
def process_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No se envió el archivo"}), 400
    
    file = request.files['file']
    
    try:
        pdf_reader = PyPDF2.PdfReader(file)
        full_text = ""
        for page in pdf_reader.pages:
            full_text += page.extract_text() + "\n"
        
        # Procesamos el texto para sacar las preguntas
        extracted_questions = extract_questions_from_text(full_text)
        
        if not extracted_questions:
            return jsonify({
                "status": "warning",
                "message": "Se leyó el PDF pero no se detectaron preguntas. ¿El formato es estándar?",
                "questions": []
            })

        return jsonify({
            "status": "success",
            "questions": extracted_questions
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def handler(request, *args, **kwargs):
    return app(request.environ, lambda status, headers: None)
