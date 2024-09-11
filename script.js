let words = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let incorrectCount = 0;
let incorrectWords = [];

// カラフルなボタン用の色リスト
const buttonColors = ["#FF5733", "#33FF57", "#3357FF", "#F39C12", "#8E44AD", "#1ABC9C", "#E74C3C", "#3498DB"];

// CSVファイルのリストを取得してボタンを生成
fetch('/csv_files')
    .then(response => {
        if (!response.ok) {
            throw new Error("ファイルリストの取得に失敗しました");
        }
        return response.json();
    })
    .then(csvFiles => {
        const fileButtonsDiv = document.getElementById('fileButtons');
        csvFiles.forEach((file, index) => {
            const button = document.createElement('button');
            button.textContent = file.replace('.csv', '');
            button.style.backgroundColor = buttonColors[index % buttonColors.length]; // ボタンに色を設定
            button.onclick = () => loadQuizFile(file);
            fileButtonsDiv.appendChild(button);
        });
    })
    .catch(error => {
        console.error("ファイルリストの取得中にエラーが発生しました:", error);
    });

function loadQuizFile(fileName) {
    console.log("選択されたファイル:", fileName);  // ファイル名をログに出力
    fetch(`/csv/${fileName}`)
        .then(response => {
            console.log("CSVファイルをフェッチ中...");  // フェッチ処理の開始をログ
            if (!response.ok) {
                throw new Error(`ファイル ${fileName} の読み込みに失敗しました`);
            }
            return response.text();
        })
        .then(data => {
            console.log("CSVデータを取得しました:", data);  // CSVデータをログに出力
            const workbook = XLSX.read(data, {type: 'binary'});
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, {header: 1});

            parseData(jsonData);

            // クイズファイル選択画面を非表示にし、出題画面に遷移
            document.getElementById('fileButtons').style.display = 'none';
            document.querySelector('h1').style.display = 'none';
            document.getElementById('quizContent').style.display = 'block';

            console.log("出題画面に遷移しました");  // 出題画面に遷移したことを確認

            shuffle(words);
            showQuestion();  // 最初の問題を表示
        })
        .catch(error => {
            console.error(`ファイル ${fileName} の読み込み中にエラーが発生しました:`, error);
        });
}

function parseData(data) {
    words = data.slice(1).map(row => ({
        wordOptions: [
            { word: row[0], choice: row[1], furigana: row[2] },  // word1, choice1, furigana1
            { word: row[3], choice: row[4], furigana: row[5] },  // word2, choice2, furigana2
            { word: row[6], choice: row[7], furigana: row[8] },  // word3, choice3, furigana3
            { word: row[9], choice: row[10], furigana: row[11] } // word4, choice4, furigana4
        ]
    }));
}

function showQuestion() {
    if (currentQuestionIndex >= words.length) {
        showResults();
        return;
    }

    const questionElement = document.getElementById('question');
    const choiceButtonsContainer = document.getElementById('choices');
    choiceButtonsContainer.innerHTML = '';  // 選択肢をクリア
    const currentWordOptions = words[currentQuestionIndex].wordOptions;

    // ランダムにword1〜word4から1つを選んで出題
    const randomWord = currentWordOptions[Math.floor(Math.random() * 4)];

    // 問題を表示
    questionElement.innerHTML = `What is the meaning of "<span class="highlight-word">${randomWord.word}</span>"?`;
    questionElement.style.display = 'block';  // 問題文を表示

    // 発音ボタンに機能を追加
    const pronounceBtn = document.getElementById('pronounceBtn');
    pronounceBtn.style.display = 'block';
    pronounceBtn.onclick = () => pronounceWord(randomWord.word);

    const correctChoice = randomWord.choice;
    const shuffledChoices = shuffle([...currentWordOptions]);

    shuffledChoices.forEach(choice => {
        const button = document.createElement('button');
        if (choice.furigana && choice.furigana !== "") {
            button.innerHTML = `<ruby>${choice.choice}<rt>${choice.furigana}</rt></ruby>`;
        } else {
            button.textContent = choice.choice;
        }

        button.style.margin = '10px'; // 選択肢ボタンの間に隙間を追加
        button.onclick = () => checkAnswer(choice.choice, correctChoice, randomWord.word);
        choiceButtonsContainer.appendChild(button);
    });
    choiceButtonsContainer.style.display = 'block';  // 選択肢を表示
}

function checkAnswer(selectedChoice, correctChoice, word) {
    if (selectedChoice === correctChoice) {
        correctCount++;
    } else {
        incorrectCount++;
        incorrectWords.push({ word: word, correctChoice: correctChoice });
    }

    currentQuestionIndex++;
    showQuestion();
}

function showResults() {
    document.getElementById('question').style.display = 'none';
    document.getElementById('choices').style.display = 'none';
    document.getElementById('pronounceBtn').style.display = 'none';

    const resultElement = document.getElementById('result');
    resultElement.innerHTML = '';

    // 結果の表示をテーブル形式に変更
    resultElement.innerHTML = `
        <div class="centered">
            <button id="restartBtn" style="display: block;">再チャレンジ</button>
        </div>
        <table>
            <tr>
                <th>正解数</th>
                <td>${correctCount}</td>
            </tr>
            <tr>
                <th>不正解数</th>
                <td>${incorrectCount}</td>
            </tr>
        </table>
    `;

    // 間違えた単語とその意味をテーブルで表示
    if (incorrectWords.length > 0) {
        let incorrectTable = `<br><strong>間違えた単語とその意味:</strong><br>`;
        incorrectTable += `
            <table>
                <tr>
                    <th>単語</th>
                    <th>正しい意味</th>
                </tr>
        `;
        incorrectWords.forEach(item => {
            incorrectTable += `
                <tr>
                    <td>${item.word}</td>
                    <td>${item.correctChoice}</td>
                </tr>
            `;
        });
        incorrectTable += `</table>`;
        resultElement.innerHTML += incorrectTable;
    }

    // 再チャレンジボタンにクリックイベントを設定
    const restartBtn = document.getElementById('restartBtn');
    restartBtn.onclick = resetQuiz;
}

function resetQuiz() {
    currentQuestionIndex = 0;
    correctCount = 0;
    incorrectCount = 0;
    incorrectWords = [];

    // 結果表示をクリア
    document.getElementById('result').textContent = '';

    // クイズ選択画面に戻す
    document.getElementById('quizContent').style.display = 'none';  // 出題画面を非表示
    document.querySelector('h1').style.display = 'block';  // クイズファイル選択画面の文言を再表示
    document.getElementById('fileButtons').style.display = 'block';  // クイズファイル選択画面を再表示

    // 再チャレンジボタンを非表示
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        restartBtn.style.display = 'none';  // 再チャレンジボタンを非表示
    }

    // 発音ボタンと問題文、選択肢を非表示にしてリセット
    const question = document.getElementById('question');
    if (question) {
        question.style.display = 'none';  // 問題文を非表示
    }

    const choices = document.getElementById('choices');
    if (choices) {
        choices.style.display = 'none';  // 選択肢を非表示
        choices.innerHTML = '';  // 選択肢ボタンをクリア
    }

    const pronounceBtn = document.getElementById('pronounceBtn');
    if (pronounceBtn) {
        pronounceBtn.style.display = 'none';  // 発音ボタンを非表示
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function pronounceWord(word) {
    const synth = window.speechSynthesis;
    const utterThis = new SpeechSynthesisUtterance(word);
    utterThis.lang = 'en-US';
    synth.speak(utterThis);
}

// タッチ操作とマウス操作の両方に対応
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        // touchstartイベントで反応させ、クリックの遅延を防ぐ
        button.addEventListener('touchstart', handleButtonPress, { passive: true });
        button.addEventListener('click', handleButtonPress); // fallback for non-touch devices
    });
});

function handleButtonPress(event) {
    event.preventDefault(); // タッチのデフォルトアクションを防止
    // ボタンが押されたときの処理をここで記述
}
