// orientedDice.js

class OrientedDice {
    // 定数
    static NUM_FACES = 6;
    static NUM_ROTATIONS_PER_FACE = 4;
    static NUM_STATES = OrientedDice.NUM_FACES * OrientedDice.NUM_ROTATIONS_PER_FACE; // 24

    // 方向の定義（隣接行列の値に対応）
    static DIRECTIONS = {
        NORTH: 1,
        EAST: 2,
        SOUTH: 3,
        WEST: 4,
    };

    // 隣接行列データ (24x24)
    // 提供されたデータを解析して2次元配列にする
    static ADJACENCY_MATRIX_FLAT = [
        0,	0,	0,	0,	0,	4,	0,	0,	0,	0,	0,	1,	0,	0,	0,	0,	0,	2,	0,	0,	0,	3,	0,	0,
        0,	0,	0,	0,	0,	0,	3,	0,	4,	0,	0,	0,	0,	0,	0,	0,	0,	0,	1,	0,	0,	0,	2,	0,
        0,	0,	0,	0,	0,	0,	0,	2,	0,	3,	0,	0,	0,	0,	0,	0,	0,	0,	0,	4,	0,	0,	0,	1,
        0,	0,	0,	0,	1,	0,	0,	0,	0,	0,	2,	0,	0,	0,	0,	0,	3,	0,	0,	0,	4,	0,	0,	0,
        0,	0,	0,	3,	0,	0,	0,	0,	0,	0,	0,	2,	0,	1,	0,	0,	0,	0,	0,	0,	0,	0,	0,	4,
        2,	0,	0,	0,	0,	0,	0,	0,	1,	0,	0,	0,	0,	0,	4,	0,	0,	0,	0,	0,	3,	0,	0,	0,
        0,	1,	0,	0,	0,	0,	0,	0,	0,	4,	0,	0,	0,	0,	0,	3,	0,	0,	0,	0,	0,	2,	0,	0,
        0,	0,	4,	0,	0,	0,	0,	0,	0,	0,	3,	0,	2,	0,	0,	0,	0,	0,	0,	0,	0,	0,	1,	0,
        0,	2,	0,	0,	0,	3,	0,	0,	0,	0,	0,	0,	0,	4,	0,	0,	0,	0,	0,	1,	0,	0,	0,	0,
        0,	0,	1,	0,	0,	0,	2,	0,	0,	0,	0,	0,	0,	0,	3,	0,	4,	0,	0,	0,	0,	0,	0,	0,
        0,	0,	0,	4,	0,	0,	0,	1,	0,	0,	0,	0,	0,	0,	0,	2,	0,	3,	0,	0,	0,	0,	0,	0,
        3,	0,	0,	0,	4,	0,	0,	0,	0,	0,	0,	0,	1,	0,	0,	0,	0,	0,	2,	0,	0,	0,	0,	0,
        0,	0,	0,	0,	0,	0,	0,	4,	0,	0,	0,	3,	0,	0,	0,	0,	0,	0,	0,	2,	0,	1,	0,	0,
        0,	0,	0,	0,	3,	0,	0,	0,	2,	0,	0,	0,	0,	0,	0,	0,	1,	0,	0,	0,	0,	0,	4,	0,
        0,	0,	0,	0,	0,	2,	0,	0,	0,	1,	0,	0,	0,	0,	0,	0,	0,	4,	0,	0,	0,	0,	0,	3,
        0,	0,	0,	0,	0,	0,	1,	0,	0,	0,	4,	0,	0,	0,	0,	0,	0,	0,	3,	0,	2,	0,	0,	0,
        0,	0,	0,	1,	0,	0,	0,	0,	0,	2,	0,	0,	0,	3,	0,	0,	0,	0,	0,	0,	0,	4,	0,	0,
        4,	0,	0,	0,	0,	0,	0,	0,	0,	0,	1,	0,	0,	0,	2,	0,	0,	0,	0,	0,	0,	0,	3,	0,
        0,	3,	0,	0,	0,	0,	0,	0,	0,	0,	0,	4,	0,	0,	0,	1,	0,	0,	0,	0,	0,	0,	0,	2,
        0,	0,	2,	0,	0,	0,	0,	0,	3,	0,	0,	0,	4,	0,	0,	0,	0,	0,	0,	0,	1,	0,	0,	0,
        0,	0,	0,	2,	0,	1,	0,	0,	0,	0,	0,	0,	0,	0,	0,	4,	0,	0,	0,	3,	0,	0,	0,	0,
        1,	0,	0,	0,	0,	0,	4,	0,	0,	0,	0,	0,	3,	0,	0,	0,	2,	0,	0,	0,	0,	0,	0,	0,
        0,	4,	0,	0,	0,	0,	0,	3,	0,	0,	0,	0,	0,	2,	0,	0,	0,	1,	0,	0,	0,	0,	0,	0,
        0,	0,	3,	0,	2,	0,	0,	0,	0,	0,	0,	0,	0,	0,	1,	0,	0,	0,	4,	0,	0,	0,	0,	0,
    ];

    static ADJACENCY_MATRIX = [];

    static {
        for (let i = 0; i < OrientedDice.NUM_STATES; i++) {
            OrientedDice.ADJACENCY_MATRIX.push(
                OrientedDice.ADJACENCY_MATRIX_FLAT.slice(
                    i * OrientedDice.NUM_STATES,
                    (i + 1) * OrientedDice.NUM_STATES
                )
            );
        }
    }

    /**
     * サイコロのインスタンスを生成します。
     * @param {string[]} imageFaceFiles - 各面(0から5)の画像ファイル名の配列。例: ['0.png', '1.png', ..., '5.png']
     * @param {number} initialTopFace - 初期状態の上面の数字 (0-5)。デフォルトは0。
     * @param {number} initialRotation - 初期状態の上面の回転角度 (0, 90, 180, 270)。デフォルトは0。
     */
    constructor(imageFaceFiles, initialTopFace = 0, initialRotation = 0) {
        if (!Array.isArray(imageFaceFiles) || imageFaceFiles.length !== OrientedDice.NUM_FACES) {
            throw new Error(`imageFaceFiles must be an array of ${OrientedDice.NUM_FACES} strings.`);
        }
        this.imageFaceFiles = imageFaceFiles; // 例: ['face0.png', 'face1.png', ...]

        if (initialTopFace < 0 || initialTopFace >= OrientedDice.NUM_FACES ||
            ![0, 90, 180, 270].includes(initialRotation)) {
            throw new Error("Invalid initial state.");
        }
        this.topFace = initialTopFace;     // 0-5
        this.rotation = initialRotation; // 0, 90, 180, 270
    }

    /**
     * 現在の状態を ([上面の数字], [上面の回転角度]) の形式で取得します。
     * @returns {[number, number]} 現在の状態。
     */
    getState() {
        return [this.topFace, this.rotation];
    }
    
    /**
     * 現在の状態を文字列表現で取得します。
     * @returns {string} 例: "(0, 90)"
     */
    getStateString() {
        return `(${this.topFace}, ${this.rotation})`;
    }

    /**
     * 現在の上面の画像ファイルパスを取得します。
     * 画像は `img/` ディレクトリにあると仮定します。
     * @returns {string} 画像ファイルのパス。例: "img/face0.png"
     */
    getCurrentImageSrc() {
        // imgディレクトリの前提は一旦そのままにします
        return `img/${this.imageFaceFiles[this.topFace]}`;
    }

    /**
     * 現在の上面の画像のCSS回転角度を取得します。
     * @returns {number} 回転角度 (0, 90, 180, 270)。
     */
    getCurrentCssRotation() {
        return this.rotation;
    }

    /**
     * 内部状態インデックスを取得します (0-23)。
     * @param {number} face - 上面の数字 (0-5)。
     * @param {number} rotation - 回転角度 (0, 90, 180, 270)。
     * @returns {number} 状態インデックス。
     */
    _getStateIndex(face, rotation) {
        const rotationIndex = rotation / 90;
        return face * OrientedDice.NUM_ROTATIONS_PER_FACE + rotationIndex;
    }

    /**
     * 状態インデックスから ([上面の数字], [回転角度]) を取得します。
     * @param {number} index - 状態インデックス (0-23)。
     * @returns {[number, number]} [上面の数字, 回転角度]。
     */
    _getStateFromIndex(index) {
        const face = Math.floor(index / OrientedDice.NUM_ROTATIONS_PER_FACE);
        const rotationIndex = index % OrientedDice.NUM_ROTATIONS_PER_FACE;
        const rotation = rotationIndex * 90;
        return [face, rotation];
    }

    /**
     * サイコロを指定された方向に転がします。
     * @param {'NORTH' | 'EAST' | 'SOUTH' | 'WEST'} directionString - 転がす方向。
     */
    roll(directionString) {
        const directionKey = directionString.toUpperCase();
        const directionValue = OrientedDice.DIRECTIONS[directionKey];

        if (directionValue === undefined) {
            console.error("Invalid direction:", directionString);
            return false;
        }

        const currentIndex = this._getStateIndex(this.topFace, this.rotation);
        const transitions = OrientedDice.ADJACENCY_MATRIX[currentIndex];
        
        if (!transitions) {
             console.error(`No transitions defined for current state index ${currentIndex}`);
             return false;
        }

        let nextStateIndex = -1;
        for (let i = 0; i < transitions.length; i++) {
            if (transitions[i] === directionValue) {
                nextStateIndex = i;
                break;
            }
        }

        if (nextStateIndex !== -1) {
            [this.topFace, this.rotation] = this._getStateFromIndex(nextStateIndex);
            return true;
        } else {
            // これは隣接行列が正しく、全ての状態からの全ての有効な回転が定義されていれば起こらないはず
            console.error(
                `No transition found for state (${this.topFace}, ${this.rotation}) ` +
                `and direction ${directionString} (value ${directionValue})`
            );
            return false;
        }
    }
}

export default OrientedDice; // ESモジュールとしてエクスポート