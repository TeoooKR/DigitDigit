document.addEventListener('DOMContentLoaded', () => {
    let KEY_MAP = {
        'KeyQ': 0,
        'KeyW': 1,
        'KeyE': 2,
        'KeyR': 3,
        'Space': 4,
        'AltRight': 5,
        'KeyP': 6,
        'BracketLeft': 7,
        'BracketRight': 8,
        'Backslash': 9
    };

    function getKeyNameByIndex(idx) {
        return Object.keys(KEY_MAP).find(key => KEY_MAP[key] === idx);
    }

    let isRemapping = false;
    let remapIndex = -1;
    let remapElement = null;



    const settingsModal = document.getElementById('settings-modal');
    const descriptionModal = document.getElementById('description-modal');
    const closeSettings = document.getElementById('close-settings');
    const closeDescription = document.getElementById('close-description');

    const keyConfigGrid = document.getElementById('key-config-grid');
    const waitingKeyMsg = document.getElementById('waiting-key-msg');


    const keyBarContainer = document.getElementById('key-bar-container');


    const helpBtn = document.getElementById('help-btn');
    const settingsBtn = document.getElementById('settings-btn');

    settingsBtn.addEventListener('click', () => {
        openModal(settingsModal);
        renderKeyGrid();
    });
    helpBtn.addEventListener('click', () => openModal(descriptionModal));

    function openModal(modal) {
        modal.style.display = 'flex';
    }
    function closeModal(modal) {
        modal.style.display = 'none';
        if (modal === settingsModal) {
            cancelRemap();
        }
    }




    closeSettings.addEventListener('click', () => closeModal(settingsModal));
    closeDescription.addEventListener('click', () => closeModal(descriptionModal));

    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeModal(settingsModal);
        if (e.target === descriptionModal) closeModal(descriptionModal);
    });


    keyBarContainer.addEventListener('click', () => {
        openModal(settingsModal);
        renderKeyGrid();
    });

    function renderKeyBar() {
        keyBarContainer.innerHTML = '';
        for (let i = 0; i < 10; i++) {
            if (i === 5) {
                const sep = document.createElement('div');
                sep.className = 'key-separator';
                sep.textContent = '|';
                keyBarContainer.appendChild(sep);
            }
            const code = getKeyNameByIndex(i);
            const slot = document.createElement('div');
            slot.className = 'bottom-key-slot';
            slot.textContent = formatKeyName(code);

            keyBarContainer.appendChild(slot);
        }
    }



    function renderKeyGrid() {
        keyConfigGrid.innerHTML = '';
        for (let i = 0; i < 10; i++) {
            const code = getKeyNameByIndex(i);
            const slot = document.createElement('div');
            slot.className = 'key-slot';
            slot.innerHTML = `
                <span class="key-label">Bit ${i + 1}</span>
                <span class="key-value">${formatKeyName(code)}</span>
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

    const START_NUMBER = 1;

    const playerState = new Array(10).fill(0);
    const targetQueue = [
        START_NUMBER,
        START_NUMBER + 1,
        START_NUMBER + 2,
        START_NUMBER + 3,
        START_NUMBER + 4
    ];
    let nextNumber = START_NUMBER + 5;

    const playerDisplay = document.getElementById('player-binary');
    const playerDecimal = document.getElementById('player-decimal');
    const target1 = document.getElementById('target-1');
    const target2 = document.getElementById('target-2');
    const target3 = document.getElementById('target-3');
    const target4 = document.getElementById('target-4');
    const target5 = document.getElementById('target-5');

    function formatBinary(input) {
        if (input === undefined) return '';

        let bits = [];
        if (Array.isArray(input)) {
            bits = input;
        } else {
            const binString = input.toString(2).padStart(10, '0');
            bits = binString.split('').map(Number);
        }

        const left = bits.slice(0, 5).join(' ');
        const right = bits.slice(5).join(' ');
        return `${left} | ${right}`;
    }

    function render() {
        const currentTarget = targetQueue[0];
        if (currentTarget !== undefined) {
            playerDecimal.textContent = currentTarget - 1;
        } else {
            playerDecimal.textContent = 1023;
        }

        playerDisplay.textContent = formatBinary(playerState);
        target1.textContent = formatBinary(targetQueue[0]);
        target2.textContent = formatBinary(targetQueue[1]);
        target3.textContent = formatBinary(targetQueue[2]);
        target4.textContent = formatBinary(targetQueue[3]);
        target5.textContent = formatBinary(targetQueue[4]);
    }

    window.addEventListener('keydown', (e) => {
        if (isRemapping) {
            e.preventDefault();

            const newKey = e.code;
            const oldKey = getKeyNameByIndex(remapIndex);

            const conflictingIndex = KEY_MAP[newKey];

            KEY_MAP[newKey] = remapIndex;

            if (conflictingIndex !== undefined && conflictingIndex !== remapIndex) {
                if (oldKey) {
                    KEY_MAP[oldKey] = conflictingIndex;
                }
            } else {
                if (oldKey && oldKey !== newKey) {
                    delete KEY_MAP[oldKey];
                }
            }

            renderKeyGrid();
            renderKeyBar();
            cancelRemap();
            return;
        }

        if (e.key === 'Escape') {
            if (settingsModal.style.display === 'flex') closeModal(settingsModal);
            if (descriptionModal.style.display === 'flex') closeModal(descriptionModal);
            return;
        }

        if (settingsModal.style.display === 'flex' || descriptionModal.style.display === 'flex') {
            return;
        }

        if (KEY_MAP.hasOwnProperty(e.code)) {
            e.preventDefault();
            const index = KEY_MAP[e.code];
            if (playerState[index] !== 1) {
                playerState[index] = 1;
                render();
                checkMatch();
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        if (KEY_MAP.hasOwnProperty(e.code)) {
            e.preventDefault();
            const index = KEY_MAP[e.code];
            if (playerState[index] !== 0) {
                playerState[index] = 0;
                render();
                checkMatch();
            }
        }
    });

    function checkMatch() {
        const playerVal = parseInt(playerState.join(''), 2);

        if (targetQueue.length > 0 && playerVal === targetQueue[0]) {
            targetQueue.shift();
            if (nextNumber <= 1023) {
                targetQueue.push(nextNumber);
                nextNumber++;
            }
            render();
        }
    }

    render();
    renderKeyBar();
});
