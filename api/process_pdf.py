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
        
        # Intentamos con el modelo estándar por ahora
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        Actúa como un extractor de datos experto. Lee el siguiente texto extraído de un PDF de preguntas tipo test.
        Tu objetivo es identificar todas las preguntas y devolverlas en un formato JSON estrictamente estructurado.
        
        Para cada pregunta debes extraer:
        - La pregunta completa.
        - Una lista de opciones (mínimo 3).
        - La respuesta correcta (debe coincidir exactamente con una de las opciones).
        - Una breve explicación de por qué esa es la respuesta correcta (basándote en el texto o en tu conocimiento si el texto no lo indica).

        IMPORTANTE: Devuelve ÚNICAMENTE el código JSON, sin textos explicativos antes ni después.
        El formato debe ser una lista de objetos:
        [
          {{
            "question": "¿Pregunta?",
            "options": ["opción A", "opción B", "opción C"],
            "correctAnswer": "opción B",
            "explanation": "Explicación detallada..."
          }}
        ]

        Aquí está el texto:
        {raw_text}
        """

        response = model.generate_content(prompt)
        cleaned_response = response.text.replace('```json', '').replace('```', '').strip()
        questions_data = json.loads(cleaned_response)

        return jsonify({"questions": questions_data})

    except Exception as e:
        # ==========================================
        # MODO DETECTIVE: PREGUNTAMOS QUÉ MODELOS TIENES
        # ==========================================
        try:
            available_models = [m.name.replace('models/', '') for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
            lista_texto = ", ".join(available_models)
            return jsonify({"error": f"Vaya... Tu API Key solo tiene permiso para usar estos modelos exactos: {lista_texto}"}), 500
        except Exception as e_models:
            return jsonify({"error": f"Error grave de conexión: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
