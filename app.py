from flask import Flask, jsonify, send_from_directory
import os

app = Flask(__name__)

# CSVファイルが保存されているディレクトリ
CSV_DIRECTORY = './csv'

# ルートURLでindex.htmlを表示する設定
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# CSSファイルの提供
@app.route('/style.css')
def styles():
    return send_from_directory('.', 'style.css')

# JavaScriptファイルの提供
@app.route('/script.js')
def script():
    return send_from_directory('.', 'script.js')

# CSVファイルのリストを取得するエンドポイント
@app.route('/csv_files')
def list_csv_files():
    csv_files = [f for f in os.listdir(CSV_DIRECTORY) if f.endswith('.csv')]
    return jsonify(csv_files)

# 特定のCSVファイルを提供するエンドポイント
@app.route('/csv/<filename>')
def get_csv_file(filename):
    return send_from_directory(CSV_DIRECTORY, filename)

# manifest.json を提供するルート
@app.route('/manifest.json')
def manifest():
    return send_from_directory('.', 'manifest.json')

# service-worker.js を提供するルート
@app.route('/service-worker.js')
def service_worker():
    return send_from_directory('.', 'service-worker.js')

# favicon.ico を提供するルート（オプション）
@app.route('/favicon.ico')
def favicon():
    return send_from_directory('.', 'favicon.ico')

# imageディレクトリの画像ファイルを提供するルート
@app.route('/image/<path:filename>')
def image_files(filename):
    return send_from_directory('image', filename)

# HerokuまたはRenderが提供するポートにバインドするための設定
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # HerokuやRenderが指定するポートを取得
    app.run(host='0.0.0.0', port=port, debug=True)  # 全てのホストにバインド
