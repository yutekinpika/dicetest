// diceBoard.js
import OrientedDice from './orientedDice.js'; // OrientedDiceクラスをインポート

class DiceBoard {
    constructor(width = 3, height = 3) {
        this.width = width;
        this.height = height;
        this.board = Array(this.height).fill(null).map(() => Array(this.width).fill(null));
        
        // { diceId: OrientedDiceInstance }
        this.diceMap = new Map(); 
        // { diceId: { x: number, y: number, dice: OrientedDiceInstance } }
        this.dicePositions = new Map(); 
    }

    /**
     * 指定された座標が盤面内かどうかをチェックします。
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {boolean} 盤面内ならtrue
     */
    isValidCoordinate(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    /**
     * サイコロを盤面に追加します。
     * @param {string} diceId - サイコロを識別するユニークなID
     * @param {OrientedDice} diceInstance - 追加するOrientedDiceのインスタンス
     * @param {number} x - 配置するX座標
     * @param {number} y - 配置するY座標
     * @returns {boolean} 追加に成功すればtrue、失敗すればfalse
     */
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
        console.log(`Dice '${diceId}' added at (${x}, ${y}) with state ${diceInstance.getStateString()}`);
        return true;
    }

    /**
     * 指定された座標にあるサイコロのインスタンスを取得します。
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {OrientedDice | null} サイコロのインスタンス、または空ならnull
     */
    getDiceAt(x, y) {
        if (!this.isValidCoordinate(x, y)) {
            return null;
        }
        return this.board[y][x];
    }
    
    /**
     * 指定された座標にあるサイコロのIDを取得します。
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {string | null} サイコロのID、または空か見つからなければnull
     */
    getDiceIdAt(x, y) {
        const diceInstance = this.getDiceAt(x,y);
        if (!diceInstance) return null;

        for (const [id, dicePos] of this.dicePositions.entries()) {
            if (dicePos.dice === diceInstance) {
                return id;
            }
        }
        return null; // Should not happen if data is consistent
    }


    /**
     * 指定されたIDのサイコロの現在の位置情報を取得します。
     * @param {string} diceId - サイコロのID
     * @returns {{x: number, y: number, dice: OrientedDice} | null} サイコロの位置情報、またはnull
     */
    getDiceInfo(diceId) {
        return this.dicePositions.get(diceId) || null;
    }

    /**
     * サイコロを指定された盤面上の方向に転がします。
     * @param {string} diceId - 転がすサイコロのID
     * @param {'NORTH' | 'EAST' | 'SOUTH' | 'WEST'} boardDirection - 転がす盤面上の方向
     * @returns {boolean} 転がしに成功すればtrue、失敗すればfalse
     */
    rollDice(diceId, boardDirection) {
        const currentDiceInfo = this.getDiceInfo(diceId);
        if (!currentDiceInfo) {
            console.error(`Error rolling dice: Dice ID '${diceId}' not found.`);
            return false;
        }

        const { x: currentX, y: currentY, dice: diceInstance } = currentDiceInfo;

        let nextX = currentX;
        let nextY = currentY;

        switch (boardDirection.toUpperCase()) {
            case 'NORTH': nextY--; break;
            case 'EAST':  nextX++; break;
            case 'SOUTH': nextY++; break;
            case 'WEST':  nextX--; break;
            default:
                console.error(`Error rolling dice '${diceId}': Invalid board direction '${boardDirection}'.`);
                return false;
        }

        if (!this.isValidCoordinate(nextX, nextY)) {
            console.error(`Error rolling dice '${diceId}': Target coordinate (${nextX}, ${nextY}) is out of bounds.`);
            return false;
        }

        if (this.board[nextY][nextX] !== null) {
            const occupyingDiceId = this.getDiceIdAt(nextX, nextY);
            console.error(`Error rolling dice '${diceId}': Target coordinate (${nextX}, ${nextY}) is occupied by dice '${occupyingDiceId}'.`);
            return false;
        }

        // サイコロを転がす (OrientedDiceのrollメソッド)
        // 盤面上の移動方向とサイコロの回転方向は一致すると仮定
        if (!diceInstance.roll(boardDirection)) {
            // OrientedDice.rollがfalseを返した場合 (通常は内部エラー)
            console.error(`Error rolling dice '${diceId}': Dice internal roll failed for direction '${boardDirection}'.`);
            return false;
        }

        // 盤面の状態を更新
        this.board[currentY][currentX] = null;         // 元のマスを空にする
        this.board[nextY][nextX] = diceInstance;       // 新しいマスにサイコロを配置
        this.dicePositions.set(diceId, { x: nextX, y: nextY, dice: diceInstance }); // サイコロの位置情報を更新

        console.log(`Dice '${diceId}' rolled ${boardDirection} from (${currentX}, ${currentY}) to (${nextX}, ${nextY}). New state: ${diceInstance.getStateString()}`);
        return true;
    }

    /**
     * 盤面の状態をコンソールに表示します（デバッグ用）。
     */
    displayBoard() {
        console.log("Current Board State:");
        for (let y = 0; y < this.height; y++) {
            let rowStr = "";
            for (let x = 0; x < this.width; x++) {
                const dice = this.board[y][x];
                if (dice) {
                    const diceId = this.getDiceIdAt(x,y);
                    rowStr += `[${diceId ? diceId.slice(0,3) : 'ERR'}:${dice.getStateString()}] `;
                } else {
                    rowStr += "[Empty]          ";
                }
            }
            console.log(rowStr);
        }
        console.log("---");
    }
}

// --- 使用例 ---

// (この部分はブラウザ環境で実行する場合、<script type="module"> 内に記述するか、
//  ビルドツール(Webpack, Parcelなど)でバンドルする必要があります)

// サイコロの画像ファイル名の設定（各サイコロで同じでも異なっても良い）
const diceImages = [
    '0.png', '1.png', '2.png', '3.png', '4.png', '5.png'
];
const diceRedImages = [ // 例: 色違いのサイコロ用
    'r0.png', 'r1.png', 'r2.png', 'r3.png', 'r4.png', 'r5.png'
];


// 盤面のインスタンスを作成
const gameBoard = new DiceBoard(3, 3);

// サイコロを作成して盤面に追加
const diceA = new OrientedDice(diceImages, 0, 0); // 初期状態(0,0)
const diceB = new OrientedDice(diceRedImages, 5, 90); // 別の画像セット、初期状態(5,90)

gameBoard.addDice("D_A", diceA, 0, 0);
gameBoard.addDice("D_B", diceB, 1, 1);
// gameBoard.addDice("D_C", new OrientedDice(diceImages, 2, 180), 2, 2);

gameBoard.displayBoard();

console.log("\nRolling Dice A NORTH (should fail, out of bounds):");
gameBoard.rollDice("D_A", "NORTH"); 
gameBoard.displayBoard();

console.log("\nRolling Dice A EAST:");
gameBoard.rollDice("D_A", "EAST"); // (0,0) -> (1,0), (0,0)にいたD_Aは(2,270)になるはず (0,0)->(2,270)は北。東なら (0,0)->(4,90)
// (0,0)から東へ転がすと(4,90)になる
gameBoard.displayBoard();

console.log("\nRolling Dice A SOUTH:");
gameBoard.rollDice("D_A", "SOUTH"); // (1,0) -> (1,1) (D_Bがいるので失敗するはず)
gameBoard.displayBoard();

console.log("\nRolling Dice B WEST:");
gameBoard.rollDice("D_B", "WEST"); // (1,1) -> (0,1), D_B (5,90) -> 西 -> (2,90)
gameBoard.displayBoard();

console.log("\nRolling Dice A SOUTH (again, D_A is at (1,0)):");
gameBoard.rollDice("D_A", "SOUTH"); // (1,0)のD_A -> 南 -> (1,1) (ここにはD_Bがいたが移動したので空のはず) D_A(4,90) -> 南 -> (5,90)
gameBoard.displayBoard();


// 例のシーケンスを特定のサイコロで試す
const diceTest = new OrientedDice(diceImages, 0, 0);
gameBoard.addDice("D_T", diceTest, 2,1);
console.log(`\nTest sequence for D_T starting at (2,1) with state ${diceTest.getStateString()}`);
gameBoard.displayBoard();

const sequence = ["NORTH", "NORTH", "EAST", "SOUTH", "SOUTH", "WEST"];
const diceIdToTest = "D_T";

// 北への移動は (2,1) -> (2,0)
// 北への移動は (2,0) -> (2,-1) (盤面外なので失敗)
// ...など、盤面上の移動を考慮しながらテストする必要がある。
// ここでは、単にサイコロ自体の連続回転テストを、盤面上の一つのサイコロで行う。
// ただし、移動先が空いているか、盤面内であるかのチェックが必要。

// (0,0)から開始するサイコロでテスト
const diceForSeq = new OrientedDice(diceImages, 0, 0);
gameBoard.addDice("SEQ", diceForSeq, 0, 2); // (0,2)に配置
gameBoard.displayBoard();

console.log("\nTest sequence from example for dice 'SEQ' at (0,2):");
let currentPos = { x: 0, y: 2 };
const testDirections = [
    { board: "NORTH", dice: "NORTH", targetPos: {x:0, y:1} }, // (0,0) -> (2,270)
    { board: "NORTH", dice: "NORTH", targetPos: {x:0, y:0} }, // (2,270) -> (3,0)
    { board: "EAST",  dice: "EAST",  targetPos: {x:1, y:0} }, // (3,0) -> (4,270)
    { board: "SOUTH", dice: "SOUTH", targetPos: {x:1, y:1} }, // (4,270) -> (2,0)
    { board: "SOUTH", dice: "SOUTH", targetPos: {x:1, y:2} }, // (2,0) -> (1,90)
    { board: "WEST",  dice: "WEST",  targetPos: {x:0, y:2} }  // (1,90) -> (3,180)
];

for (const move of testDirections) {
    console.log(`\nAttempting to roll 'SEQ' ${move.board} from (${currentPos.x}, ${currentPos.y})`);
    const diceBeforeRoll = gameBoard.getDiceInfo("SEQ").dice.getStateString();
    if (gameBoard.rollDice("SEQ", move.board)) {
        console.log(`  Dice 'SEQ' was ${diceBeforeRoll}, now ${gameBoard.getDiceInfo("SEQ").dice.getStateString()}`);
        currentPos = gameBoard.getDiceInfo("SEQ"); // Update currentPos to the new x, y
    } else {
        console.log(`  Roll failed. Check board state or if target was occupied/out of bounds.`);
        // シーケンスが途中で失敗したら抜ける
        break; 
    }
    gameBoard.displayBoard();
}