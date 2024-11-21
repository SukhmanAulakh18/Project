let gameData;
let currentScenario;
let currentStory;
let score = 0;
let scenarioCount = 0;
let answers = { who: '', what: '', when: '', why: '' };

// Fetch game data from JSON file
fetch('game-data.json')
    .then(response => response.json())
    .then(data => {
        gameData = data;
        currentScenario = gameData.scenarios[0];
        updateScenario();
    });

function updateScenario() {
    const scenarioText = document.getElementById('scenario-text');
    scenarioText.style.opacity = '0';
    setTimeout(() => {
        scenarioText.textContent = currentScenario.text;
        scenarioText.style.opacity = '1';
    }, 300);

    clearAnswers();
    clearOptions();
    createDraggables();
}

function clearAnswers() {
    answers = { who: '', what: '', when: '', why: '' };
    const dropZones = document.querySelectorAll('.drop-zone');
    dropZones.forEach(zone => {
        while (zone.firstChild) {
            if (zone.lastChild.tagName !== 'H3') {
                zone.removeChild(zone.lastChild);
            } else {
                break;
            }
        }
    });
}

function clearOptions() {
    const optionsArea = document.getElementById('options-area');
    optionsArea.innerHTML = '';
}

function createDraggables() {
    const optionsArea = document.getElementById('options-area');
    optionsArea.innerHTML = ''; // Clear previous options

    const allOptions = [];
    for (const key of ['who', 'what', 'when', 'why']) {
        allOptions.push(currentScenario[key]);
        // Add incorrect options
        allOptions.push(...currentScenario.incorrect[key]);
    }

    // Shuffle all options
    for (let i = allOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    allOptions.forEach((option, index) => {
        const draggable = document.createElement('div');
        draggable.className = 'draggable';
        draggable.textContent = option;
        draggable.draggable = true;
        draggable.style.animationDelay = `${index * 0.05}s`; // Faster animation
        optionsArea.appendChild(draggable);
    });

    new Sortable(optionsArea, {
        group: 'shared',
        animation: 150,
        ghostClass: 'draggable-ghost'
    });

    const dropZones = document.querySelectorAll('.drop-zone');
    dropZones.forEach(dropZone => {
        new Sortable(dropZone, {
            group: 'shared',
            animation: 150,
            ghostClass: 'draggable-ghost',
            onAdd: function(evt) {
                const type = evt.to.id;
                answers[type] = evt.item.textContent;
                evt.to.classList.add('drag-over');
                setTimeout(() => evt.to.classList.remove('drag-over'), 300);
            },
            onRemove: function(evt) {
                const type = evt.from.id;
                answers[type] = '';
            }
        });
    });
}

function nextScenario() {
    if (scenarioCount === gameData.scenarios.length) {
        // Switch to stories after all scenarios are completed
        if (currentStory) {
            const currentIndex = gameData.stories.findIndex(s => s.id === currentStory.id);
            currentStory = gameData.stories[(currentIndex + 1) % gameData.stories.length];
        } else {
            currentStory = gameData.stories[0];
        }
        currentScenario = currentStory;
    } else {
        // Move to next scenario
        const currentIndex = gameData.scenarios.findIndex(s => s.id === currentScenario.id);
        currentScenario = gameData.scenarios[(currentIndex + 1) % gameData.scenarios.length];
    }
    updateScenario();
}

function resetGame() {
    score = 0;
    scenarioCount = 0;
    currentScenario = gameData.scenarios[0];
    currentStory = null;
    document.getElementById('score').textContent = score;
    document.getElementById('scenario-count').textContent = scenarioCount;
    updateScenario();
}

function endGame() {
    const finalScore = Math.round((score / (scenarioCount * 4)) * 100);
    alert(`Game Over! Your final score is ${score} out of ${scenarioCount * 4} possible points (${finalScore}%).`);
    resetGame();
}

// Submit button handler
document.getElementById('submit-btn').addEventListener('click', function() {
    let correct = 0;
    for (const key in answers) {
        if (answers[key] === currentScenario[key]) {
            correct++;
        }
    }
    score += correct;
    scenarioCount++;

    document.getElementById('score').textContent = score;
    document.getElementById('scenario-count').textContent = scenarioCount;

    // Animate score change
    const scoreElement = document.getElementById('score');
    scoreElement.classList.add('pulse');
    setTimeout(() => scoreElement.classList.remove('pulse'), 1000);

    nextScenario();
});

// Reset button handler
document.getElementById('reset-btn').addEventListener('click', resetGame);

// End game button handler
document.getElementById('end-btn').addEventListener('click', endGame);

// Initial setup
window.addEventListener('DOMContentLoaded', (event) => {
    const dropZones = document.querySelectorAll('.drop-zone');
    dropZones.forEach(dropZone => {
        new Sortable(dropZone, {
            group: 'shared',
            animation: 150,
            ghostClass: 'draggable-ghost',
            onAdd: function(evt) {
                const type = evt.to.id;
                answers[type] = evt.item.textContent;
                evt.to.classList.add('drag-over');
                setTimeout(() => evt.to.classList.remove('drag-over'), 300);
            },
            onRemove: function(evt) {
                const type = evt.from.id;
                answers[type] = '';
            }
        });
    });
});