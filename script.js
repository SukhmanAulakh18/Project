// Game state variables
let gameData;
let currentScenario;
let score = 0;
let scenarioCount = 0;

// DOM Element Selectors
const scenarioTextElement = document.getElementById('scenario-text');
const optionsArea = document.getElementById('options-area');
const submitButton = document.getElementById('submit-btn');
const resetButton = document.getElementById('reset-btn');
const endButton = document.getElementById('end-btn');
const scoreElement = document.getElementById('score');
const scenarioCountElement = document.getElementById('scenario-count');
const modal = document.getElementById('feedback-modal');
const modalFeedback = document.getElementById('modal-feedback');
const modalClose = document.getElementById('modal-close');

// Drop zones
const dropZones = {
    who: document.getElementById('who'),
    what: document.getElementById('what'),
    when: document.getElementById('when'),
    why: document.getElementById('why')
};

// Game Initialization
function initializeGame() {
    fetch('game-data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load game data');
            }
            return response.json();
        })
        .then(data => {
            gameData = data;
            resetGame();
            setupDragAndDrop();
        })
        .catch(error => {
            console.error('Game Initialization Error:', error);
            showModal('Failed to load game data. Please refresh the page.');
        });
}

// Setup Drag and Drop Event Listeners
function setupDragAndDrop() {
    // Prevent default drag behaviors
    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('draggable')) {
            e.dataTransfer.setData('text/plain', e.target.textContent);
        }
    });

    // Drag over event to allow dropping
    Object.values(dropZones).forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        // Drop event handler
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            const data = e.dataTransfer.getData('text/plain');

            // Find the original draggable element in the options area or other drop zones
            const originalDraggable = document.querySelector(`.draggable[data-content="${data}"]`);

            if (originalDraggable) {
                // If the drop zone already has an option, move it back to the options area
                const existingDraggable = zone.querySelector('.draggable');
                if (existingDraggable) {
                    optionsArea.appendChild(existingDraggable);
                }

                // Add the new option to the drop zone
                zone.appendChild(originalDraggable);
            }
        });
    });

    // Drag start for options area
    optionsArea.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('draggable')) {
            e.dataTransfer.setData('text/plain', e.target.textContent);
        }
    });
}

// Reset Game State
function resetGame() {
    score = 0;
    scenarioCount = 0;
    scoreElement.textContent = score;
    scenarioCountElement.textContent = scenarioCount;
    loadNextScenario();
}

// Load Next Scenario
function loadNextScenario() {
    const totalScenarios = gameData.scenarios.length;
    const totalStories = gameData.stories.length;

    if (scenarioCount < totalScenarios) {
        currentScenario = gameData.scenarios[scenarioCount];
    } else if (scenarioCount < totalScenarios + totalStories) {
        currentScenario = gameData.stories[scenarioCount - totalScenarios];
    } else {
        endGame();
        return;
    }

    scenarioTextElement.textContent = currentScenario.text;
    clearOptionsAndDropZones();
    generateDraggableOptions();
}

// Clear Options and Drop Zones
function clearOptionsAndDropZones() {
    optionsArea.innerHTML = '';
    Object.values(dropZones).forEach(zone => {
        const label = zone.querySelector('h3');
        zone.innerHTML = '';
        zone.appendChild(label);
    });
}

// Generate Draggable Options
function generateDraggableOptions() {
    const allOptions = ['who', 'what', 'when', 'why'].map(key => currentScenario[key]);
    shuffleArray(allOptions);

    allOptions.forEach((option, index) => {
        const draggable = document.createElement('div');
        draggable.className = 'draggable';
        draggable.textContent = option;
        draggable.draggable = true;
        draggable.setAttribute('data-content', option);
        draggable.style.animationDelay = `${index * 0.05}s`;

        // Prevent text selection to improve drag experience
        draggable.style.userSelect = 'none';
        draggable.style.webkitUserSelect = 'none';
        draggable.style.mozUserSelect = 'none';
        draggable.style.msUserSelect = 'none';

        optionsArea.appendChild(draggable);
    });
}

// Shuffle Array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Submit Answer
function submitAnswer() {
    const answers = {
        who: getDropZoneAnswer(dropZones.who),
        what: getDropZoneAnswer(dropZones.what),
        when: getDropZoneAnswer(dropZones.when),
        why: getDropZoneAnswer(dropZones.why)
    };

    if (!areAllZonesFilled()) {
        showModal('Please fill all drop zones before submitting.');
        return;
    }

    let correctAnswers = 0;
    const feedback = [];

    ['who', 'what', 'when', 'why'].forEach(key => {
        if (answers[key] === currentScenario[key]) {
            correctAnswers++;
            feedback.push(`<p class="correct">✓ ${key.charAt(0).toUpperCase() + key.slice(1)}: Correct</p>`);
        } else {
            feedback.push(`<p class="incorrect">✗ ${key.charAt(0).toUpperCase() + key.slice(1)}: Incorrect (Correct answer: ${currentScenario[key]})</p>`);
        }
    });

    score += correctAnswers;
    scoreElement.textContent = score;
    scenarioCount++;
    scenarioCountElement.textContent = scenarioCount;

    showModal(feedback.join(''));

    scoreElement.classList.add('pulse');
    setTimeout(() => scoreElement.classList.remove('pulse'), 1000);

    clearOptionsAndDropZones();
    loadNextScenario();
}

// Get Answer from Drop Zone
function getDropZoneAnswer(zone) {
    const draggableInZone = zone.querySelector('.draggable');
    return draggableInZone ? draggableInZone.textContent : '';
}

// Check if All Zones are Filled
function areAllZonesFilled() {
    return Object.values(dropZones).every(zone => zone.querySelector('.draggable'));
}

// End Game
function endGame() {
    const totalQuestions = scenarioCount;
    const percentage = totalQuestions > 0 
        ? ((score / (totalQuestions * 4)) * 100).toFixed(2) 
        : 0;

    const endGameMessage = `
        <h2>Game Over!</h2>
        <p>Total Scenarios: ${totalQuestions}</p>
        <p>Total Score: ${score}</p>
        <p>Accuracy: ${percentage}%</p>
        <button id="play-again">Play Again</button>
    `;

    showModal(endGameMessage);
    document.getElementById('play-again').addEventListener('click', () => {
        hideModal();
        resetGame();
    });
}

// Show Modal
function showModal(content) {
    modalFeedback.innerHTML = content;
    modal.style.display = 'block';
}

// Hide Modal
function hideModal() {
    modal.style.display = 'none';
}

// Event Listeners
submitButton.addEventListener('click', submitAnswer);
resetButton.addEventListener('click', resetGame);
endButton.addEventListener('click', endGame);
modalClose.addEventListener('click', hideModal);

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        hideModal();
    }
});

// Initialize the game when the page loads
initializeGame();
