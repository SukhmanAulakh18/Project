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
const feedbackElement = document.getElementById('feedback');
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
        })
        .catch(error => {
            console.error('Game Initialization Error:', error);
            showModal('Failed to load game data. Please refresh the page.');
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
        draggable.style.animationDelay = `${index * 0.05}s`;
        optionsArea.appendChild(draggable);
    });

    initializeSortable();
}

// Shuffle Array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Initialize Sortable for Drag and Drop
function initializeSortable() {
    new Sortable(optionsArea, {
        group: 'shared',
        animation: 150,
        ghostClass: 'draggable-ghost'
    });

    Object.values(dropZones).forEach(zone => {
        new Sortable(zone, {
            group: 'shared',
            animation: 150,
            ghostClass: 'draggable-ghost',
            onAdd: function(evt) {
                if (evt.to.children.length > 2) {
                    evt.to.removeChild(evt.to.children[1]);
                }
            }
        });
    });
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