// Chewatabingo Game Logic (Version with 3 Screens: Landing, Selection, Game)

// Screen IDs for easy switching
const LANDING_SCREEN = 'landing-screen';
const SELECTION_SCREEN = 'selection-screen';
const GAME_SCREEN = 'game-screen';

// Timer Constants
const SELECTION_TIME = 45; // 45s Selection/Waiting time
const GAME_SIMULATION_TIME = 30; // 30s Game simulation time (for current project phase)

// Game state
let masterNumbers = [];
let calledNumbers = [];
let playerCard = [];
let markedCells = new Set();
let autoCallInterval = null;
let selectionTimerInterval = null;
let gameTimerInterval = null;

let currentStake = 10; // Default stake
let selectedCardId = null;
let isCardConfirmed = false; // Player has confirmed a card
let hasPlayerCard = false; // Does the player have a card for the current game (Confirmed or not)

// Initialize Telegram WebApp
let tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
}

// =========================================================================
//                             SCREEN FLOW LOGIC
// =========================================================================

// Function to switch between the three main screens
function switchScreen(targetId) {
    const screens = [LANDING_SCREEN, SELECTION_SCREEN, GAME_SCREEN];
    screens.forEach(id => {
        const screen = document.getElementById(id);
        if (screen) {
            screen.style.display = (id === targetId) ? 'flex' : 'none';
        }
    });
    // Stop timers not relevant to the new screen
    if (targetId !== SELECTION_SCREEN) clearInterval(selectionTimerInterval);
    if (targetId !== GAME_SCREEN) stopAutoCall();
}

// 1. Landing Screen Handlers
function handleStakeSelection(event) {
    // ... (Stake selection logic - same as before) ...
    document.querySelectorAll('.stake-btn').forEach(btn => {
        btn.classList.remove('active-stake');
    });

    event.target.classList.add('active-stake');
    currentStake = parseInt(event.target.dataset.stake);
    
    const playBtn = document.getElementById('start-selection-btn');
    playBtn.textContent = `▷ Play ${currentStake} ETB`;
}

function startSelectionPhase() {
    // 1. Reset state
    stopAutoCall();
    selectedCardId = null;
    isCardConfirmed = false;
    hasPlayerCard = false;
    
    // 2. Update Selection Header with current stake
    document.getElementById('current-stake').textContent = currentStake;
    
    // 3. Switch to Selection Screen
    switchScreen(SELECTION_SCREEN);
    
    // 4. Initialize the card selection grid (resets card-select-cell state)
    initializeSelectionGrid();
    
    // 5. Start the 45-second timer
    startSelectionTimer();
}

// 2. Selection Screen Handlers
function initializeSelectionGrid() {
    const grid = document.getElementById('card-selection-grid');
    const confirmBtn = document.getElementById('confirm-card-btn');
    const statusEl = document.getElementById('confirmation-status');

    // Reset UI elements
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'ካርዱን አረጋግጥ';
    statusEl.textContent = 'ካርድ ይምረጡና አረጋግጡ';
    
    grid.innerHTML = '';
    
    // Create 100 cells for card selection (e.g., card IDs 1 to 100)
    for (let i = 1; i <= 100; i++) {
        const cell = document.createElement('div');
        cell.className = 'card-select-cell';
        cell.textContent = i;
        cell.dataset.cardId = i;
        
        // Temporary: Randomly mark some as 'taken' for visual (ensure selected card logic overrides this if confirmed)
        if (Math.random() < 0.2) {
             cell.classList.add('taken');
        } else {
             // Use a function wrapper to ensure correct scope for the click listener
             cell.addEventListener('click', function() { selectCard(cell); });
        }
        
        grid.appendChild(cell);
    }
}

function selectCard(cell) {
    const cardId = cell.dataset.cardId;
    const confirmBtn = document.getElementById('confirm-card-btn');
    const statusEl = document.getElementById('confirmation-status');

    if (cell.classList.contains('taken') || isCardConfirmed) {
        return; // Cannot select taken card or if already confirmed
    }
    
    // Deselect previously selected card
    if (selectedCardId) {
        const prevSelected = document.querySelector(`.card-select-cell[data-card-id="${selectedCardId}"]`);
        prevSelected?.classList.remove('selected');
    }

    // Select the new card
    cell.classList.add('selected');
    selectedCardId = cardId;
    
    // Enable Confirm Button
    confirmBtn.disabled = false;
    statusEl.textContent = `Card ${cardId} ተመርጧል። ለማረጋገጥ ይጫኑ።`;
}

function handleCardConfirmation() {
    if (!selectedCardId || isCardConfirmed) return;
    
    const confirmBtn = document.getElementById('confirm-card-btn');
    const statusEl = document.getElementById('confirmation-status');
    
    isCardConfirmed = true;
    hasPlayerCard = true; 
    
    // 1. UI Feedback: ቆጣሪው ከ confirmation ነጻ ሆኖ ይቀጥላል
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'ካርድዎ ተረጋግጧል።';
    statusEl.textContent = `ካርድ ${selectedCardId} ተረጋግጧል። ጨዋታው እስኪጀመር ይጠብቁ።`;

    // 2. Lock the grid (prevent further changes by removing listeners)
    document.querySelectorAll('.card-select-cell').forEach(cell => {
        // We need to use cloneNode to safely remove listeners without knowing the function reference
        const newCell = cell.cloneNode(true);
        cell.parentNode.replaceChild(newCell, cell);
    });
    // Re-select the confirmed cell (as cloneNode removes the selected class)
    const confirmedCell = document.querySelector(`.card-select-cell[data-card-id="${selectedCardId}"]`);
    if(confirmedCell) confirmedCell.classList.add('selected');
}

// === TIMER LOGIC: 45s Timer (Independent of Confirmation) ===
function startSelectionTimer() {
    let timeLeft = SELECTION_TIME;
    const timeDisplay = document.getElementById('time-left');

    if (selectionTimerInterval) clearInterval(selectionTimerInterval);
    
    timeDisplay.textContent = `${timeLeft}s`;

    selectionTimerInterval = setInterval(() => {
        timeLeft--;
        timeDisplay.textContent = `${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(selectionTimerInterval);
            timeDisplay.textContent = 'GO!';
            
            // Time is up, start the game regardless of confirmation status
            startGame(selectedCardId); 
        }
    }, 1000);
}


// 3. Game Start
function startGame(cardId) {
    // If a card was selected but not confirmed, or nothing selected, it's Watch Only
    if (!isCardConfirmed || !cardId) {
        hasPlayerCard = false; 
        console.log("Starting game without a card (Watch Only Mode)");
    } else {
        hasPlayerCard = true; 
        console.log(`Starting game with Stake: ${currentStake} and Card ID: ${cardId}`);
    }
    
    // 1. Switch to Game Screen
    switchScreen(GAME_SCREEN);
    
    // 2. Initialize Game Assets
    initializeMasterGrid();
    generatePlayerCard(cardId); // Handles Watch Only visibility based on hasPlayerCard
    
    // 3. Start the game flow and the simulation timer (30s)
    startAutoCall(); 
    startGameSimulationTimer();
}

// === NEW: Game Simulation Timer (30s) ===
function startGameSimulationTimer() {
    let timeLeft = GAME_SIMULATION_TIME;
    
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    
    gameTimerInterval = setInterval(() => {
        timeLeft--;
        console.log(`Game Simulation Time Left: ${timeLeft}s`);

        if (timeLeft <= 0) {
            clearInterval(gameTimerInterval);
            gameTimerInterval = null;

            // 1. Announce End
            stopAutoCall();
            document.getElementById('current-call').textContent = 'WINNER!';
            
            // 2. Wait 3 seconds, then go back to selection
            setTimeout(() => {
                endGame();
            }, 3000);
        }
    }, 1000);
}

// === NEW: End Game Function ===
function endGame() {
    // Stop all timers
    stopAutoCall();
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    if (selectionTimerInterval) clearInterval(selectionTimerInterval);

    // Go back to selection screen to start the next round
    startSelectionPhase();
}

// =========================================================================
//                             ORIGINAL BINGO LOGIC
// =========================================================================

// Auto-call system (calls a number every 3 seconds)
function startAutoCall() {
    if (autoCallInterval) {
        clearInterval(autoCallInterval);
    }
    // Only start if we are on the game screen
    if (document.getElementById(GAME_SCREEN).style.display === 'flex') {
        autoCallInterval = setInterval(function() {
            callNumber();
        }, 3000);
    }
}

// Stop auto-call
function stopAutoCall() {
    if (autoCallInterval) {
        clearInterval(autoCallInterval);
        autoCallInterval = null;
    }
}

// Create the master grid (1-75)
function initializeMasterGrid() {
    // ... (Master Grid generation logic - same as before) ...
    const masterGrid = document.getElementById('master-grid');
    masterGrid.innerHTML = '';
    masterNumbers = [];
    calledNumbers = []; // Reset called numbers
    
    for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 5; col++) {
            const number = (col * 15) + row + 1;
            const cell = document.createElement('div');
            cell.className = 'master-cell';
            cell.textContent = number;
            cell.dataset.number = number;
            masterGrid.appendChild(cell);
            masterNumbers.push(number);
        }
    }
    document.getElementById('current-call').textContent = 'Call';
    updateCallHistory();
}

// Generate a random bingo card (5x5 with free space in center) or show Watch Only
function generatePlayerCard(cardId = null) {
    const playerCardEl = document.getElementById('player-bingo-card');
    const watchPlacard = document.getElementById('watch-only-placard');
    
    if (!hasPlayerCard) {
        // Watch Only Mode
        playerCardEl.innerHTML = '';
        watchPlacard.style.display = 'flex';
        return;
    }

    // Normal game mode
    watchPlacard.style.display = 'none';
    playerCardEl.innerHTML = '';
    playerCard = [];
    markedCells.clear();
    
    // ... (Card generation logic - same as before) ...
    const headers = ['B', 'I', 'N', 'G', 'O'];
    headers.forEach(letter => {
        const header = document.createElement('div');
        header.className = 'header';
        header.textContent = letter;
        playerCardEl.appendChild(header);
    });
    
    const columns = [
        generateColumn(1, 15), generateColumn(16, 30), generateColumn(31, 45),
        generateColumn(46, 60), generateColumn(61, 75)
    ];
    
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            if (row === 2 && col === 2) {
                cell.textContent = 'FREE';
                cell.classList.add('free-space', 'marked');
                cell.dataset.number = 'free';
                markedCells.add('free');
            } else {
                const number = columns[col][row];
                cell.textContent = number;
                cell.dataset.number = number;
                playerCard.push(number);
                
                cell.addEventListener('click', function() {
                    toggleCell(cell);
                });
            }
            
            playerCardEl.appendChild(cell);
        }
    }
}

// Generate random numbers for a column
function generateColumn(min, max) {
    // ... (Column generation logic - same as before) ...
    const numbers = [];
    const available = [];
    
    for (let i = min; i <= max; i++) {
        available.push(i);
    }
    
    for (let i = 0; i < 5; i++) {
        const randomIndex = Math.floor(Math.random() * available.length);
        numbers.push(available[randomIndex]);
        available.splice(randomIndex, 1);
    }
    
    return numbers;
}

// Toggle cell marking
function toggleCell(cell) {
    const number = cell.dataset.number;
    
    if (number === 'free') return;
    
    // Only allow marking if the number has been officially called
    if (!calledNumbers.includes(parseInt(number))) {
        console.log(`Number ${number} has not been called yet!`);
        return; 
    }
    
    if (cell.classList.contains('marked')) {
        cell.classList.remove('marked');
        markedCells.delete(number);
    } else {
        cell.classList.add('marked');
        markedCells.add(number);
        checkForBingo(); // Check for Bingo immediately after marking
    }
}

// Call a random number from the master grid
function callNumber() {
    const uncalledNumbers = masterNumbers.filter(num => !calledNumbers.includes(num));
    
    if (uncalledNumbers.length === 0) {
        stopAutoCall();
        document.getElementById('current-call').textContent = 'End';
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * uncalledNumbers.length);
    const calledNumber = uncalledNumbers[randomIndex];
    
    calledNumbers.push(calledNumber);
    
    // Update the Call button to show the latest number
    document.getElementById('current-call').textContent = calledNumber;
    
    // Update call history (show last 3 calls)
    updateCallHistory();
    
    // Mark the number in the master grid
    document.querySelectorAll('.master-cell').forEach(cell => {
        if (parseInt(cell.dataset.number) === calledNumber) {
            cell.classList.add('called');
        }
    });

    // NOTE: We do NOT auto-mark the player card here. Player must click (toggleCell) to mark.
}

// Update call history display
function updateCallHistory() {
    // ... (Update call history logic - same as before) ...
    const historyItems = document.querySelectorAll('.history-item');
    const lastThree = calledNumbers.slice(-3).reverse(); 
    
    historyItems.forEach((item, index) => {
        if (lastThree[index]) {
            item.textContent = lastThree[index];
        } else {
            item.textContent = '-';
        }
    });
}

// Check if player has bingo (Simplified and corrected for 5x5 cell structure)
function checkForBingo() {
    const grid = Array(5).fill().map(() => Array(5).fill(false));
    
    // Select only the 25 cell elements (skipping the 5 header elements)
    const playerCells = document.querySelectorAll('#player-bingo-card .cell');
    
    playerCells.forEach((cell, index) => {
        const row = Math.floor(index / 5);
        const col = index % 5;
        
        if (cell.classList.contains('marked')) {
            grid[row][col] = true;
        }
    });

    // Check rows
    for (let row = 0; row < 5; row++) {
        if (grid[row].every(cell => cell)) {
            console.log('BINGO! Row Win!');
            return true;
        }
    }
    
    // Check columns
    for (let col = 0; col < 5; col++) {
        if (grid.every(row => row[col])) {
            console.log('BINGO! Column Win!');
            return true;
        }
    }
    
    // Check diagonals
    if (grid[0][0] && grid[1][1] && grid[2][2] && grid[3][3] && grid[4][4]) {
        console.log('BINGO! Diagonal Win (Left-Top)!');
        return true;
    }
    if (grid[0][4] && grid[1][3] && grid[2][2] && grid[3][1] && grid[4][0]) {
        console.log('BINGO! Diagonal Win (Right-Top)!');
        return true;
    }
    
    return false;
}


// Set up event listeners for all screens
function setupEventListeners() {
    
    // LANDING SCREEN LISTENERS
    document.querySelectorAll('.stake-btn').forEach(button => {
        button.addEventListener('click', handleStakeSelection);
    });

    document.getElementById('start-selection-btn')?.addEventListener('click', startSelectionPhase);

    // SELECTION SCREEN LISTENERS
    document.getElementById('confirm-card-btn')?.addEventListener('click', handleCardConfirmation);

    // GAME SCREEN LISTENERS
    // "አዲስ ካርድ" button & "Refresh" button -> Ends the current game and goes back to selection
    document.querySelector('.top-round-btn')?.addEventListener('click', endGame);
    document.getElementById('refresh-btn')?.addEventListener('click', endGame);
    
    // "BINGO" button - Check for bingo
    document.getElementById('bingo-btn')?.addEventListener('click', function() {
        if (checkForBingo()) {
            console.log('BINGO! Congratulations! (Implement custom modal)');
            document.getElementById('bingo-btn').textContent = '🎉 BINGO! 🎉';
            stopAutoCall();
        } else {
            console.log('Not yet! Keep playing!');
            const bingoBtn = document.getElementById('bingo-btn');
            bingoBtn.textContent = 'Not Yet...';
            setTimeout(() => bingoBtn.textContent = 'BINGO', 1000);
        }
    });
}

// Initialize the screen flow when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // START: Show Landing Screen first
    switchScreen(LANDING_SCREEN); 
    setupEventListeners();
    
    // Ensure initial stake is set on the play button text
    document.getElementById('start-selection-btn').textContent = `▷ Play ${currentStake} ETB`;
});
