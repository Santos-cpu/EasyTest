import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

# Configurar Gemini con la clave de entorno
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
genai.configure(api_key=GEMINI_API_KEY)

def extract_text_from_pdf(pdf_file):
    reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

@app.route('/api/process_pdf', methods=['POST'])
def process_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No se subió ningún archivo"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Archivo no seleccionado"}), 400

    try:
        # Extraer el texto del PDF
        raw_text = extract_text_from_pdf(file)
        
        # Usamos gemini-2.5-flash por su alta velocidad
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Prompt optimizado para velocidad y límite de 20 preguntas
        prompt = f"""
        Actúa como un profesor experto. Tu tarea es extraer preguntas de opción múltiple del siguiente texto.
        
        REGLA DE ORO: Extrae un MÁXIMO de 20 preguntas. No intentes procesar más, aunque el texto sea largo.
        
        Para cada pregunta, genera:
        1. La pregunta clara.
        2. Un array de opciones (mínimo 3).
        3. La respuesta correcta (debe ser idéntica a una de las opciones).
        4. Una breve explicación educativa.

        Responde ÚNICAMENTE con un JSON válido (una lista de objetos). Sin texto adicional ni bloques de código.

        Formato esperado:
        [
          {{
            "question": "¿Ejemplo de pregunta?",
            "options": ["A", "B", "C"],
            "correctAnswer": "A",
            "explanation": "Porque..."
          }}
        ]

        Texto del PDF:
        {raw_text}
        """

        # Generar contenido
        response = model.generate_content(prompt)
        
        # Limpiar posibles etiquetas de la respuesta
        json_text = response.text.replace('```json', '').replace('```', '').strip()
        questions_data = json.loads(json_text)

        return jsonify({"questions": questions_data})

    except Exception as e:
        # Error detallado para depuración
        return jsonify({"error": f"Error técnico: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
