// Déclarations de variables globales (sans initialisation avec DOM ici)
let isLeftLight = false;
let intervalId = null;
let BLINK_FREQUENCY_HZ; 
let BLINK_INTERVAL_MS; 
let audioContext = null; 
let masterGainNode = null; 
let currentCarrierFrequency; 
let currentBBMultiplier; 
let currentAudioMode; 
let currentBinauralVolume; 
let currentIsochronenVolume; 
let binauralOscillatorLeft = null;
let binauralOscillatorRight = null;
let binauralGainLeftChannel = null;
let binauralGainRightChannel = null;
let binauralMerger = null;
let binauralMasterGain = null;

const SOUND_DURATION_MS = 20;
const SOUND_DURATION_S = SOUND_DURATION_MS / 1000;


// --- Références DOM globales (déclarées ici, assignées dans DOMContentLoaded) ---
let leftPanel, centerPanel, rightPanel, startButton, colorPicker;
let carrierFrequencySlider, carrierFrequencyInput; // carrierFrequencyInput correspond à carrierFrequencyInputDisplay dans HTML
let blinkRateSlider, blinkFrequencyInput; // blinkFrequencyInput correspond à blinkFrequencyInputDisplay dans HTML
let radioBinaural, radioIsochronen, radioBoth, audioModeRadios;
let bbMultiplierRadios;
let binauralVolumeSlider, isochronenVolumeSlider;
let binauralBeatFrequencyDisplay;
let warningButton, warningModal, closeButton, understoodButton;


// --- Fonctions globales (définies en dehors de DOMContentLoaded) ---

function initAudioContext() {
    if (!audioContext) { 
        console.log("initAudioContext: Initialisation de l'AudioContext...");
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            masterGainNode = audioContext.createGain();
            masterGainNode.connect(audioContext.destination);
            masterGainNode.gain.setValueAtTime(0.5, audioContext.currentTime); 
            console.log("initAudioContext: AudioContext initialisé.");
        } catch (e) {
            console.error('initAudioContext: Web Audio API non supportée ou impossible à initialiser:', e);
            alert('Votre navigateur ne supporte pas ou n\'a pas pu initialiser l\'API audio. Veuillez essayer avec un autre navigateur (ex: Chrome, Firefox).');
        }
    }
}

function getSynchronizedBinauralBeatFrequency() {
    const blinkFrequencyHz = BLINK_FREQUENCY_HZ;
    const bbFreq = blinkFrequencyHz * currentBBMultiplier;
    return bbFreq;
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
         console.warn("startBinauralBeats: Fréquence de battement binaural trop élevée pour la fréquence porteuse actuelle. Le son peut être inaudible.");
    }

    const freqLeftEar = currentCarrierFrequency - (effectiveBinauralBeatFreq / 2);
    const freqRightEar = currentCarrierFrequency + (effectiveBinauralBeatFreq / 2);
    
    if (freqLeftEar <= 0 || freqRightEar <= 0) {
        console.warn(`startBinauralBeats: Fréquence finale de l'oreille calculée invalide (<= 0). Gauche: ${freqLeftEar}, Droite: ${freqRightEar}. Ne démarre pas les battements binauraux.`);
        return; 
    }
    console.log(`startBinauralBeats: Fréquences oreilles: Gauche=${freqLeftEar.toFixed(2)}Hz, Droite=${freqRightEar.toFixed(2)}Hz. Battement=${effectiveBinauralBeatFreq.toFixed(2)}Hz`);


    if (!audioContext) {
        console.error("startBinauralBeats: AudioContext non initialisé.");
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
    console.log("startBinauralBeats: Battements binauraux démarrés.");
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
    console.log("stopBinauralBeats: Battements binauraux arrêtés.");
}

function playSound(panDirection) {
    initAudioContext(); 

    if (!audioContext) {
        console.error("playSound: AudioContext non initialisé.");
        return; 
    }

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
        console.log("playSound: Son isochrone joué.");
    }
}

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
    //console.log("updateVisuals: Visuels mis à jour. BLINK_INTERVAL_MS:", BLINK_INTERVAL_MS);
}

function updateFrequencyDisplays() {
    // Vérifier si les éléments d'input sont définis avant d'accéder à .value
    if (!blinkFrequencyInput || !carrierFrequencyInput || !binauralBeatFrequencyDisplay) {
        console.error("updateFrequencyDisplays: Un élément d'affichage de fréquence est null. Impossible de mettre à jour.");
        return;
    }
    blinkFrequencyInput.value = BLINK_FREQUENCY_HZ.toFixed(1); 
    carrierFrequencyInput.value = currentCarrierFrequency; 
    
    const bbFreq = getSynchronizedBinauralBeatFrequency();
    binauralBeatFrequencyDisplay.textContent = `BB: ${bbFreq.toFixed(1)} Hz`;
    //console.log("updateFrequencyDisplays: Affichages fréquences mis à jour.");
}

// Global flag to prevent re-triggering input events
let isUpdatingSliderProgrammatically = false;

function validateAndSetFrequency(inputElement, sliderElement, isBlinkFreq) {
    // Vérifier si les éléments sont valides avant de continuer
    if (!inputElement || !sliderElement) {
        console.error(`validateAndSetFrequency: Élément input (${inputElement ? inputElement.id : 'null'}) ou slider (${sliderElement ? sliderElement.id : 'null'}) non défini. Impossible de valider ou mettre à jour.`);
        return;
    }

    // Protection contre la boucle infinie
    if (isUpdatingSliderProgrammatically) {
        console.log("validateAndSetFrequency: Ignoré (mise à jour programmatique pour " + inputElement.id + ").");
        return; 
    }

    let newValue = parseFloat(inputElement.value);
    const minVal = parseFloat(inputElement.min);
    const maxVal = parseFloat(inputElement.max);

    console.log(`validateAndSetFrequency: Valider ${inputElement.id}. Valeur brute: ${inputElement.value}, Parsée: ${newValue}. Min: ${minVal}, Max: ${maxVal}.`);


    if (isNaN(newValue) || newValue < minVal || newValue > maxVal) {
        console.warn(`validateAndSetFrequency: Valeur invalide (${newValue}). Doit être entre ${minVal} et ${maxVal} Hz. Utilisation de la valeur du curseur.`);
        newValue = parseFloat(sliderElement.value); 
        // Assurez-vous que la valeur du curseur est aussi dans la plage valide
        if (isNaN(newValue) || newValue < minVal || newValue > maxVal) {
            newValue = minVal; // Fallback ultime à la valeur minimale
            console.warn(`validateAndSetFrequency: Valeur du curseur (${sliderElement.value}) aussi invalide. Forçage à min.`);
        }
        inputElement.value = isBlinkFreq ? newValue.toFixed(1) : newValue; 
        sliderElement.value = newValue; 
        // Ne retourne pas, on continue avec la valeur corrigée
    }

    if (isBlinkFreq && newValue <= 0) {
        console.warn("validateAndSetFrequency: La fréquence de clignotement doit être supérieure à 0 Hz. Forçage à la valeur minimale.");
        newValue = minVal; 
        inputElement.value = minVal.toFixed(1); 
    }
    
    if (isBlinkFreq) {
        BLINK_FREQUENCY_HZ = newValue;
        BLINK_INTERVAL_MS = 1000 / BLINK_FREQUENCY_HZ; 
    } else {
        currentCarrierFrequency = newValue;
    }

    // Définir le flag avant de mettre à jour le slider
    isUpdatingSliderProgrammatically = true; 
    sliderElement.value = newValue; 
    // Réinitialiser le flag immédiatement ou après un court délai
    // Le setTimeout peut introduire des latences, essayons sans d'abord
    isUpdatingSliderProgrammatically = false;

    updateFrequencyDisplays(); // Mise à jour des affichages après validation

    // Le redémarrage de l'intervalle est géré par l'appelant (l'écouteur d'événement)
    // Le redémarrage de l'audio est géré par l'appelant
    //console.log(`validateAndSetFrequency: BLINK_FREQUENCY_HZ=${BLINK_FREQUENCY_HZ}, currentCarrierFrequency=${currentCarrierFrequency}`);
}


// --- Écouteurs d'événements ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded: Le DOM est entièrement chargé. Début de l'initialisation des écouteurs.");

    // Les références DOM (maintenant correctement définies DANS DOMContentLoaded)
    // et assignées aux variables globales déjà déclarées.
    leftPanel = document.getElementById('left-panel');
    centerPanel = document.getElementById('center-panel');
    rightPanel = document.getElementById('right-panel');
    startButton = document.getElementById('startButton');
    colorPicker = document.getElementById('colorPicker');

    carrierFrequencySlider = document.getElementById('carrierFrequencySlider');
    carrierFrequencyInput = document.getElementById('carrierFrequencyInputDisplay'); 

    blinkRateSlider = document.getElementById('blinkRateSlider');
    blinkFrequencyInput = document.getElementById('blinkFrequencyInputDisplay'); 

    radioBinaural = document.getElementById('mode-binaural');
    radioIsochronen = document.getElementById('mode-isochronen');
    radioBoth = document.getElementById('mode-both');
    audioModeRadios = document.querySelectorAll('input[name="audioMode"]');

    bbMultiplierRadios = document.querySelectorAll('input[name="bbMultiplier"]');

    binauralVolumeSlider = document.getElementById('binauralVolumeSlider');
    isochronenVolumeSlider = document.getElementById('isochronenVolumeSlider');

    binauralBeatFrequencyDisplay = document.getElementById('binauralBeatFrequencyDisplay');

    warningButton = document.getElementById('warningButton');
    warningModal = document.getElementById('warningModal');
    closeButton = document.querySelector('.close-button');
    understoodButton = document.getElementById('understoodButton');

    console.log("DOMContentLoaded: Références DOM obtenues.");

    // Initialisation des variables globales AVEC les valeurs du DOM après qu'elles soient définies
    BLINK_FREQUENCY_HZ = parseFloat(blinkFrequencyInput.value); 
    BLINK_INTERVAL_MS = 1000 / BLINK_FREQUENCY_HZ;
    currentCarrierFrequency = parseFloat(carrierFrequencyInput.value); 

    currentBBMultiplier = parseFloat(document.querySelector('input[name="bbMultiplier"]:checked').value);
    currentAudioMode = document.querySelector('input[name="audioMode"]:checked').value;
    currentBinauralVolume = parseFloat(binauralVolumeSlider.value) / 100;
    currentIsochronenVolume = parseFloat(isochronenVolumeSlider.value) / 100;

    console.log("DOMContentLoaded: Variables globales initialisées.");


    // Appeler une fois au chargement pour initialiser toutes les valeurs et affichages
    // Cela garantit que l'interface reflète les valeurs par défaut HTML
    // Le redémarrage de l'intervalle/audio n'est PAS déclenché ici
    validateAndSetFrequency(carrierFrequencyInput, carrierFrequencySlider, false); 
    validateAndSetFrequency(blinkFrequencyInput, blinkRateSlider, true); 
    console.log("DOMContentLoaded: validateAndSetFrequency appelé une fois au chargement.");

    // Afficher le modal d'avertissement au démarrage
    if (warningModal) { // S'assurer que le modal existe avant de tenter de l'afficher
        warningModal.style.display = 'flex'; 
        console.log("DOMContentLoaded: Fenêtre d'avertissement affichée au démarrage.");
    } else {
        console.error("DOMContentLoaded: L'élément warningModal n'a pas été trouvé.");
    }


    startButton.addEventListener('click', () => {
        console.log("startButton: Bouton Démarrer/Arrêter cliqué.");
        initAudioContext(); // Initialiser AudioContext UNIQUEMENT au clic du bouton de démarrage
        
        // Mettre à jour et valider les fréquences immédiatement
        validateAndSetFrequency(carrierFrequencyInput, carrierFrequencySlider, false);
        validateAndSetFrequency(blinkFrequencyInput, blinkRateSlider, true);

        if (intervalId) {
            // Arrêter l'animation
            console.log("startButton: Arrêt de l'animation.");
            clearInterval(intervalId);
            intervalId = null;
            startButton.textContent = "Démarrer / Arrêter";
            leftPanel.innerHTML = ''; // Nettoyer les panneaux
            rightPanel.innerHTML = '';
            leftPanel.style.backgroundColor = 'black';
            rightPanel.style.backgroundColor = 'black';
            stopBinauralBeats(); // Arrêter les sons continus
        } else {
            // Démarrer l'animation
            console.log("startButton: Démarrage de l'animation.");
            if (currentAudioMode === 'binaural' || currentAudioMode === 'both') {
                startBinauralBeats();
            }
            updateVisuals(); // Afficher la première frame immédiatement
            intervalId = setInterval(updateVisuals, BLINK_INTERVAL_MS);
            startButton.textContent = "Arrêter";
        }
    });

    // Écouteurs pour Fréquence Porteuse (Curseur et Champ Numérique)
    carrierFrequencySlider.addEventListener('input', () => {
        console.log("Curseur Fréquence Porteuse bougé. Valeur:", carrierFrequencySlider.value);
        // Mettre à jour l'input numérique avec la valeur du curseur
        carrierFrequencyInput.value = carrierFrequencySlider.value; 
        validateAndSetFrequency(carrierFrequencyInput, carrierFrequencySlider, false);
        // Redémarrage audio si nécessaire
        if (intervalId && (currentAudioMode === 'binaural' || currentAudioMode === 'both')) {
            startBinauralBeats();
        }
    });
    carrierFrequencyInput.addEventListener('input', () => {
        console.log("Input Fréquence Porteuse modifié. Valeur:", carrierFrequencyInput.value);
        validateAndSetFrequency(carrierFrequencyInput, carrierFrequencySlider, false);
        // Redémarrage audio si nécessaire
        if (intervalId && (currentAudioMode === 'binaural' || currentAudioMode === 'both')) {
            startBinauralBeats();
        }
    });

    // Écouteurs pour Fréquence Clignotement (Curseur et Champ Numérique)
    blinkRateSlider.addEventListener('input', () => {
        console.log("Curseur Fréquence Clignotement bougé. Valeur:", blinkRateSlider.value);
        // Mettre à jour l'input numérique avec la valeur du curseur
        blinkFrequencyInput.value = blinkRateSlider.value;
        validateAndSetFrequency(blinkFrequencyInput, blinkRateSlider, true);
        // Redémarrage animation et audio si nécessaire
        if (intervalId) { 
            clearInterval(intervalId); 
            intervalId = setInterval(updateVisuals, BLINK_INTERVAL_MS); 
        }
        if (intervalId && (currentAudioMode === 'binaural' || currentAudioMode === 'both')) {
            startBinauralBeats();
        }
    });
    blinkFrequencyInput.addEventListener('input', () => {
        console.log("Input Fréquence Clignotement modifié. Valeur:", blinkFrequencyInput.value);
        validateAndSetFrequency(blinkFrequencyInput, blinkRateSlider, true);
        // Redémarrage animation et audio si nécessaire
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
            console.log("Mode audio changé à:", currentAudioMode);
            if (intervalId) { // Si l'animation est en cours, potentiellement redémarrer les BB
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
            console.log("Multiplicateur BB changé à:", currentBBMultiplier);
            updateFrequencyDisplays(); // Mettre à jour l'affichage de la fréquence BB
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

    // Écouteurs du modal
    warningButton.addEventListener('click', () => {
        console.log("Bouton ATTENTION! cliqué.");
        warningModal.style.display = 'flex'; 
        // Mettre en pause si déjà en cours
        if (intervalId) {
            console.log("Animation mise en pause par le modal.");
            clearInterval(intervalId);
            intervalId = null;
            startButton.textContent = "Démarrer / Arrêter";
            stopBinauralBeats(); // Arrêter les sons continus
        }
    });

    closeButton.addEventListener('click', () => {
        console.log("Bouton Fermer du modal cliqué.");
        warningModal.style.display = 'none'; 
    });

    understoodButton.addEventListener('click', () => {
        console.log("Bouton J'ai compris du modal cliqué.");
        warningModal.style.display = 'none'; 
    });

    window.addEventListener('click', (event) => {
        if (event.target == warningModal) { 
            console.log("Clic en dehors du modal.");
            warningModal.style.display = 'none'; 
        }
    });
}); // Fin de DOMContentLoaded