const canvas = document.getElementById('omok-board');
const ctx = canvas.getContext('2d');
const messageEl = document.getElementById('message');
const turnEl = document.getElementById('current-turn');
const canvasContainer = document.getElementById('canvas-container');
const restartButton = document.getElementById('restart-button');

const BOARD_SIZE = 15; // Standard 15x15 Omok board
let board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));

let currentPlayer = 1; // 1 for black, 2 for white
let gameOver = false;
let lastMove = null; // 마지막으로 둔 돌의 좌표를 저장
let gameMode = 'ai'; // 기본값은 AI 모드

// Image objects
const blackStone = new Image();
blackStone.src = 'black.png';

const whiteStone = new Image();
whiteStone.src = 'white.png';

// Game state variables that will be set after the board image loads
let STONE_SIZE;
let BOARD_MARGIN;
let GRID_SPACING;

function resizeCanvas() {
    const containerRect = canvasContainer.getBoundingClientRect();
    const size = Math.min(containerRect.width, containerRect.height);
    canvas.width = size;
    canvas.height = size;

    // Recalculate board parameters based on new canvas size
    BOARD_MARGIN = canvas.width * 0.05; // 5% margin
    GRID_SPACING = (canvas.width - BOARD_MARGIN * 2) / (BOARD_SIZE - 1);
    STONE_SIZE = GRID_SPACING * 0.9;

    drawBoard();
}

function restartGame() {
    // Reset game state
    board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
    currentPlayer = 1;
    gameOver = false;
    lastMove = null; // 마지막 수 초기화

    // Reset UI
    messageEl.textContent = '';
    turnEl.textContent = '흑돌';

    // Redraw the board
    drawBoard();
}

// Main game initialization function
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const h1 = document.querySelector('h1');

    if (mode === 'user') {
        gameMode = 'user';
        h1.textContent = '오목 한판!';
    } else {
        gameMode = 'ai';
        h1.textContent = 'AI와 오목 한판!';
    }

    resizeCanvas(); // Initial setup
    restartButton.addEventListener('click', restartGame);
};

window.addEventListener('resize', resizeCanvas);

function drawBoard() {
    // Clear the canvas and set a background color
    ctx.fillStyle = '#deb887'; // A woody color for the board
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath(); // Start a new path for all grid lines

    for (let i = 0; i < BOARD_SIZE; i++) {
        // Vertical lines
        const x = Math.round(BOARD_MARGIN + i * GRID_SPACING);
        ctx.moveTo(x, BOARD_MARGIN);
        ctx.lineTo(x, canvas.height - BOARD_MARGIN);

        // Horizontal lines
        const y = Math.round(BOARD_MARGIN + i * GRID_SPACING);
        ctx.moveTo(BOARD_MARGIN, y);
        ctx.lineTo(canvas.width - BOARD_MARGIN, y);
    }
    ctx.stroke(); // Draw all lines at once

    // Draw all the stones currently on the board
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] !== 0) {
                const stone = board[y][x] === 1 ? blackStone : whiteStone;
                // Calculate the top-left corner for drawing the stone image
                const drawX = BOARD_MARGIN + x * GRID_SPACING - STONE_SIZE / 2;
                const drawY = BOARD_MARGIN + y * GRID_SPACING - STONE_SIZE / 2;
                ctx.drawImage(stone, drawX, drawY, STONE_SIZE, STONE_SIZE);
            }
        }
    }

    // 금수 위치에 X 표시 (흑돌 턴에만)
    if (currentPlayer === 1 && !gameOver) {
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] === 0 && isForbidden(x, y)) {
                    const drawX = BOARD_MARGIN + x * GRID_SPACING;
                    const drawY = BOARD_MARGIN + y * GRID_SPACING;
                    ctx.strokeStyle = 'red';
                    ctx.lineWidth = 4;
                    ctx.shadowColor = 'red';
                    ctx.shadowBlur = 15;
                    ctx.beginPath();
                    ctx.moveTo(drawX - STONE_SIZE / 3, drawY - STONE_SIZE / 3);
                    ctx.lineTo(drawX + STONE_SIZE / 3, drawY + STONE_SIZE / 3);
                    ctx.moveTo(drawX + STONE_SIZE / 3, drawY - STONE_SIZE / 3);
                    ctx.lineTo(drawX - STONE_SIZE / 3, drawY + STONE_SIZE / 3);
                    ctx.stroke();
                    ctx.shadowBlur = 0; // Reset shadow
                }
            }
        }
    }

    // 마지막으로 둔 돌에 네온 효과 추가
    if (lastMove) {
        const drawX = BOARD_MARGIN + lastMove.x * GRID_SPACING;
        const drawY = BOARD_MARGIN + lastMove.y * GRID_SPACING;
        
        // 현재 플레이어에 따라 테두리 색상 변경
        const lastPlayer = board[lastMove.y][lastMove.x];
        const neonColor = lastPlayer === 1 ? '#FFA500' : '#00BFFF'; // 흑돌: 주황, 백돌: 파랑

        ctx.strokeStyle = neonColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = neonColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(drawX, drawY, STONE_SIZE / 2, 0, Math.PI * 2);
        ctx.stroke();
        // 그림자 효과 리셋
        ctx.shadowBlur = 0;
    }
}

function handleWin(player) {
    const winner = player === 1 ? '흑돌' : '백돌';
    messageEl.textContent = `${winner} 승리!`
    gameOver = true;
}

function checkWin(x, y) {
    const player = board[y][x];
    if (!player) return false;

    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

    for (const [dx, dy] of directions) {
        let count = 1;

        // 양쪽 방향으로 연속된 돌의 개수를 셉니다.
        for (let i = 1; i < 6; i++) {
            const nx = x + i * dx;
            const ny = y + i * dy;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                count++;
            } else {
                break;
            }
        }

        for (let i = 1; i < 6; i++) {
            const nx = x - i * dx;
            const ny = y - i * dy;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                count++;
            } else {
                break;
            }
        }
        
        // 정확히 5개의 돌이 연속된 경우에만 승리로 인정합니다.
        if (count === 5) {
            return true;
        }
    }

    return false;
}

function analyzeMove(x, y, player) {
    let openThrees = 0;
    let fours = 0;
    let fives = 0;
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

    board[y][x] = player;

    for (const [dx, dy] of directions) {
        let consecutive = 1;
        let openEnds = 0;

        // Positive direction
        for (let i = 1; i < 5; i++) {
            const nx = x + i * dx;
            const ny = y + i * dy;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                consecutive++;
            } else {
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === 0) {
                    openEnds++;
                }
                break;
            }
        }

        // Negative direction
        for (let i = 1; i < 5; i++) {
            const nx = x - i * dx;
            const ny = y - i * dy;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === player) {
                consecutive++;
            } else {
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === 0) {
                    openEnds++;
                }
                break;
            }
        }

        if (consecutive === 3 && openEnds === 2) openThrees++;
        if (consecutive === 4) fours++;
        if (consecutive >= 5) fives++;
    }

    board[y][x] = 0; // Revert the board
    return { openThrees, fours, fives };
}

function isForbidden(x, y) {
    if (board[y][x] !== 0) return false; // Already occupied

    const { openThrees, fours, fives } = analyzeMove(x, y, 1);

    // 3-3 is forbidden, unless it also creates a 4 or 5
    if (openThrees >= 2 && fours === 0 && fives === 0) {
        return true;
    }

    return false;
}

function aiMove() {
    if (gameOver) return;

    let move;
    const stoneCount = board.flat().filter(stone => stone !== 0).length;

    // --- 오프닝 북: AI의 첫 수 전략 ---
    if (stoneCount === 1) { // 사용자가 첫 수를 둔 직후, AI의 첫 번째 응수
        let playerMove;
        // 사용자의 첫 수를 찾습니다.
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (board[y][x] === 1) {
                    playerMove = {x, y};
                    break;
                }
            }
            if(playerMove) break;
        }

        // 1. 사용자가 중앙을 차지했다면, 바로 옆에 두어 견제합니다.
        if (playerMove.x === 7 && playerMove.y === 7) {
            move = { x: 7, y: 8 };
        } else {
            // 2. 사용자가 다른 곳에 두었다면, AI가 중앙을 차지합니다.
            if (board[7][7] === 0) {
                move = { x: 7, y: 7 };
            } else {
                // (예외 처리) 중앙이 이미 차있다면, 사용자 돌 옆에 둡니다.
                move = { x: playerMove.x + 1, y: playerMove.y };
            }
        }
        board[move.y][move.x] = 2;

    } else {
        // --- 중반 이후의 기존 AI 로직 ---
        // 1. AI가 다음 수에 이길 수 있는지 확인
        move = findWinningMove(2); // AI는 플레이어 2
        if (move) {
            board[move.y][move.x] = 2;
        } else {
            // 2. 플레이어가 다음 수에 이길 수 있는지 확인하고 막기
            move = findWinningMove(1); // 플레이어는 플레이어 1
            if (move) {
                board[move.y][move.x] = 2;
            } else {
                // 3. 즉각적인 승/패가 없으면 최적의 수를 찾기
                move = findBestMove();
                if (move) {
                    board[move.y][move.x] = 2;
                } else {
                    // 비상 로직: 둘 곳이 없으면 무작위로 둠
                    let availableMoves = [];
                    for (let y = 0; y < BOARD_SIZE; y++) {
                        for (let x = 0; x < BOARD_SIZE; x++) {
                            if (board[y][x] === 0) {
                                availableMoves.push({ x, y });
                            }
                        }
                    }
                    if (availableMoves.length > 0) {
                        move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
                        board[move.y][move.x] = 2;
                    }
                }
            }
        }
    }

    if (move) {
        lastMove = { x: move.x, y: move.y };
        if (checkWin(move.x, move.y)) {
            handleWin(2);
            drawBoard();
        } else {
            currentPlayer = 1;
            turnEl.textContent = '흑돌';
            drawBoard();
        }
    }
}

function findWinningMove(player) {
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] === 0) {
                board[y][x] = player;
                const hasWon = checkWin(x, y);
                board[y][x] = 0; // 원래대로 되돌리기
                if (hasWon) {
                    return { x, y };
                }
            }
        }
    }
    return null;
}

function findBestMove() {
    let bestAttackMove = null;
    let maxAiScore = -1;
    let bestDefenseMove = null;
    let maxPlayerScore = -1;

    // 보드의 모든 빈 칸을 순회하며 최고의 공격수와 방어수를 찾습니다.
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            if (board[y][x] === 0) {
                // 이 칸에 두었을 때 AI가 얻는 공격 점수
                const currentAiScore = evaluatePatterns(x, y, 2);
                if (currentAiScore > maxAiScore) {
                    maxAiScore = currentAiScore;
                    bestAttackMove = { x, y };
                }

                // 이 칸에 두었을 때 플레이어가 얻는 공격 점수 (즉, AI의 방어 필요성)
                const currentPlayerScore = evaluatePatterns(x, y, 1);
                if (currentPlayerScore > maxPlayerScore) {
                    maxPlayerScore = currentPlayerScore;
                    bestDefenseMove = { x, y };
                }
            }
        }
    }

    // 의사결정 로직:
    // 1. 만약 플레이어의 최고 위협이 '열린 3' 이상이라면, 무조건 방어합니다.
    //    ('열린 4' 이상의 위협은 이미 aiMove 함수에서 처리되었으므로, 여기서는 '열린 3'이 가장 시급한 위협입니다.)
    if (maxPlayerScore >= 20000) { // 20000은 '열린 3'의 점수입니다.
        return bestDefenseMove;
    }

    // 2. 그렇지 않다면 (플레이어의 위협이 '열린 3' 미만이라면),
    //    AI는 자신의 가장 강력한 공격수를 둡니다.
    return bestAttackMove;
}

function evaluatePatterns(x, y, player) {
    // 패턴에 따른 점수표입니다. '열린 3'과 '열린 4'의 점수를 크게 상향 조정했습니다.
    const scores = {
        five: 100000,          // 5개 연속 (승리)
        four_open: 25000,      // 양쪽이 열린 4개 (필승)
        four_closed: 4000,     // 한쪽이 막힌 4개
        three_open: 20000,     // 양쪽이 열린 3개 (매우 강력한 위협)
        three_closed: 200,     // 한쪽이 막힌 3개
        two_open: 100,         // 양쪽이 열린 2개
        two_closed: 10,
        one_open: 1
    };

    let totalScore = 0;
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]]; // 4방향 (가로, 세로, 대각선 2개)

    // 평가를 위해 임시로 돌을 놓습니다.
    board[y][x] = player;

    for (const [dx, dy] of directions) {
        let consecutive = 0;
        let openEnds = 0;
        let line = [];

        // 현재 위치를 중심으로 양쪽 4칸씩, 총 9칸의 상태를 확인합니다.
        for (let i = -4; i <= 4; i++) {
            const nx = x + i * dx;
            const ny = y + i * dy;
            if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
                line.push(board[ny][nx]);
            } else {
                line.push(3); // 3은 보드 바깥을 의미합니다.
            }
        }

        // 현재 놓은 돌(line[4])을 중심으로 연속된 돌의 개수를 셉니다.
        let tempConsecutive = 1;
        // 양의 방향
        for (let i = 5; i < 9; i++) {
            if (line[i] === player) tempConsecutive++;
            else { if (line[i] === 0) openEnds++; break; }
        }
        // 음의 방향
        for (let i = 3; i >= 0; i--) {
            if (line[i] === player) tempConsecutive++;
            else { if (line[i] === 0) openEnds++; break; }
        }

        // 완성된 패턴에 따라 점수를 부여합니다.
        if (tempConsecutive >= 5) totalScore += scores.five;
        else if (tempConsecutive === 4) {
            totalScore += (openEnds === 2) ? scores.four_open : scores.four_closed;
        } else if (tempConsecutive === 3) {
            totalScore += (openEnds === 2) ? scores.three_open : scores.three_closed;
        } else if (tempConsecutive === 2) {
            totalScore += (openEnds === 2) ? scores.two_open : scores.two_closed;
        }
    }

    // 임시로 놓았던 돌을 다시 원래대로 되돌립니다.
    board[y][x] = 0;

    return totalScore;
}


canvas.addEventListener('click', (event) => {
    if (gameOver) return;

    // Get mouse coordinates relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Find the closest grid intersection
    const x = Math.round((mouseX - BOARD_MARGIN) / GRID_SPACING);
    const y = Math.round((mouseY - BOARD_MARGIN) / GRID_SPACING);

    // Check if the move is valid
    if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && board[y][x] === 0) {
        if (currentPlayer === 1 && isForbidden(x, y)) {
            messageEl.textContent = '3-3은 금수입니다!';
            setTimeout(() => messageEl.textContent = '', 2000);
            return;
        }

        board[y][x] = currentPlayer;
        lastMove = { x, y }; // 마지막 수 저장

        if (checkWin(x, y)) {
            handleWin(currentPlayer);
            drawBoard();
        } else {
            // 턴 변경
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            const turnText = currentPlayer === 1 ? '흑돌' : '백돌';
            turnEl.textContent = turnText;

            // AI 모드일 경우에만 AI 턴 진행
            if (gameMode === 'ai' && currentPlayer === 2) {
                turnEl.textContent = '백돌 (AI 생각 중...)';
                setTimeout(aiMove, 500);
            }
            drawBoard();
        }
    }
});

// Add a fallback for images that might not load
blackStone.onerror = () => {
    console.error("Failed to load the black stone image: black.png");
};
whiteStone.onerror = () => {
    console.error("Failed to load the white stone image: white.png");
};
