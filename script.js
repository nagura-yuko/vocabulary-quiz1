let words = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let incorrectCount = 0;
let incorrectWords = [];
let isRetryMode = false;  // 間違った問題を再チャレンジするモード

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
        csvFiles.sort((a, b) => {
            const numA = parseInt(a.match(/\d+/));
            const numB = parseInt(b.match(/\d+/));
            return numA - numB;
        });

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
    console.log("選択されたファイル:", fileName);
    fetch(`/csv/${fileName}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`ファイル ${fileName} の読み込みに失敗しました`);
            }
            return response.text();
        })
        .then(data => {
            const workbook = XLSX.read(data, {type: 'binary'});
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, {header: 1});

            parseData(jsonData);

            console.log("CSVデータが読み込まれました: ", jsonData);  // デバッグ: 読み込んだデータを表示

            // クイズファイル選択画面を非表示にし、出題画面に遷移
            document.getElementById('fileButtons').style.display = 'none';
            document.querySelector('h1').style.display = 'none';
            document.getElementById('quizContent').style.display = 'block';

            if (!isRetryMode) {
                shuffle(words);
            }
            showQuestion();
        })
        .catch(error => {
            console.error(`ファイル ${fileName} の読み込み中にエラーが発生しました:`, error);
        });
}

function parseData(data) {
    words = data.slice(1).map(row => ({
        questionNumber: row[0],
        wordOptions: [
            { word: row[1], choice: row[2], furigana: row[3] },
            { word: row[4], choice: row[5], furigana: row[6] },
            { word: row[7], choice: row[8], furigana: row[9] },
            { word: row[10], choice: row[11], furigana: row[12] }
        ]
    }));

    console.log("問題データがパースされました: ", words);  // デバッグ: パースされた問題データを表示
}

function retryQuiz() {
    if (incorrectWords.length > 0) {
        isRetryMode = true;

        // 間違った問題とその選択肢を使って再出題
        words = incorrectWords.map(item => {
            console.log("Retrying with the following incorrect question: ", item);
            return {
                questionNumber: "",  // 再チャレンジ時は問題番号は不要
                wordOptions: item.wordOptions,  // 保存された選択肢をそのまま使用
                word: item.word,  // 正しい単語を再度設定
                correctChoice: item.correctChoice  // 正しい答えも再設定
            };
        });

        incorrectWords = [];  // リセット
        currentQuestionIndex = 0;
        correctCount = 0;
        incorrectCount = 0;
        document.getElementById('result').innerHTML = '';  // 結果表示をクリア
        showQuestion();  // 再度問題を表示
    } else {
        resetQuiz();  // 不正解問題がない場合はクイズをリセット
    }
}

function showQuestion() {
    if (currentQuestionIndex >= words.length) {
        showResults();
        return;
    }

    const questionElement = document.getElementById('question');
    const choiceButtonsContainer = document.getElementById('choices');
    choiceButtonsContainer.innerHTML = '';
    const currentWordOptions = words[currentQuestionIndex].wordOptions;

    // もし retryMode の場合、選ばれた不正解問題の単語をそのまま表示する
    const randomWord = isRetryMode ? words[currentQuestionIndex].word : currentWordOptions[Math.floor(Math.random() * 4)].word;

    // 問題を表示 (retryMode でも通常モードでも正しく表示)
    questionElement.innerHTML = `What is the meaning of "<span class="highlight-word">${randomWord}</span>"?`;
    questionElement.style.display = 'block';

    // 発音ボタンを再表示
    const pronounceBtn = document.getElementById('pronounceBtn');
    pronounceBtn.style.display = 'block';
    pronounceBtn.onclick = () => pronounceWord(randomWord);

    const correctChoice = isRetryMode ? words[currentQuestionIndex].correctChoice : currentWordOptions.find(opt => opt.word === randomWord).choice;

    // ふりがなと選択肢を表示
    currentWordOptions.forEach(choice => {
        const button = document.createElement('button');
        if (choice.furigana && choice.furigana !== "") {
            button.innerHTML = `<ruby>${choice.choice}<rt>${choice.furigana}</rt></ruby>`;
        } else {
            button.textContent = choice.choice;
        }
        button.onclick = () => checkAnswer(choice.choice, correctChoice, randomWord);
        choiceButtonsContainer.appendChild(button);
    });
    choiceButtonsContainer.style.display = 'block';
}

function checkAnswer(selectedChoice, correctChoice, word) {
    if (selectedChoice === correctChoice) {
        correctCount++;
    } else {
        incorrectCount++;
        // 元の選択肢を保持して、間違えた問題として保存する
        const originalWordOptions = words[currentQuestionIndex].wordOptions;

        // コンソールで保存する問題と選択肢を確認
        console.log("Saving incorrect question: ", {
            word: word,
            correctChoice: correctChoice,
            wordOptions: originalWordOptions
        });

        // 間違った問題を保存 (単語、正しい選択肢、全ての選択肢を保持)
        incorrectWords.push({
            word: word,
            correctChoice: correctChoice,
            wordOptions: originalWordOptions
        });
    }

    currentQuestionIndex++;
    showQuestion();
}

function showResults() {
    document.getElementById('question').style.display = 'none';
    document.getElementById('choices').style.display = 'none';
    document.getElementById('pronounceBtn').style.display = 'none';  // 発音ボタンも非表示に

    const resultElement = document.getElementById('result');
    resultElement.innerHTML = `
        <div class="centered">
            <button id="retryBtn" style="display: block;">再度回答する</button>
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
    } else {
        resultElement.innerHTML += `
            <div class="centered">
                <button id="nextQuizBtn" style="display: block;">他の問題にチャレンジする</button>
            </div>
        `;

        const nextQuizBtn = document.getElementById('nextQuizBtn');
        nextQuizBtn.onclick = resetQuiz;
    }

    const retryBtn = document.getElementById('retryBtn');
    retryBtn.onclick = retryQuiz;
}

function retryQuiz() {
    if (incorrectWords.length > 0) {
        isRetryMode = true;

        // 間違った問題とその選択肢を使って再出題
        words = incorrectWords.map(item => {
            console.log("Retrying with the following incorrect question: ", item);
            return {
                questionNumber: "",  // 再チャレンジ時は問題番号は不要
                wordOptions: item.wordOptions,  // 保存された選択肢をそのまま使用
                word: item.word,  // 正しい単語を再度設定
                correctChoice: item.correctChoice  // 正しい答えも再設定
            };
        });

        incorrectWords = [];  // リセット
        currentQuestionIndex = 0;
        correctCount = 0;
        incorrectCount = 0;
        document.getElementById('result').innerHTML = '';  // 結果表示をクリア
        showQuestion();  // 再度問題を表示
    } else {
        resetQuiz();  // 不正解問題がない場合はクイズをリセット
    }
}

function resetQuiz() {
    isRetryMode = false;
    currentQuestionIndex = 0;
    correctCount = 0;
    incorrectCount = 0;
    incorrectWords = [];

    // クイズ選択画面に戻す
    document.getElementById('quizContent').style.display = 'none';
    document.querySelector('h1').style.display = 'block';
    document.getElementById('fileButtons').style.display = 'flex';  // クイズファイル選択画面を再表示
    document.getElementById('fileButtons').style.justifyContent = 'center';  // 中央揃えを再適用

    const resultElement = document.getElementById('result');
    resultElement.innerHTML = '';  // 結果表示をクリア

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

// シャッフル関数
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 発音機能
function pronounceWord(word) {
    const synth = window.speechSynthesis;
    const utterThis = new SpeechSynthesisUtterance(word);
    utterThis.lang = 'en-US';  // 英語の発音設定
    synth.speak(utterThis);
}

// タッチ操作とマウス操作の両方に対応
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        // touchstartイベントで反応させ、クリックの遅延を防ぐ
        button.addEventListener('touchstart', handleButtonPress, { passive: true });
        button.addEventListener('click', handleButtonPress);  // タッチデバイス以外用
    });
});

function handleButtonPress(event) {
    event.preventDefault();  // タッチのデフォルトアクションを防止
    // ボタンが押されたときの処理を記述
}
