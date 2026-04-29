import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

# Configurar Gemini
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
        raw_text = extract_text_from_pdf(file)
        
        # Usamos el modelo 2.5-flash que es el que tienes activo y es ultra rápido
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""
        Actúa como un extractor de datos experto. Lee el siguiente texto extraído de un PDF de preguntas tipo test.
        Tu objetivo es identificar las preguntas y devolverlas en un formato JSON estrictamente estructurado.
        
        REGLA CRÍTICA DE VELOCIDAD: Extrae un MÁXIMO de 20 preguntas. 
        Si el documento tiene muchas preguntas, selecciona las 20 primeras o una muestra representativa. 
        Esto es para asegurar que la respuesta no tarde demasiado y el servidor no corte la conexión.

        Para cada pregunta debes extraer:
        - La pregunta completa.
        - Una lista de opciones (mínimo 3).
        - La respuesta correcta (debe coincidir exactamente con una de las opciones).
        - Una breve explicación de por qué esa es la respuesta correcta.

        IMPORTANTE: Devuelve ÚNICAMENTE el código JSON. No incluyas "```json" ni texto extra.
        El formato debe ser:
        [
          {{
            "question": "¿Pregunta?",
            "options": ["opción A", "opción B", "opción C"],
            "correctAnswer": "opción B",
            "explanation": "..."
          }}
        ]

        Aquí está el texto del PDF:
        {raw_text}
        """

        response = model.generate_content(prompt)
        
        # Limpieza de seguridad por si la IA mete etiquetas de bloque de código
        cleaned_response = response.text.replace('```json', '').replace('```', '').strip()
        questions_data = json.loads(cleaned_response)

        return jsonify({"questions": questions_data})

    except Exception as e:
        # Devolvemos el error técnico real para poder debuguear si algo falla
        return jsonify({"error": f"Error técnico real: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
