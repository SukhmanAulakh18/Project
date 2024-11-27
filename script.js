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

// Drop zones
const dropZones = {
    who: document.getElementById('who'),
    what: document.getElementById('what'),
    when: document.getElementById('when'),
    why: document.getElementById('why')
};

// Game Initialization
function initializeGame() {
    // Fetch game data
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
            alert('Failed to load game data. Please refresh the page.');
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
    // Determine scenario source based on current count
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

    // Update scenario text
    scenarioTextElement.textContent = currentScenario.text;

    // Clear previous options and drop zones
    clearOptionsAndDropZones();

    // Generate and display draggable options
    generateDraggableOptions();
}

// Clear Options and Drop Zones
function clearOptionsAndDropZones() {
    // Clear options area
    optionsArea.innerHTML = '';

    // Clear drop zones
    Object.values(dropZones).forEach(zone => {
        // Keep only the header, remove all other children
        while (zone.children.length > 1) {
            zone.removeChild(zone.lastChild);
        }
    });
}

// Generate Draggable Options
function generateDraggableOptions() {
    const allOptions = [];

    // Collect correct and incorrect options
    ['who', 'what', 'when', 'why'].forEach(key => {
        allOptions.push(currentScenario[key]);
        allOptions.push(...currentScenario.incorrect[key]);
    });

    // Shuffle options
    shuffleArray(allOptions);

    // Create draggable elements
    allOptions.forEach((option, index) => {
        const draggable = document.createElement('div');
        draggable.className = 'draggable';
        draggable.textContent = option;
        draggable.draggable = true;
        draggable.style.animationDelay = `${index * 0.05}s`;
        optionsArea.appendChild(draggable);
    });

    // Initialize Sortable for options and drop zones
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
    // Options area
    new Sortable(optionsArea, {
        group: 'shared',
        animation: 150,
        ghostClass: 'draggable-ghost'
    });

    // Drop zones
    Object.values(dropZones).forEach(zone => {
        new Sortable(zone, {
            group: 'shared',
            animation: 150,
            ghostClass: 'draggable-ghost',
            onAdd: function(evt) {
                // Remove existing draggable if present
                const existingDraggable = zone.querySelector('.draggable');
                if (existingDraggable) {
                    zone.removeChild(existingDraggable);
                }
                // Ensure the new draggable is the last child
                zone.appendChild(evt.item);
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

    // Validate all zones are filled
    if (!areAllZonesFilled()) {
        alert('Please fill all drop zones before submitting.');
        return;
    }

    // Calculate score
    let correctAnswers = 0;
    const feedback = [];

    // Check each answer
    ['who', 'what', 'when', 'why'].forEach(key => {
        if (answers[key] === currentScenario[key]) {
            correctAnswers++;
            feedback.push(`✓ Correct ${key}`);
        } else {
            feedback.push(`✗ Incorrect ${key}`);
        }
    });

    // Update score
    score += correctAnswers;
    scoreElement.textContent = score;
    scenarioCount++;
    scenarioCountElement.textContent = scenarioCount;

    // Show feedback
    alert(feedback.join('\n'));

    // Animate score
    scoreElement.classList.add('pulse');
    setTimeout(() => scoreElement.classList.remove('pulse'), 1000);

    // Load next scenario
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

    const message = `Game Over!\n\n` +
                   `Total Scenarios: ${totalQuestions}\n` +
                   `Total Score: ${score}\n` +
                   `Accuracy: ${percentage}%\n\n` +
                   `Would you like to play again?`;

    if (confirm(message)) {
        resetGame();
    }
}

// Event Listeners
submitButton.addEventListener('click', submitAnswer);
resetButton.addEventListener('click', resetGame);
endButton.addEventListener('click', endGame);

// Initialize the game when the page loads
initializeGame();