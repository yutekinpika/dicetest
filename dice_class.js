// dice_class.js

const OPPOSITE_FACE_SUM = 7;
// (上面番号, 手前面番号) -> 右面番号 の対応表 (標準的なサイコロの物理的な面配置)
const STANDARD_RIGHT_FACE_TABLE = {
    "1-2": 3, "1-3": 5, "1-4": 2, "1-5": 4,
    "2-1": 4, "2-3": 1, "2-4": 6, "2-6": 3,
    "3-1": 2, "3-2": 6, "3-5": 1, "3-6": 5,
    "4-1": 5, "4-2": 1, "4-5": 6, "4-6": 2,
    "5-1": 3, "5-2": 4, "5-3": 6, "5-4": 1,
    "6-2": 4, "6-3": 2, "6-4": 5, "6-5": 3
};

// 向きの定義
const ORIENTATION_CODES = { // 数値コード -> 向きシンボルと相対位置
    0: { symbol: '↑', relativePos: 'back' },  // 奥
    1: { symbol: '→', relativePos: 'right' }, // 右
    2: { symbol: '↓', relativePos: 'front' }, // 手前
    3: { symbol: '←', relativePos: 'left' }   // 左
};
// 逆引きマップ (相対位置 -> 数値コード)
const RELATIVE_POS_TO_ORIENTATION_CODE = {};
Object.keys(ORIENTATION_CODES).forEach(code => {
    RELATIVE_POS_TO_ORIENTATION_CODE[ORIENTATION_CODES[code].relativePos] = parseInt(code);
});
// 以前のマップも残しておくか、必要なら ORIENTATION_CODES から導出
const RELATIVE_POS_TO_SYMBOL = {};
Object.values(ORIENTATION_CODES).forEach(obj => RELATIVE_POS_TO_SYMBOL[obj.relativePos] = obj.symbol);

class Dice {
    constructor(id, initialStateConfig, config) {
        this.id = id;
        this.config = config;

        this.traditionalStateGraph = {};
        this.intuitiveToTraditionalMap = {};
        this.traditionalToIntuitiveMap = {};
        
        this._generateTraditionalGraphAndMappings();

        // initialStateConfig から初期の traditionalKey と intuitiveKey を設定
        const { topFaceNumber, orientationCode } = initialStateConfig; // orientationSymbol -> orientationCode
        if (topFaceNumber === undefined || orientationCode === undefined) {
            throw new Error(`Dice [${this.id}]: initialStateConfig must contain 'topFaceNumber' and 'orientationCode'.`);
        }
        if (orientationCode < 0 || orientationCode > 3 || !ORIENTATION_CODES[orientationCode]) {
            throw new Error(`Dice [${this.id}]: initialStateConfig.orientationCode '${orientationCode}' is invalid. Must be 0 (Up), 1 (Right), 2 (Down), or 3 (Left).`);
        }
        if (!this.config.faceSymbols[topFaceNumber]) {
            throw new Error(`Dice [${this.id}]: initialStateConfig.topFaceNumber '${topFaceNumber}' does not have a symbol defined in faceSymbols.`);
        }

        const expectedOrientationSymbol = ORIENTATION_CODES[orientationCode].symbol; // コードから期待するシンボルを取得

        let foundInitialTraditionalKey = null;
        for (const traditionalKey in this.traditionalStateGraph) {
            const stateDetails = this.traditionalStateGraph[traditionalKey];
            const currentTopFaceNumber = stateDetails.faces.top;

            if (currentTopFaceNumber === topFaceNumber) {
                const intuitiveKeyForThisState = this.traditionalToIntuitiveMap[traditionalKey];
                if (intuitiveKeyForThisState) {
                    const actualSymbolOnTop = this.config.faceSymbols[currentTopFaceNumber];
                    // 直感的キーは "シンボル+向きシンボル" なので、向きシンボル部分を比較
                    const actualOrientationSymbolInKey = intuitiveKeyForThisState.slice(actualSymbolOnTop.length);
                    
                    if (actualOrientationSymbolInKey === expectedOrientationSymbol) {
                        foundInitialTraditionalKey = traditionalKey;
                        break;
                    }
                }
            }
        }

        if (!foundInitialTraditionalKey) {
            const availableStatesInfo = Object.entries(this.traditionalToIntuitiveMap)
                .map(([tradKey, intKey]) => {
                    const topNum = this.traditionalStateGraph[tradKey].faces.top;
                    return `TradKey: ${tradKey} (TopFaceNum: ${topNum}) -> IntuitiveKey: ${intKey}`;
                })
                .join('\n');
            throw new Error(`Dice [${this.id}]: Could not find a valid traditional state for initialStateConfig { topFaceNumber: ${topFaceNumber}, orientationCode: ${orientationCode} (resolves to symbol '${expectedOrientationSymbol}') }. No state matches these criteria. Check your charOrientationTargetFaceNumber settings.\nAvailable mappings:\n${availableStatesInfo}`);
        }

        this.currentTraditionalKey = foundInitialTraditionalKey;
        this.currentIntuitiveKey = this.traditionalToIntuitiveMap[foundInitialTraditionalKey];
        
        if (!this.currentIntuitiveKey) {
            throw new Error(`Dice [${this.id}]: Internal error - intuitive key not found for derived traditional key ${this.currentTraditionalKey}`);
        }

        this.displayElements = null;
    }

    _getOppositeFaceNumber(faceNumber) {
        return OPPOSITE_FACE_SUM - faceNumber;
    }
    
    _generateTraditionalGraphAndMappings() {
        // 1. 物理的な面番号に基づいた伝統的グラフを生成 (変更なし)
        Object.keys(STANDARD_RIGHT_FACE_TABLE).forEach(key => {
            const [topNum, frontNum] = key.split('-').map(Number);
            const rightNum = STANDARD_RIGHT_FACE_TABLE[key];
            
            const facesByNumber = {
                top: topNum,
                front: frontNum,
                right: rightNum,
                left: this._getOppositeFaceNumber(rightNum),
                back: this._getOppositeFaceNumber(frontNum),
                bottom: this._getOppositeFaceNumber(topNum)
            };

            this.traditionalStateGraph[key] = {
                faces: facesByNumber,
                transitions: {
                    forward: `${facesByNumber.front}-${facesByNumber.bottom}`,
                    backward: `${facesByNumber.back}-${facesByNumber.top}`,
                    right: `${facesByNumber.right}-${facesByNumber.front}`,
                    left: `${facesByNumber.left}-${facesByNumber.front}`
                }
            };
        });

        // 2. 伝統的キーと直感的キーのマッピングを生成 (charOrientationTargetFaceNumber を使用するように変更)
        Object.keys(this.traditionalStateGraph).forEach(traditionalKey => {
            const faceNumbers = this.traditionalStateGraph[traditionalKey].faces; // {top: 1, front: 2, ...}
            const topFaceNumber = faceNumbers.top; // 現在の上面の「番号」(1-6)
            const topFaceSymbol = this.config.faceSymbols[topFaceNumber]; // 上面の「シンボル」

            // 上面(の物理的な面番号)の文字の向きが、どの「物理的な面の番号」を指すかを取得
            const targetFaceNumberForOrientation = this.config.charOrientationTargetFaceNumber[topFaceNumber];
            
            if (targetFaceNumberForOrientation === undefined) {
                console.warn(`Dice [${this.id}]: Character orientation rule not defined for top face number '${topFaceNumber}'. Skipping intuitive mapping for this state.`);
                return; 
            }
            if (targetFaceNumberForOrientation === topFaceNumber || targetFaceNumberForOrientation === this._getOppositeFaceNumber(topFaceNumber)) {
                console.warn(`Dice [${this.id}]: charOrientationTargetFaceNumber for face ${topFaceNumber} cannot be itself or its opposite. Target was ${targetFaceNumberForOrientation}. Skipping intuitive mapping.`);
                return;
            }

            let charDirectionSymbol = null; // これは '↑', '→', '↓', '←' のまま
            let charOrientationCode = -1;   // 数値コードも決定する

            for (const relPos of ['back', 'right', 'front', 'left']) { 
                const faceNumberAtPos = faceNumbers[relPos];
                if (faceNumberAtPos === targetFaceNumberForOrientation) {
                    charDirectionSymbol = ORIENTATION_CODES[RELATIVE_POS_TO_ORIENTATION_CODE[relPos]].symbol;
                    // charOrientationCode = RELATIVE_POS_TO_ORIENTATION_CODE[relPos]; // この行は直感的キー生成には直接不要だが、デバッグや内部ロジックで使える
                    break;
                }
            }
            
            if (charDirectionSymbol) {
                const intuitiveKey = `${topFaceSymbol}${charDirectionSymbol}`;
                if (this.intuitiveToTraditionalMap[intuitiveKey] && this.intuitiveToTraditionalMap[intuitiveKey] !== traditionalKey) {
                     // 異なる伝統的状態から同じ直感的キーが生成された場合（通常、設定ミス）
                     console.warn(`Dice [${this.id}]: Duplicate intuitive key "${intuitiveKey}" generated. Traditional key ${traditionalKey} maps to it, but it was already mapped by ${this.intuitiveToTraditionalMap[intuitiveKey]}. Check charOrientationTargetFaceNumber and faceSymbols to ensure 24 unique intuitive states.`);
                }
                this.traditionalToIntuitiveMap[traditionalKey] = intuitiveKey;
                this.intuitiveToTraditionalMap[intuitiveKey] = traditionalKey;
            } else {
                // この状況は、targetFaceNumberForOrientation が上面でも底面でもない（つまり横の面である）にも関わらず、
                // 現在のサイコロの向きでその横の面が見つからない場合に起こりうる。
                // 通常は STANDARD_RIGHT_FACE_TABLE が正しく、ロジックが正しければ発生しづらい。
                // 主に charOrientationTargetFaceNumber の設定が、現在の上面に対してありえない向き先を指定した場合に問題となる。
                console.error(`Dice [${this.id}]: Could not determine character direction for traditional state ${traditionalKey}. Top face number: ${topFaceNumber} (Symbol: '${topFaceSymbol}'). Target face number for orientation: ${targetFaceNumberForOrientation}. This implies the target face is not one of the four side faces in the current orientation, which is problematic if the target is not top/bottom.`);
            }
        });

        if (Object.keys(this.traditionalToIntuitiveMap).length !== 24) {
            console.warn(`Dice [${this.id}]: Expected 24 traditional-to-intuitive mappings, but got ${Object.keys(this.traditionalToIntuitiveMap).length}. Some states might be unreachable or undefined intuitively. Check charOrientationTargetFaceNumber. Generated: ${Object.values(this.traditionalToIntuitiveMap).join(', ')}`);
        }
        if (Object.keys(this.intuitiveToTraditionalMap).length !== 24) {
             console.warn(`Dice [${this.id}]: Expected 24 intuitive-to-traditional mappings, but got ${Object.keys(this.intuitiveToTraditionalMap).length}. Some intuitive states might be invalid. Check charOrientationTargetFaceNumber. Generated: ${Object.keys(this.intuitiveToTraditionalMap).join(', ')}`);
        }
    }
    
    roll(directionKey) { // 'forward', 'backward', 'left', 'right'
        const currentTraditionalState = this.traditionalStateGraph[this.currentTraditionalKey];
        if (!currentTraditionalState) {
            console.error(`Dice [${this.id}]: Current traditional state '${this.currentTraditionalKey}' not found.`);
            return;
        }

        const nextTraditionalKey = currentTraditionalState.transitions[directionKey];
        const nextIntuitiveKey = this.traditionalToIntuitiveMap[nextTraditionalKey];

        if (this.traditionalStateGraph[nextTraditionalKey] && nextIntuitiveKey) {
            this.currentTraditionalKey = nextTraditionalKey;
            this.currentIntuitiveKey = nextIntuitiveKey;
        } else {
            console.error(`Dice [${this.id}]: Invalid transition from '${this.currentTraditionalKey}' via '${directionKey}'. Next traditional: '${nextTraditionalKey}', Next intuitive: '${nextIntuitiveKey}'`);
        }
        if (this.displayElements) this.updateDisplay();
    }

    getIntuitiveState() {
        return this.currentIntuitiveKey;
    }

    getCurrentFaceDetails() {
        const traditionalState = this.traditionalStateGraph[this.currentTraditionalKey];
        if (!traditionalState) {
            throw new Error(`Dice [${this.id}]: Current traditional state '${this.currentTraditionalKey}' not found.`);
        }
        
        const faceNumbers = traditionalState.faces; // {top: 1, front: 2, ...}
        const details = {};
        for (const faceName in faceNumbers) { // 'top', 'front', etc.
            const faceNum = faceNumbers[faceName];
            details[faceName] = {
                symbol: this.config.faceSymbols[faceNum],
                color: this.config.faceColors[faceNum] 
            };
        }
        return details;
    }

    linkDisplayElements(elements) {
        this.displayElements = elements;
        this.updateDisplay(); // 初期表示
    }

    updateDisplay() {
        if (!this.displayElements) return;

        const details = this.getCurrentFaceDetails();
        this.displayElements.intuitiveState.textContent = this.getIntuitiveState();
        
        const updateFaceElement = (el, faceDetail) => {
            if (!el) return;
            el.textContent = faceDetail.symbol;
            // 色の適用: 赤なら背景を薄赤、白なら背景を薄灰色など
            if (faceDetail.color.toLowerCase() === 'red') {
                el.style.backgroundColor = '#ffdddd';
                el.style.color = '#c00000';
            } else if (faceDetail.color.toLowerCase() === 'white') {
                el.style.backgroundColor = '#f0f0f0';
                el.style.color = '#333333';
            } else { // その他の色や未定義の場合
                el.style.backgroundColor = 'transparent';
                el.style.color = '#000000';
            }
        };

        updateFaceElement(this.displayElements.faceTop, details.top);
        updateFaceElement(this.displayElements.faceFront, details.front);
        updateFaceElement(this.displayElements.faceRight, details.right);
        updateFaceElement(this.displayElements.faceLeft, details.left);
        updateFaceElement(this.displayElements.faceBack, details.back);
        updateFaceElement(this.displayElements.faceBottom, details.bottom);
    }
}