// Chewatabingo Game Logic

// Game state
let masterNumbers = [];
let calledNumbers = [];
let playerCard = [];
let markedCells = new Set();
let autoCallInterval = null;

// Initialize Telegram WebApp
let tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeMasterGrid();
    generatePlayerCard();
    setupEventListeners();
    startAutoCall();
});

// Auto-call system - calls a number every 3 seconds
function startAutoCall() {
    if (autoCallInterval) {
        clearInterval(autoCallInterval);
    }
    autoCallInterval = setInterval(function() {
        callNumber();
    }, 3000);
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
}

// Generate a random bingo card (5x5 with free space in center)
function generatePlayerCard() {
    const playerCardEl = document.getElementById('player-bingo-card');
    playerCardEl.innerHTML = '';
    playerCard = [];
    markedCells.clear();
    
    // Create headers (B-I-N-G-O)
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
    
    // Create 5x5 grid
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
    
    if (cell.classList.contains('marked')) {
        cell.classList.remove('marked');
        markedCells.delete(number);
    } else {
        cell.classList.add('marked');
        markedCells.add(number);
        
        // Check if this number was called
        if (calledNumbers.includes(parseInt(number))) {
            checkForBingo();
        }
    }
}

// Call a random number from the master grid
function callNumber() {
    const uncalledNumbers = masterNumbers.filter(num => !calledNumbers.includes(num));
    
    if (uncalledNumbers.length === 0) {
        alert('All numbers have been called!');
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * uncalledNumbers.length);
    const calledNumber = uncalledNumbers[randomIndex];
    
    calledNumbers.push(calledNumber);
    
    // Update the Call button to show the latest number
    const callBtn = document.querySelector('.top-call-circle');
    if (callBtn) {
        callBtn.textContent = calledNumber;
    }
    
    // Mark the number in the master grid
    const masterCells = document.querySelectorAll('.master-cell');
    masterCells.forEach(cell => {
        if (parseInt(cell.dataset.number) === calledNumber) {
            cell.classList.add('called');
        }
    });
    
    // Auto-mark if it's on the player's card
    const playerCells = document.querySelectorAll('#player-bingo-card .cell');
    playerCells.forEach(cell => {
        if (parseInt(cell.dataset.number) === calledNumber) {
            cell.classList.add('marked');
            markedCells.add(cell.dataset.number);
        }
    });
    
    checkForBingo();
}

// Check if player has bingo
function checkForBingo() {
    const grid = Array(5).fill().map(() => Array(5).fill(false));
    
    // Fill the grid with marked status
    const playerCells = document.querySelectorAll('#player-bingo-card .cell');
    let cellIndex = 0;
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            const cell = playerCells[cellIndex];
            if (cell && cell.classList.contains('marked')) {
                grid[row][col] = true;
            }
            cellIndex++;
        }
    }
    
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

// Reset the game
function resetGame() {
    calledNumbers = [];
    initializeMasterGrid();
    generatePlayerCard();
    
    // Reset the Call button text
    const callBtn = document.querySelector('.top-call-circle');
    if (callBtn) {
        callBtn.textContent = 'Call';
    }
    
    // Restart auto-call
    startAutoCall();
}

// Set up event listeners
function setupEventListeners() {
    // "አዲስ ካርድ" button - Generate new card
    const newCardBtn = document.querySelector('.top-round-btn');
    if (newCardBtn) {
        newCardBtn.addEventListener('click', generatePlayerCard);
    }
    
    // "Call" button - Call a random number
    const callBtn = document.querySelector('.top-call-circle');
    if (callBtn) {
        callBtn.addEventListener('click', callNumber);
    }
    
    // "Refresh" button - Reset the game
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', resetGame);
    }
    
    // "BINGO" button - Check for bingo
    const bingoBtn = document.querySelector('.bingo-btn-placeholder');
    if (bingoBtn) {
        bingoBtn.addEventListener('click', function() {
            if (checkForBingo()) {
                alert('🎉 BINGO! Congratulations! 🎉');
            } else {
                alert('Not yet! Keep playing!');
            }
        });
    }
}
