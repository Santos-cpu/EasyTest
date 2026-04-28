from flask import Flask, request, jsonify
import PyPDF2

app = Flask(__name__)

@app.route('/api/process_pdf', methods=['POST'])
def process_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No se envió ningún archivo desde la web."}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "El archivo no tiene nombre."}), 400
    
    try:
        pdf_reader = PyPDF2.PdfReader(file)
        num_pages = len(pdf_reader.pages)
        
        return jsonify({
            "status": "success",
            "message": "¡PDF recibido y leído con éxito por Python!",
            "filename": file.filename,
            "pages_counted": num_pages
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Error al procesar el PDF: {str(e)}"}), 500


# 🔴 ESTO ES LO IMPORTANTE PARA VERCEL
def handler(request):
    return app(request.environ, lambda status, headers: None)
