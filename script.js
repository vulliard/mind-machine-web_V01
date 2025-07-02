const leftPanel = document.getElementById('left-panel');
const centerPanel = document.getElementById('center-panel');
const rightPanel = document.getElementById('right-panel');
const startButton = document.getElementById('startButton');
const colorPicker = document.getElementById('colorPicker');

const carrierFrequencySlider = document.getElementById('carrierFrequencySlider');
const carrierFrequencyInputDisplay = document.getElementById('carrierFrequencyInputDisplay'); // Reste le même

const blinkRateSlider = document.getElementById('blinkRateSlider');
const blinkFrequencyInputDisplay = document.getElementById('blinkFrequencyInputDisplay'); // NOUVELLE RÉFÉRENCE

const radioBinaural = document.getElementById('mode-binaural');
const radioIsochronen = document.getElementById('mode-isochronen');
const radioBoth = document.getElementById('mode-both');
const audioModeRadios = document.querySelectorAll('input[name="audioMode"]');

const bbMultiplierRadios = document.querySelectorAll('input[name="bbMultiplier"]');

const binauralVolumeSlider = document.getElementById('binauralVolumeSlider');
const isochronenVolumeSlider = document.getElementById('isochronenVolumeSlider');

const binauralBeatFrequencyDisplay = document.getElementById('binauralBeatFrequencyDisplay');

const warningButton = document.getElementById('warningButton');
const warningModal = document.getElementById('warningModal');
const closeButton = document.querySelector('.close-button');
const understoodButton = document.getElementById('understoodButton');

let isLeftLight = false;
let intervalId = null;

// BLINK_FREQUENCY_HZ est maintenant la variable principale pour la fréquence de clignotement
// MODIFIÉ : Lit la valeur par défaut depuis l'input numérique
let BLINK_FREQUENCY_HZ = parseFloat(blinkFrequencyInputDisplay.value); 
let BLINK_INTERVAL_MS = 1000 / BLINK_FREQUENCY_HZ; // Convertit Hz en ms

const SOUND_DURATION_MS = 20;
const SOUND_DURATION_S = SOUND_DURATION_MS / 1000;

// --- Configuration audio ---
let audioContext;
let masterGainNode;
let currentCarrierFrequency = parseFloat(carrierFrequencyInputDisplay.value); // Lit depuis l'input numérique
let currentBBMultiplier = parseFloat(document.querySelector('input[name="bbMultiplier"]:checked').value);
let currentAudioMode = document.querySelector('input[name="audioMode"]:checked').value;

let currentBinauralVolume = parseFloat(binauralVolumeSlider.value) / 100;
let currentIsochronenVolume = parseFloat(isochronenVolumeSlider.value) / 100;

let binauralOscillatorLeft = null;
let binauralOscillatorRight = null;
let binauralGainLeftChannel = null;
let binauralGainRightChannel = null;
let binauralMerger = null;
let binauralMasterGain = null;

// Function: Calculate the synchronized binaural beat frequency
function getSynchronizedBinauralBeatFrequency() {
    const blinkFrequencyHz = BLINK_FREQUENCY_HZ; // Utilise BLINK_FREQUENCY_HZ
    const bbFreq = blinkFrequencyHz * currentBBMultiplier;
    return bbFreq;
}

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        masterGainNode = audioContext.createGain();
        masterGainNode.connect(audioContext.destination);
        masterGainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    }
}

function createEnvelope(gainNode, durationS, fadeS) {
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(1.0, audioContext.currentTime + fadeS);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + durationS);
}

function startBinauralBeats() {
    initAudioContext();
    stopBinauralBeats();

    const binauralBeatFreq = getSynchronizedBinauralBeatFrequency();
    
    const minAudibleFreq = 20;
    const maxAllowedBinauralBeatFreq = Math.max(0, (currentCarrierFrequency * 2) - (minAudibleFreq * 2));
    
    const effectiveBinauralBeatFreq = Math.min(binauralBeatFreq, maxAllowedBinauralBeatFreq);
    
    if (effectiveBinauralBeatFreq === 0 && binauralBeatFreq > 0) {
         console.warn("Fréquence de battement binaural trop élevée pour la fréquence porteuse actuelle. Le son peut être inaudible.");
    }

    const freqLeftEar = currentCarrierFrequency - (effectiveBinauralBeatFreq / 2);
    const freqRightEar = currentCarrierFrequency + (effectiveBinauralBeatFreq / 2);
    
    if (freqLeftEar <= 0 || freqRightEar <= 0) {
        console.warn("Fréquence finale de l'oreille calculée invalide (<= 0). Ne démarre pas les battements binauraux.");
        return;
    }

    binauralOscillatorLeft = audioContext.createOscillator();
    binauralOscillatorLeft.type = 'sine';
    binauralOscillatorLeft.frequency.setValueAtTime(freqLeftEar, audioContext.currentTime);

    binauralOscillatorRight = audioContext.createOscillator();
    binauralOscillatorRight.type = 'sine';
    binauralOscillatorRight.frequency.setValueAtTime(freqRightEar, audioContext.currentTime);

    binauralGainLeftChannel = audioContext.createGain();
    binauralGainRightChannel = audioContext.createGain();

    binauralGainLeftChannel.gain.setValueAtTime(1.0, audioContext.currentTime);
    binauralGainRightChannel.gain.setValueAtTime(1.0, audioContext.currentTime);

    binauralOscillatorLeft.connect(binauralGainLeftChannel);
    binauralOscillatorRight.connect(binauralGainRightChannel);

    binauralMerger = audioContext.createChannelMerger(2);
    binauralGainLeftChannel.connect(binauralMerger, 0, 0);
    binauralGainRightChannel.connect(binauralMerger, 0, 1);

    binauralMasterGain = audioContext.createGain();
    binauralMerger.connect(binauralMasterGain);
    binauralMasterGain.connect(masterGainNode);
    binauralMasterGain.gain.setValueAtTime(currentBinauralVolume, audioContext.currentTime);

    binauralOscillatorLeft.start(audioContext.currentTime);
    binauralOscillatorRight.start(audioContext.currentTime);

    binauralBeatFrequencyDisplay.textContent = `BB: ${effectiveBinauralBeatFreq.toFixed(1)} Hz`;
}

function stopBinauralBeats() {
    if (binauralOscillatorLeft) {
        binauralOscillatorLeft.stop();
        binauralOscillatorLeft.disconnect();
        binauralOscillatorLeft = null;
    }
    if (binauralOscillatorRight) {
        binauralOscillatorRight.stop();
        binauralOscillatorRight.disconnect();
        binauralOscillatorRight = null;
    }
    if (binauralGainLeftChannel) {
        binauralGainLeftChannel.disconnect();
        binauralGainLeftChannel = null;
    }
    if (binauralGainRightChannel) {
        binauralGainRightChannel.disconnect();
        binauralGainRightChannel = null;
    }
    if (binauralMerger) {
        binauralMerger.disconnect();
        binauralMerger = null;
    }
    if (binauralMasterGain) {
        binauralMasterGain.disconnect();
        binauralMasterGain = null;
    }
    binauralBeatFrequencyDisplay.textContent = `BB: -- Hz`;
}

function playSound(panDirection) {
    initAudioContext();

    if (currentAudioMode === 'isochronen' || currentAudioMode === 'both') {
        const baseFrequency = 440;

        const oscillatorIsochronen = audioContext.createOscillator();
        oscillatorIsochronen.type = 'sine';
        oscillatorIsochronen.frequency.setValueAtTime(baseFrequency, audioContext.currentTime);

        const gainIsochronen = audioContext.createGain();
        createEnvelope(gainIsochronen, SOUND_DURATION_S, 0.01);

        const pannerIsochronen = audioContext.createStereoPanner();
        if (panDirection === 'left') {
            pannerIsochronen.pan.setValueAtTime(-1, audioContext.currentTime);
        } else {
            pannerIsochronen.pan.setValueAtTime(1, audioContext.currentTime);
        }

        const isochronenSpecificGain = audioContext.createGain();
        isochronenSpecificGain.gain.setValueAtTime(currentIsochronenVolume, audioContext.currentTime);

        oscillatorIsochronen.connect(gainIsochronen);
        gainIsochronen.connect(pannerIsochronen);
        pannerIsochronen.connect(isochronenSpecificGain);
        isochronenSpecificGain.connect(masterGainNode);

        oscillatorIsochronen.start(audioContext.currentTime);
        oscillatorIsochronen.stop(audioContext.currentTime + SOUND_DURATION_S);
    }
}

// --- Visual Logic (unchanged) ---
function updateVisuals() {
    const circleColor = colorPicker.value;

    Array.from(document.querySelectorAll('.circle')).forEach(c => c.remove());

    if (isLeftLight) {
        const circle = document.createElement('div');
        circle.classList.add('circle');
        circle.style.backgroundColor = circleColor;
        leftPanel.appendChild(circle);

        rightPanel.style.backgroundColor = 'black';
    } else {
        const circle = document.createElement('div');
        circle.classList.add('circle');
        circle.style.backgroundColor = circleColor;
        rightPanel.appendChild(circle);

        leftPanel.style.backgroundColor = 'black';
    }

    if (currentAudioMode === 'isochronen' || currentAudioMode === 'both') {
        playSound(isLeftLight ? 'left' : 'right');
    }
    
    isLeftLight = !isLeftLight;
}

// --- Mise à jour des affichages de fréquence ---
function updateFrequencyDisplays() {
    // MODIFIÉ : Affiche la valeur de BLINK_FREQUENCY_HZ (qui est éditée via l'input)
    blinkFrequencyInputDisplay.value = BLINK_FREQUENCY_HZ.toFixed(1); 

    // Affiche la valeur de currentCarrierFrequency (qui est éditée via l'input)
    carrierFrequencyInputDisplay.value = currentCarrierFrequency; 
    
    const bbFreq = getSynchronizedBinauralBeatFrequency();
    binauralBeatFrequencyDisplay.textContent = `BB: ${bbFreq.toFixed(1)} Hz`;
}

// --- User Controls ---
startButton.addEventListener('click', () => {
    initAudioContext();
    // BLINK_INTERVAL_MS est calculé à partir de BLINK_FREQUENCY_HZ
    BLINK_INTERVAL_MS = 1000 / BLINK_FREQUENCY_HZ;

    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        startButton.textContent = "Démarrer / Arrêter";
        leftPanel.innerHTML = '';
        rightPanel.innerHTML = '';
        leftPanel.style.backgroundColor = 'black';
        rightPanel.style.backgroundColor = 'black';
        stopBinauralBeats();
    } else {
        if (currentAudioMode === 'binaural' || currentAudioMode === 'both') {
            startBinauralBeats();
        }
        updateVisuals();
        intervalId = setInterval(updateVisuals, BLINK_INTERVAL_MS);
        startButton.textContent = "Arrêter";
    }
});

// Écouteur pour le CURSEUR de fréquence porteuse (synchronise l'input display)
carrierFrequencySlider.addEventListener('input', (event) => {
    currentCarrierFrequency = parseFloat(event.target.value);
    carrierFrequencyInputDisplay.value = currentCarrierFrequency; // Synchronise l'input textuel
    updateFrequencyDisplays();
    if (intervalId && (currentAudioMode === 'binaural' || currentAudioMode === 'both')) {
        startBinauralBeats();
    }
});

// Écouteur pour le CHAMP DE SAISIE NUMÉRIQUE de la fréquence porteuse
carrierFrequencyInputDisplay.addEventListener('input', (event) => {
    let newValue = parseFloat(event.target.value);
    // Validation pour s'assurer que la valeur est dans la plage min/max du curseur
    if (isNaN(newValue) || newValue < parseFloat(carrierFrequencyInputDisplay.min) || newValue > parseFloat(carrierFrequencyInputDisplay.max)) {
        console.warn("Valeur de fréquence porteuse invalide.");
        // Remet à la valeur précédente valide
        newValue = currentCarrierFrequency;
        carrierFrequencyInputDisplay.value = newValue; // Affiche la valeur valide
    }
    currentCarrierFrequency = newValue;
    carrierFrequencySlider.value = newValue; // Synchronise le curseur
    updateFrequencyDisplays();
    if (intervalId && (currentAudioMode === 'binaural' || currentAudioMode === 'both')) {
        startBinauralBeats();
    }
});

// MODIFIÉ : Écouteur pour le CURSEUR de fréquence de clignotement (synchronise l'input display)
blinkRateSlider.addEventListener('input', (event) => {
    BLINK_FREQUENCY_HZ = parseFloat(event.target.value);
    blinkFrequencyInputDisplay.value = BLINK_FREQUENCY_HZ.toFixed(1); // Synchronise l'input textuel
    
    // Assurez-vous que la fréquence est valide pour éviter division par zéro ou infini si elle était à 0
    if (BLINK_FREQUENCY_HZ <= 0) {
        console.warn("La fréquence de clignotement doit être supérieure à 0 Hz.");
        BLINK_FREQUENCY_HZ = 1; // Force à 1 Hz
        blinkRateSlider.value = 1; // Ajuste visuellement le curseur
        blinkFrequencyInputDisplay.value = 1; // Ajuste visuellement l'input
    }

    BLINK_INTERVAL_MS = 1000 / BLINK_FREQUENCY_HZ; 
    
    updateFrequencyDisplays();
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = setInterval(updateVisuals, BLINK_INTERVAL_MS);
    }
    if (intervalId && (currentAudioMode === 'binaural' || currentAudioMode === 'both')) {
        startBinauralBeats();
    }
});

// NOUVEAU : Écouteur pour le CHAMP DE SAISIE NUMÉRIQUE de la fréquence de clignotement
blinkFrequencyInputDisplay.addEventListener('input', (event) => {
    let newValue = parseFloat(event.target.value);
    // Validation pour s'assurer que la valeur est dans la plage min/max du curseur
    if (isNaN(newValue) || newValue < parseFloat(blinkFrequencyInputDisplay.min) || newValue > parseFloat(blinkFrequencyInputDisplay.max)) {
        console.warn("Valeur de fréquence de clignotement invalide.");
        // Remet à la valeur précédente valide
        newValue = BLINK_FREQUENCY_HZ;
        blinkFrequencyInputDisplay.value = newValue.toFixed(1); // Affiche la valeur valide
    }
    BLINK_FREQUENCY_HZ = newValue;
    blinkRateSlider.value = newValue; // Synchronise le curseur

    // Gère le cas où l'utilisateur entre 0 ou un nombre négatif
    if (BLINK_FREQUENCY_HZ <= 0) {
        console.warn("La fréquence de clignotement doit être supérieure à 0 Hz.");
        BLINK_FREQUENCY_HZ = 1; // Force à 1 Hz
        blinkRateSlider.value = 1; // Ajuste visuellement le curseur
        blinkFrequencyInputDisplay.value = 1; // Ajuste visuellement l'input
    }

    BLINK_INTERVAL_MS = 1000 / BLINK_FREQUENCY_HZ;
    
    updateFrequencyDisplays();
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = setInterval(updateVisuals, BLINK_INTERVAL_MS);
    }
    if (intervalId && (currentAudioMode === 'binaural' || currentAudioMode === 'both')) {
        startBinauralBeats();
    }
});


audioModeRadios.forEach(radio => {
    radio.addEventListener('change', (event) => {
        currentAudioMode = event.target.value;
        if (intervalId) {
            stopBinauralBeats();
            if (currentAudioMode === 'binaural' || currentAudioMode === 'both') {
                startBinauralBeats();
            }
        }
    });
});

bbMultiplierRadios.forEach(radio => {
    radio.addEventListener('change', (event) => {
        currentBBMultiplier = parseFloat(event.target.value);
        updateFrequencyDisplays();
        if (intervalId && (currentAudioMode === 'binaural' || currentAudioMode === 'both')) {
            startBinauralBeats();
        }
    });
});

binauralVolumeSlider.addEventListener('input', (event) => {
    currentBinauralVolume = parseFloat(event.target.value) / 100;
    if (binauralMasterGain) {
        binauralMasterGain.gain.setValueAtTime(currentBinauralVolume, audioContext.currentTime);
    }
});

isochronenVolumeSlider.addEventListener('input', (event) => {
    currentIsochronenVolume = parseFloat(event.target.value) / 100;
});

warningButton.addEventListener('click', () => {
    warningModal.style.display = 'flex';
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        startButton.textContent = "Démarrer / Arrêter";
        stopBinauralBeats();
    }
});

closeButton.addEventListener('click', () => {
    warningModal.style.display = 'none';
});

understoodButton.addEventListener('click', () => {
    warningModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target == warningModal) {
        warningModal.style.display = 'none';
    }
});

// Appeler une fois au chargement pour initialiser les affichages
updateFrequencyDisplays();
// Initialiser BLINK_INTERVAL_MS au chargement à partir de la valeur par défaut du curseur en Hz
BLINK_INTERVAL_MS = 1000 / BLINK_FREQUENCY_HZ;