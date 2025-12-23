document.addEventListener('DOMContentLoaded', () => {
    const MODES = {
        standard: { bitCount: 10, maxVal: 1023 },
        quarter: { bitCount: 8, maxVal: 255 },
        root: { bitCount: 5, maxVal: 31 },
        timed: { bitCount: 8, maxVal: Infinity },
        instant: { bitCount: 10, maxVal: Infinity }
    };

    let currentMode = 'standard';
    let currentConfigTab = 'standard';

    const DEFAULT_KEY_MAPS = {
        standard: {
            'KeyQ': 0, 'KeyW': 1, 'KeyE': 2, 'KeyR': 3, 'Space': 4,
            'AltRight': 5, 'KeyP': 6, 'BracketLeft': 7, 'BracketRight': 8, 'Backslash': 9
        },
        quarter: {
            'KeyW': 0, 'KeyE': 1, 'KeyR': 2, 'Space': 3,
            'AltRight': 4, 'KeyP': 5, 'BracketLeft': 6, 'BracketRight': 7
        },
        root: {
            'AltRight': 0, 'KeyP': 1, 'BracketLeft': 2, 'BracketRight': 3, 'Backslash': 4
        },
        timed: {
            'KeyW': 0, 'KeyE': 1, 'KeyR': 2, 'Space': 3,
            'AltRight': 4, 'KeyP': 5, 'BracketLeft': 6, 'BracketRight': 7
        }
    };

    let KEY_CONFIGS = JSON.parse(JSON.stringify(DEFAULT_KEY_MAPS));

    function getCurrentKeyMap() {
        if (currentMode === 'instant') return KEY_CONFIGS['standard'];
        return KEY_CONFIGS[currentMode];
    }

    function getConfigKeyMap(tabName) {
        return KEY_CONFIGS[tabName];
    }

    function getKeyNameByIndex(map, idx) {
        return Object.keys(map).find(key => map[key] === idx);
    }

    let isRemapping = false;
    let remapIndex = -1;
    let remapElement = null;

    const settingsModal = document.getElementById('settings-modal');
    const descriptionModal = document.getElementById('description-modal');
    const gamemodeModal = document.getElementById('gamemode-modal');
    const closeSettings = document.getElementById('close-settings');
    const closeDescription = document.getElementById('close-description');
    const closeGamemode = document.getElementById('close-gamemode');

    const resultScreen = document.getElementById('result-screen');
    const resultMode = document.getElementById('result-mode');
    const resultTitle = document.getElementById('result-title');
    const resultScore = document.getElementById('result-score');
    const resultIps = document.getElementById('result-ips');
    const resultSubtext = document.getElementById('result-subtext');
    const restartBtn = document.getElementById('restart-btn');
    const shareBtn = document.getElementById('share-btn');
    const gameContainer = document.getElementById('game-container');


    const keyConfigGrid = document.getElementById('key-config-grid');
    const waitingKeyMsg = document.getElementById('waiting-key-msg');

    const keyBarContainer = document.getElementById('key-bar-container');

    const helpBtn = document.getElementById('help-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const modeBtn = document.getElementById('mode-btn');

    function updateModeDisplay() {
        const modeName = currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
        modeBtn.innerHTML = `🎮 <span style="font-size: 0.8rem; vertical-align: middle; margin-left: 5px;">${modeName}</span>`;
    }

    const settingsTabBtns = document.querySelectorAll('.tab-btn');
    const modeCards = document.querySelectorAll('.mode-card');

    const playerDisplay = document.getElementById('player-binary');
    const playerDecimal = document.getElementById('player-decimal');
    const timerElement = document.getElementById('timer');

    const START_NUMBER = 1;
    let playerState = [];
    let targetQueue = [];
    let nextNumber = START_NUMBER + 5;

    let startTime = 0;
    let timerReqId = null;
    let isTimerRunning = false;
    let timedModeCount = 0;
    let TIMED_MODE_DURATION = 10000;



    settingsBtn.addEventListener('click', () => {
        openModal(settingsModal);
        currentConfigTab = (currentMode === 'instant') ? 'standard' : currentMode;
        updateSettingsTabs();
        renderKeyGrid();
    });
    helpBtn.addEventListener('click', () => openModal(descriptionModal));
    modeBtn.addEventListener('click', () => {
        modeCards.forEach(card => {
            if (card.dataset.mode === currentMode) card.classList.add('active');
            else card.classList.remove('active');
        });
        openModal(gamemodeModal);
    });

    modeCards.forEach(card => {
        card.addEventListener('click', () => {
            currentMode = card.dataset.mode;
            closeModal(gamemodeModal);
            initGame();
        });
    });

    settingsTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentConfigTab = btn.dataset.tab;
            updateSettingsTabs();
            renderKeyGrid();
        });
    });

    function updateSettingsTabs() {
        settingsTabBtns.forEach(btn => {
            if (btn.dataset.tab === currentConfigTab) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }

    function openModal(modal) {
        modal.style.display = 'flex';
    }
    function closeModal(modal) {
        modal.style.display = 'none';
        if (modal === settingsModal) {
            cancelRemap();
            renderKeyBar();
        }
    }

    closeSettings.addEventListener('click', () => closeModal(settingsModal));
    closeDescription.addEventListener('click', () => closeModal(descriptionModal));
    closeGamemode.addEventListener('click', () => closeModal(gamemodeModal));

    restartBtn.addEventListener('click', () => {
        initGame();
    });

    shareBtn.addEventListener('click', () => {
        let text = "";
        const modeName = currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
        const score = resultScore.textContent;
        const ips = resultIps.textContent;

        if (currentMode === 'timed') {
            text = `[DigitDigit] I scored ${score} in ${modeName} mode! (${ips}) ⚡\nCan you beat my speed?`;
        } else {
            text = `[DigitDigit] Cleared ${modeName} mode in ${score}! (${ips}) 🎯\nThink you can do better?`;
        }
        text += `\nhttps://teoookr.github.io/DigitDigit`;

        navigator.clipboard.writeText(text).then(() => {
            const originalText = shareBtn.textContent;
            shareBtn.textContent = 'Copied!';
            setTimeout(() => shareBtn.textContent = originalText, 2000);
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeModal(settingsModal);
        if (e.target === descriptionModal) closeModal(descriptionModal);
        if (e.target === gamemodeModal) closeModal(gamemodeModal);
    });

    keyBarContainer.addEventListener('click', () => {
        openModal(settingsModal);
        currentConfigTab = (currentMode === 'instant') ? 'standard' : currentMode;
        updateSettingsTabs();
        renderKeyGrid();
    });

    function renderKeyBar() {
        const map = getCurrentKeyMap();
        const bitCount = MODES[currentMode].bitCount;

        const fragment = document.createDocumentFragment();

        for (let i = 0; i < bitCount; i++) {
            let splitIndex = -1;
            if (bitCount === 10) splitIndex = 5;
            if (bitCount === 8) splitIndex = 4;

            if (i === splitIndex) {
                const sep = document.createElement('div');
                sep.className = 'key-separator';
                sep.textContent = '|';
                fragment.appendChild(sep);
            }
            const code = getKeyNameByIndex(map, i);
            const slot = document.createElement('div');
            slot.className = 'bottom-key-slot';
            slot.textContent = formatKeyName(code);

            fragment.appendChild(slot);
        }

        keyBarContainer.innerHTML = '';
        keyBarContainer.appendChild(fragment);
    }

    function renderKeyGrid() {
        keyConfigGrid.innerHTML = '';
        const map = getConfigKeyMap(currentConfigTab);
        let bitCount = 10;
        if (currentConfigTab === 'quarter') bitCount = 8;
        if (currentConfigTab === 'root') bitCount = 5;
        if (currentConfigTab === 'timed') bitCount = 8;

        for (let i = 0; i < bitCount; i++) {
            const code = getKeyNameByIndex(map, i);
            const slot = document.createElement('div');
            slot.className = 'key-slot';
            slot.innerHTML = `
                <span class=\"key-label\">Bit ${i + 1}</span>
                <span class=\"key-value\">${formatKeyName(code)}</span>
            `;
            slot.addEventListener('click', () => startRemap(i, slot));
            keyConfigGrid.appendChild(slot);
        }
    }

    function formatKeyName(code) {
        if (!code) return 'UNBOUND';
        if (code.startsWith('Key')) return code.slice(3);
        if (code === 'Space') return 'SPACE';
        if (code === 'AltRight') return 'R-ALT';
        if (code === 'BracketLeft') return '[';
        if (code === 'BracketRight') return ']';
        if (code === 'Backslash') return '\\';
        return code;
    }

    function startRemap(index, element) {
        if (isRemapping && remapIndex === index) {
            cancelRemap();
            return;
        }

        const prev = document.querySelector('.key-slot.active');
        if (prev) prev.classList.remove('active');

        isRemapping = true;
        remapIndex = index;
        remapElement = element;
        element.classList.add('active');
        waitingKeyMsg.style.display = 'block';
        waitingKeyMsg.textContent = `Press key for Bit ${index + 1}...`;
    }

    function cancelRemap() {
        isRemapping = false;
        remapIndex = -1;
        if (remapElement) remapElement.classList.remove('active');
        remapElement = null;
        waitingKeyMsg.style.display = 'none';
        renderKeyBar();
    }

    function formatBinary(input) {
        if (input === undefined) return '';
        let bits = [];
        const modeInfo = MODES[currentMode];
        const bitCount = modeInfo.bitCount;

        if (Array.isArray(input)) {
            bits = input;
        } else {
            const binString = input.toString(2).padStart(bitCount, '0');
            bits = binString.split('').map(Number);
        }

        if (bitCount === 10) {
            const left = bits.slice(0, 5).join(' ');
            const right = bits.slice(5).join(' ');
            return `${left} | ${right}`;
        } else if (bitCount === 8) {
            const left = bits.slice(0, 4).join(' ');
            const right = bits.slice(4).join(' ');
            return `${left} | ${right}`;
        } else {
            return bits.join(' ');
        }
    }

    function render() {
        if (currentMode === 'instant') {
            const playerVal = parseInt(playerState.join(''), 2);
            playerDecimal.textContent = playerVal;
        } else if (currentMode === 'timed') {
            playerDecimal.textContent = timedModeCount;
        } else {
            const currentTarget = targetQueue[0];
            if (currentTarget !== undefined) {
                playerDecimal.textContent = currentTarget - 1;
            } else if (targetQueue.length === 0 && nextNumber > MODES[currentMode].maxVal) {
                playerDecimal.textContent = MODES[currentMode].maxVal;
            }
        }

        playerDisplay.textContent = formatBinary(playerState);
    }

    window.addEventListener('keydown', (e) => {
        if (isRemapping) {
            e.preventDefault();
            const newKey = e.code;
            const map = getConfigKeyMap(currentConfigTab);
            const oldKey = getKeyNameByIndex(map, remapIndex);

            const conflictingIndex = map[newKey];

            map[newKey] = remapIndex;

            if (conflictingIndex !== undefined && conflictingIndex !== remapIndex) {
                if (oldKey) {
                    map[oldKey] = conflictingIndex;
                }
            } else {
                if (oldKey && oldKey !== newKey) {
                    delete map[oldKey];
                }
            }

            renderKeyGrid();

            if (currentConfigTab === currentMode || (currentConfigTab === 'standard' && currentMode === 'instant')) {
                renderKeyBar();
            }

            cancelRemap();
            return;
        }

        if (e.key === 'Escape') {
            if (settingsModal.style.display === 'flex') closeModal(settingsModal);
            else if (descriptionModal.style.display === 'flex') closeModal(descriptionModal);
            else if (gamemodeModal.style.display === 'flex') closeModal(gamemodeModal);
            return;
        }

        if (settingsModal.style.display === 'flex' || descriptionModal.style.display === 'flex' || gamemodeModal.style.display === 'flex') {
            return;
        }

        const map = getCurrentKeyMap();
        if (map.hasOwnProperty(e.code)) {
            e.preventDefault();
            const index = map[e.code];
            if (index < MODES[currentMode].bitCount && playerState[index] !== 1) {
                playerState[index] = 1;
                render();
                checkMatch();
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        const map = getCurrentKeyMap();
        if (map.hasOwnProperty(e.code)) {
            e.preventDefault();
            const index = map[e.code];
            if (index < MODES[currentMode].bitCount && playerState[index] !== 0) {
                playerState[index] = 0;
                render();
                checkMatch();
            }
        }
    });

    function startTimer() {
        if (isTimerRunning) return;
        isTimerRunning = true;
        startTime = Date.now();
        updateTimer();
    }

    function updateTimer() {
        if (!isTimerRunning) return;
        const now = Date.now();
        let elapsed = now - startTime;

        if (currentMode === 'timed') {
            let remaining = Math.max(0, TIMED_MODE_DURATION - elapsed);
            timerElement.textContent = (remaining / 1000).toFixed(3) + 's';
            if (elapsed >= TIMED_MODE_DURATION) {
                stopTimer();
                showResult(true, timedModeCount);
                return;
            }
        } else {
            timerElement.textContent = (elapsed / 1000).toFixed(3) + 's';
        }

        timerReqId = requestAnimationFrame(updateTimer);
    }

    function stopTimer() {
        if (!isTimerRunning) return;
        isTimerRunning = false;
        cancelAnimationFrame(timerReqId);
        if (currentMode === 'timed') {
            timerElement.textContent = '0.000s';
        } else {
            const elapsed = (Date.now() - startTime) / 1000;
            timerElement.textContent = elapsed.toFixed(3) + 's';
        }
    }

    function checkMatch() {
        if (currentMode === 'instant') return;

        const playerVal = parseInt(playerState.join(''), 2);

        if (targetQueue.length > 0 && playerVal === targetQueue[0]) {

            if (!isTimerRunning) {
                if (targetQueue[0] === START_NUMBER) {
                    startTimer();
                }
            }

            if (currentMode === 'timed') {
                timedModeCount++;
                targetQueue.shift();
                targetQueue.push(nextNumber++);
            } else {
                targetQueue.shift();
                const max = MODES[currentMode].maxVal;
                if (nextNumber <= max) {
                    targetQueue.push(nextNumber);
                    nextNumber++;
                }

                if (targetQueue.length === 0) {
                    stopTimer();
                    const finalTime = timerElement.textContent;
                    showResult(false, finalTime);
                }
            }

            render();
        }
    }

    function showResult(isTimedMode, scoreOrTime) {
        resultMode.textContent = currentMode.toUpperCase();
        let ips = 0;
        if (isTimedMode) {
            resultTitle.textContent = "TIME'S UP!";
            resultTitle.style.color = "#FF7043";
            resultScore.textContent = scoreOrTime;
            resultSubtext.textContent = "Binary numbers counted";
            ips = scoreOrTime / (TIMED_MODE_DURATION / 1000);
        } else {
            resultTitle.textContent = "CLEARED!";
            resultTitle.style.color = "#4DB6AC";
            resultScore.textContent = scoreOrTime;
            resultSubtext.textContent = "Completion Time";
            const timeVal = parseFloat(scoreOrTime);
            ips = MODES[currentMode].maxVal / timeVal;
        }
        resultIps.textContent = `${ips.toFixed(2)}/s`;

        gameContainer.classList.add('fade-out');

        setTimeout(() => {
            gameContainer.style.display = 'none';
            gameContainer.classList.remove('fade-out');
            resultScreen.style.display = 'flex';
        }, 500);
    }

    function initGame() {
        stopTimer();
        timerElement.textContent = "0.000s";
        timedModeCount = 0;

        resultScreen.style.display = 'none';
        gameContainer.style.display = 'flex';
        void gameContainer.offsetWidth;

        const modeInfo = MODES[currentMode];
        playerState = new Array(modeInfo.bitCount).fill(0);

        targetQueue = [];
        nextNumber = START_NUMBER;

        if (currentMode === 'instant') {
            playerDecimal.textContent = '0';
            timerElement.style.display = 'none';
        } else {
            timerElement.style.display = 'block';

            if (currentMode === 'timed') {
                targetQueue = [1, 2, 3, 4, 5];
                nextNumber = 6;
                playerDecimal.textContent = '0';
                timerElement.textContent = "10.000s";
            } else {
                let safeMax = modeInfo.maxVal;
                targetQueue = [];
                for (let i = 0; i < 5; i++) {
                    if (START_NUMBER + i <= safeMax) {
                        targetQueue.push(START_NUMBER + i);
                    }
                }
                nextNumber = START_NUMBER + 5;
                playerDecimal.textContent = '0';
            }
        }

        render();
        renderKeyBar();
        updateModeDisplay();
    }

    initGame();
});
