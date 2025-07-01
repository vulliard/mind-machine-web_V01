const leftPanel = document.getElementById('left-panel');
const centerPanel = document.getElementById('center-panel');
const rightPanel = document.getElementById('right-panel');
const startButton = document.getElementById('startButton');
const colorPicker = document.getElementById('colorPicker');
const frequencySlider = document.getElementById('frequencySlider');
// NOUVEAU : Référence au curseur de fréquence de clignotement
const blinkRateSlider = document.getElementById('blinkRateSlider');

let isLeftLight = false;
let intervalId = null;
// ANCIENNE LIGNE: const BLINK_INTERVAL = 250;
// NOUVEAU : La valeur initiale est lue depuis le curseur
let BLINK_INTERVAL = parseInt(blinkRateSlider.value);
const SOUND_DURATION = 20; // 20 millisecondes pour un son très court et percutant

// --- Configuration audio ---
let audioContext;
let masterGainNode; // Pour le volume global
let currentFrequency = parseFloat(frequencySlider.value);

// Initialise le contexte audio au premier clic utilisateur
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        masterGainNode = audioContext.createGain();
        masterGainNode.connect(audioContext.destination);
        masterGainNode.gain.setValueAtTime(0.5, audioContext.currentTime); // Volume global
    }
}

function playSound(panDirection) {
    initAudioContext(); // Assurez-vous que le contexte audio est initialisé

    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine'; // Onde sinusoidale
    oscillator.frequency.setValueAtTime(currentFrequency, audioContext.currentTime);

    const gainNode = audioContext.createGain(); // Pour l'enveloppe
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);

    // Fade-in (linéaire)
    const fadeDuration = 0.01; // 10 ms pour le fade
    gainNode.gain.linearRampToValueAtTime(1.0, audioContext.currentTime + fadeDuration);
    // Fade-out (linéaire)
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + (SOUND_DURATION / 1000));

    const panner = audioContext.createStereoPanner(); // Pour la stéréo
    panner.pan.setValueAtTime(panDirection === 'left' ? -1 : 1, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(masterGainNode); // Connecter au gain global pour le volume

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + (SOUND_DURATION / 1000)); // Arrêter après la durée convertie en secondes
}

// --- Logique visuelle ---
function updateVisuals() {
    const circleColor = colorPicker.value;

    // Supprimer les cercles existants
    Array.from(document.querySelectorAll('.circle')).forEach(c => c.remove());

    if (isLeftLight) {
        // Côté gauche : rond lumineux, Côté droit : carré noir
        const circle = document.createElement('div');
        circle.classList.add('circle');
        circle.style.backgroundColor = circleColor;
        leftPanel.appendChild(circle);

        rightPanel.style.backgroundColor = 'black'; // Assurez-vous que le panneau est noir
    } else {
        // Côté gauche : carré noir, Côté droit : rond lumineux
        const circle = document.createElement('div');
        circle.classList.add('circle');
        circle.style.backgroundColor = circleColor;
        rightPanel.appendChild(circle);

        leftPanel.style.backgroundColor = 'black'; // Assurez-vous que le panneau est noir
    }

    // Jouer le son du côté correspondant
    playSound(isLeftLight ? 'left' : 'right');

    isLeftLight = !isLeftLight; // Inverser l'état
}

// --- Contrôles utilisateur ---
startButton.addEventListener('click', () => {
    initAudioContext(); // Assurez que le contexte audio est initialisé au premier clic
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        startButton.textContent = "Démarrer / Arrêter";
        // Optionnel: remettre les panneaux à un état initial neutre
        leftPanel.innerHTML = ''; // Enlève le cercle
        rightPanel.innerHTML = '';
        leftPanel.style.backgroundColor = 'black';
        rightPanel.style.backgroundColor = 'black';
    } else {
        updateVisuals(); // Première exécution immédiate
        // NOUVEAU : Utilise la variable BLINK_INTERVAL qui est mise à jour par le curseur
        intervalId = setInterval(updateVisuals, BLINK_INTERVAL);
        startButton.textContent = "Arrêter";
    }
});

frequencySlider.addEventListener('input', (event) => {
    currentFrequency = parseFloat(event.target.value);
});

// NOUVEAU : Écouteur d'événement pour le curseur de fréquence de clignotement
blinkRateSlider.addEventListener('input', (event) => {
    BLINK_INTERVAL = parseInt(event.target.value); // Met à jour l'intervalle
    // Si l'animation est déjà en cours, il faut la redémarrer pour appliquer le nouvel intervalle
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = setInterval(updateVisuals, BLINK_INTERVAL);
    }
});