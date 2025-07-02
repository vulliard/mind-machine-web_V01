// Global variable declarations (no DOM-dependent initializations here)
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

// --- Language Management ---
let currentLanguage = 'en'; // Default language
const translations = {
    en: {
        startButton: "Start / Stop",
        circleColor: "Circle Color :",
        carrierFrequency: "Carrier Frequency (Hz):",
        blinkFrequency: "Blink Frequency (Hz):",
        audioMode: "Audio Mode :",
        binauralBeats: "Binaural Beats",
        isochronicTones: "Isochronic Tones",
        both: "Both",
        bbMultiplier: "BB x Blink Freq :",
        bbVolume: "BB Volume :",
        isochronicVol: "Isochronic Vol :",
        warningButton: "WARNING !",
        warningTitle: "⚠️ Important Warning ⚠️",
        warningPara1: "This visual and auditory stimulation application is designed to be used **with EYES CLOSED**.",
        warningPara2: "Rapid light stimulation is very intense and can have adverse effects.",
        warningLi1: "It is **STRONGLY DISCOURAGED** for individuals prone to **photosensitive epilepsy**, even with eyes closed.",
        warningLi2: "**Not recommended for pregnant women.**",
        warningLi3: "**Not recommended for individuals with a history of neurological disorders, severe migraines, or heart problems.**",
        warningLi4: "Always start with low settings (frequency, volume) and gradually increase if desired.",
        warningLi5: "Use it in a safe and relaxed environment.",
        warningLi6: "**Stop immediately** if you experience any discomfort, nausea, headaches, dizziness, disorientation, or any other unusual symptoms.",
        warningLi7: "Do not use while driving, operating heavy machinery, or in any situation requiring sustained attention.",
        warningLi8: "For binaural beats, the use of **headphones** is essential for the effect to be perceptible.",
        warningPara3: "By using this application, you acknowledge having read and understood these warnings and assume full responsibility for your use.",
        understoodButton: "I Understand"
    },
    fr: {
        startButton: "Démarrer / Arrêter",
        circleColor: "Couleur du Cercle :",
        carrierFrequency: "Fréquence Porteuse (Hz):",
        blinkFrequency: "Fréquence Clignotement (Hz):",
        audioMode: "Mode Audio :",
        binauralBeats: "Battements Binauraux",
        isochronicTones: "Sons Isochrones",
        both: "Les Deux",
        bbMultiplier: "BB x Fréq Clignotement :",
        bbVolume: "Volume BB :",
        isochronicVol: "Volume Isochrone :",
        warningButton: "ATTENTION !",
        warningTitle: "⚠️ Avertissement Important ⚠️",
        warningPara1: "Cette application de stimulation visuelle et auditive est conçue pour être utilisée **les YEUX FERMÉS**.",
        warningPara2: "La stimulation lumineuse rapide est très intense et peut avoir des effets indésirables.",
        warningLi1: "Il est **FORTEMENT DÉCONSEILLÉ** aux personnes sujettes à l'**épilepsie photosensible**, même les yeux fermés.",
        warningLi2: "**Déconseillé aux femmes enceintes.**",
        warningLi3: "**Déconseillé aux personnes ayant des antécédents de troubles neurologiques, de migraines sévères ou de problèmes cardiaques.**",
        warningLi4: "Commencez toujours avec des réglages bas (fréquence, volume) et augmentez progressivement si désiré.",
        warningLi5: "Utilisez-le dans un environnement sûr et détendu.",
        warningLi6: "**Arrêtez immédiatement** si vous ressentez un inconfort, des nausées, des maux de tête, des vertiges, une désorientation ou tout autre symptôme inhabituel.",
        warningLi7: "Ne pas utiliser en conduisant, en utilisant des machines lourdes, ou dans toute situation nécessitant une attention soutenue.",
        warningLi8: "Pour les battements binauraux, l'utilisation d'un **casque audio** est indispensable pour que l'effet soit perceptible.",
        warningPara3: "En utilisant cette application, vous reconnaissez avoir lu et compris ces avertissements et assumez l'entière responsabilité de votre utilisation.",
        understoodButton: "J'ai compris"
    }
};

function setLanguage(lang) {
    currentLanguage = lang;
    document.querySelectorAll('[data-en]').forEach(element => {
        const enText = element.getAttribute('data-en');
        const frText = element.getAttribute('data-fr');
        
        if (lang === 'en') {
            // Special handling for the startButton and warningButton
            if (element.id === 'startButton') {
                element.textContent = intervalId ? "Stop" : translations.en.startButton;
            } else if (element.id === 'warningButton') {
                element.textContent = translations.en.warningButton;
            }
            else {
                element.textContent = enText;
            }
        } else { // lang === 'fr'
            if (element.id === 'startButton') {
                element.textContent = intervalId ? "Arrêter" : translations.fr.startButton;
            } else if (element.id === 'warningButton') {
                element.textContent = translations.fr.warningButton;
            }
            else {
                element.textContent = frText;
            }
        }
    });

    // Update specific elements that don't use data attributes for text content
    document.querySelector('#app-title h1').textContent = "e-mindmachine"; // Title remains constant
    document.querySelector('#app-title p').textContent = "by PHV"; // Subtitle remains constant

    // Special handling for dynamic content in the warning modal paragraphs and list items
    document.querySelector('#warningModal h2').textContent = translations[lang].warningTitle;
    document.querySelector('#warningModal p:nth-of-type(1)').innerHTML = translations[lang].warningPara1;
    document.querySelector('#warningModal p:nth-of-type(2)').innerHTML = translations[lang].warningPara2;
    document.querySelector('#warningModal ul li:nth-of-type(1)').innerHTML = translations[lang].warningLi1;
    document.querySelector('#warningModal ul li:nth-of-type(2)').innerHTML = translations[lang].warningLi2;
    document.querySelector('#warningModal ul li:nth-of-type(3)').innerHTML = translations[lang].warningLi3;
    document.querySelector('#warningModal ul li:nth-of-type(4)').innerHTML = translations[lang].warningLi4;
    document.querySelector('#warningModal ul li:nth-of-type(5)').innerHTML = translations[lang].warningLi5;
    document.querySelector('#warningModal ul li:nth-of-type(6)').innerHTML = translations[lang].warningLi6;
    document.querySelector('#warningModal ul li:nth-of-type(7)').innerHTML = translations[lang].warningLi7;
    document.querySelector('#warningModal ul li:nth-of-type(8)').innerHTML = translations[lang].warningLi8;
    document.querySelector('#warningModal p:nth-of-type(3)').innerHTML = translations[lang].warningPara3;
    document.getElementById('understoodButton').textContent = translations[lang].understoodButton;

    // Update fieldset legends and radio button labels
    document.querySelector('.audio-mode legend').textContent = translations[lang].audioMode;
    document.querySelector('label[for="mode-binaural"]').textContent = translations[lang].binauralBeats;
    document.querySelector('label[for="mode-isochronen"]').textContent = translations[lang].isochronicTones;
    document.querySelector('label[for="mode-both"]').textContent = translations[lang].both;

    document.querySelector('.binaural-sync-multiplier legend').textContent = translations[lang].bbMultiplier;
    document.querySelector('label[for="binauralVolumeSlider"]').textContent = translations[lang].bbVolume;
    document.querySelector('label[for="isochronenVolumeSlider"]').textContent = translations[lang].isochronicVol;

    // Update the start/stop button text based on current state and language
    if (startButton.textContent === "Arrêter" || startButton.textContent === "Stop") {
        startButton.textContent = lang === 'en' ? "Stop" : "Arrêter";
    } else {
        startButton.textContent = lang === 'en' ? "Start / Stop" : "Démarrer / Arrêter";
    }

    // Highlight the active flag
    document.querySelectorAll('.lang-flag').forEach(flag => {
        if (flag.dataset.lang === lang) {
            flag.classList.add('active');
        } else {
            flag.classList.remove('active');
        }
    });
}


// --- Global DOM References (declared here, assigned within DOMContentLoaded) ---
let leftPanel, centerPanel, rightPanel, startButton, colorPicker;
let carrierFrequencySlider, carrierFrequencyInput; 
let blinkRateSlider, blinkFrequencyInput; 
let radioBinaural, radioIsochronen, radioBoth, audioModeRadios;
let bbMultiplierRadios;
let binauralVolumeSlider, isochronenVolumeSlider;
let binauralBeatFrequencyDisplay;
let warningButton, warningModal, closeButton, understoodButton;
let flagFr, flagEn; // New: Flag image references


// --- Global Functions (defined outside DOMContentLoaded) ---

function initAudioContext() {
    if (!audioContext) { 
        console.log("initAudioContext: Initializing AudioContext...");
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            masterGainNode = audioContext.createGain();
            masterGainNode.connect(audioContext.destination);
            masterGainNode.gain.setValueAtTime(0.5, audioContext.currentTime); 
            console.log("initAudioContext: AudioContext initialized.");
        } catch (e) {
            console.error('initAudioContext: Web Audio API not supported or could not be initialized:', e);
            alert('Your browser does not support or could not initialize the Audio API. Please try with another browser (e.g., Chrome, Firefox).');
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
         console.warn("startBinauralBeats: Binaural beat frequency too high for current carrier frequency. Sound may be inaudible.");
    }

    const freqLeftEar = currentCarrierFrequency - (effectiveBinauralBeatFreq / 2);
    const freqRightEar = currentCarrierFrequency + (effectiveBinauralBeatFreq / 2);
    
    if (freqLeftEar <= 0 || freqRightEar <= 0) {
        console.warn(`startBinauralBeats: Calculated ear frequency invalid (<= 0). Left: ${freqLeftEar}, Right: ${freqRightEar}. Not starting binaural beats.`);
        return; 
    }
    console.log(`startBinauralBeats: Ear frequencies: Left=${freqLeftEar.toFixed(2)}Hz, Right=${freqRightEar.toFixed(2)}Hz. Beat=${effectiveBinauralBeatFreq.toFixed(2)}Hz`);


    if (!audioContext) {
        console.error("startBinauralBeats: AudioContext not initialized.");
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
    console.log("startBinauralBeats: Binaural beats started.");
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
    console.log("stopBinauralBeats: Binaural beats stopped.");
}

function playSound(panDirection) {
    initAudioContext(); 

    if (!audioContext) {
        console.error("playSound: AudioContext not initialized.");
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
        console.log("playSound: Isochronic tone played.");
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
    //console.log("updateVisuals: Visuals updated. BLINK_INTERVAL_MS:", BLINK_INTERVAL_MS);
}

function updateFrequencyDisplays() {
    // Vérifier si les éléments d'input sont définis avant d'accéder à .value
    if (!blinkFrequencyInput || !carrierFrequencyInput || !binauralBeatFrequencyDisplay) {
        console.error("updateFrequencyDisplays: A frequency display element is null. Cannot update.");
        return;
    }
    blinkFrequencyInput.value = BLINK_FREQUENCY_HZ.toFixed(1); 
    carrierFrequencyInput.value = currentCarrierFrequency; 
    
    const bbFreq = getSynchronizedBinauralBeatFrequency();
    binauralBeatFrequencyDisplay.textContent = `BB: ${bbFreq.toFixed(1)} Hz`;
    //console.log("updateFrequencyDisplays: Frequency displays updated.");
}

// Global flag to prevent re-triggering input events
let isUpdatingSliderProgrammatically = false;

function validateAndSetFrequency(inputElement, sliderElement, isBlinkFreq) {
    // Vérifier si les éléments sont valides avant de continuer
    if (!inputElement || !sliderElement) {
        console.error(`validateAndSetFrequency: Input element (${inputElement ? inputElement.id : 'null'}) or slider (${sliderElement ? sliderElement.id : 'null'}) not defined. Cannot validate or update.`);
        return;
    }

    // Protection contre la boucle infinie
    if (isUpdatingSliderProgrammatically) {
        console.log("validateAndSetFrequency: Ignored (programmatic update for " + inputElement.id + ").");
        return; 
    }

    let newValue = parseFloat(inputElement.value); // Read value from the number input field
    const minVal = parseFloat(inputElement.min);
    const maxVal = parseFloat(inputElement.max);

    console.log(`validateAndSetFrequency: Validating ${inputElement.id}. Raw value: ${inputElement.value}, Parsed: ${newValue}. Min: ${minVal}, Max: ${maxVal}.`);


    if (isNaN(newValue) || newValue < minVal || newValue > maxVal) {
        console.warn(`validateAndSetFrequency: Invalid or out-of-bounds value (${newValue}). Must be between ${minVal} and ${maxVal} Hz. Using slider value as fallback.`);
        newValue = parseFloat(sliderElement.value); // Fallback vers la valeur du curseur
        // Assurez-vous que la valeur du curseur est aussi dans la plage valide
        if (isNaN(newValue) || newValue < minVal || newValue > maxVal) {
            newValue = minVal; // Fallback ultime à la valeur minimale
            console.warn(`validateAndSetFrequency: Valeur du curseur (${sliderElement.id}) aussi invalide. Forçage à min.`);
        }
        inputElement.value = isBlinkFreq ? newValue.toFixed(1) : newValue; // Met à jour l'input textuel avec la valeur corrigée
        // sliderElement.value sera mis à jour plus bas
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
    
    // Get references to the new flag images
    flagFr = document.getElementById('flag-fr');
    flagEn = document.getElementById('flag-en');

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

    // Set initial language based on the default `currentLanguage`
    setLanguage(currentLanguage);

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
            startButton.textContent = currentLanguage === 'en' ? "Start / Stop" : "Démarrer / Arrêter";
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
            startButton.textContent = currentLanguage === 'en' ? "Stop" : "Arrêter";
        }
    });

    // Écouteurs pour Fréquence Porteuse (Curseur et Champ Numérique)
    carrierFrequencySlider.addEventListener('input', () => {
        console.log("Curseur Fréquence Porteuse bougé. Valeur:", carrierFrequencySlider.value);
        // Met explicitement à jour la valeur de l'input numérique
        carrierFrequencyInput.value = carrierFrequencySlider.value; 
        validateAndSetFrequency(carrierFrequencyInput, carrierFrequencySlider, false);
        // Redémarrage audio si nécessaire
        if (intervalId && (currentAudioMode === 'binaural' || currentAudioMode === 'both')) {
            startBinauralBeats();
        }
    });
    
    // NOUVEAU : Écouteur pour le champ de saisie de la fréquence porteuse
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
        // Met explicitement à jour la valeur de l'input numérique
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

    // NOUVEAU : Écouteur pour le champ de saisie de la fréquence de clignotement
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
            startButton.textContent = currentLanguage === 'en' ? "Start / Stop" : "Démarrer / Arrêter";
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

    // Language flag event listeners
    flagFr.addEventListener('click', () => {
        setLanguage('fr');
    });

    flagEn.addEventListener('click', () => {
        setLanguage('en');
    });

}); // Fin de DOMContentLoaded