// Chewatabingo Game Logic (Version with 3 Screens: Landing, Selection, Game)

// Screen IDs for easy switching
const LANDING_SCREEN = 'landing-screen';
const SELECTION_SCREEN = 'selection-screen';
const GAME_SCREEN = 'game-screen';

// Game state
let masterNumbers = [];
let calledNumbers = [];
let playerCard = [];
let markedCells = new Set();
let autoCallInterval = null;
let currentStake = 10; // Default stake
let selectedCardId = null;

// Initialize Telegram WebApp
let tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
}

// =========================================================================
//                             SCREEN FLOW LOGIC
// =========================================================================

// Function to switch between the three main screens
function switchScreen(targetId) {
    const screens = [LANDING_SCREEN, SELECTION_SCREEN, GAME_SCREEN];
    screens.forEach(id => {
        const screen = document.getElementById(id);
        if (screen) {
            // Use 'flex' for the screen that needs to be visible
            screen.style.display = (id === targetId) ? 'flex' : 'none';
        }
    });
}

// 1. Landing Screen Handlers
function handleStakeSelection(event) {
    // Remove active class from all buttons
    document.querySelectorAll('.stake-btn').forEach(btn => {
        btn.classList.remove('active-stake');
    });

    // Add active class to the clicked button
    event.target.classList.add('active-stake');
    
    // Update the current stake value
    currentStake = parseInt(event.target.dataset.stake);
    
    // Update the Play button text
    const playBtn = document.getElementById('start-selection-btn');
    playBtn.textContent = `▷ Play ${currentStake} ETB`;
}

function startSelectionPhase() {
    // 1. Stop any potential auto-call interval if game was somehow running
    stopAutoCall();
    
    // 2. Update Selection Header with current stake
    document.getElementById('current-stake').textContent = currentStake;
    
    // 3. Switch to Selection Screen
    switchScreen(SELECTION_SCREEN);
    
    // 4. Initialize the card selection grid (10x10)
    initializeSelectionGrid();
}

// 2. Selection Screen Handlers
function initializeSelectionGrid() {
    const grid = document.getElementById('card-selection-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    // Create 100 cells for card selection (e.g., card IDs 1 to 100)
    for (let i = 1; i <= 100; i++) {
        const cell = document.createElement('div');
        cell.className = 'card-select-cell';
        cell.textContent = i;
        cell.dataset.cardId = i;
        
        // Temporary: Randomly mark some as 'taken' for visual
        if (Math.random() < 0.2) {
             cell.classList.add('taken');
        } else {
            cell.addEventListener('click', () => selectCard(cell));
        }
        
        grid.appendChild(cell);
    }
}

function selectCard(cell) {
    const cardId = cell.dataset.cardId;

    if (cell.classList.contains('taken')) {
        return; // Cannot select taken card
    }
    
    // Deselect previously selected card
    if (selectedCardId) {
        const prevSelected = document.querySelector(`.card-select-cell[data-card-id="${selectedCardId}"]`);
        prevSelected?.classList.remove('selected');
    }

    // Select the new card
    cell.classList.add('selected');
    selectedCardId = cardId;
    
    // For now, immediately start the game upon selection (Future: Add a "Confirm" button)
    // We will simulate the start of the game after a slight delay for visual confirmation
    setTimeout(() => {
        startGame(cardId);
    }, 500);
}

// 3. Game Start
function startGame(cardId) {
    console.log(`Starting game with Stake: ${currentStake} and Card ID: ${cardId}`);
    
    // 1. Switch to Game Screen
    switchScreen(GAME_SCREEN);
    
    // 2. Initialize Game Assets
    // We use the existing functions, now ensuring they run AFTER selection
    initializeMasterGrid();
    // Note: For now, generatePlayerCard still creates a random card, ignoring the passed cardId.
    // In a final multiplayer game, generatePlayerCard would use the server-determined card based on cardId.
    generatePlayerCard(); 
    
    // 3. Start the game flow
    startAutoCall();
}


// =========================================================================
//                             ORIGINAL BINGO LOGIC
// =========================================================================

// Auto-call system - calls a number every 3 seconds
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

// Create the master grid (1-75) - arranged by BINGO columns
function initializeMasterGrid() {
    const masterGrid = document.getElementById('master-grid');
    masterGrid.innerHTML = '';
    masterNumbers = [];
    calledNumbers = []; // Reset called numbers
    
    // B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
    // Grid is 5 columns x 15 rows, fill by row but with BINGO order
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
    // Reset call button and history when grid is initialized
    document.getElementById('current-call').textContent = 'Call';
    updateCallHistory();
}

// Generate a random bingo card (5x5 with free space in center)
function generatePlayerCard(cardId = null) { // cardId is currently ignored
    const playerCardEl = document.getElementById('player-bingo-card');
    playerCardEl.innerHTML = '';
    playerCard = [];
    markedCells.clear();
    
    // Create headers (B-I-N-G-O) - (6 rows total in CSS grid)
    const headers = ['B', 'I', 'N', 'G', 'O'];
    headers.forEach(letter => {
        const header = document.createElement('div');
        header.className = 'header';
        header.textContent = letter;
        playerCardEl.appendChild(header);
    });
    
    // Generate numbers for each column
    const columns = [
        generateColumn(1, 15),   // B: 1-15
        generateColumn(16, 30),  // I: 16-30
        generateColumn(31, 45),  // N: 31-45
        generateColumn(46, 60),  // G: 46-60
        generateColumn(61, 75)   // O: 61-75
    ];
    
    // Create 5x5 grid (rows 2-6 in CSS grid)
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            // Center cell is FREE space
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
                
                // Add click event to mark/unmark
                cell.addEventListener('click', function() {
                    toggleCell(cell);
                });
            }
            
            playerCardEl.appendChild(cell);
        }
    }
    
    // Re-mark any cells that were already called (if the game is in progress)
    playerCardEl.querySelectorAll('.cell').forEach(cell => {
        const number = parseInt(cell.dataset.number);
        if (calledNumbers.includes(number)) {
            cell.classList.add('marked');
            markedCells.add(number);
        }
    });
}

// Generate random numbers for a column
function generateColumn(min, max) {
    const numbers = [];
    const available = [];
    
    for (let i = min; i <= max; i++) {
        available.push(i);
    }
    
    // Pick 5 random numbers
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
    
    if (number === 'free') return; // Can't toggle free space
    
    // Only allow marking if the number has been officially called
    if (!calledNumbers.includes(parseInt(number))) {
        console.log(`Number ${number} has not been called yet!`);
        // We could add a visual feedback here instead of just logging
        return; 
    }
    
    if (cell.classList.contains('marked')) {
        cell.classList.remove('marked');
        markedCells.delete(number);
    } else {
        cell.classList.add('marked');
        markedCells.add(number);
        checkForBingo();
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
    const callBtn = document.getElementById('current-call');
    if (callBtn) {
        callBtn.textContent = calledNumber;
    }
    
    // Update call history (show last 3 calls)
    updateCallHistory();
    
    // Mark the number in the master grid
    const masterCells = document.querySelectorAll('.master-cell');
    masterCells.forEach(cell => {
        if (parseInt(cell.dataset.number) === calledNumber) {
            cell.classList.add('called');
        }
    });
    
    // Auto-mark the player's card (optional, but good for UX)
    // We already added a check in toggleCell, but we can visually mark it here too
    const playerCells = document.querySelectorAll('#player-bingo-card .cell');
    playerCells.forEach(cell => {
        if (parseInt(cell.dataset.number) === calledNumber) {
            cell.classList.add('marked');
            markedCells.add(cell.dataset.number);
            checkForBingo();
        }
    });
}

// Update call history display
function updateCallHistory() {
    const historyItems = document.querySelectorAll('.history-item');
    // Get the last three called numbers, excluding the latest one displayed in the circle
    const lastThree = calledNumbers.slice(-4, -1).reverse(); 
    
    historyItems.forEach((item, index) => {
        if (lastThree[index]) {
            item.textContent = lastThree[index];
        } else {
            item.textContent = '-';
        }
    });
}

// Check if player has bingo
function checkForBingo() {
    // This check is the core game logic and remains the same
    const grid = Array(5).fill().map(() => Array(5).fill(false));
    
    const playerCells = document.querySelectorAll('#player-bingo-card .cell');
    
    // Map marked cells onto a 5x5 grid representation
    let cellIndex = 0;
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            // Adjust cellIndex based on the 6x5 display grid (skips the header row)
            const displayIndex = (row + 1) * 5 + col; 
            const cell = playerCells[displayIndex];

            // NOTE: The cell traversal logic here needs to align with the HTML structure which includes headers
            // A simpler way: just iterate over the cells that are NOT headers
            
            const realIndex = row * 5 + col;
            const targetCell = document.getElementById('player-bingo-card').children[realIndex + 5]; // +5 to skip headers
            
            if (targetCell && targetCell.classList.contains('marked')) {
                grid[row][col] = true;
            }
        }
    }
    
    // Fill the grid with marked status (Simplified for 5x5 content area only)
    let cellCounter = 0;
    document.querySelectorAll('#player-bingo-card .cell').forEach(cell => {
        const row = Math.floor(cellCounter / 5);
        const col = cellCounter % 5;
        if (row < 5 && col < 5) { // Ensure we only check the 5x5 card area (after headers)
            if (cell.classList.contains('marked')) {
                grid[row][col] = true;
            }
            cellCounter++;
        }
    });

    // Check rows
    for (let row = 0; row < 5; row++) {
        if (grid[row].every(cell => cell)) {
            return true;
        }
    }
    
    // Check columns
    for (let col = 0; col < 5; col++) {
        if (grid.every(row => row[col])) {
            return true;
        }
    }
    
    // Check diagonals
    if (grid[0][0] && grid[1][1] && grid[2][2] && grid[3][3] && grid[4][4]) {
        return true;
    }
    if (grid[0][4] && grid[1][3] && grid[2][2] && grid[3][1] && grid[4][0]) {
        return true;
    }
    
    return false;
}

// Reset the game (resets only the game screen components)
function resetGame() {
    stopAutoCall();
    calledNumbers = [];
    initializeMasterGrid();
    generatePlayerCard();
    startAutoCall();
}

// Set up event listeners for all screens
function setupEventListeners() {
    
    // LANDING SCREEN LISTENERS
    document.querySelectorAll('.stake-btn').forEach(button => {
        button.addEventListener('click', handleStakeSelection);
    });

    document.getElementById('start-selection-btn')?.addEventListener('click', startSelectionPhase);


    // GAME SCREEN LISTENERS
    // "አዲስ ካርድ" button - Generate new card (and restart game flow)
    const newCardBtn = document.querySelector('.top-round-btn');
    if (newCardBtn) {
        newCardBtn.addEventListener('click', resetGame); 
    }
    
    // "Call" button (for manual call testing)
    const callBtn = document.getElementById('current-call');
    if (callBtn) {
        // Temporarily commented out to rely solely on auto-call for game flow
        // callBtn.addEventListener('click', callNumber);
    }
    
    // "Refresh" button - Reset the game
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', resetGame);
    }
    
    // "BINGO" button - Check for bingo
    const bingoBtn = document.getElementById('bingo-btn');
    if (bingoBtn) {
        bingoBtn.addEventListener('click', function() {
            if (checkForBingo()) {
                // IMPORTANT: Since you cannot use alert(), this needs a custom UI element in HTML/CSS
                console.log('BINGO! Congratulations! (Use a custom modal instead of alert)');
                // For demonstration:
                bingoBtn.textContent = '🎉 BINGO! 🎉';
            } else {
                console.log('Not yet! Keep playing! (Use a custom modal instead of alert)');
                bingoBtn.textContent = 'Not Yet...';
                setTimeout(() => bingoBtn.textContent = 'BINGO', 1000);
            }
        });
    }
}

// Initialize the screen flow when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // START: Show Landing Screen first
    switchScreen(LANDING_SCREEN); 
    setupEventListeners();
    
    // Ensure initial stake is set on the play button text
    document.getElementById('start-selection-btn').textContent = `▷ Play ${currentStake} ETB`;
});
