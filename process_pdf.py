from flask import Flask, request, jsonify
import PyPDF2
import io

# Inicializamos la aplicación Flask
app = Flask(__name__)

# Definimos la "ruta" que escuchará las peticiones desde JavaScript
@app.route('/api/process_pdf', methods=['POST'])
def process_pdf():
    # 1. Comprobamos si la petición contiene un archivo
    if 'file' not in request.files:
        return jsonify({"error": "No se envió ningún archivo desde la web."}), 400
    
    file = request.files['file']
    
    # 2. Comprobamos si el archivo tiene un nombre válido
    if file.filename == '':
        return jsonify({"error": "El archivo no tiene nombre."}), 400
    
    try:
        # 3. Leemos el PDF directamente desde la memoria (sin guardarlo en el disco duro)
        pdf_reader = PyPDF2.PdfReader(file)
        num_pages = len(pdf_reader.pages)
        
        # 4. Devolvemos una respuesta exitosa en formato JSON (que JavaScript entiende perfectamente)
        return jsonify({
            "status": "success",
            "message": "¡PDF recibido y leído con éxito por Python!",
            "filename": file.filename,
            "pages_counted": num_pages
        }), 200
        
    except Exception as e:
        # Si ocurre algún error al leer el PDF (ej. está encriptado con contraseña)
        return jsonify({"error": f"Error al procesar el PDF: {str(e)}"}), 500

# Esta línea es necesaria para entornos de desarrollo local
if __name__ == '__main__':
    app.run(debug=True, port=5000)