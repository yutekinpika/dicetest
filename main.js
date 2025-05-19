// main.js
import OrientedDice from './orientedDice.js';

class DiceBoard {
    constructor(width = 3, height = 3, boardContainerId) {
        this.width = width;
        this.height = height;
        this.board = Array(this.height).fill(null).map(() => Array(this.width).fill(null));
        this.diceMap = new Map();
        this.dicePositions = new Map();
        this.boardContainer = document.getElementById(boardContainerId);

        if (!this.boardContainer) {
            throw new Error(`Board container with ID '${boardContainerId}' not found.`);
        }
        this.boardContainer.style.gridTemplateColumns = `repeat(${this.width}, 70px)`;
        this.boardContainer.style.gridTemplateRows = `repeat(${this.height}, 70px)`;
    }

    isValidCoordinate(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    addDice(diceId, diceInstance, x, y) {
        if (!this.isValidCoordinate(x, y)) {
            console.error(`Error adding dice '${diceId}': Coordinate (${x}, ${y}) is out of bounds.`);
            return false;
        }
        if (this.board[y][x] !== null) {
            console.error(`Error adding dice '${diceId}': Cell (${x}, ${y}) is already occupied by dice '${this.getDiceIdAt(x,y)}'.`);
            return false;
        }
        if (this.diceMap.has(diceId)) {
            console.error(`Error adding dice '${diceId}': ID already exists.`);
            return false;
        }
        if (!(diceInstance instanceof OrientedDice)) {
            console.error(`Error adding dice '${diceId}': diceInstance is not an instance of OrientedDice.`);
            return false;
        }

        this.board[y][x] = diceInstance;
        this.diceMap.set(diceId, diceInstance);
        this.dicePositions.set(diceId, { x, y, dice: diceInstance });
        // console.log(`Dice '${diceId}' added at (${x}, ${y}) with state ${diceInstance.getStateString()}`);
        return true;
    }

    getDiceAt(x, y) {
        if (!this.isValidCoordinate(x, y)) return null;
        return this.board[y][x];
    }

    getDiceIdAt(x, y) {
        const diceInstance = this.getDiceAt(x, y);
        if (!diceInstance) return null;
        for (const [id, dicePos] of this.dicePositions.entries()) {
            if (dicePos.dice === diceInstance) return id;
        }
        return null;
    }

    getDiceInfo(diceId) {
        return this.dicePositions.get(diceId) || null;
    }

    getTargetCoordinate(currentX, currentY, boardDirection) {
        let nextX = currentX;
        let nextY = currentY;
        switch (boardDirection.toUpperCase()) {
            case 'NORTH': nextY--; break;
            case 'EAST': nextX++; break;
            case 'SOUTH': nextY++; break;
            case 'WEST': nextX--; break;
            default: return null;
        }
        return { x: nextX, y: nextY };
    }
    
    canRollTo(currentX, currentY, boardDirection) {
        const target = this.getTargetCoordinate(currentX, currentY, boardDirection);
        if (!target) return false; // Invalid direction
        
        const { x: nextX, y: nextY } = target;

        if (!this.isValidCoordinate(nextX, nextY)) {
            return false; // Out of bounds
        }
        if (this.board[nextY][nextX] !== null) {
            return false; // Occupied
        }
        return true;
    }

    rollDice(diceId, boardDirection) {
        const currentDiceInfo = this.getDiceInfo(diceId);
        if (!currentDiceInfo) {
            console.error(`Error rolling dice: Dice ID '${diceId}' not found.`);
            return false;
        }

        const { x: currentX, y: currentY, dice: diceInstance } = currentDiceInfo;
        const target = this.getTargetCoordinate(currentX, currentY, boardDirection);

        if (!target) {
            console.error(`Error rolling dice '${diceId}': Invalid board direction '${boardDirection}'.`);
            return false;
        }
        const { x: nextX, y: nextY } = target;

        if (!this.isValidCoordinate(nextX, nextY)) {
            console.error(`Error rolling dice '${diceId}': Target coordinate (${nextX}, ${nextY}) is out of bounds.`);
            return false;
        }

        if (this.board[nextY][nextX] !== null) {
            const occupyingDiceId = this.getDiceIdAt(nextX, nextY);
            console.error(`Error rolling dice '${diceId}': Target coordinate (${nextX}, ${nextY}) is occupied by dice '${occupyingDiceId}'.`);
            return false;
        }

        if (!diceInstance.roll(boardDirection)) {
            console.error(`Error rolling dice '${diceId}': Dice internal roll failed for direction '${boardDirection}'.`);
            return false;
        }

        this.board[currentY][currentX] = null;
        this.board[nextY][nextX] = diceInstance;
        this.dicePositions.set(diceId, { x: nextX, y: nextY, dice: diceInstance });

        console.log(`Dice '${diceId}' rolled ${boardDirection} from (${currentX}, ${currentY}) to (${nextX}, ${nextY}). New state: ${diceInstance.getStateString()}`);
        return true;
    }

    renderBoard() {
        this.boardContainer.innerHTML = ''; // 既存の盤面をクリア

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cell = document.createElement('div');
                cell.classList.add('board-cell');
                cell.dataset.x = x; // 座標情報をdata属性に保存
                cell.dataset.y = y;

                const diceInstance = this.board[y][x];
                if (diceInstance) {
                    const img = document.createElement('img');
                    img.src = diceInstance.getCurrentImageSrc(); // img/0.png など
                    img.alt = `${diceInstance.imageFaceFiles[diceInstance.topFace]}`;
                    img.style.transform = `rotate(${diceInstance.getCurrentCssRotation()}deg)`;
                    cell.appendChild(img);

                    const diceId = this.getDiceIdAt(x, y);
                    if (diceId) {
                        const idOverlay = document.createElement('span');
                        idOverlay.classList.add('dice-id-overlay');
                        idOverlay.textContent = diceId;
                        cell.appendChild(idOverlay);
                    }
                }
                // クリックイベントリスナーを各セルに追加
                cell.addEventListener('click', () => this.handleCellClick(x, y));
                this.boardContainer.appendChild(cell);
            }
        }
        this.displayBoardStateForDebug(); // デバッグ用にコンソールにも表示
    }

    handleCellClick(x, y) {
        console.log(`Cell (${x}, ${y}) clicked.`);
        const diceInstance = this.getDiceAt(x, y);
        if (!diceInstance) {
            console.log("Clicked on an empty cell.");
            return; // 空のマスをクリックしても何もしない
        }

        const diceId = this.getDiceIdAt(x, y);
        if (!diceId) {
            console.error("Could not find ID for dice at clicked cell.");
            return;
        }

        console.log(`Dice '${diceId}' at (${x}, ${y}) state: ${diceInstance.getStateString()}`);

        const preferredDirections = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
        let rolled = false;
        for (const direction of preferredDirections) {
            if (this.canRollTo(x, y, direction)) {
                console.log(`Attempting to roll ${diceId} ${direction}...`);
                if (this.rollDice(diceId, direction)) {
                    rolled = true;
                    break; // 最初の可能な方向に転がしたらループを抜ける
                }
            } else {
                // console.log(`Cannot roll ${diceId} ${direction}.`);
            }
        }

        if (rolled) {
            this.renderBoard(); // 盤面を再描画
        } else {
            console.log(`Dice '${diceId}' cannot be rolled in any preferred direction.`);
        }
    }
    
    // デバッグ用に盤面状態をコンソール出力するメソッド
    displayBoardStateForDebug() {
        console.log("Current Board State (for debug):");
        let boardStr = "";
        for (let y = 0; y < this.height; y++) {
            let rowStr = "";
            for (let x = 0; x < this.width; x++) {
                const dice = this.board[y][x];
                if (dice) {
                    const diceId = this.getDiceIdAt(x,y);
                    rowStr += `[${diceId ? diceId.substring(0,3) : '???'}:${dice.getStateString()}] `;
                } else {
                    rowStr += "[Empty]        ";
                }
            }
            boardStr += rowStr + "\n";
        }
        console.log(boardStr + "---");
    }

    // 盤面をクリアし、サイコロを再配置するメソッド (リセット用)
    resetAndSetupBoard(initialDiceSetup) {
        // 盤面とサイコロ情報をクリア
        this.board = Array(this.height).fill(null).map(() => Array(this.width).fill(null));
        this.diceMap.clear();
        this.dicePositions.clear();

        // 初期配置に基づいてサイコロを追加
        initialDiceSetup.forEach(setup => {
            // 新しいOrientedDiceインスタンスを作成
            // (imageFiles, initialTopFace, initialRotation)
            const dice = new OrientedDice(setup.images, setup.top, setup.rot);
            this.addDice(setup.id, dice, setup.x, setup.y);
        });
        this.renderBoard();
    }
}

// --- アプリケーションの初期化と実行 ---
document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = new DiceBoard(3, 3, 'game-board-container');

    // サイコロの画像ファイル名の設定
    const dice1Images = ['1.png', '3.png', '3r.png', '1.png', '1r.png','3r.png'];
    const dice2Images = ['2.png', '5.png', '2r.png', '5.png', '2r.png','5r.png'];
    const dice3Images = ['3.png', '7.png', '7r.png', '3.png', '3r.png','7r.png'];
    const dice4Images = ['4.png', '6.png', '4r.png', '4.png', '6r.png','4r.png'];
    const dice5Images = ['2.png', '5.png', '2r.png', '5.png', '2r.png','5r.png'];
    const dice6Images = ['6.png', '8.png', '6r.png', '6.png', '8r.png','6r.png'];
    const dice7Images = ['7.png', '1.png', '1r.png', '7.png', '7r.png','1r.png'];
    const dice8Images = ['8.png', '4.png', '8r.png', '8.png', '4r.png','8r.png'];

    const initialDiceConfig = [
        { id: "D_A", images: dice1Images, top: 0, rot: 0, x: 0, y: 0 },
        { id: "D_B", images: dice2Images, top: 0, rot: 0, x: 1, y: 0 },
        { id: "D_C", images: dice3Images, top: 0, rot: 0, x: 2, y: 0 },
        { id: "D_D", images: dice4Images, top: 0, rot: 0, x: 0, y: 1 },
        { id: "D_E", images: dice5Images, top: 0, rot: 0, x: 1, y: 1 },
        { id: "D_F", images: dice6Images, top: 0, rot: 0, x: 2, y: 1 },
        { id: "D_G", images: dice7Images, top: 0, rot: 0, x: 0, y: 2 },
        { id: "D_H", images: dice8Images, top: 0, rot: 0, x: 1, y: 2 },
    ];
    
    gameBoard.resetAndSetupBoard(initialDiceConfig);

    // リセットボタンのイベントリスナー
    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            console.log("Resetting board...");
            gameBoard.resetAndSetupBoard(initialDiceConfig); // 同じ初期設定でリセット
        });
    }
});