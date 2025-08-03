// Global variable declarations
let isLeftLight = false;
let visualTimeoutId = null; 
let BLINK_FREQUENCY_HZ;
let audioContext = null;
let masterGainNode = null;
let currentCarrierFrequency;
let currentBBMultiplier;
let currentAudioMode;
let currentBinauralVolume;
let currentIsochronicVolume;
let currentAlternophonyVolume;
let currentLanguage = 'en';
let currentSession = 'manual';
let sessionTimeoutId = null;
let rampIntervalId = null; 
let htmlFadeInterval = null;
let currentBlinkMode = 'alternating';
let currentVisualMode = 'circle';
let lastBlinkTime = 0;
let isLightPhase = true; 

let eegSocket = null;

// Audio nodes
let binauralOscillatorLeft = null;
let binauralOscillatorRight = null;
let binauralMasterGain = null;
let isochronicOscillator = null;
let isochronicEnvelopeGain = null;
let isochronicPanner = null;
let isochronicMasterGain = null;
let crackleIsPlaying = false;
let crackleTimeoutId = null;
let crackleNoiseBuffer = null;
let crackleVolumeNode = null;
let alternophonyIsPlaying = false;
let alternophonyNoiseNode = null;
let alternophonyEnvelopeGain = null;
let alternophonyPannerNode = null;
let alternophonyMasterGain = null;

const musicLoopAudio = new Audio();
musicLoopAudio.loop = true;
let musicIsPlaying = false;

// Variables for generated waves
let waveIsPlaying = false;
let waveRumbleNode = null;
let waveHissNode = null;
let waveMasterVolume = null;
let waveLfoNode = null;
let waveMetaLfoNode = null;

// Ambiance system variables
let currentAmbiance = null;
let ambianceIsPlaying = false;

const SOUND_DURATION_S = 0.02;

const uiTranslations = {
    blinkModes: {
        alternating: { en: 'Alternating', fr: 'Alterné', de: 'Abwechselnd', es: 'Alterno', it: 'Alternato', nl: 'Afwisselend' },
        synchro: { en: 'Synchro', fr: 'Synchro', de: 'Synchron', es: 'Sincro', it: 'Sincro', nl: 'Synchro' },
        crossed: { en: 'Crossed', fr: 'Croisé', de: 'Gekreuzt', es: 'Cruzado', it: 'Incrociato', nl: 'Gekruist' },
        balanced: { en: 'Balanced', fr: 'Équilibré', de: 'Ausgeglichen', es: 'Equilibrado', it: 'Bilanciato', nl: 'Gebalanceerd' }
    }
};

const sophrologyTexts = {
    fr: {
        sommeil: `Bonjour et bienvenue dans cette séance conçue pour vous accompagner vers un sommeil profond et réparateur. Prenez le temps de vous installer le plus confortablement possible, dans la pénombre, prêt à vous laisser aller. ... ... ... Fermez doucement les yeux, et laissez le monde extérieur s'estomper... ... ... ... Portez maintenant toute votre attention sur votre respiration. Sentez l'air frais qui entre par vos narines... et le souffle tiède qui en ressort. ... ... ... Inspirez le calme... et à chaque expiration, imaginez que vous soufflez au loin les tensions, les soucis, les pensées de la journée... Chaque expiration est un soupir de soulagement qui vous enfonce un peu plus dans la détente... ... ... ... Nous allons maintenant relâcher chaque partie de votre corps. Prenez conscience de votre tête, de votre visage. Relâchez votre front, laissez-le devenir lisse, sans expression. Desserrez vos mâchoires, laissez vos dents se séparer légèrement. Votre langue se dépose tranquillement dans votre bouche. ... ... ... Sentez vos épaules devenir lourdes, et s'éloigner de vos oreilles. Relâchez vos bras, vos coudes, vos poignets, jusqu'au bout de vos doigts. Vos bras sont lourds, très lourds, complètement détendus. ... ... ... Portez attention à votre dos. Sentez chaque vertèbre se déposer, se relâcher sur le support. Libérez toutes les tensions accumulées dans votre dos. ... ... ... Votre poitrine et votre ventre se soulèvent et s'abaissent au rythme calme de votre respiration. Votre cœur bat tranquillement, sereinement. ... ... ... Relâchez votre bassin, vos hanches. Sentez vos jambes devenir lourdes et totalement passives... des genoux jusqu'aux chevilles... et jusqu'à la pointe de vos pieds. ... ... ... Votre corps tout entier est maintenant lourd, détendu, et prêt pour le repos. ... ... ... Imaginez maintenant un escalier devant vous. Un escalier magnifique, doux et accueillant. Il descend en spirale vers un lieu de calme et de silence absolu. ... ... ... Nous allons le descendre ensemble. Chaque marche vous emmène plus profondément dans la relaxation, plus près du sommeil. ... ... ... Dix... Neuf... Huit... vous êtes de plus en plus calme... Sept... Six... Cinq... votre esprit s'apaise... Quatre... Trois... Deux... vous êtes aux portes du sommeil... Un... ... ... ... Vous voici au bas de l'escalier. Vous entrez dans un jardin de nuit, baigné par la douce lumière d'une lune bienveillante. L'air est frais et pur. C'est votre sanctuaire de repos. ... ... ... Au centre de ce jardin se trouve le lit le plus confortable que vous puissiez imaginer. Approchez-vous... Allongez-vous... et sentez la douceur des draps, le moelleux de l'oreiller. ... ... ... Ici, dans ce lieu magique, rien ne peut vous déranger. Vous êtes complètement en sécurité, enveloppé de calme. ... ... ... Chaque son lointain, chaque sensation, devient une berceuse qui vous guide encore plus profondément vers le sommeil. ... ... ... Laissez-vous aller maintenant... Laissez votre esprit se dissoudre dans le repos... et votre corps se régénérer. Glissez doucement... paisiblement... dans un sommeil profond, continu, et merveilleusement réparateur. Dormez bien.`,
        relaxation: `Bonjour. Prenez le temps de vous installer dans une position confortable, et fermez les yeux. ... ... ... Aujourd'hui, nous allons relâcher toutes les tensions, une par une. ... ... ... Commencez par prendre une grande inspiration... et expirez lentement, très lentement... Sentez vos épaules se détendre... votre mâchoire se desserrer... votre front se lisser... ... ... ... Imaginez que chaque partie de votre corps est une bougie, et que votre souffle est une douce brise qui vient éteindre la flamme de la tension... ... ... ... D'abord vos pieds... puis vos jambes... elles deviennent lourdes et détendues... Votre bassin... votre ventre... votre dos... tout se relâche... ... ... ... Votre poitrine s'ouvre, votre cœur bat calmement... vos bras, vos mains, jusqu'au bout de vos doigts, sont complètement relâchés... ... ... ... Visualisez maintenant une plage de sable chaud, au coucher du soleil. Le bruit des vagues est un rythme lent et régulier qui vous berce. La chaleur douce du sable détend chaque muscle de votre corps... Vous êtes parfaitement bien... en paix... ... ... ... Profitez de cet instant de calme total... Ancrez cette sensation de détente profonde en vous... Vous pouvez y revenir chaque fois que vous en aurez besoin...`,
        antiStress: `Bienvenue dans cette séance pour apaiser le stress et retrouver votre calme intérieur. Asseyez-vous ou allongez-vous confortablement. Fermez les yeux. ... ... ... Prenez conscience des points de contact de votre corps avec le support... Sentez le sol, la chaise, le lit qui vous soutient... Vous êtes en sécurité. ... ... ... Portez maintenant votre attention sur votre respiration. Sans la forcer, observez-la. ... ... ... Imaginez qu'à chaque inspiration, vous inhalez un air pur et calme, de couleur bleue... Et à chaque expiration, vous soufflez un nuage gris qui contient toutes vos tensions, vos soucis, votre stress... ... ... ... Inspirez le calme... Expirez le stress... Continuez ce cycle. ... ... ... Visualisez maintenant une bulle de protection tout autour de vous. Une bulle de sérénité. À l'intérieur de cette bulle, rien ne peut vous atteindre. Les bruits extérieurs, les pensées agitées, tout reste à l'extérieur. Ici, vous êtes souverain, vous êtes calme. ... ... ... Répétez intérieurement : 'Je suis calme... je suis serein(e)... je gère la situation avec confiance.' ... ... ... Sentez cette force tranquille grandir en vous. Le stress n'a plus de prise. Vous êtes centré(e), ancré(e) et prêt(e) à faire face aux défis avec une nouvelle perspective.`,
        meditation: `Bonjour et bienvenue. Cette séance est une invitation à vous reconnecter avec l'instant présent. Trouvez une posture digne et confortable. Fermez les yeux. ... ... ... Portez simplement votre attention sur les sensations de votre respiration... l'air qui entre par vos narines... le mouvement de votre abdomen... sans chercher à changer quoi que ce soit... juste en observant. ... ... ... Votre esprit va probablement s'évader. C'est normal. Chaque fois que vous remarquez que vos pensées sont parties ailleurs, ramenez doucement, et sans jugement, votre attention sur votre souffle. C'est l'exercice même de la méditation. ... ... ... Il n'y a rien à réussir, rien à atteindre. Juste être là, présent à ce qui est. ... ... ... Soyez conscient des sons autour de vous... des sensations dans votre corps... des pensées qui passent comme des nuages dans le ciel... ... ... ... Vous n'êtes pas vos pensées, vous êtes celui ou celle qui les observe. Restez dans cet espace de pure conscience, un observateur silencieux et paisible... ... ... ... Chaque instant est une nouvelle occasion de revenir ici et maintenant. Profitez de ce silence intérieur, de cette clarté... C'est votre nature profonde.`,
        arretTabac: `Bonjour. Aujourd'hui, vous renforcez votre décision de vous libérer du tabac. Installez-vous confortablement et fermez les yeux. ... ... ... Prenez trois grandes respirations... et à chaque expiration, relâchez les tensions et le besoin de fumer... Vous avez pris une décision pour votre santé, pour votre liberté. Soyez fier de ce choix. ... ... ... Visualisez maintenant deux chemins devant vous. L'un est gris, enfumé, c'est le chemin de la dépendance. L'autre est lumineux, plein d'air pur, c'est le chemin de la liberté. Sentez la différence. ... ... ... Ressentez l'odeur de l'air frais, la vitalité dans vos poumons, l'énergie qui circule dans votre corps sur ce chemin lumineux. ... ... ... Imaginez-vous dans quelques semaines, quelques mois... sans tabac. Ressentez la fierté. Sentez votre souffle plus ample, votre odorat plus fin, votre énergie décuplée. ... ... ... À chaque envie de fumer qui pourrait apparaître, vous disposez d'une ancre. Posez une main sur votre ventre, et respirez profondément trois fois. Rappelez-vous cette image du chemin lumineux. ... ... ... Vous êtes plus fort que cette vieille habitude. Chaque jour sans tabac est une victoire. Vous respirez la vie. Vous êtes libre.`,
        amincissement: `Bonjour. Bienvenue dans cette séance dédiée à l'harmonisation de votre corps et de votre esprit. Installez-vous confortablement... fermez les yeux... et respirez profondément... ... ... ... À chaque expiration, laissez partir les jugements sur votre corps, les frustrations, les régimes passés... Accueillez-vous avec bienveillance, ici et maintenant. ... ... ... Prenez conscience de votre corps, de sa forme, de sa présence... sans jugement, avec gratitude... C'est votre véhicule pour la vie. ... ... ... Imaginez maintenant une douce lumière dorée qui entre par le sommet de votre crâne. C'est une lumière de guérison, d'acceptation et d'énergie. Elle descend lentement, remplissant chaque cellule de votre corps d'une sensation de bien-être. ... ... ... Cette lumière vous aide à vous reconnecter à vos véritables sensations de faim et de satiété. Elle vous guide vers des choix alimentaires sains, qui nourrissent et respectent votre corps. ... ... ... Visualisez la personne que vous souhaitez devenir : pleine d'énergie, à l'aise dans son corps, en paix avec la nourriture. Voyez-vous bouger avec aisance, faire des activités que vous aimez. Cette image est en vous. ... ... ... Votre corps sait ce qui est bon pour lui. Écoutez-le. Faites-lui confiance. Chaque jour, vous faites des choix conscients et bienveillants pour votre bien-être. Vous êtes en harmonie avec vous-même.`,
        douleur: `Bonjour. Cette séance est un espace pour vous aider à gérer la sensation de douleur. Installez-vous aussi confortablement que votre corps vous le permet aujourd'hui. Fermez les yeux et laissez votre souffle trouver un rythme naturel et apaisant. ... ... ... Pour commencer, nous n'allons pas nous concentrer sur la douleur, mais sur le confort. Parcourez mentalement votre corps et trouvez une zone qui, en ce moment même, est neutre, ou même agréable. Peut-être la chaleur de vos mains... la sensation de vos cheveux sur votre front... ou le contact de vos pieds avec le sol. ... ... ... Choisissez une de ces zones, et plongez votre conscience à l'intérieur. Explorez cette sensation de non-douleur, de confort. À chaque inspiration, imaginez que cette sensation de bien-être grandit, s'amplifie, s'étend un peu plus. Laissez-la devenir une ressource, une ancre de calme dans votre corps. ... ... ... Maintenant, avec cette ressource de confort bien présente, vous pouvez laisser la zone de douleur entrer dans votre champ de conscience. Sans peur, sans jugement. Observez la sensation de loin, comme un scientifique observe un phénomène. ... ... ... Donnez-lui une forme, une couleur, une texture. Est-elle chaude, froide ? Piquante, sourde ? Dense, diffuse ? Simplement observer, sans la juger 'mauvaise'. ... ... ... Maintenant, utilisez votre respiration comme un outil de transformation. Imaginez qu'à chaque inspiration, vous puisez dans votre zone de confort et vous envoyez un souffle de douceur et de chaleur vers la zone douloureuse. ... ... ... Et à chaque expiration, imaginez que la sensation douloureuse perd un peu de son intensité. Visualisez sa couleur qui devient plus pâle, plus transparente. Ses bords, qui étaient peut-être nets et durs, deviennent flous et mous. ... ... ... Continuez ce processus... Inspirez le confort vers la douleur... Expirez pour la dissoudre, la diffuser, l'adoucir. Vous pouvez aussi imaginer que la sensation se transforme. Une plaque de glace qui fond sous un soleil doux... un nœud serré qui se desserre fibre par fibre... ... ... ... Vous n'êtes pas votre douleur. Vous êtes la conscience qui l'observe et qui a le pouvoir de la moduler. Vous reprenez le contrôle non pas par la lutte, mais par la douceur et l'attention. Continuez de respirer. Vous êtes en sécurité.`,
        alcool: `Bonjour. Prenez ce moment pour vous, pour reconnaître le chemin que vous parcourez et la force de votre décision. Installez-vous dans une position confortable, fermez les yeux. ... ... ... Prenez une grande et profonde inspiration, et en expirant, laissez aller les tensions de la journée. Une deuxième fois, inspirez la fierté de votre choix... et expirez le poids du passé. Une dernière fois, inspirez le calme... et expirez toute agitation. ... ... ... Prenez conscience de votre corps, ici, maintenant. Sentez la clarté qui revient dans votre esprit. Sentez la vitalité qui s'installe dans vos cellules, jour après jour. Votre corps se régénère, il vous remercie pour ce respect que vous lui accordez. ... ... ... Visualisez une lumière blanche et pure qui entre par le sommet de votre tête. C'est une lumière de clarté, de pureté. Elle descend en vous, nettoyant tout sur son passage. Elle nettoie vos pensées, votre gorge, votre poitrine, votre foie, votre sang... Elle emporte avec elle toutes les mémoires toxiques et vous laisse propre, renouvelé, plein d'une énergie saine. ... ... ... L'envie, ou le besoin, est une pensée, une vieille habitude neurologique. Ce n'est pas vous. Vous avez le pouvoir de ne pas y répondre. Imaginez que vous êtes assis au bord d'une rivière. Les envies sont comme des feuilles ou des branches qui flottent sur l'eau. Elles apparaissent en amont, passent devant vous, et continuent leur chemin en aval jusqu'à disparaître. ... ... ... Vous êtes l'observateur sur la rive. Vous n'avez pas besoin de sauter dans l'eau pour attraper chaque feuille. Vous pouvez simplement la regarder passer. Quand une envie se présente, respirez. Dites-vous : 'Je vois cette pensée. C'est juste une vague du passé.' Et comme une vague, elle montera, atteindra un pic, puis inévitablement, elle redescendra et s'éloignera. Vous, vous restez sur la rive, calme et stable. ... ... ... Maintenant, projetez-vous dans un futur proche. Imaginez-vous dans une situation sociale, entouré d'amis. Vous tenez un verre d'eau fraîche, de jus, ou de votre boisson non-alcoolisée préférée. Vous êtes parfaitement à l'aise. Vous êtes présent, votre esprit est vif, vous participez pleinement à la conversation. Vous vous sentez bien. Vous êtes en contrôle. Vous n'avez besoin de rien d'autre pour apprécier ce moment. ... ... ... Ressentez la fierté, la simplicité, la liberté de ce choix. Cette personne, c'est vous. Ancrez cette image et cette sensation en vous. C'est votre nouvelle réalité, celle que vous construisez chaque jour.`,
        confiance: `Bonjour et bienvenue dans cet espace pour renforcer votre confiance en vous. Installez-vous confortablement, fermez les yeux, et prenez une grande inspiration. En expirant, laissez aller les doutes et les peurs. ... ... ... Prenez conscience de votre posture, ici et maintenant. Redressez-vous légèrement, ouvrez vos épaules. Sentez l'ancrage de vos pieds sur le sol. Vous êtes stable, solide. ... ... ... Visualisez au centre de votre poitrine une sphère de lumière chaude et dorée. C'est le noyau de votre confiance. ... ... ... À chaque inspiration, cette sphère grandit, sa lumière devient plus intense, plus rayonnante. Elle remplit votre torse, descend dans vos bras, monte dans votre tête. Tout votre être est rempli de cette lumière de confiance. ... ... ... Pensez à un moment, même bref, où vous vous êtes senti fier de vous, compétent, en pleine possession de vos moyens. Revivez cette scène, ressentez les émotions positives. Ancrez cette sensation. ... ... ... Cette force est en vous. Elle a toujours été là. Répétez intérieurement : 'Je suis capable. Je crois en moi. Je mérite le succès et le respect.' ... ... ... Chaque jour, vous nourrissez cette lumière intérieure. Vous marchez dans le monde avec assurance et sérénité.`
    },
    en: {
        sommeil: `Hello and welcome to this session designed to guide you towards a deep and restorative sleep. Take the time to get as comfortable as possible, in the dim light, ready to let go. ... ... ... Gently close your eyes, and let the outside world fade away... ... ... ... Now, bring all your attention to your breath. Feel the cool air entering your nostrils... and the warm breath leaving. ... ... ... Breathe in calm... and with each exhale, imagine you are blowing away the tensions, the worries, the thoughts of the day... Each exhale is a sigh of relief that sinks you a little deeper into relaxation... ... ... ... We will now relax each part of your body. Become aware of your head, your face. Relax your forehead, let it become smooth, without expression. Unclench your jaw, let your teeth separate slightly. Your tongue rests peacefully in your mouth. ... ... ... Feel your shoulders becoming heavy, and moving away from your ears. Relax your arms, your elbows, your wrists, to the very tips of your fingers. Your arms are heavy, very heavy, completely relaxed. ... ... ... Pay attention to your back. Feel each vertebra setting down, relaxing on the support. Release all the accumulated tension in your back. ... ... ... Your chest and your belly rise and fall with the calm rhythm of your breath. Your heart beats quietly, serenely. ... ... ... Relax your pelvis, your hips. Feel your legs becoming heavy and totally passive... from the knees to the ankles... and to the tips of your toes. ... ... ... Your entire body is now heavy, relaxed, and ready for rest. ... ... ... Now imagine a staircase before you. A magnificent, soft, and inviting staircase. It spirals down to a place of absolute calm and silence. ... ... ... We will descend it together. Each step takes you deeper into relaxation, closer to sleep. ... ... ... Ten... Nine... Eight... you are more and more calm... Seven... Six... Five... your mind calms down... Four... Three... Two... you are at the gates of sleep... One... ... ... ... Here you are at the bottom of the stairs. You enter a night garden, bathed in the soft light of a benevolent moon. The air is fresh and pure. This is your sanctuary of rest. ... ... ... In the center of this garden is the most comfortable bed you can imagine. Come closer... Lie down... and feel the softness of the sheets, the fluffiness of the pillow. ... ... ... Here, in this magical place, nothing can disturb you. You are completely safe, wrapped in calm. ... ... ... Every distant sound, every sensation, becomes a lullaby that guides you even deeper into sleep. ... ... ... Let go now... Let your mind dissolve into rest... and your body regenerate. Gently... peacefully... drift into a deep, continuous, and wonderfully restorative sleep. Sleep well.`,
        relaxation: `Hello. Take the time to settle into a comfortable position, and close your eyes. ... ... ... Today, we will release all tensions, one by one. ... ... ... Start by taking a deep breath... and exhale slowly, very slowly... Feel your shoulders relax... your jaw loosen... your forehead smooth out... ... ... ... Imagine that each part of your body is a candle, and your breath is a gentle breeze that extinguishes the flame of tension... ... ... ... First your feet... then your legs... they become heavy and relaxed... Your pelvis... your belly... your back... everything releases... ... ... ... Your chest opens, your heart beats calmly... your arms, your hands, to the tips of your fingers, are completely relaxed... ... ... ... Now visualize a warm sandy beach at sunset. The sound of the waves is a slow, regular rhythm that lulls you. The gentle warmth of the sand relaxes every muscle in your body... You are perfectly fine... at peace... ... ... ... Enjoy this moment of total calm... Anchor this feeling of deep relaxation within you... You can return to it whenever you need...`,
        antiStress: `Welcome to this session to soothe stress and find your inner calm. Sit or lie down comfortably. Close your eyes. ... ... ... Become aware of your body's contact points with the support... Feel the floor, the chair, the bed supporting you... You are safe. ... ... ... Now, bring your attention to your breath. Without forcing it, just observe it. ... ... ... Imagine that with each inhalation, you breathe in pure, calm, blue air... And with each exhalation, you breathe out a gray cloud containing all your tensions, your worries, your stress... ... ... ... Breathe in calm... Breathe out stress... Continue this cycle. ... ... ... Now visualize a protective bubble all around you. A bubble of serenity. Inside this bubble, nothing can reach you. External noises, restless thoughts, everything stays outside. Here, you are sovereign, you are calm. ... ... ... Repeat inwardly: 'I am calm... I am serene... I handle the situation with confidence.' ... ... ... Feel this quiet strength growing within you. Stress no longer has a hold. You are centered, grounded, and ready to face challenges with a new perspective.`,
        meditation: `Hello and welcome. This session is an invitation to reconnect with the present moment. Find a dignified and comfortable posture. Close your eyes. ... ... ... Simply bring your attention to the sensations of your breath... the air entering your nostrils... the movement of your abdomen... without trying to change anything... just observing. ... ... ... Your mind will likely wander. This is normal. Whenever you notice your thoughts have gone elsewhere, gently, and without judgment, bring your attention back to your breath. This is the very exercise of meditation. ... ... ... There is nothing to achieve, nothing to attain. Just be here, present to what is. ... ... ... Be aware of the sounds around you... the sensations in your body... the thoughts passing like clouds in the sky... ... ... ... You are not your thoughts, you are the one who observes them. Remain in this space of pure consciousness, a silent and peaceful observer... ... ... ... Every moment is a new opportunity to return here and now. Enjoy this inner silence, this clarity... It is your true nature.`,
        arretTabac: `Hello. Today, you are strengthening your decision to free yourself from tobacco. Get comfortable and close your eyes. ... ... ... Take three deep breaths... and with each exhale, release the tension and the craving to smoke... You have made a decision for your health, for your freedom. Be proud of this choice. ... ... ... Now visualize two paths before you. One is gray, smoky, the path of addiction. The other is bright, full of fresh air, the path of freedom. Feel the difference. ... ... ... Feel the smell of fresh air, the vitality in your lungs, the energy flowing through your body on this bright path. ... ... ... Imagine yourself in a few weeks, a few months... without tobacco. Feel the pride. Feel your breath fuller, your sense of smell sharper, your energy boosted. ... ... ... Whenever a craving might appear, you have an anchor. Place a hand on your belly, and breathe deeply three times. Remember this image of the bright path. ... ... ... You are stronger than this old habit. Every day without tobacco is a victory. You are breathing life. You are free.`,
        amincissement: `Hello. Welcome to this session dedicated to harmonizing your body and mind. Get comfortable... close your eyes... and breathe deeply... ... ... ... With each exhale, let go of judgments about your body, frustrations, past diets... Welcome yourself with kindness, here and now. ... ... ... Become aware of your body, its shape, its presence... without judgment, with gratitude... It is your vehicle for life. ... ... ... Now imagine a soft golden light entering through the top of your head. It is a light of healing, acceptance, and energy. It slowly descends, filling every cell of your body with a sense of well-being. ... ... ... This light helps you reconnect with your true feelings of hunger and satiety. It guides you towards healthy food choices that nourish and respect your body. ... ... ... Visualize the person you want to become: full of energy, comfortable in your body, at peace with food. See yourself moving with ease, doing activities you love. This image is within you. ... ... ... Your body knows what is good for it. Listen to it. Trust it. Every day, you make conscious and kind choices for your well-being. You are in harmony with yourself.`,
        douleur: `Hello. This session is a space to help you manage the sensation of pain. Make yourself as comfortable as your body allows today. Close your eyes and let your breath find a natural and soothing rhythm. ... ... ... To begin, we will not focus on the pain, but on comfort. Mentally scan your body and find an area that, right now, is neutral, or even pleasant. Perhaps the warmth of your hands... the sensation of your hair on your forehead... or the contact of your feet with the floor. ... ... ... Choose one of these areas, and immerse your consciousness within it. Explore this sensation of non-pain, of comfort. With each inhalation, imagine this feeling of well-being growing, amplifying, expanding a little more. Let it become a resource, an anchor of calm in your body. ... ... ... Now, with this resource of comfort firmly present, you can allow the area of pain to enter your field of awareness. Without fear, without judgment. Observe the sensation from a distance, like a scientist observing a phenomenon. ... ... ... Give it a shape, a color, a texture. Is it hot, cold? Sharp, dull? Dense, diffuse? Simply observe, without judging it as 'bad'. ... ... ... Now, use your breath as a tool for transformation. Imagine that with each inhalation, you draw from your comfort zone and send a breath of softness and warmth towards the painful area. ... ... ... And with each exhalation, imagine that the painful sensation loses some of its intensity. Visualize its color becoming paler, more transparent. Its edges, which were perhaps sharp and hard, become blurry and soft. ... ... ... Continue this process... Breathe comfort towards the pain... Exhale to dissolve, diffuse, and soften it. You can also imagine the sensation transforming. A block of ice melting under a gentle sun... a tight knot loosening fiber by fiber... ... ... ... You are not your pain. You are the consciousness that observes it and has the power to modulate it. You regain control not through struggle, but through gentleness and attention. Continue to breathe. You are safe.`,
        alcool: `Hello. Take this moment for yourself, to acknowledge the path you are on and the strength of your decision. Get into a comfortable position, close your eyes. ... ... ... Take a big, deep breath, and as you exhale, let go of the day's tensions. A second time, breathe in the pride of your choice... and breathe out the weight of the past. One last time, breathe in calm... and breathe out all agitation. ... ... ... Become aware of your body, here, now. Feel the clarity returning to your mind. Feel the vitality settling into your cells, day after day. Your body is regenerating, it thanks you for the respect you are giving it. ... ... ... Visualize a pure white light entering through the top of your head. It is a light of clarity, of purity. It descends into you, cleansing everything in its path. It cleanses your thoughts, your throat, your chest, your liver, your blood... It carries away all toxic memories and leaves you clean, renewed, full of healthy energy. ... ... ... The craving, or the need, is a thought, an old neurological habit. It is not you. You have the power not to respond to it. Imagine you are sitting by a river. Cravings are like leaves or branches floating on the water. They appear upstream, pass in front of you, and continue their way downstream until they disappear. ... ... ... You are the observer on the bank. You do not need to jump into the water to catch every leaf. You can simply watch it go by. When a craving arises, breathe. Tell yourself: 'I see this thought. It's just a wave from the past.' And like a wave, it will rise, reach a peak, and then inevitably, it will recede and move away. You, you remain on the bank, calm and stable. ... ... ... Now, project yourself into the near future. Imagine yourself in a social situation, surrounded by friends. You are holding a glass of fresh water, juice, or your favorite non-alcoholic drink. You are perfectly at ease. You are present, your mind is sharp, you are fully participating in the conversation. You feel good. You are in control. You don't need anything else to enjoy this moment. ... ... ... Feel the pride, the simplicity, the freedom of this choice. This person is you. Anchor this image and this feeling within you. This is your new reality, the one you are building every day.`,
        confiance: `Hello and welcome to this space to strengthen your self-confidence. Settle in comfortably, close your eyes, and take a deep breath. As you exhale, let go of doubts and fears. ... ... ... Become aware of your posture, here and now. Straighten up slightly, open your shoulders. Feel the grounding of your feet on the floor. You are stable, solid. ... ... ... Visualize in the center of your chest a sphere of warm, golden light. This is the core of your confidence. ... ... ... With each breath, this sphere grows, its light becomes more intense, more radiant. It fills your torso, flows down your arms, rises into your head. Your entire being is filled with this light of confidence. ... ... ... Think of a moment, however brief, when you felt proud of yourself, competent, in full command of your abilities. Relive that scene, feel the positive emotions. Anchor that feeling. ... ... ... This strength is within you. It has always been there. Repeat inwardly: 'I am capable. I believe in myself. I deserve success and respect.' ... ... ... Every day, you nourish this inner light. You walk in the world with assurance and serenity.`
    },
    de: {
        sommeil: `Hallo und willkommen zu dieser Sitzung, die Sie in einen tiefen und erholsamen Schlaf begleiten soll. Machen Sie es sich so bequem wie möglich, im Halbdunkel, bereit loszulassen. ... ... ... Schließen Sie sanft Ihre Augen und lassen Sie die Außenwelt verblassen... ... ... ... Richten Sie nun Ihre ganze Aufmerksamkeit auf Ihren Atem. Spüren Sie die kühle Luft, die durch Ihre Nasenlöcher einströmt... und den warmen Atem, der wieder ausströmt. ... ... ... Atmen Sie Ruhe ein... und stellen Sie sich bei jedem Ausatmen vor, wie Sie die Anspannungen, Sorgen und Gedanken des Tages wegblasen... Jedes Ausatmen ist ein Seufzer der Erleichterung, der Sie ein wenig tiefer in die Entspannung sinken lässt... ... ... ... Wir werden nun jeden Teil Ihres Körpers entspannen. Nehmen Sie Ihren Kopf, Ihr Gesicht wahr. Entspannen Sie Ihre Stirn, lassen Sie sie glatt und ausdruckslos werden. Lockern Sie Ihren Kiefer, lassen Sie Ihre Zähne sich leicht voneinander lösen. Ihre Zunge liegt ruhig in Ihrem Mund. ... ... ... Spüren Sie, wie Ihre Schultern schwer werden und sich von Ihren Ohren entfernen. Entspannen Sie Ihre Arme, Ihre Ellbogen, Ihre Handgelenke, bis in die Fingerspitzen. Ihre Arme sind schwer, sehr schwer, völlig entspannt. ... ... ... Achten Sie auf Ihren Rücken. Spüren Sie, wie sich jeder Wirbel ablegt, sich auf der Unterlage entspannt. Lassen Sie alle angesammelten Spannungen im Rücken los. ... ... ... Ihre Brust und Ihr Bauch heben und senken sich im ruhigen Rhythmus Ihres Atems. Ihr Herz schlägt ruhig und gelassen. ... ... ... Entspannen Sie Ihr Becken, Ihre Hüften. Spüren Sie, wie Ihre Beine schwer und völlig passiv werden... von den Knien bis zu den Knöcheln... und bis zu den Zehenspitzen. ... ... ... Ihr ganzer Körper ist jetzt schwer, entspannt und bereit für die Ruhe. ... ... ... Stellen Sie sich nun eine Treppe vor Ihnen vor. Eine prächtige, sanfte und einladende Treppe. Sie führt spiralförmig hinab an einen Ort absoluter Ruhe und Stille. ... ... ... Wir werden sie gemeinsam hinabsteigen. Jede Stufe führt Sie tiefer in die Entspannung, näher an den Schlaf. ... ... ... Zehn... Neun... Acht... Sie werden immer ruhiger... Sieben... Sechs... Fünf... Ihr Geist beruhigt sich... Vier... Drei... Zwei... Sie stehen an der Schwelle zum Schlaf... Eins... ... ... ... Sie sind am Ende der Treppe angekommen. Sie betreten einen nächtlichen Garten, getaucht in das sanfte Licht eines wohlwollenden Mondes. Die Luft ist frisch und rein. Dies ist Ihr Zufluchtsort der Ruhe. ... ... ... In der Mitte dieses Gartens steht das bequemste Bett, das Sie sich vorstellen können. Treten Sie näher... Legen Sie sich hin... und spüren Sie die Weichheit der Laken, die Flauschigkeit des Kissens. ... ... ... Hier, an diesem magischen Ort, kann Sie nichts stören. Sie sind vollkommen sicher, in Ruhe gehüllt. ... ... ... Jeder ferne Klang, jede Empfindung wird zu einem Wiegenlied, das Sie noch tiefer in den Schlaf führt. ... ... ... Lassen Sie sich nun gehen... Lassen Sie Ihren Geist in der Ruhe aufgehen... und Ihren Körper sich regenerieren. Gleiten Sie sanft... friedlich... in einen tiefen, ununterbrochenen und wunderbar erholsamen Schlaf. Schlafen Sie gut.`,
        relaxation: `Hallo. Nehmen Sie sich Zeit, um eine bequeme Position einzunehmen, und schließen Sie Ihre Augen. ... ... ... Heute werden wir alle Spannungen lösen, eine nach der anderen. ... ... ... Beginnen Sie mit einem tiefen Atemzug... und atmen Sie langsam, sehr langsam aus... Spüren Sie, wie sich Ihre Schultern entspannen... Ihr Kiefer lockert sich... Ihre Stirn glättet sich... ... ... ... Stellen Sie sich vor, jeder Teil Ihres Körpers ist eine Kerze, und Ihr Atem ist eine sanfte Brise, die die Flamme der Spannung auslöscht... ... ... ... Zuerst Ihre Füße... dann Ihre Beine... sie werden schwer und entspannt... Ihr Becken... Ihr Bauch... Ihr Rücken... alles entspannt sich... ... ... ... Ihre Brust öffnet sich, Ihr Herz schlägt ruhig... Ihre Arme, Ihre Hände, bis in die Fingerspitzen, sind völlig entspannt... ... ... ... Visualisieren Sie nun einen warmen Sandstrand bei Sonnenuntergang. Das Rauschen der Wellen ist ein langsamer, regelmäßiger Rhythmus, der Sie wiegt. Die sanfte Wärme des Sandes entspannt jeden Muskel in Ihrem Körper... Es geht Ihnen vollkommen gut... in Frieden... ... ... ... Genießen Sie diesen Moment totaler Ruhe... Verankern Sie dieses Gefühl tiefer Entspannung in sich... Sie können jederzeit darauf zurückkommen, wenn Sie es brauchen...`,
        antiStress: `Willkommen zu dieser Sitzung, um Stress abzubauen und Ihre innere Ruhe wiederzufinden. Setzen oder legen Sie sich bequem hin. Schließen Sie Ihre Augen. ... ... ... Nehmen Sie die Kontaktpunkte Ihres Körpers mit der Unterlage wahr... Spüren Sie den Boden, den Stuhl, das Bett, das Sie stützt... Sie sind sicher. ... ... ... Richten Sie nun Ihre Aufmerksamkeit auf Ihren Atem. Ohne ihn zu erzwingen, beobachten Sie ihn einfach. ... ... ... Stellen Sie sich vor, dass Sie bei jeder Einatmung reine, ruhige, blaue Luft einatmen... Und bei jeder Ausatmung blasen Sie eine graue Wolke aus, die all Ihre Spannungen, Sorgen und Ihren Stress enthält... ... ... ... Atmen Sie Ruhe ein... Atmen Sie Stress aus... Setzen Sie diesen Zyklus fort. ... ... ... Visualisieren Sie nun eine Schutzblase um sich herum. Eine Blase der Gelassenheit. Innerhalb dieser Blase kann Sie nichts erreichen. Äußere Geräusche, unruhige Gedanken, alles bleibt draußen. Hier sind Sie souverän, Sie sind ruhig. ... ... ... Wiederholen Sie innerlich: 'Ich bin ruhig... ich bin gelassen... ich meistere die Situation mit Zuversicht.' ... ... ... Spüren Sie, wie diese ruhige Kraft in Ihnen wächst. Stress hat keinen Halt mehr. Sie sind zentriert, geerdet und bereit, Herausforderungen mit einer neuen Perspektive zu begegnen.`,
        meditation: `Hallo und willkommen. Diese Sitzung ist eine Einladung, sich wieder mit dem gegenwärtigen Moment zu verbinden. Finden Sie eine würdevolle und bequeme Haltung. Schließen Sie Ihre Augen. ... ... ... Richten Sie Ihre Aufmerksamkeit einfach auf die Empfindungen Ihres Atems... die Luft, die durch Ihre Nasenlöcher einströmt... die Bewegung Ihres Bauches... ohne zu versuchen, etwas zu ändern... nur beobachten. ... ... ... Ihr Geist wird wahrscheinlich abschweifen. Das ist normal. Immer wenn Sie bemerken, dass Ihre Gedanken woanders sind, bringen Sie Ihre Aufmerksamkeit sanft und ohne Urteil zurück zu Ihrem Atem. Das ist die eigentliche Übung der Meditation. ... ... ... Es gibt nichts zu erreichen, nichts zu erzielen. Nur hier sein, präsent für das, was ist. ... ... ... Seien Sie sich der Geräusche um Sie herum bewusst... der Empfindungen in Ihrem Körper... der Gedanken, die wie Wolken am Himmel vorbeiziehen... ... ... ... Sie sind nicht Ihre Gedanken, Sie sind derjenige, der sie beobachtet. Verweilen Sie in diesem Raum reinen Bewusstseins, ein stiller und friedlicher Beobachter... ... ... ... Jeder Moment ist eine neue Gelegenheit, hier und jetzt zurückzukehren. Genießen Sie diese innere Stille, diese Klarheit... Es ist Ihre wahre Natur.`,
        arretTabac: `Hallo. Heute stärken Sie Ihre Entscheidung, sich vom Tabak zu befreien. Machen Sie es sich bequem und schließen Sie die Augen. ... ... ... Nehmen Sie drei tiefe Atemzüge... und mit jedem Ausatmen lassen Sie die Anspannung und das Verlangen nach dem Rauchen los... Sie haben eine Entscheidung für Ihre Gesundheit, für Ihre Freiheit getroffen. Seien Sie stolz auf diese Wahl. ... ... ... Stellen Sie sich nun zwei Wege vor Ihnen vor. Einer ist grau, rauchig, der Weg der Abhängigkeit. Der andere ist hell, voller frischer Luft, der Weg der Freiheit. Spüren Sie den Unterschied. ... ... ... Spüren Sie den Duft frischer Luft, die Vitalität in Ihren Lungen, die Energie, die auf diesem hellen Weg durch Ihren Körper fließt. ... ... ... Stellen Sie sich vor, in ein paar Wochen, ein paar Monaten... ohne Tabak. Spüren Sie den Stolz. Spüren Sie Ihren volleren Atem, Ihren feineren Geruchssinn, Ihre gesteigerte Energie. ... ... ... Jedes Mal, wenn ein Verlangen aufkommen könnte, haben Sie einen Anker. Legen Sie eine Hand auf Ihren Bauch und atmen Sie dreimal tief durch. Erinnern Sie sich an dieses Bild des hellen Weges. ... ... ... Sie sind stärker als diese alte Gewohnheit. Jeder Tag ohne Tabak ist ein Sieg. Sie atmen das Leben. Sie sind frei.`,
        amincissement: `Hallo. Willkommen zu dieser Sitzung, die der Harmonisierung von Körper und Geist gewidmet ist. Machen Sie es sich bequem... schließen Sie die Augen... und atmen Sie tief durch... ... ... ... Lassen Sie bei jedem Ausatmen die Urteile über Ihren Körper, die Frustrationen, vergangene Diäten los... Nehmen Sie sich mit Wohlwollen an, hier und jetzt. ... ... ... Nehmen Sie Ihren Körper wahr, seine Form, seine Präsenz... ohne Urteil, mit Dankbarkeit... Er ist Ihr Fahrzeug für das Leben. ... ... ... Stellen Sie sich nun vor, wie ein sanftes goldenes Licht durch Ihren Scheitel eintritt. Es ist ein Licht der Heilung, der Akzeptanz und der Energie. Es senkt sich langsam herab und erfüllt jede Zelle Ihres Körpers mit einem Gefühl des Wohlbefindens. ... ... ... Dieses Licht hilft Ihnen, sich wieder mit Ihren wahren Hunger- und Sättigungsgefühlen zu verbinden. Es leitet Sie zu gesunden Essensentscheidungen, die Ihren Körper nähren und respektieren. ... ... ... Visualisieren Sie die Person, die Sie werden möchten: voller Energie, wohl in Ihrem Körper, im Frieden mit dem Essen. Sehen Sie sich, wie Sie sich mit Leichtigkeit bewegen, Aktivitäten nachgehen, die Sie lieben. Dieses Bild ist in Ihnen. ... ... ... Ihr Körper weiß, was gut für ihn ist. Hören Sie auf ihn. Vertrauen Sie ihm. Jeden Tag treffen Sie bewusste und wohlwollende Entscheidungen für Ihr Wohlbefinden. Sie sind im Einklang mit sich selbst.`,
        douleur: `Hallo. Diese Sitzung ist ein Raum, der Ihnen hilft, mit dem Schmerzempfinden umzugehen. Machen Sie es sich so bequem, wie es Ihr Körper heute zulässt. Schließen Sie die Augen und lassen Sie Ihren Atem einen natürlichen und beruhigenden Rhythmus finden. ... ... ... Zuerst konzentrieren wir uns nicht auf den Schmerz, sondern auf das Wohlbefinden. Gehen Sie gedanklich durch Ihren Körper und finden Sie einen Bereich, der im Moment neutral oder sogar angenehm ist. Vielleicht die Wärme Ihrer Hände... das Gefühl Ihrer Haare auf der Stirn... oder der Kontakt Ihrer Füße mit dem Boden. ... ... ... Wählen Sie einen dieser Bereiche und tauchen Sie mit Ihrem Bewusstsein hinein. Erforschen Sie dieses Gefühl von Nicht-Schmerz, von Behaglichkeit. Lassen Sie es zu einer Ressource, einem Anker der Ruhe in Ihrem Körper werden. ... ... ... Jetzt, mit dieser Ressource des Wohlbefindens fest präsent, können Sie den Schmerzbereich in Ihr Bewusstseinsfeld treten lassen. Ohne Angst, ohne Urteil. Beobachten Sie das Gefühl aus der Ferne, wie ein Wissenschaftler ein Phänomen beobachtet. ... ... ... Geben Sie ihm eine Form, eine Farbe, eine Textur. Ist es heiß, kalt? Stechend, dumpf? Dicht, diffus? Einfach beobachten, ohne es als 'schlecht' zu beurteilen. ... ... ... Nutzen Sie nun Ihren Atem als Werkzeug zur Transformation. Stellen Sie sich vor, dass Sie bei jeder Einatmung aus Ihrem Komfortbereich schöpfen und einen Hauch von Sanftheit und Wärme zum schmerzhaften Bereich senden. ... ... ... Und bei jeder Ausatmung stellen Sie sich vor, dass das Schmerzempfinden etwas an Intensität verliert. Visualisieren Sie, wie seine Farbe blasser, transparenter wird. Seine Kanten, die vielleicht scharf und hart waren, werden unscharf und weich. ... ... ... Setzen Sie diesen Prozess fort... Atmen Sie Komfort zum Schmerz... Atmen Sie aus, um ihn aufzulösen, zu verteilen, zu mildern. Sie können sich auch vorstellen, dass sich das Gefühl verwandelt. Eine Eisplatte, die unter einer sanften Sonne schmilzt... ein fester Knoten, der sich Faser für Faser löst... ... ... ... Sie sind nicht Ihr Schmerz. Sie sind das Bewusstsein, das ihn beobachtet und die Macht hat, ihn zu modulieren. Sie gewinnen die Kontrolle zurück, nicht durch Kampf, sondern durch Sanftheit und Aufmerksamkeit. Atmen Sie weiter. Sie sind in Sicherheit.`,
    alcool: `Hallo. Nehmen Sie sich diesen Moment für sich selbst, um den Weg anzuerkennen, den Sie gehen, und die Stärke Ihrer Entscheidung. Nehmen Sie eine bequeme Position ein, schließen Sie die Augen. ... ... ... Atmen Sie tief und kräftig ein, und lassen Sie beim Ausatmen die Anspannungen des Tages los. Ein zweites Mal, atmen Sie den Stolz Ihrer Wahl ein... und atmen Sie die Last der Vergangenheit aus. Ein letztes Mal, atmen Sie Ruhe ein... und atmen Sie alle Unruhe aus. ... ... ... Nehmen Sie Ihren Körper wahr, hier und jetzt. Spüren Sie die Klarheit, die in Ihren Geist zurückkehrt. Spüren Sie die Vitalität, die sich Tag für Tag in Ihren Zellen ausbreitet. Ihr Körper regeneriert sich, er dankt Ihnen für den Respekt, den Sie ihm entgegenbringen. ... ... ... Visualisieren Sie ein reines weißes Licht, das durch Ihren Scheitel eintritt. Es ist ein Licht der Klarheit, der Reinheit. Es senkt sich in Sie herab und reinigt alles auf seinem Weg. Es reinigt Ihre Gedanken, Ihren Hals, Ihre Brust, Ihre Leber, Ihr Blut... Es nimmt alle toxischen Erinnerungen mit sich und lässt Sie sauber, erneuert, voller gesunder Energie zurück. ... ... ... Das Verlangen oder das Bedürfnis ist ein Gedanke, eine alte neurologische Gewohnheit. Es ist nicht Sie. Sie haben die Macht, nicht darauf zu reagieren. Stellen Sie sich vor, Sie sitzen an einem Flussufer. Verlangen ist wie Blätter oder Äste, die auf dem Wasser treiben. Sie erscheinen stromaufwärts, ziehen an Ihnen vorbei und setzen ihren Weg stromabwärts fort, bis sie verschwinden. ... ... ... Sie sind der Beobachter am Ufer. Sie müssen nicht ins Wasser springen, um jedes Blatt zu fangen. Sie können es einfach vorbeiziehen sehen. Wenn ein Verlangen aufkommt, atmen Sie. Sagen Sie sich: 'Ich sehe diesen Gedanken. Er ist nur eine Welle aus der Vergangenheit.' Und wie eine Welle wird er ansteigen, einen Höhepunkt erreichen und dann unweigerlich wieder abklingen und sich entfernen. Sie bleiben am Ufer, ruhig und stabil. ... ... ... Projezieren Sie sich nun in die nahe Zukunft. Stellen Sie sich eine soziale Situation vor, umgeben von Freunden. Sie halten ein Glas frisches Wasser, Saft oder Ihr Lieblingsgetränk ohne Alkohol in der Hand. Sie fühlen sich vollkommen wohl. Sie sind präsent, Ihr Geist ist wach, Sie nehmen voll am Gespräch teil. Sie fühlen sich gut. Sie haben die Kontrolle. Sie brauchen nichts anderes, um diesen Moment zu genießen. ... ... ... Spüren Sie den Stolz, die Einfachheit, die Freiheit dieser Wahl. Diese Person sind Sie. Verankern Sie dieses Bild und dieses Gefühl in sich. Dies ist Ihre neue Realität, die Sie jeden Tag aufbauen.`,
    confiance: `Hallo und willkommen in diesem Raum, um Ihr Selbstvertrauen zu stärken. Machen Sie es sich bequem, schließen Sie die Augen und atmen Sie tief ein. Beim Ausatmen lassen Sie Zweifel und Ängste los. ... ... ... Werden Sie sich Ihrer Haltung bewusst, hier und jetzt. Richten Sie sich leicht auf, öffnen Sie Ihre Schultern. Spüren Sie die Erdung Ihrer Füße auf dem Boden. Sie sind stabil, solide. ... ... ... Visualisieren Sie in der Mitte Ihrer Brust eine Kugel aus warmem, goldenem Licht. Dies ist der Kern Ihres Vertrauens. ... ... ... Mit jedem Atemzug wächst diese Kugel, ihr Licht wird intensiver, strahlender. Es füllt Ihren Rumpf, fließt in Ihre Arme, steigt in Ihren Kopf. Ihr ganzes Wesen ist von diesem Licht des Vertrauens erfüllt. ... ... ... Denken Sie an einen Moment, wie kurz auch immer, in dem Sie stolz auf sich waren, kompetent, in voller Beherrschung Ihrer Fähigkeiten. Erleben Sie diese Szene noch einmal, spüren Sie die positiven Emotionen. Verankern Sie dieses Gefühl. ... ... ... Diese Stärke ist in Ihnen. Sie war schon immer da. Wiederholen Sie innerlich: 'Ich bin fähig. Ich glaube an mich. Ich verdiene Erfolg und Respekt.' ... ... ... Jeden Tag nähren Sie dieses innere Licht. Sie gehen mit Sicherheit und Gelassenheit durch die Welt.`
    },
    es: {
        sommeil: `Hola y bienvenido a esta sesión diseñada para guiarte hacia un sueño profundo y reparador. Tómate tu tiempo para instalarte lo más cómodamente posible, en la penumbra, listo para dejarte llevar. ... ... ... Cierra suavemente los ojos y deja que el mundo exterior se desvanezca... ... ... ... Ahora, lleva toda tu atención a tu respiración. Siente el aire fresco que entra por tus fosas nasales... y el aliento tibio que sale. ... ... ... Inspira calma... y con cada exhalación, imagina que soplas lejos las tensiones, las preocupaciones, los pensamientos del día... Cada exhalación es un suspiro de alivio que te hunde un poco más en la relajación... ... ... ... Ahora vamos a relajar cada parte de tu cuerpo. Toma conciencia de tu cabeza, de tu rostro. Relaja tu frente, deja que se vuelva lisa, sin expresión. Afloja tus mandíbulas, deja que tus dientes se separen ligeramente. Tu lengua descansa tranquilamente en tu boca. ... ... ... Siente cómo tus hombros se vuelven pesados y se alejan de tus orejas. Relaja tus brazos, tus codos, tus muñecas, hasta la punta de tus dedos. Tus brazos están pesados, muy pesados, completamente relajados. ... ... ... Presta atención a tu espalda. Siente cada vértebra asentarse, relajarse sobre el soporte. Libera todas las tensiones acumuladas en tu espalda. ... ... ... Tu pecho y tu vientre suben y bajan al ritmo tranquilo de tu respiración. Tu corazón late tranquilamente, serenamente. ... ... ... Relaja tu pelvis, tus caderas. Siente tus piernas volverse pesadas y totalmente pasivas... desde las rodillas hasta los tobillos... y hasta la punta de tus pies. ... ... ... Todo tu cuerpo está ahora pesado, relajado y listo para el descanso. ... ... ... Ahora imagina una escalera frente a ti. Una escalera magnífica, suave y acogedora. Desciende en espiral hacia un lugar de calma y silencio absoluto. ... ... ... Vamos a bajarla juntos. Cada escalón te lleva más profundamente a la relajación, más cerca del sueño. ... ... ... Diez... Nueve... Ocho... estás cada vez más tranquilo... Siete... Seis... Cinco... tu mente se calma... Cuatro... Tres... Dos... estás a las puertas del sueño... Uno... ... ... ... Ya estás al final de la escalera. Entras en un jardín nocturno, bañado por la suave luz de una luna benévola. El aire es fresco y puro. Es tu santuario de descanso. ... ... ... En el centro de este jardín se encuentra la cama más cómoda que puedas imaginar. Acércate... Acuéstate... y siente la suavidad de las sábanas, la esponjosidad de la almohada. ... ... ... Aquí, en este lugar mágico, nada puede molestarte. Estás completamente seguro, envuelto en calma. ... ... ... Cada sonido lejano, cada sensación, se convierte en una canción de cuna que te guía aún más profundamente hacia el sueño. ... ... ... Déjate llevar ahora... Deja que tu mente se disuelva en el descanso... y que tu cuerpo se regenere. Deslízate suavemente... pacíficamente... hacia un sueño profundo, continuo y maravillosamente reparador. Duerme bien.`,
        relaxation: `Hola. Tómate el tiempo para instalarte en una posición cómoda y cierra los ojos. ... ... ... Hoy vamos a liberar todas las tensiones, una por una. ... ... ... Comienza tomando una respiración profunda... y exhala lentamente, muy lentamente... Siente cómo se relajan tus hombros... cómo se afloja tu mandíbula... cómo se alisa tu frente... ... ... ... Imagina que cada parte de tu cuerpo es una vela, y tu aliento es una suave brisa que apaga la llama de la tensión... ... ... ... Primero tus pies... luego tus piernas... se vuelven pesadas y relajadas... Tu pelvis... tu vientre... tu espalda... todo se suelta... ... ... ... Tu pecho se abre, tu corazón late con calma... tus brazos, tus manos, hasta la punta de tus dedos, están completamente relajados... ... ... ... Ahora visualiza una playa de arena cálida al atardecer. El sonido de las olas es un ritmo lento y regular que te arrulla. El suave calor de la arena relaja cada músculo de tu cuerpo... Estás perfectamente bien... en paz... ... ... ... Disfruta de este momento de calma total... Ancla esta sensación de relajación profunda en ti... Puedes volver a ella cada vez que lo necesites...`,
        antiStress: `Bienvenido a esta sesión para calmar el estrés y encontrar tu calma interior. Siéntate o acuéstate cómodamente. Cierra los ojos. ... ... ... Toma conciencia de los puntos de contacto de tu cuerpo con el soporte... Siente el suelo, la silla, la cama que te sostiene... Estás a salvo. ... ... ... Ahora, lleva tu atención a tu respiración. Sin forzarla, simplemente obsérvala. ... ... ... Imagina que con cada inhalación, respiras un aire puro y tranquilo, de color azul... Y con cada exhalación, exhalas una nube gris que contiene todas tus tensiones, tus preocupaciones, tu estrés... ... ... ... Inspira calma... Exhala estrés... Continúa este ciclo. ... ... ... Ahora visualiza una burbuja protectora a tu alrededor. Una burbuja de serenidad. Dentro de esta burbuja, nada puede alcanzarte. Los ruidos externos, los pensamientos inquietos, todo queda fuera. Aquí, eres soberano, estás en calma. ... ... ... Repite interiormente: 'Estoy en calma... estoy sereno(a)... manejo la situación con confianza.' ... ... ... Siente cómo esta fuerza tranquila crece dentro de ti. El estrés ya no tiene poder. Estás centrado(a), anclado(a) y listo(a) para enfrentar los desafíos con una nueva perspectiva.`,
        meditation: `Hola y bienvenido. Esta sesión es una invitación a reconectar con el momento presente. Encuentra una postura digna y cómoda. Cierra los ojos. ... ... ... Simplemente lleva tu atención a las sensaciones de tu respiración... el aire que entra por tus fosas nasales... el movimiento de tu abdomen... sin intentar cambiar nada... solo observando. ... ... ... Es probable que tu mente divague. Es normal. Cada vez que notes que tus pensamientos se han ido a otra parte, con suavidad y sin juzgar, devuelve tu atención a tu respiración. Este es el ejercicio mismo de la meditación. ... ... ... No hay nada que lograr, nada que alcanzar. Solo estar aquí, presente a lo que es. ... ... ... Sé consciente de los sonidos a tu alrededor... de las sensaciones en tu cuerpo... de los pensamientos que pasan como nubes en el cielo... ... ... ... No eres tus pensamientos, eres quien los observa. Permanece en este espacio de pura conciencia, un observador silencioso y pacífico... ... ... ... Cada momento es una nueva oportunidad para volver aquí y ahora. Disfruta de este silencio interior, de esta claridad... Es tu verdadera naturaleza.`,
        arretTabac: `Hola. Hoy estás fortaleciendo tu decisión de liberarte del tabaco. Ponte cómodo y cierra los ojos. ... ... ... Toma tres respiraciones profundas... y con cada exhalación, libera la tensión y el deseo de fumar... Has tomado una decisión por tu salud, por tu libertad. Siéntete orgulloso de esta elección. ... ... ... Ahora visualiza dos caminos frente a ti. Uno es gris, lleno de humo, es el camino de la adicción. El otro es brillante, lleno de aire puro, es el camino de la libertad. Siente la diferencia. ... ... ... Siente el olor del aire fresco, la vitalidad en tus pulmones, la energía que fluye por tu cuerpo en este camino brillante. ... ... ... Imagínate en unas pocas semanas, unos pocos meses... sin tabaco. Siente el orgullo. Siente tu respiración más plena, tu olfato más agudo, tu energía aumentada. ... ... ... Cada vez que aparezca un antojo, tienes un ancla. Coloca una mano sobre tu vientre y respira profundamente tres veces. Recuerda esta imagen del camino brillante. ... ... ... Eres más fuerte que este viejo hábito. Cada día sin tabaco es una victoria. Estás respirando vida. Eres libre.`,
        amincissement: `Hola. Bienvenido a esta sesión dedicada a armonizar tu cuerpo y tu mente. Ponte cómodo... cierra los ojos... y respira profundamente... ... ... ... Con cada exhalación, deja ir los juicios sobre tu cuerpo, las frustraciones, las dietas pasadas... Acógete con amabilidad, aquí y ahora. ... ... ... Toma conciencia de tu cuerpo, de su forma, de su presencia... sin juicio, con gratitud... Es tu vehículo para la vida. ... ... ... Ahora imagina una suave luz dorada que entra por la parte superior de tu cabeza. Es una luz de sanación, aceptación y energía. Desciende lentamente, llenando cada célula de tu cuerpo con una sensación de bienestar. ... ... ... Esta luz te ayuda a reconectar con tus verdaderos sentimientos de hambre y saciedad. Te guía hacia elecciones alimentarias saludables que nutren y respetan tu cuerpo. ... ... ... Visualiza a la persona en la que quieres convertirte: llena de energía, cómoda en tu cuerpo, en paz con la comida. Mírate moviéndote con facilidad, haciendo actividades que amas. Esta imagen está dentro de ti. ... ... ... Tu cuerpo sabe lo que es bueno para él. Escúchalo. Confía en él. Cada día, tomas decisiones conscientes y amables para tu bienestar. Estás en armonía contigo mismo.`,
        douleur: `Hola. Esta sesión es un espacio para ayudarte a manejar la sensación de dolor. Ponte tan cómodo como tu cuerpo te lo permita hoy. Cierra los ojos y deja que tu respiración encuentre un ritmo natural y relajante. ... ... ... Para empezar, no nos centraremos en el dolor, sino en la comodidad. Recorre mentalmente tu cuerpo y encuentra una zona que, en este momento, sea neutral o incluso agradable. Tal vez el calor de tus manos... la sensación de tu cabello en la frente... o el contacto de tus pies con el suelo. ... ... ... Elige una de estas zonas y sumerge tu conciencia en ella. Explora esta sensación de no-dolor, de confort. Con cada inhalación, imagina que esta sensación de bienestar crece, se amplifica, se expande un poco más. Deja que se convierta en un recurso, un ancla de calma en tu cuerpo. ... ... ... Ahora, con este recurso de confort firmemente presente, puedes permitir que la zona de dolor entre en tu campo de conciencia. Sin miedo, sin juicio. Observa la sensación desde la distancia, como un científico observa un fenómeno. ... ... ... Dale una forma, un color, una textura. ¿Es caliente, fría? ¿Punzante, sorda? ¿Densa, difusa? Simplemente observa, sin juzgarla como 'mala'. ... ... ... Ahora, utiliza tu respiración como una herramienta de transformación. Imagina que con cada inhalación, extraes de tu zona de confort y envías un soplo de suavidad y calor hacia la zona dolorosa. ... ... ... Y con cada exhalación, imagina que la sensación dolorosa pierde algo de su intensidad. Visualiza su color volviéndose más pálido, más transparente. Sus bordes, que quizás eran nítidos y duros, se vuelven borrosos y suaves. ... ... ... Continúa este proceso... Inspira confort hacia el dolor... Exhala para disolverlo, difundirlo, suavizarlo. También puedes imaginar que la sensación se transforma. Un bloque de hielo que se derrite bajo un sol suave... un nudo apretado que se afloja fibra por fibra... ... ... ... Tú no eres tu dolor. Eres la conciencia que lo observa y que tiene el poder de modularlo. Recuperas el control no a través de la lucha, sino a través de la suavidad y la atención. Sigue respirando. Estás a salvo.`,
    alcool: `Hola. Tómate este momento para ti, para reconocer el camino que estás recorriendo y la fuerza de tu decisión. Ponte en una posición cómoda, cierra los ojos. ... ... ... Toma una respiración grande y profunda, y al exhalar, deja ir las tensiones del día. Una segunda vez, inspira el orgullo de tu elección... y exhala el peso del pasado. Una última vez, inspira calma... y exhala toda agitación. ... ... ... Toma conciencia de tu cuerpo, aquí y ahora. Siente la claridad que regresa a tu mente. Siente la vitalidad que se instala en tus células, día tras día. Tu cuerpo se está regenerando, te agradece el respeto que le estás dando. ... ... ... Visualiza una luz blanca y pura que entra por la parte superior de tu cabeza. Es una luz de claridad, de pureza. Desciende dentro de ti, limpiando todo a su paso. Limpia tus pensamientos, tu garganta, tu pecho, tu hígado, tu sangre... Se lleva todos los recuerdos tóxicos y te deja limpio, renovado, lleno de energía saludable. ... ... ... El antojo, o la necesidad, es un pensamiento, un viejo hábito neurológico. No eres tú. Tienes el poder de no responderle. Imagina que estás sentado junto a un río. Los antojos son como hojas o ramas que flotan en el agua. Aparecen río arriba, pasan frente a ti y continúan su camino río abajo hasta desaparecer. ... ... ... Tú eres el observador en la orilla. No necesitas saltar al agua para atrapar cada hoja. Simplemente puedes verla pasar. Cuando surja un antojo, respira. Dite a ti mismo: 'Veo este pensamiento. Es solo una ola del pasado.' Y como una ola, subirá, alcanzará un pico y luego, inevitablemente, retrocederá y se alejará. Tú permaneces en la orilla, tranquilo y estable. ... ... ... Ahora, proyéctate en el futuro cercano. Imagínate en una situación social, rodeado de amigos. Sostienes un vaso de agua fresca, jugo o tu bebida sin alcohol favorita. Estás perfectamente a gusto. Estás presente, tu mente está aguda, participas plenamente en la conversación. Te sientes bien. Tienes el control. No necesitas nada más para disfrutar este momento. ... ... ... Siente el orgullo, la simplicidad, la libertad de esta elección. Esa persona eres tú. Ancla esta imagen y esta sensación dentro de ti. Esta es tu nueva realidad, la que estás construyendo cada día.`,
    confiance: `Hola y bienvenido a este espacio para fortalecer tu confianza en ti mismo. Acomódate, cierra los ojos y respira profundamente. Al exhalar, deja ir las dudas y los miedos. ... ... ... Toma conciencia de tu postura, aquí y ahora. Endereza ligeramente la espalda, abre los hombros. Siente el anclaje de tus pies en el suelo. Eres estable, sólido. ... ... ... Visualiza en el centro de tu pecho una esfera de luz cálida y dorada. Este es el núcleo de tu confianza. ... ... ... Con cada respiración, esta esfera crece, su luz se vuelve más intensa, más radiante. Llena tu torso, desciende por tus brazos, sube a tu cabeza. Todo tu ser se llena de esta luz de confianza. ... ... ... Piensa en un momento, por breve que sea, en el que te sentiste orgulloso de ti mismo, competente, en pleno dominio de tus capacidades. Revive esa escena, siente las emociones positivas. Ancla ese sentimiento. ... ... ... Esta fuerza está dentro de ti. Siempre ha estado ahí. Repite interiormente: 'Soy capaz. Creo en mí. Merezco el éxito y el respeto.' ... ... ... Cada día, nutres esta luz interior. Caminas por el mundo con seguridad y serenidad.`
    },
    it: {
        sommeil: `Ciao e benvenuto a questa sessione progettata per guidarti verso un sonno profondo e ristoratore. Prenditi il tempo per metterti il più comodo possibile, nella penombra, pronto a lasciarti andare. ... ... ... Chiudi dolcemente gli occhi e lascia che il mondo esterno svanisca... ... ... ... Ora, porta tutta la tua attenzione sul tuo respiro. Senti l'aria fresca che entra dalle narici... e il respiro caldo che esce. ... ... ... Inspira la calma... e ad ogni espirazione, immagina di soffiare via le tensioni, le preoccupazioni, i pensieri della giornata... Ogni espirazione è un sospiro di sollievo che ti fa sprofondare un po' di più nel rilassamento... ... ... ... Ora rilasseremo ogni parte del tuo corpo. Prendi coscienza della tua testa, del tuo viso. Rilassa la fronte, lasciala diventare liscia, senza espressione. Allenta la mascella, lascia che i denti si separino leggermente. La tua lingua riposa tranquillamente in bocca. ... ... ... Senti le tue spalle diventare pesanti e allontanarsi dalle orecchie. Rilassa le braccia, i gomiti, i polsi, fino alla punta delle dita. Le tue braccia sono pesanti, molto pesanti, completamente rilassate. ... ... ... Presta attenzione alla tua schiena. Senti ogni vertebra che si posa, si rilassa sul supporto. Libera tutte le tensioni accumulate nella schiena. ... ... ... Il tuo petto e il tuo ventre si alzano e si abbassano al ritmo calmo del tuo respiro. Il tuo cuore batte tranquillamente, serenamente. ... ... ... Rilassa il bacino, i fianchi. Senti le tue gambe diventare pesanti e totalmente passive... dalle ginocchia alle caviglie... e fino alla punta dei piedi. ... ... ... Tutto il tuo corpo è ora pesante, rilassato e pronto per il riposo. ... ... ... Ora immagina una scala di fronte a te. Una scala magnifica, dolce e accogliente. Scende a spirale verso un luogo di calma e silenzio assoluti. ... ... ... La scenderemo insieme. Ogni gradino ti porta più in profondità nel rilassamento, più vicino al sonno. ... ... ... Dieci... Nove... Otto... sei sempre più calmo... Sette... Sei... Cinque... la tua mente si calma... Quattro... Tre... Due... sei alle porte del sonno... Uno... ... ... ... Eccoti in fondo alle scale. Entri in un giardino notturno, immerso nella luce soffusa di una luna benevola. L'aria è fresca e pura. Questo è il tuo santuario di riposo. ... ... ... Al centro di questo giardino c'è il letto più comodo che tu possa immaginare. Avvicinati... Sdraiati... e senti la morbidezza delle lenzuola, la sofficità del cuscino. ... ... ... Qui, in questo luogo magico, nulla può disturbarti. Sei completamente al sicuro, avvolto nella calma. ... ... ... Ogni suono lontano, ogni sensazione, diventa una ninna nanna che ti guida ancora più profondamente nel sonno. ... ... ... Lasciati andare ora... Lascia che la tua mente si dissolva nel riposo... e il tuo corpo si rigeneri. Scivola dolcemente... pacificamente... in un sonno profondo, continuo e meravigliosamente ristoratore. Dormi bene.`,
        relaxation: `Ciao. Prenditi il tempo di sistemarti in una posizione comoda e chiudi gli occhi. ... ... ... Oggi rilasceremo tutte le tensioni, una per una. ... ... ... Inizia facendo un respiro profondo... ed espira lentamente, molto lentamente... Senti le spalle che si rilassano... la mascella che si allenta... la fronte che si distende... ... ... ... Immagina che ogni parte del tuo corpo sia una candela e che il tuo respiro sia una brezza leggera che spegne la fiamma della tensione... ... ... ... Prima i piedi... poi le gambe... diventano pesanti e rilassate... Il bacino... la pancia... la schiena... tutto si rilascia... ... ... ... Il petto si apre, il cuore batte con calma... le braccia, le mani, fino alla punta delle dita, sono completamente rilassate... ... ... ... Ora visualizza una spiaggia di sabbia calda al tramonto. Il suono delle onde è un ritmo lento e regolare che ti culla. Il dolce calore della sabbia rilassa ogni muscolo del tuo corpo... Stai perfettamente bene... in pace... ... ... ... Goditi questo momento di calma totale... Ancora questa sensazione di profondo rilassamento dentro di te... Puoi tornarci ogni volta che ne avrai bisogno...`,
        antiStress: `Benvenuto a questa sessione per alleviare lo stress e ritrovare la tua calma interiore. Siediti o sdraiati comodamente. Chiudi gli occhi. ... ... ... Prendi coscienza dei punti di contatto del tuo corpo con il supporto... Senti il pavimento, la sedia, il letto che ti sostiene... Sei al sicuro. ... ... ... Ora porta la tua attenzione sul respiro. Senza forzarlo, osservalo semplicemente. ... ... ... Immagina che ad ogni inspirazione, inspiri un'aria pura e calma, di colore blu... E ad ogni espirazione, soffi una nuvola grigia che contiene tutte le tue tensioni, le tue preoccupazioni, il tuo stress... ... ... ... Inspira la calma... Espira lo stress... Continua questo ciclo. ... ... ... Ora visualizza una bolla protettiva tutto intorno a te. Una bolla di serenità. All'interno di questa bolla, nulla può raggiungerti. I rumori esterni, i pensieri irrequieti, tutto rimane fuori. Qui, sei sovrano, sei calmo. ... ... ... Ripeti interiormente: 'Sono calmo... sono sereno(a)... gestisco la situazione con fiducia.' ... ... ... Senti questa forza tranquilla crescere dentro di te. Lo stress non ha più presa. Sei centrato(a), radicato(a) e pronto(a) ad affrontare le sfide con una nuova prospettiva.`,
        meditation: `Ciao e benvenuto. Questa sessione è un invito a riconnetterti con il momento presente. Trova una postura dignitosa e comoda. Chiudi gli occhi. ... ... ... Porta semplicemente la tua attenzione alle sensazioni del tuo respiro... l'aria che entra dalle narici... il movimento del tuo addome... senza cercare di cambiare nulla... solo osservando. ... ... ... La tua mente probabilmente vagherà. È normale. Ogni volta che noti che i tuoi pensieri sono andati altrove, dolcemente e senza giudizio, riporta la tua attenzione al tuo respiro. Questo è l'esercizio stesso della meditazione. ... ... ... Non c'è nulla da raggiungere, nulla da ottenere. Solo essere qui, presente a ciò che è. ... ... ... Sii consapevole dei suoni intorno a te... delle sensazioni nel tuo corpo... dei pensieri che passano come nuvole nel cielo... ... ... ... Tu non sei i tuoi pensieri, sei colui che li osserva. Rimani in questo spazio di pura coscienza, un osservatore silenzioso e pacifico... ... ... ... Ogni momento è una nuova opportunità per tornare qui e ora. Goditi questo silenzio interiore, questa chiarezza... È la tua vera natura.`,
        arretTabac: `Ciao. Oggi rafforzi la tua decisione di liberarti dal tabacco. Mettiti comodo e chiudi gli occhi. ... ... ... Fai tre respiri profondi... e ad ogni espirazione, rilascia la tensione e il desiderio di fumare... Hai preso una decisione per la tua salute, per la tua libertà. Sii orgoglioso di questa scelta. ... ... ... Ora visualizza due sentieri di fronte a te. Uno è grigio, fumoso, è il sentiero della dipendenza. L'altro è luminoso, pieno di aria fresca, è il sentiero della libertà. Senti la differenza. ... ... ... Senti l'odore dell'aria fresca, la vitalità nei tuoi polmoni, l'energia che scorre nel tuo corpo su questo sentiero luminoso. ... ... ... Immaginati tra qualche settimana, qualche mese... senza tabacco. Senti l'orgoglio. Senti il tuo respiro più pieno, il tuo olfatto più acuto, la tua energia aumentata. ... ... ... Ogni volta che potrebbe apparire un desiderio, hai un'ancora. Metti una mano sulla pancia e respira profondamente tre volte. Ricorda questa immagine del sentiero luminoso. ... ... ... Sei più forte di questa vecchia abitudine. Ogni giorno senza tabacco è una vittoria. Stai respirando la vita. Sei libero.`,
        amincissement: `Ciao. Benvenuto a questa sessione dedicata all'armonizzazione del tuo corpo e della tua mente. Mettiti comodo... chiudi gli occhi... e respira profondamente... ... ... ... Ad ogni espirazione, lascia andare i giudizi sul tuo corpo, le frustrazioni, le diete passate... Accogliti con benevolenza, qui e ora. ... ... ... Prendi coscienza del tuo corpo, della sua forma, della sua presenza... senza giudizio, con gratitudine... È il tuo veicolo per la vita. ... ... ... Ora immagina una morbida luce dorata che entra dalla sommità della tua testa. È una luce di guarigione, accettazione ed energia. Scende lentamente, riempiendo ogni cellula del tuo corpo con una sensazione di benessere. ... ... ... Questa luce ti aiuta a riconnetterti con le tue vere sensazioni di fame e sazietà. Ti guida verso scelte alimentari sane che nutrono e rispettano il tuo corpo. ... ... ... Visualizza la persona che vuoi diventare: piena di energia, a tuo agio nel tuo corpo, in pace con il cibo. Vediti muoverti con facilità, fare attività che ami. Questa immagine è dentro di te. ... ... ... Il tuo corpo sa cosa è buono per lui. Ascoltalo. Fidati di lui. Ogni giorno, fai scelte consapevoli e benevole per il tuo benessere. Sei in armonia con te stesso.`,
        douleur: `Ciao. Questa sessione è uno spazio per aiutarti a gestire la sensazione di dolore. Mettiti comodo quanto il tuo corpo te lo permette oggi. Chiudi gli occhi e lascia che il tuo respiro trovi un ritmo naturale e rilassante. ... ... ... Per cominciare, non ci concentreremo sul dolore, ma sul comfort. Scansiona mentalmente il tuo corpo e trova una zona che, in questo momento, è neutra o addirittura piacevole. Forse il calore delle tue mani... la sensazione dei tuoi capelli sulla fronte... o il contatto dei tuoi piedi con il pavimento. ... ... ... Scegli una di queste zone e immergi la tua coscienza al suo interno. Esplora questa sensazione di non-dolore, di comfort. Ad ogni inspirazione, immagina che questa sensazione di benessere cresca, si amplifichi, si espanda un po' di più. Lascia che diventi una risorsa, un'ancora di calma nel tuo corpo. ... ... ... Ora, con questa risorsa di comfort ben presente, puoi permettere all'area del dolore di entrare nel tuo campo di consapevolezza. Senza paura, senza giudizio. Osserva la sensazione da lontano, come uno scienziato osserva un fenomeno. ... ... ... Dagli una forma, un colore, una consistenza. È calda, fredda? Pungente, sorda? Densa, diffusa? Semplicemente osserva, senza giudicarla 'cattiva'. ... ... ... Ora, usa il tuo respiro come strumento di trasformazione. Immagina che ad ogni inspirazione, attingi dalla tua zona di comfort e invii un soffio di dolcezza e calore verso la zona dolorosa. ... ... ... E ad ogni espirazione, immagina che la sensazione dolorosa perda un po' della sua intensità. Visualizza il suo colore che diventa più pallido, più trasparente. I suoi bordi, che forse erano netti e duri, diventano sfocati e morbidi. ... ... ... Continua questo processo... Inspira comfort verso il dolore... Espira per dissolverlo, diffonderlo, ammorbidirlo. Puoi anche immaginare che la sensazione si trasformi. Un blocco di ghiaccio che si scioglie sotto un sole gentile... un nodo stretto che si allenta fibra per fibra... ... ... ... Tu non sei il tuo dolore. Sei la coscienza che lo osserva e che ha il potere di modularlo. Riacquisti il controllo non attraverso la lotta, ma attraverso la dolcezza e l'attenzione. Continua a respirare. Sei al sicuro.`,
    alcool: `Ciao. Prenditi questo momento per te stesso, per riconoscere il cammino che stai percorrendo e la forza della tua decisione. Mettiti in una posizione comoda, chiudi gli occhi. ... ... ... Fai un respiro grande e profondo, e mentre espiri, lascia andare le tensioni della giornata. Una seconda volta, inspira l'orgoglio della tua scelta... ed espira il peso del passato. Un'ultima volta, inspira la calma... ed espira ogni agitazione. ... ... ... Prendi coscienza del tuo corpo, qui e ora. Senti la chiarezza che torna nella tua mente. Senti la vitalità che si insedia nelle tue cellule, giorno dopo giorno. Il tuo corpo si sta rigenerando, ti ringrazia per il rispetto che gli stai dando. ... ... ... Visualizza una luce bianca e pura che entra dalla sommità della tua testa. È una luce di chiarezza, di purezza. Scende dentro di te, purificando tutto sul suo cammino. Pulisce i tuoi pensieri, la tua gola, il tuo petto, il tuo fegato, il tuo sangue... Porta via tutti i ricordi tossici e ti lascia pulito, rinnovato, pieno di energia sana. ... ... ... La voglia, o il bisogno, è un pensiero, una vecchia abitudine neurologica. Non sei tu. Hai il potere di non rispondergli. Immagina di essere seduto in riva a un fiume. Le voglie sono come foglie o rami che galleggiano sull'acqua. Appaiono a monte, passano davanti a te e continuano il loro cammino a valle fino a scomparire. ... ... ... Tu sei l'osservatore sulla riva. Non hai bisogno di saltare in acqua per afferrare ogni foglia. Puoi semplicemente guardarla passare. Quando sorge una voglia, respira. Dì a te stesso: 'Vedo questo pensiero. È solo un'onda del passato.' E come un'onda, salirà, raggiungerà un picco e poi, inevitabilmente, si ritirerà e si allontanerà. Tu rimani sulla riva, calmo e stabile. ... ... ... Ora, proiettati nel futuro prossimo. Immaginati in una situazione sociale, circondato da amici. Stai tenendo un bicchiere di acqua fresca, succo o la tua bevanda analcolica preferita. Sei perfettamente a tuo agio. Sei presente, la tua mente è acuta, partecipi pienamente alla conversazione. Ti senti bene. Hai il controllo. Non hai bisogno di nient'altro per goderti questo momento. ... ... ... Senti l'orgoglio, la semplicità, la libertà di questa scelta. Quella persona sei tu. Ancora questa immagine e questa sensazione dentro di te. Questa è la tua nuova realtà, quella che stai costruendo ogni giorno.`,
    confiance: `Ciao e benvenuto in questo spazio per rafforzare la tua autostima. Mettiti comodo, chiudi gli occhi e fai un respiro profondo. Mentre espiri, lascia andare dubbi e paure. ... ... ... Prendi coscienza della tua postura, qui e ora. Raddrizzati leggermente, apri le spalle. Senti il radicamento dei tuoi piedi sul pavimento. Sei stabile, solido. ... ... ... Visualizza al centro del tuo petto una sfera di luce calda e dorata. Questo è il nucleo della tua fiducia. ... ... ... Ad ogni respiro, questa sfera cresce, la sua luce diventa più intensa, più radiosa. Riempie il tuo torso, scende lungo le tue braccia, sale nella tua testa. Tutto il tuo essere è pieno di questa luce di fiducia. ... ... ... Pensa a un momento, per quanto breve, in cui ti sei sentito orgoglioso di te stesso, competente, in pieno controllo delle tue capacità. Rivivi quella scena, senti le emozioni positive. Ancora quella sensazione. ... ... ... Questa forza è dentro di te. È sempre stata lì. Ripeti interiormente: 'Sono capace. Credo in me stesso. Merito successo e rispetto.' ... ... ... Ogni giorno, nutri questa luce interiore. Cammini nel mondo con sicurezza e serenità.`
    },
    nl: {
        sommeil: `Hallo en welkom bij deze sessie, ontworpen om je te begeleiden naar een diepe en herstellende slaap. Neem de tijd om je zo comfortabel mogelijk te installeren, in het schemerdonker, klaar om los te laten. ... ... ... Sluit zachtjes je ogen en laat de buitenwereld vervagen... ... ... ... Breng nu al je aandacht naar je ademhaling. Voel de koele lucht die je neusgaten binnenkomt... en de warme adem die er weer uitgaat. ... ... ... Adem kalmte in... en stel je bij elke uitademing voor dat je de spanningen, de zorgen, de gedachten van de dag wegblaast... Elke uitademing is een zucht van verlichting die je een beetje dieper in ontspanning brengt... ... ... ... We gaan nu elk deel van je lichaam ontspannen. Word je bewust van je hoofd, je gezicht. Ontspan je voorhoofd, laat het glad worden, zonder uitdrukking. Ontspan je kaken, laat je tanden iets van elkaar komen. Je tong rust rustig in je mond. ... ... ... Voel hoe je schouders zwaar worden en van je oren wegzakken. Ontspan je armen, je ellebogen, je polsen, tot aan je vingertoppen. Je armen zijn zwaar, heel zwaar, volledig ontspannen. ... ... ... Richt je aandacht op je rug. Voel hoe elke wervel zich neerlegt, zich ontspant op de ondergrond. Laat alle opgebouwde spanning in je rug los. ... ... ... Je borst en je buik rijzen en dalen op het kalme ritme van je ademhaling. Je hart klopt rustig, sereen. ... ... ... Ontspan je bekken, je heupen. Voel hoe je benen zwaar en totaal passief worden... van de knieën tot de enkels... en tot aan de toppen van je tenen. ... ... ... Je hele lichaam is nu zwaar, ontspannen en klaar voor rust. ... ... ... Stel je nu een trap voor je voor. Een prachtige, zachte en uitnodigende trap. Hij daalt in een spiraal af naar een plaats van absolute rust en stilte. ... ... ... We gaan hem samen afdalen. Elke trede brengt je dieper in ontspanning, dichter bij de slaap. ... ... ... Tien... Negen... Acht... je wordt steeds kalmer... Zeven... Zes... Vijf... je geest wordt rustig... Vier... Drie... Twee... je staat aan de poorten van de slaap... Eén... ... ... ... Je bent aan de voet van de trap. Je betreedt een nachttuin, badend in het zachte licht van een welwillende maan. De lucht is fris en zuiver. Dit is jouw toevluchtsoord van rust. ... ... ... In het midden van deze tuin staat het meest comfortabele bed dat je je kunt voorstellen. Kom dichterbij... Ga liggen... en voel de zachtheid van de lakens, de luchtigheid van het kussen. ... ... ... Hier, op deze magische plek, kan niets je storen. Je bent volkomen veilig, omhuld door kalmte. ... ... ... Elk geluid in de verte, elke sensatie, wordt een slaapliedje dat je nog dieper in de slaap leidt. ... ... ... Laat je nu gaan... Laat je geest oplossen in rust... en je lichaam regenereren. Glijd zachtjes... vredig... in een diepe, ononderbroken en heerlijk herstellende slaap. Slaap lekker.`,
        relaxation: `Hallo. Neem de tijd om in een comfortabele houding te gaan zitten en sluit je ogen. ... ... ... Vandaag gaan we alle spanningen loslaten, één voor één. ... ... ... Begin met een diepe ademhaling... en adem langzaam, heel langzaam uit... Voel je schouders ontspannen... je kaak losser worden... je voorhoofd gladder worden... ... ... ... Stel je voor dat elk deel van je lichaam een kaars is, en je adem een zachte bries die de vlam van de spanning dooft... ... ... ... Eerst je voeten... dan je benen... ze worden zwaar en ontspannen... Je bekken... je buik... je rug... alles ontspant... ... ... ... Je borst opent zich, je hart klopt rustig... je armen, je handen, tot aan je vingertoppen, zijn volledig ontspannen... ... ... ... Visualiseer nu een warm zandstrand bij zonsondergang. Het geluid van de golven is een langzaam, regelmatig ritme dat je wiegt. De zachte warmte van het zand ontspant elke spier in je lichaam... Je voelt je perfect... in vrede... ... ... ... Geniet van dit moment van totale rust... Veranker dit gevoel van diepe ontspanning in jezelf... Je kunt er altijd naar terugkeren wanneer je het nodig hebt...`,
        antiStress: `Welkom bij deze sessie om stress te kalmeren en je innerlijke rust te vinden. Ga comfortabel zitten of liggen. Sluit je ogen. ... ... ... Word je bewust van de contactpunten van je lichaam met de ondergrond... Voel de vloer, de stoel, het bed dat je ondersteunt... Je bent veilig. ... ... ... Breng nu je aandacht naar je ademhaling. Zonder het te forceren, observeer het gewoon. ... ... ... Stel je voor dat je bij elke inademing zuivere, kalme, blauwe lucht inademt... En bij elke uitademing blaas je een grijze wolk uit die al je spanningen, zorgen en stress bevat... ... ... ... Adem kalmte in... Adem stress uit... Ga door met deze cyclus. ... ... ... Visualiseer nu een beschermende bel om je heen. Een bel van sereniteit. Binnen deze bel kan niets je bereiken. Externe geluiden, rusteloze gedachten, alles blijft buiten. Hier ben jij de baas, je bent kalm. ... ... ... Herhaal innerlijk: 'Ik ben kalm... ik ben sereen... ik ga met vertrouwen met de situatie om.' ... ... ... Voel deze stille kracht in je groeien. Stress heeft geen vat meer op je. Je bent gecentreerd, geaard en klaar om uitdagingen met een nieuw perspectief aan te gaan.`,
        meditation: `Hallo en welkom. Deze sessie is een uitnodiging om je opnieuw te verbinden met het huidige moment. Zoek een waardige en comfortabele houding. Sluit je ogen. ... ... ... Breng je aandacht gewoon naar de sensaties van je ademhaling... de lucht die door je neusgaten naar binnen stroomt... de beweging van je buik... zonder iets te proberen te veranderen... gewoon observeren. ... ... ... Je geest zal waarschijnlijk afdwalen. Dat is normaal. Telkens als je merkt dat je gedachten ergens anders zijn, breng je je aandacht zachtjes en zonder oordeel terug naar je adem. Dit is de essentie van meditatie. ... ... ... Er is niets te bereiken, niets te behalen. Gewoon hier zijn, aanwezig in wat is. ... ... ... Wees je bewust van de geluiden om je heen... de sensaties in je lichaam... de gedachten die voorbijgaan als wolken in de lucht... ... ... ... Je bent niet je gedachten, je bent degene die ze observeert. Blijf in deze ruimte van puur bewustzijn, een stille en vredige waarnemer... ... ... ... Elk moment is een nieuwe kans om hier en nu terug te keren. Geniet van deze innerlijke stilte, deze helderheid... Het is je ware aard.`,
        arretTabac: `Hallo. Vandaag versterk je je beslissing om je te bevrijden van tabak. Maak het je gemakkelijk en sluit je ogen. ... ... ... Haal drie keer diep adem... en bij elke uitademing laat je de spanning en de drang om te roken los... Je hebt een beslissing genomen voor je gezondheid, voor je vrijheid. Wees trots op deze keuze. ... ... ... Visualiseer nu twee paden voor je. Het ene is grijs, rokerig, het pad van verslaving. Het andere is licht, vol frisse lucht, het pad van vrijheid. Voel het verschil. ... ... ... Voel de geur van frisse lucht, de vitaliteit in je longen, de energie die door je lichaam stroomt op dit lichte pad. ... ... ... Stel je voor dat je over een paar weken, een paar maanden... zonder tabak bent. Voel de trots. Voel je adem ruimer, je reukvermogen scherper, je energie verhoogd. ... ... ... Telkens als er een verlangen opkomt, heb je een anker. Leg een hand op je buik en haal drie keer diep adem. Herinner je dit beeld van het lichte pad. ... ... ... Je bent sterker dan deze oude gewoonte. Elke dag zonder tabak is een overwinning. Je ademt het leven. Je bent vrij.`,
        amincissement: `Hallo. Welkom bij deze sessie gewijd aan het harmoniseren van je lichaam en geest. Maak het je gemakkelijk... sluit je ogen... en adem diep... ... ... ... Laat bij elke uitademing de oordelen over je lichaam, de frustraties, de diëten uit het verleden los... Verwelkom jezelf met welwillendheid, hier en nu. ... ... ... Word je bewust van je lichaam, zijn vorm, zijn aanwezigheid... zonder oordeel, met dankbaarheid... Het is je voertuig voor het leven. ... ... ... Stel je nu een zacht gouden licht voor dat via de kruin van je hoofd binnenkomt. Het is een licht van genezing, acceptatie en energie. Het daalt langzaam af en vult elke cel van je lichaam met een gevoel van welzijn. ... ... ... Dit licht helpt je om je weer te verbinden met je ware gevoelens van honger en verzadiging. Het leidt je naar gezonde voedingskeuzes die je lichaam voeden en respecteren. ... ... ... Visualiseer de persoon die je wilt worden: vol energie, comfortabel in je lichaam, in vrede met voedsel. Zie jezelf met gemak bewegen, activiteiten doen waar je van houdt. Dit beeld zit in je. ... ... ... Je lichaam weet wat goed voor het is. Luister ernaar. Vertrouw erop. Elke dag maak je bewuste en welwillende keuzes voor je welzijn. Je bent in harmonie met jezelf.`,
        douleur: `Hallo. Deze sessie is een ruimte om je te helpen om te gaan met de gewaarwording van pijn. Maak het jezelf zo comfortabel als je lichaam vandaag toelaat. Sluit je ogen en laat je adem een natuurlijk en rustgevend ritme vinden. ... ... ... Om te beginnen zullen we ons niet richten op de pijn, maar op comfort. Ga mentaal door je lichaam en zoek een gebied dat op dit moment neutraal of zelfs aangenaam is. Misschien de warmte van je handen... het gevoel van je haar op je voorhoofd... of het contact van je voeten met de vloer. ... ... ... Kies een van deze gebieden en dompel je bewustzijn erin onder. Verken dit gevoel van niet-pijn, van comfort. Laat het een bron worden, een anker van rust in je lichaam. ... ... ... Nu, met deze bron van comfort stevig aanwezig, kun je het pijngebied in je bewustzijnsveld laten komen. Zonder angst, zonder oordeel. Observeer de gewaarwording van een afstand, zoals een wetenschapper een fenomeen observeert. ... ... ... Geef het een vorm, een kleur, een textuur. Is het warm, koud? Stekend, dof? Dicht, diffuus? Observeer gewoon, zonder het als 'slecht' te beoordelen. ... ... ... Gebruik nu je adem als een instrument voor transformatie. Stel je voor dat je bij elke inademing uit je comfortzone put en een adem van zachtheid en warmte naar het pijnlijke gebied stuurt. ... ... ... En bij elke uitademing stel je je voor dat de pijnlijke gewaarwording wat van zijn intensiteit verliest. Visualiseer de kleur die bleker, transparanter wordt. De randen, die misschien scherp en hard waren, worden wazig en zacht. ... ... ... Zet dit proces voort... Adem comfort naar de pijn... Adem uit om het op te lossen, te verspreiden, te verzachten. Je kunt je ook voorstellen dat de gewaarwording verandert. Een ijsblok dat smelt onder een zachte zon... een strakke knoop die vezel voor vezel loskomt... ... ... ... Je bent niet je pijn. Je bent het bewustzijn dat het observeert en de kracht heeft om het te moduleren. Je herwint de controle niet door strijd, maar door zachtheid en aandacht. Blijf ademen. Je bent veilig.`,
    alcool: `Hallo. Neem dit moment voor jezelf, om het pad dat je bewandelt en de kracht van je beslissing te erkennen. Neem een comfortabele houding aan, sluit je ogen. ... ... ... Haal diep en krachtig adem, en laat bij het uitademen de spanningen van de dag los. Een tweede keer, adem de trots van je keuze in... en adem het gewicht van het verleden uit. Een laatste keer, adem kalmte in... en adem alle onrust uit. ... ... ... Word je bewust van je lichaam, hier en nu. Voel de helderheid die terugkeert in je geest. Voel de vitaliteit die zich dag na dag in je cellen nestelt. Je lichaam regenereert, het bedankt je voor het respect dat je het geeft. ... ... ... Visualiseer een zuiver wit licht dat via je kruin naar binnen komt. Het is een licht van helderheid, van zuiverheid. Het daalt in je af en reinigt alles op zijn pad. Het reinigt je gedachten, je keel, je borst, je lever, je bloed... Het neemt alle giftige herinneringen mee en laat je schoon, vernieuwd, vol gezonde energie achter. ... ... ... Het verlangen, of de behoefte, is een gedachte, een oude neurologische gewoonte. Het is niet jij. Je hebt de macht om er niet op te reageren. Stel je voor dat je aan de oever van een rivier zit. Verlangens zijn als bladeren of takken die op het water drijven. Ze verschijnen stroomopwaarts, drijven langs je heen en vervolgen hun weg stroomafwaarts tot ze verdwijnen. ... ... ... Jij bent de waarnemer op de oever. Je hoeft niet in het water te springen om elk blad te vangen. Je kunt het gewoon voorbij zien gaan. Als er een verlangen opkomt, adem dan. Zeg tegen jezelf: 'Ik zie deze gedachte. Het is slechts een golf uit het verleden.' En als een golf zal het opkomen, een piek bereiken en dan onvermijdelijk weer afnemen en verdwijnen. Jij blijft aan de oever, kalm en stabiel. ... ... ... Projecteer jezelf nu in de nabije toekomst. Stel je een sociale situatie voor, omringd door vrienden. Je houdt een glas vers water, sap of je favoriete alcoholvrije drank vast. Je bent volkomen op je gemak. Je bent aanwezig, je geest is scherp, je neemt volledig deel aan het gesprek. Je voelt je goed. Je hebt de controle. Je hebt niets anders nodig om van dit moment te genieten. ... ... ... Voel de trots, de eenvoud, de vrijheid van deze keuze. Die persoon ben jij. Veranker dit beeld en dit gevoel in jezelf. Dit is je nieuwe realiteit, die je elke dag opbouwt.`,
    confiance: `Hallo en welkom in deze ruimte om je zelfvertrouwen te versterken. Maak het jezelf gemakkelijk, sluit je ogen en haal diep adem. Laat bij het uitademen twijfels en angsten los. ... ... ... Word je bewust van je houding, hier en nu. Richt je iets op, open je schouders. Voel de gronding van je voeten op de vloer. Je bent stabiel, stevig. ... ... ... Visualiseer in het midden van je borst een bol van warm, gouden licht. Dit is de kern van je vertrouwen. ... ... ... Bij elke ademhaling groeit deze bol, wordt het licht intenser, stralender. Het vult je romp, stroomt door je armen, stijgt naar je hoofd. Je hele wezen is vervuld van dit licht van vertrouwen. ... ... ... Denk aan een moment, hoe kort ook, waarop je trots was op jezelf, competent, in volledige controle over je capaciteiten. Herleef die scène, voel de positieve emoties. Veranker dat gevoel. ... ... ... Deze kracht zit in je. Het is er altijd geweest. Herhaal innerlijk: 'Ik ben capabel. Ik geloof in mezelf. Ik verdien succes en respect.' ... ... ... Elke dag voed je dit innerlijke licht. Je loopt met zelfvertrouwen en sereniteit door de wereld.`
    }
};

const sophrologySessions = {
    sommeil: [
        { startFreq: 10, endFreq: 9, duration: 120, blinkMode: 'alternating' },
        { startFreq: 9,  endFreq: 7, duration: 240, blinkMode: 'synchro' },
        { startFreq: 7,  endFreq: 5, duration: 360, blinkMode: 'crossed' },
        { startFreq: 5,  endFreq: 3, duration: 360, blinkMode: 'alternating' },
        { startFreq: 3,  endFreq: 2, duration: 120, blinkMode: 'synchro' }
    ],
    relaxation: [
        { startFreq: 12, endFreq: 10, duration: 120, blinkMode: 'synchro' },
        { startFreq: 10, endFreq: 8, duration: 480, blinkMode: 'alternating' },
        { startFreq: 8,  endFreq: 6, duration: 480, blinkMode: 'crossed' },
        { startFreq: 6,  endFreq: 7, duration: 120, blinkMode: 'synchro' }
    ],
    antiStress: [
        { startFreq: 12, endFreq: 10, duration: 180, blinkMode: 'synchro' },
        { startFreq: 10, endFreq: 8, duration: 420, blinkMode: 'alternating' },
        { startFreq: 8,  endFreq: 7, duration: 420, blinkMode: 'crossed' },
        { startFreq: 7,  endFreq: 9, duration: 180, blinkMode: 'synchro' }
    ],
    meditation: [
        { startFreq: 10, endFreq: 9, duration: 240, blinkMode: 'synchro' },
        { startFreq: 9,  endFreq: 8, duration: 360, blinkMode: 'alternating' },
        { startFreq: 8,  endFreq: 7, duration: 360, blinkMode: 'crossed' },
        { startFreq: 7,  endFreq: 7, duration: 240, blinkMode: 'synchro' }
    ],
    arretTabac: [
        { startFreq: 14, endFreq: 12, duration: 180, blinkMode: 'synchro' },
        { startFreq: 12, endFreq: 10, duration: 420, blinkMode: 'alternating' },
        { startFreq: 10, endFreq: 8, duration: 420, blinkMode: 'crossed' },
        { startFreq: 8,  endFreq: 12, duration: 180, blinkMode: 'synchro' }
    ],
    amincissement: [
        { startFreq: 13, endFreq: 11, duration: 180, blinkMode: 'synchro' },
        { startFreq: 11, endFreq: 9, duration: 480, blinkMode: 'alternating' },
        { startFreq: 9,  endFreq: 8, duration: 420, blinkMode: 'crossed' },
        { startFreq: 8,  endFreq: 10, duration: 120, blinkMode: 'synchro' }
    ],
    douleur: [
        { startFreq: 10, endFreq: 8, duration: 240, blinkMode: 'alternating' },
        { startFreq: 8,  endFreq: 6, duration: 480, blinkMode: 'synchro' },
        { startFreq: 6,  endFreq: 5, duration: 360, blinkMode: 'crossed' },
        { startFreq: 5,  endFreq: 7, duration: 120, blinkMode: 'alternating' }
    ],
    alcool: [
        { startFreq: 12, endFreq: 10, duration: 240, blinkMode: 'synchro' },
        { startFreq: 10, endFreq: 8, duration: 480, blinkMode: 'alternating' },
        { startFreq: 8,  endFreq: 7, duration: 360, blinkMode: 'crossed' },
        { startFreq: 7,  endFreq: 11, duration: 120, blinkMode: 'synchro' }
    ],
    confiance: [
        { startFreq: 12, endFreq: 10, duration: 240, blinkMode: 'synchro' },
        { startFreq: 10, endFreq: 8, duration: 480, blinkMode: 'alternating' },
        { startFreq: 8, endFreq: 12, duration: 480, blinkMode: 'crossed' }
    ]
};

const sessions = {
    deepRelaxation: [ 
        { startFreq: 10, endFreq: 8, duration: 120, blinkMode: 'alternating' },
        { startFreq: 8,  endFreq: 6, duration: 120, blinkMode: 'synchro' },
        { startFreq: 6,  endFreq: 4, duration: 120, blinkMode: 'alternating' },
        { startFreq: 4,  endFreq: 4, duration: 240, blinkMode: 'crossed' }
    ],
    concentration: [ 
        { startFreq: 8,  endFreq: 10, duration: 60, blinkMode: 'synchro' },
        { startFreq: 10, endFreq: 12, duration: 60, blinkMode: 'synchro' },
        { startFreq: 12, endFreq: 15, duration: 120, blinkMode: 'alternating' },
        { startFreq: 15, endFreq: 15, duration: 60, blinkMode: 'synchro' }
    ],
    sleep: [
        { startFreq: 8, endFreq: 5, duration: 120, blinkMode: 'alternating' },
        { startFreq: 5, endFreq: 3, duration: 120, blinkMode: 'crossed' },
        { startFreq: 3, endFreq: 1, duration: 180, blinkMode: 'alternating' },
        { startFreq: 1, endFreq: 1, duration: 180, blinkMode: 'synchro' }
    ],
    meditation: [
        { startFreq: 10, endFreq: 7, duration: 240, blinkMode: 'alternating' },
        { startFreq: 7,  endFreq: 5, duration: 360, blinkMode: 'crossed' },
        { startFreq: 5,  endFreq: 5, duration: 600, blinkMode: 'synchro' }
    ],
    fastRelaxation: [ 
        { startFreq: 10, endFreq: 8, duration: 60, blinkMode: 'alternating' },
        { startFreq: 8,  endFreq: 6, duration: 60, blinkMode: 'synchro' },
        { startFreq: 6,  endFreq: 4, duration: 60, blinkMode: 'alternating' },
        { startFreq: 4,  endFreq: 4, duration: 120, blinkMode: 'crossed' }
    ],
    fastMeditation: [
        { startFreq: 10, endFreq: 7, duration: 120, blinkMode: 'alternating' },
        { startFreq: 7,  endFreq: 5, duration: 180, blinkMode: 'crossed' },
        { startFreq: 5,  endFreq: 5, duration: 300, blinkMode: 'synchro' }
    ],
    eeg: [],
    user1: [],
    user2: []
};

// --- Global DOM References ---
let leftPanel, centerPanel, rightPanel, startButton, colorPicker;
let carrierFrequencySlider, carrierFrequencyInput;
let blinkRateSlider, blinkFrequencyInput;
let audioModeRadios;
let bbMultiplierRadios;
let binauralVolumeSlider, isochronicVolumeSlider, alternophonyVolumeSlider;
let binauralBeatFrequencyDisplay;
let warningButton, warningModal, understoodButton;
let helpButton, helpModal;
let flagFr, flagEn, flagDe, flagEs, flagIt, flagNl;
let appContainer, visualPanelsWrapper, immersiveExitButton, frequencyDisplayOverlay;
let crackleToggleButton, crackleVolumeSlider;
let alternophonyToggleButton;
let sessionSelect, sophrologySelect, voiceGenderRadios;
let blinkModeRadios;
let set432hzButton;
let musicLoopSelect, musicLoopVolumeSlider, musicToggleButton;
let sessionHelpButton, sessionGraphModal;
let aboutButton, aboutModal;
let customSessionModal, customSessionForm, customSessionTableBody, saveCustomSessionButton, cancelCustomSessionButton, editSessionButton;
let visualModeSelect;
let leftCanvas, rightCanvas, leftCtx, rightCtx;

// DOM References for the ambiance system
let ambianceSelect, ambianceToggleButton, ambianceVolumeSlider;


// --- Global Functions ---

function setLanguage(lang) {
    currentLanguage = lang;
    document.querySelectorAll('[data-en]').forEach(element => {
        const text = element.getAttribute(`data-${lang}`) || element.getAttribute('data-en');
        if (!text) return;
        if (element.id === 'startButton') {
            const stopTexts = { en: 'Stop', fr: 'Arrêter', de: 'Stopp', es: 'Parar', it: 'Ferma', nl: 'Stop' };
            element.textContent = visualTimeoutId ? stopTexts[lang] || 'Stop' : text;
        } else if (element.tagName === 'LI' || element.tagName === 'P' || element.tagName === 'H2' || element.tagName === 'H3' || element.tagName === 'H4' || element.tagName === 'SPAN' || element.tagName === 'OPTION') {
            element.innerHTML = text;
        } else {
            element.textContent = text;
        }
    });
    document.querySelectorAll('.lang-flag').forEach(flag => {
        flag.classList.toggle('active', flag.dataset.lang === lang);
    });
}

function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            masterGainNode = audioContext.createGain();
            masterGainNode.connect(audioContext.destination);
            masterGainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        } catch (e) {
            alert('Your browser does not support the Web Audio API.');
        }
    }
}

function synchronizeMusicLoop() {
    if (musicLoopAudio && !musicLoopAudio.paused) {
        musicLoopAudio.playbackRate = BLINK_FREQUENCY_HZ / 8.0;
    }
}

// --- Functions for EEG Feedback ---

function handleEEGData(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        const minVol = 0.25;
        const volRange = 0.50;

        const attValue = parseFloat(data.att);
        if (!isNaN(attValue) && attValue >= 0 && attValue <= 1) {
            const minFreq = 1;
            const maxFreq = 16;
            BLINK_FREQUENCY_HZ = minFreq + (attValue * (maxFreq - minFreq));
            updateBinauralFrequencies();
        }

        const engValue = parseFloat(data.eng);
        if (!isNaN(engValue) && engValue >= 0 && engValue <= 1) {
            const minCarrier = 40;
            const maxCarrier = 440;
            currentCarrierFrequency = minCarrier + (engValue * (maxCarrier - minCarrier));
            carrierFrequencyInput.value = currentCarrierFrequency.toFixed(0);
            carrierFrequencySlider.value = currentCarrierFrequency;
            updateBinauralFrequencies();
        }

        const intValue = parseFloat(data.int);
        if (!isNaN(intValue) && intValue >= 0 && intValue <= 1) {
            currentBinauralVolume = minVol + (intValue * volRange);
            binauralVolumeSlider.value = currentBinauralVolume * 100;
             if (binauralMasterGain && audioContext) {
                binauralMasterGain.gain.setTargetAtTime(currentBinauralVolume, audioContext.currentTime, 0.01);
            }
        }

        if (data.blinkMode && data.blinkMode !== currentBlinkMode) {
            currentBlinkMode = data.blinkMode;
            const radioToSelect = document.querySelector(`input[name="blinkMode"][value="${currentBlinkMode}"]`);
            if(radioToSelect) {
                radioToSelect.checked = true;
            }
        }
        
        if (data.audioMode && data.audioMode !== currentAudioMode) {
            currentAudioMode = data.audioMode;
            document.querySelector(`input[name="audioMode"][value="${currentAudioMode}"]`).checked = true;
            if (visualTimeoutId) {
                stopBinauralBeats();
                stopIsochronicTones();
                
                if (currentAudioMode === 'binaural' || currentAudioMode === 'both') startBinauralBeats();
                if (currentAudioMode === 'isochronic' || currentAudioMode === 'both') startIsochronicTones();
            }
        }
        
        const relValue = parseFloat(data.rel);
        if (!isNaN(relValue) && relValue >= 0 && relValue <= 1) {
            currentIsochronicVolume = minVol + (relValue * volRange);
            isochronicVolumeSlider.value = currentIsochronicVolume * 100;
        }

        const strValue = parseFloat(data.str);
        if (!isNaN(strValue) && strValue >= 0 && strValue <= 1) {
            currentAlternophonyVolume = minVol + (strValue * volRange);
            alternophonyVolumeSlider.value = currentAlternophonyVolume * 100;
            if (alternophonyMasterGain && audioContext) {
                alternophonyMasterGain.gain.setTargetAtTime(currentAlternophonyVolume, audioContext.currentTime, 0.01);
            }
        }

        updateFrequencyDisplays();

    } catch (e) {
        console.error("Erreur lors du traitement des données EEG JSON:", e);
    }
}

function connectEEG() {
    if (eegSocket) return; 
    eegSocket = new WebSocket('ws://localhost:8081');
    eegSocket.onopen = () => {
        console.log("Connecté au pont EEG !");
        frequencyDisplayOverlay.textContent = "EEG";
    };
    eegSocket.onmessage = (event) => handleEEGData(event.data);
    eegSocket.onerror = (error) => {
        console.error("Erreur WebSocket EEG:", error);
        alert("Impossible de se connecter au serveur pont EEG. Assurez-vous qu'il est bien lancé.");
        if (visualTimeoutId) startButton.click();
    };
    eegSocket.onclose = () => {
        console.log("Déconnecté du pont EEG.");
        eegSocket = null;
        if (currentSession === 'eeg' && visualTimeoutId) startButton.click();
    };
}

function disconnectEEG() {
    if (eegSocket) {
        eegSocket.close();
    }
}

// --- End of EEG Functions ---

function playGuidedText(sessionKey) {
    if (!('speechSynthesis' in window)) {
        alert("Désolé, votre navigateur ne supporte pas la synthèse vocale.");
        return;
    }
    stopGuidedText();

    const langTexts = sophrologyTexts[currentLanguage] || sophrologyTexts['fr'];
    const text = langTexts[sessionKey];

    if (!text || text.includes('//')) {
        console.warn(`Texte de sophrologie non disponible pour la langue: ${currentLanguage}`);
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.6; 

    let voices = window.speechSynthesis.getVoices();
    
    const setVoice = () => {
        voices = window.speechSynthesis.getVoices();
        selectVoice(utterance, voices);
        window.speechSynthesis.speak(utterance);
    };

    if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = setVoice;
    } else {
        setVoice();
    }
    
    utterance.onend = () => console.log("La séance guidée est terminée.");
    utterance.onerror = (event) => console.error("Erreur de synthèse vocale:", event.error);
}

function selectVoice(utterance, voices) {
    const langMap = { en: 'en-US', fr: 'fr-FR', de: 'de-DE', es: 'es-ES', it: 'it-IT', nl: 'nl-NL' };
    const ttsLang = langMap[currentLanguage] || 'fr-FR';
    utterance.lang = ttsLang;

    const selectedGender = document.querySelector('input[name="voiceGender"]:checked').value;
    
    let filteredVoices = voices.filter(voice => voice.lang === ttsLang);
    let genderedVoices = [];

    const femaleKeywords = ['female', 'femme', 'weiblich', 'mujer', 'donna', 'vrouw', 'zira', 'susan', 'hazel', 'catherine', 'elizabeth', 'amy', 'emma', 'serena', 'aurelie', 'amelie', 'chantal', 'julie', 'anna', 'elena', 'laura', 'paola', 'lotte', 'femke'];
    const maleKeywords = ['male', 'homme', 'männlich', 'hombre', 'uomo', 'man', 'david', 'mark', 'james', 'george', 'paul', 'thomas', 'antoine', 'hans', 'klaus', 'jorge', 'pablo', 'diego', 'luca', 'paolo', 'roberto', 'daan', 'rik', 'willem'];

    if (selectedGender === 'female') {
        genderedVoices = filteredVoices.filter(voice => femaleKeywords.some(kw => voice.name.toLowerCase().includes(kw)));
    } else if (selectedGender === 'male') {
        genderedVoices = filteredVoices.filter(voice => maleKeywords.some(kw => voice.name.toLowerCase().includes(kw)));
    }

    if (genderedVoices.length > 0) {
        utterance.voice = genderedVoices[0];
    } else if (filteredVoices.length > 0) {
        utterance.voice = filteredVoices[0];
    }
}


function stopGuidedText() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

function getSynchronizedBinauralBeatFrequency() {
    return BLINK_FREQUENCY_HZ * currentBBMultiplier;
}

function updateBinauralFrequencies() {
    if (!visualTimeoutId || !binauralOscillatorLeft || (currentAudioMode !== 'binaural' && currentAudioMode !== 'both')) {
        return;
    }
    
    const binauralBeatFreq = getSynchronizedBinauralBeatFrequency();
    const freqLeftEar = currentCarrierFrequency - (binauralBeatFreq / 2);
    const freqRightEar = currentCarrierFrequency + (binauralBeatFreq / 2);

    if (freqLeftEar > 0 && audioContext) {
        const now = audioContext.currentTime;
        binauralOscillatorLeft.frequency.setTargetAtTime(freqLeftEar, now, 0.015);
        binauralOscillatorRight.frequency.setTargetAtTime(freqRightEar, now, 0.015);
        updateFrequencyDisplays();
    }
}

function startBinauralBeats() {
    initAudioContext();
    stopBinauralBeats();
    const binauralBeatFreq = getSynchronizedBinauralBeatFrequency();
    const freqLeftEar = currentCarrierFrequency - (binauralBeatFreq / 2);
    const freqRightEar = currentCarrierFrequency + (binauralBeatFreq / 2);
    if (freqLeftEar <= 0 || freqRightEar <= 0 || !audioContext) return; 

    binauralOscillatorLeft = audioContext.createOscillator();
    binauralOscillatorLeft.type = 'sine';
    binauralOscillatorLeft.frequency.value = freqLeftEar;
    
    binauralOscillatorRight = audioContext.createOscillator();
    binauralOscillatorRight.type = 'sine';
    binauralOscillatorRight.frequency.value = freqRightEar;

    const gainLeft = audioContext.createGain();
    const gainRight = audioContext.createGain();
    const merger = audioContext.createChannelMerger(2);
    binauralMasterGain = audioContext.createGain();
    binauralOscillatorLeft.connect(gainLeft).connect(merger, 0, 0);
    binauralOscillatorRight.connect(gainRight).connect(merger, 0, 1);
    merger.connect(binauralMasterGain).connect(masterGainNode);
    binauralMasterGain.gain.setValueAtTime(currentBinauralVolume, audioContext.currentTime);
    binauralOscillatorLeft.start(audioContext.currentTime);
    binauralOscillatorRight.start(audioContext.currentTime);
    binauralBeatFrequencyDisplay.textContent = `BB: ${binauralBeatFreq.toFixed(1)} Hz`;
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
    }
    if(binauralBeatFrequencyDisplay) binauralBeatFrequencyDisplay.textContent = `BB: -- Hz`;
}

function startIsochronicTones() {
    initAudioContext();
    stopIsochronicTones();
    if (!audioContext) return;
    isochronicOscillator = audioContext.createOscillator();
    isochronicOscillator.type = 'sine';
    isochronicOscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    isochronicEnvelopeGain = audioContext.createGain();
    isochronicEnvelopeGain.gain.setValueAtTime(0, audioContext.currentTime);
    isochronicPanner = audioContext.createStereoPanner();
    isochronicMasterGain = audioContext.createGain();
    isochronicOscillator.connect(isochronicEnvelopeGain);
    isochronicEnvelopeGain.connect(isochronicPanner);
    isochronicPanner.connect(isochronicMasterGain);
    isochronicMasterGain.connect(masterGainNode);
    isochronicOscillator.start();
}

function stopIsochronicTones() {
    if (isochronicOscillator) {
        isochronicOscillator.stop();
        isochronicOscillator.disconnect();
        isochronicOscillator = null;
    }
}

function startAlternophony() {
    initAudioContext();
    if (alternophonyIsPlaying) return;
    if (!audioContext) return;

    alternophonyNoiseNode = audioContext.createBufferSource();
    alternophonyNoiseNode.buffer = createNoiseBuffer(audioContext, 'white');
    alternophonyNoiseNode.loop = true;

    alternophonyEnvelopeGain = audioContext.createGain();
    alternophonyEnvelopeGain.gain.setValueAtTime(0, audioContext.currentTime);

    alternophonyPannerNode = audioContext.createStereoPanner();
    
    alternophonyMasterGain = audioContext.createGain();
    alternophonyMasterGain.gain.value = currentAlternophonyVolume;

    alternophonyNoiseNode.connect(alternophonyEnvelopeGain);
    alternophonyEnvelopeGain.connect(alternophonyPannerNode);
    alternophonyPannerNode.connect(alternophonyMasterGain);
    alternophonyMasterGain.connect(masterGainNode);
    
    alternophonyNoiseNode.start();
    alternophonyIsPlaying = true;
    if (alternophonyToggleButton) alternophonyToggleButton.classList.add('active');
}

function stopAlternophony() {
    if(alternophonyNoiseNode) {
        alternophonyNoiseNode.stop();
        alternophonyNoiseNode.disconnect();
        alternophonyNoiseNode = null;
    }
    alternophonyIsPlaying = false;
    if (alternophonyToggleButton) alternophonyToggleButton.classList.remove('active');
}

function playSound(panDirection) {
    if (currentBlinkMode === 'balanced' && isLightPhase) {
        return;
    }

    const now = audioContext.currentTime;
    const soundDuration = 1 / BLINK_FREQUENCY_HZ;

    if (isochronicOscillator && (currentAudioMode === 'isochronic' || currentAudioMode === 'both')) {
        let panValue = 0;
        
        if (currentBlinkMode === 'alternating') {
            panValue = (panDirection === 'left') ? -1 : 1;
        } else if (currentBlinkMode === 'crossed') {
            panValue = (panDirection === 'left') ? 1 : -1;
        }
        
        isochronicPanner.pan.setValueAtTime(panValue, now);
        isochronicMasterGain.gain.setValueAtTime(currentIsochronicVolume, now);
        isochronicEnvelopeGain.gain.cancelScheduledValues(now);
        isochronicEnvelopeGain.gain.setValueAtTime(0, now);
        isochronicEnvelopeGain.gain.linearRampToValueAtTime(1.0, now + 0.01);
        isochronicEnvelopeGain.gain.linearRampToValueAtTime(0, now + soundDuration);
    }
    
    if (alternophonyIsPlaying) {
        if (panDirection === 'center') {
            alternophonyPannerNode.pan.setValueAtTime(0, now);
        } else {
            const startPan = panDirection === 'left' ? -1 : 1;
            const endPan = panDirection === 'left' ? 1 : -1;
            
            alternophonyPannerNode.pan.cancelScheduledValues(now);
            alternophonyPannerNode.pan.setValueAtTime(startPan, now);
            alternophonyPannerNode.pan.linearRampToValueAtTime(endPan, now + soundDuration);
        }

        alternophonyEnvelopeGain.gain.cancelScheduledValues(now);
        alternophonyEnvelopeGain.gain.setValueAtTime(0, now);
        alternophonyEnvelopeGain.gain.linearRampToValueAtTime(1.0, now + soundDuration);
    }
}

function createNoiseBuffer(audioCtx, type) {
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    if (type === 'brown') {
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        }
    } else {
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
    }
    return buffer;
}

function startWaves() {
    if (waveIsPlaying) return;
    initAudioContext();
    if (!audioContext) return;
    waveRumbleNode = audioContext.createBufferSource();
    waveRumbleNode.buffer = createNoiseBuffer(audioContext, 'brown');
    waveRumbleNode.loop = true;
    const rumbleModulationGain = audioContext.createGain();
    rumbleModulationGain.gain.value = 0.6; 
    waveHissNode = audioContext.createBufferSource();
    waveHissNode.buffer = createNoiseBuffer(audioContext, 'white');
    waveHissNode.loop = true;
    const hissFilter = audioContext.createBiquadFilter();
    hissFilter.type = 'bandpass';
    hissFilter.frequency.value = 5000;
    hissFilter.Q.value = 1;
    const hissModulationGain = audioContext.createGain();
    hissModulationGain.gain.value = 0.4;
    waveLfoNode = audioContext.createOscillator();
    waveLfoNode.frequency.value = 0.15;
    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = 1;
    waveMetaLfoNode = audioContext.createOscillator();
    waveMetaLfoNode.frequency.value = 0.03;
    const metaLfoGain = audioContext.createGain();
    metaLfoGain.gain.value = 0.05;
    waveMasterVolume = audioContext.createGain();
    waveMasterVolume.gain.value = parseFloat(ambianceVolumeSlider.value) / 100;
    waveRumbleNode.connect(rumbleModulationGain).connect(waveMasterVolume);
    waveHissNode.connect(hissFilter).connect(hissModulationGain).connect(waveMasterVolume);
    waveMasterVolume.connect(masterGainNode);
    waveLfoNode.connect(lfoGain);
    lfoGain.connect(rumbleModulationGain.gain);
    lfoGain.connect(hissModulationGain.gain);
    waveMetaLfoNode.connect(metaLfoGain).connect(waveLfoNode.frequency);
    waveRumbleNode.start();
    waveHissNode.start();
    waveLfoNode.start();
    waveMetaLfoNode.start();
    waveIsPlaying = true;
}

function stopWaves() {
    if (!waveIsPlaying) return;
    if (waveRumbleNode) waveRumbleNode.stop();
    if (waveHissNode) waveHissNode.stop();
    if (waveLfoNode) waveLfoNode.stop();
    if (waveMetaLfoNode) waveMetaLfoNode.stop();
    waveIsPlaying = false;
}

function startCrackles() {
    if (crackleIsPlaying) return;
    initAudioContext();
    if (!audioContext) return;
    if (!crackleNoiseBuffer) crackleNoiseBuffer = createNoiseBuffer(audioContext, 'white');
    crackleVolumeNode = audioContext.createGain();
    crackleVolumeNode.connect(masterGainNode);
    updateCrackleVolume();
    function scheduleCrackle() {
        const source = audioContext.createBufferSource();
        source.buffer = crackleNoiseBuffer;
        source.playbackRate.value = 0.5 + Math.random() * 1.0; 
        const envelope = audioContext.createGain();
        envelope.connect(crackleVolumeNode);
        const filter = audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000 + (Math.random() * 3000);
        source.connect(filter).connect(envelope);
        source.start();
        const now = audioContext.currentTime;
        const attackTime = 0.005;
        const decayTime = 0.4 + Math.random() * 0.6; 
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(1, now + attackTime);
        envelope.gain.exponentialRampToValueAtTime(0.0001, now + attackTime + decayTime);
        source.stop(now + attackTime + decayTime + 0.1);
        const randomDelay = 150 + Math.random() * 500;
        crackleTimeoutId = setTimeout(scheduleCrackle, randomDelay);
    }
    scheduleCrackle();
    crackleIsPlaying = true;
    crackleToggleButton.classList.add('active');
}

function stopCrackles() {
    if (!crackleIsPlaying) return;
    clearTimeout(crackleTimeoutId);
    crackleTimeoutId = null;
    if (crackleVolumeNode) {
        crackleVolumeNode.disconnect();
        crackleVolumeNode = null;
    }
    crackleIsPlaying = false;
    crackleToggleButton.classList.remove('active');
}

function updateCrackleVolume() {
    if (crackleVolumeNode && audioContext) {
        const newVolume = parseFloat(crackleVolumeSlider.value) / 100;
        crackleVolumeNode.gain.setTargetAtTime(newVolume, audioContext.currentTime, 0.01);
    }
}

// --- VISUALS ---
function getProportionalFlashDuration(minDuty, maxDuty) {
    const minFreq = 0.2;
    const maxFreq = 20.0;
    
    if (maxFreq === minFreq) {
        return (1000 / BLINK_FREQUENCY_HZ) * minDuty;
    }
    
    const progress = Math.max(0, Math.min(1, (BLINK_FREQUENCY_HZ - minFreq) / (maxFreq - minFreq)));
    const dutyCycle = minDuty - (progress * (minDuty - maxDuty));
    
    return (1000 / BLINK_FREQUENCY_HZ) * dutyCycle;
}

function updateVisuals(isBlinking) {
    if (currentBlinkMode === 'balanced' && !isLightPhase) {
        clearAllVisuals();
        return;
    }

    if (currentVisualMode === 'circle') {
        leftCanvas.style.display = 'none';
        rightCanvas.style.display = 'none';
        drawCircleVisual(isBlinking);
    } else {
        clearCircleVisuals();
        leftCanvas.style.display = 'block';
        rightCanvas.style.display = 'block';
        
        let shouldAnimateNow = true; 
        if (currentBlinkMode === 'synchro') {
             const flashDuration = getProportionalFlashDuration(0.5, 0.2); 
             shouldAnimateNow = isBlinking || (performance.now() - lastBlinkTime < flashDuration);
        }
        
        animateCanvasVisuals(shouldAnimateNow);
    }
}

function clearAllVisuals() {
    clearCircleVisuals();
    leftCtx.clearRect(0, 0, leftCanvas.width, leftCanvas.height);
    rightCtx.clearRect(0, 0, rightCanvas.width, rightCanvas.height);
}

function clearCircleVisuals() {
    document.querySelectorAll('.visual-circle').forEach(c => c.remove());
}

function drawCircleVisual(isBlinking) {
    if (currentBlinkMode === 'alternating' || currentBlinkMode === 'crossed') {
        const flashDuration = getProportionalFlashDuration(0.9, 0.5); 
        if (isBlinking) {
            clearCircleVisuals();
            const targetPanel = isLeftLight ? leftPanel : rightPanel;
            targetPanel.appendChild(createSizedCircle(targetPanel));
        } else if (performance.now() - lastBlinkTime > flashDuration) {
             clearCircleVisuals();
        }
    } else { 
        const flashDuration = getProportionalFlashDuration(0.5, 0.2); 
        if (isBlinking) {
            clearCircleVisuals();
            leftPanel.appendChild(createSizedCircle(leftPanel));
            rightPanel.appendChild(createSizedCircle(rightPanel));
        } else if (performance.now() - lastBlinkTime > flashDuration) {
            clearCircleVisuals();
        }
    }
}

function createSizedCircle(panel) {
    const circle = document.createElement('div');
    circle.className = 'circle visual-circle';
    circle.style.backgroundColor = colorPicker.value;
    const diameter = Math.min(panel.clientWidth, panel.clientHeight) * 0.85;
    circle.style.width = `${diameter}px`;
    circle.style.height = `${diameter}px`;
    return circle;
}

function animateCanvasVisuals(shouldDraw) {
    const time = performance.now() / 1000; 

    if (!shouldDraw) {
        leftCtx.clearRect(0, 0, leftCanvas.width, leftCanvas.height);
        rightCtx.clearRect(0, 0, rightCanvas.width, rightCanvas.height);
        return;
    }
    
    const drawOnPanel = (ctx, panel) => {
        const width = panel.clientWidth;
        const height = panel.clientHeight;
        if (ctx.canvas.width !== width || ctx.canvas.height !== height) {
            ctx.canvas.width = width;
            ctx.canvas.height = height;
        }

        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        ctx.fillStyle = colorPicker.value;
        ctx.strokeStyle = colorPicker.value;

        switch (currentVisualMode) {
            case 'circleOfCircles': drawCircleOfCircles(ctx, centerX, centerY, time); break;
            case 'tunnel': drawTunnel(ctx, centerX, centerY, time); break;
            case 'mandala': drawMandala(ctx, centerX, centerY, time); break;
            case 'fractal': drawFractal(ctx, centerX, centerY, time); break;
        }
    };
    
    if (currentBlinkMode === 'alternating' || currentBlinkMode === 'crossed') {
        if (isLeftLight) {
            drawOnPanel(leftCtx, leftCanvas);
            rightCtx.clearRect(0, 0, rightCanvas.width, rightCanvas.height);
        } else {
            drawOnPanel(rightCtx, rightCanvas);
            leftCtx.clearRect(0, 0, leftCanvas.width, leftCanvas.height);
        }
    } else { 
        drawOnPanel(leftCtx, leftCanvas);
        drawOnPanel(rightCtx, rightCanvas);
    }
}


// Drawing functions for canvas visuals
function drawCircleOfCircles(ctx, cx, cy, time) {
    const numCircles = 12;
    const mainRadius = Math.min(cx, cy) * 0.6;
    const smallRadius = mainRadius / 5;
    for (let i = 0; i < numCircles; i++) {
        const angle = (i / numCircles) * 2 * Math.PI + time;
        const x = cx + mainRadius * Math.cos(angle);
        const y = cy + mainRadius * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, smallRadius, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function drawTunnel(ctx, cx, cy, time) {
    const numRects = 10;
    const maxDim = Math.max(cx, cy);
    ctx.lineWidth = 2;
    for (let i = 0; i < numRects; i++) {
        const size = (maxDim * 2) * ((i - (time * 2 % 1) + 1) / numRects);
        ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
    }
}

function drawMandala(ctx, cx, cy, time) {
    const numLines = 18;
    const radius = Math.min(cx, cy) * 0.8;
    ctx.lineWidth = 2;
    for (let i = 0; i < numLines; i++) {
        const angle = (i / numLines) * 2 * Math.PI;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(radius, 0);
        ctx.arc(radius / 2, 0, radius / 2 * Math.abs(Math.sin(time + angle)), 0, Math.PI);
        ctx.stroke();
        ctx.restore();
    }
}

function drawFractal(ctx, cx, cy, time) {
    ctx.lineWidth = 1;
    function drawBranch(x, y, len, angle, depth) {
        if (depth === 0) return;
        ctx.beginPath();
        ctx.moveTo(x, y);
        const newX = x + len * Math.cos(angle);
        const newY = y + len * Math.sin(angle);
        ctx.lineTo(newX, newY);
        ctx.stroke();
        drawBranch(newX, newY, len * 0.8, angle - 0.5 + Math.sin(time/2)/2, depth - 1);
        drawBranch(newX, newY, len * 0.8, angle + 0.5 + Math.cos(time/2)/2, depth - 1);
    }
    drawBranch(cx, cy * 1.4, Math.min(cx, cy) / 4, -Math.PI / 2, 7);
}

function updateFrequencyDisplays() {
    if (frequencyDisplayOverlay) {
        if (currentSession !== 'eeg') {
            frequencyDisplayOverlay.textContent = `${BLINK_FREQUENCY_HZ.toFixed(1)} Hz`;
        } else {
            frequencyDisplayOverlay.textContent = "EEG";
        }
    }
    blinkFrequencyInput.value = BLINK_FREQUENCY_HZ.toFixed(1);
    blinkRateSlider.value = BLINK_FREQUENCY_HZ;
    binauralBeatFrequencyDisplay.textContent = `BB: ${getSynchronizedBinauralBeatFrequency().toFixed(1)} Hz`;
    synchronizeMusicLoop();
}

function validateAndSetFrequency(inputElement, sliderElement, isBlinkFreq) {
    let newValue = parseFloat(inputElement.value);
    const minVal = parseFloat(inputElement.min);
    const maxVal = parseFloat(inputElement.max);
    if (isNaN(newValue) || newValue < minVal || newValue > maxVal) {
        newValue = parseFloat(sliderElement.value);
        if (isNaN(newValue) || newValue < minVal || newValue > maxVal) newValue = minVal;
        inputElement.value = isBlinkFreq ? newValue.toFixed(1) : newValue;
    }
    if (isBlinkFreq) {
        BLINK_FREQUENCY_HZ = newValue;
    } else {
        currentCarrierFrequency = newValue;
    }
    sliderElement.value = newValue;
    updateFrequencyDisplays();
    updateBinauralFrequencies();
}

function fadeHtmlAudio(durationInSeconds) {
    clearInterval(htmlFadeInterval);

    const activeAudios = [];
    if (!musicLoopAudio.paused) activeAudios.push(musicLoopAudio);
    if (currentAmbiance && currentAmbiance.audio && !currentAmbiance.audio.paused) {
        activeAudios.push(currentAmbiance.audio);
    }

    if (activeAudios.length === 0) return;

    const tickRate = 50; // ms
    const totalTicks = (durationInSeconds * 1000) / tickRate;
    let currentTick = 0;
    const initialVolumes = activeAudios.map(audio => audio.volume);

    htmlFadeInterval = setInterval(() => {
        currentTick++;
        const progress = currentTick / totalTicks;

        if (progress >= 1) {
            activeAudios.forEach(audio => audio.volume = 0);
            clearInterval(htmlFadeInterval);
            return;
        }

        activeAudios.forEach((audio, index) => {
            audio.volume = initialVolumes[index] * (1 - progress);
        });

    }, tickRate);
}

function runSession(sessionKey, step = 0, isSophrology = false) {
    clearTimeout(sessionTimeoutId);
    clearInterval(rampIntervalId);

    const sessionSteps = isSophrology ? sophrologySessions[sessionKey] : sessions[sessionKey];

    if (!sessionSteps || sessionSteps.length === 0 || step >= sessionSteps.length) {
        if(visualTimeoutId) startButton.click();
        return;
    }

    const currentStep = sessionSteps[step];
    const { startFreq, endFreq, duration, blinkMode } = currentStep;

    if (blinkMode && blinkMode !== currentBlinkMode) {
        currentBlinkMode = blinkMode;
        const radioToSelect = document.querySelector(`input[name="blinkMode"][value="${blinkMode}"]`);
        if (radioToSelect) {
            radioToSelect.checked = true;
        }
    }
    
    let stepStartTime = Date.now();
    
    rampIntervalId = setInterval(() => {
        const elapsedTime = (Date.now() - stepStartTime) / 1000;
        const progress = Math.min(elapsedTime / duration, 1);
        BLINK_FREQUENCY_HZ = startFreq + (endFreq - startFreq) * progress;
        updateFrequencyDisplays();
        updateBinauralFrequencies();
    }, 100);

    if ((currentAudioMode === 'binaural' || currentAudioMode === 'both') && binauralOscillatorLeft && binauralOscillatorRight) {
        const now = audioContext.currentTime;
        const endBeat = endFreq * currentBBMultiplier;
        binauralOscillatorLeft.frequency.linearRampToValueAtTime(currentCarrierFrequency - (endBeat / 2), now + duration);
        binauralOscillatorRight.frequency.linearRampToValueAtTime(currentCarrierFrequency + (endBeat / 2), now + duration);
    }

    const isLastStep = (step === sessionSteps.length - 1);
    if (isLastStep) {
        const fadeDuration = Math.min(duration, 15);
        const fadeStartTime = (duration - fadeDuration) * 1000;

        setTimeout(() => {
            if (audioContext && masterGainNode) {
                const now = audioContext.currentTime;
                masterGainNode.gain.cancelScheduledValues(now);
                masterGainNode.gain.linearRampToValueAtTime(0, now + fadeDuration);
            }
            fadeHtmlAudio(fadeDuration);
        }, fadeStartTime);
    }

    sessionTimeoutId = setTimeout(() => {
        runSession(sessionKey, step + 1, isSophrology);
    }, duration * 1000);
}

function createSessionGraph(sessionData, sessionName) {
    const margin = { top: 20, right: 20, bottom: 60, left: 40 };
    const width = 400 - margin.left - margin.right;
    const height = 220 - margin.top - margin.bottom;

    if (!sessionData || sessionData.length === 0) return document.createElement('div');

    let totalDuration = 0;
    let maxFreq = 0;
    sessionData.forEach(d => {
        totalDuration += d.duration;
        maxFreq = Math.max(maxFreq, d.startFreq, d.endFreq);
    });
    maxFreq = Math.ceil(maxFreq / 5) * 5;

    const xScale = (t) => (t / totalDuration) * width;
    const yScale = (f) => height - (f / maxFreq) * height;

    const getSymbol = (mode, x, y) => {
        switch (mode) {
            case 'synchro':
                return `<rect class="graph-symbol" x="${x - 3}" y="${y - 3}" width="6" height="6"></rect>`;
            case 'crossed':
                return `<path class="graph-symbol cross" d="M ${x - 3} ${y - 3} L ${x + 3} ${y + 3} M ${x - 3} ${y + 3} L ${x + 3} ${y - 3}"></path>`;
            case 'alternating':
            default:
                return `<circle class="graph-symbol" cx="${x}" cy="${y}" r="3.5"></circle>`;
        }
    };
    
    let pathPoints = [];
    let symbolsHtml = '';
    let currentTime = 0;

    pathPoints.push({ x: xScale(0), y: yScale(sessionData[0].startFreq) });
    
    sessionData.forEach(segment => {
        symbolsHtml += getSymbol(segment.blinkMode, xScale(currentTime), yScale(segment.startFreq));
        
        currentTime += segment.duration;
        pathPoints.push({ x: xScale(currentTime), y: yScale(segment.endFreq) });
    });

    const pathData = "M " + pathPoints.map(p => `${p.x} ${p.y}`).join(" L ");

    let yAxisHtml = '';
    let xAxisInterval = 60;
    if (totalDuration > 1200) { 
        xAxisInterval = 180;
    } else if (totalDuration > 600) { 
        xAxisInterval = 120;
    }
    
    for(let i = 0; i <= maxFreq; i += 5) {
        if (i > 0) yAxisHtml += `<line class="graph-gridline" x1="0" x2="${width}" y1="${yScale(i)}" y2="${yScale(i)}"></line>`;
        yAxisHtml += `<text class="graph-text" x="-5" y="${yScale(i)}" dy="3" text-anchor="end">${i} Hz</text>`;
    }

    let xAxisHtml = '';
    for(let i = 0; i <= totalDuration; i += xAxisInterval) {
        xAxisHtml += `<text class="graph-text" x="${xScale(i)}" y="${height + 15}" text-anchor="middle">${i}s</text>`;
    }

    const legendY = height + 45;
    const legendHtml = `
        <g class="graph-legend" transform="translate(0, ${legendY})">
            ${getSymbol('alternating', 15, 0)} <text class="graph-text" x="25" y="0" dy="4">${uiTranslations.blinkModes.alternating[currentLanguage] || uiTranslations.blinkModes.alternating['en']}</text>
            ${getSymbol('synchro', 110, 0)} <text class="graph-text" x="120" y="0" dy="4">${uiTranslations.blinkModes.synchro[currentLanguage] || uiTranslations.blinkModes.synchro['en']}</text>
            ${getSymbol('crossed', 205, 0)} <text class="graph-text" x="215" y="0" dy="4">${uiTranslations.blinkModes.crossed[currentLanguage] || uiTranslations.blinkModes.crossed['en']}</text>
        </g>
    `;

    const svg = `
        <svg viewBox="0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}">
            <g transform="translate(${margin.left},${margin.top})">
                <line class="graph-axis" x1="0" y1="0" x2="0" y2="${height}"></line>
                <line class="graph-axis" x1="0" y1="${height}" x2="${width}" y2="${height}"></line>
                <text class="graph-axis-label" transform="rotate(-90)" y="-30" x="${-height/2}" text-anchor="middle">Fréquence (Hz)</text>
                <text class="graph-axis-label" y="${height + 30}" x="${width/2}" text-anchor="middle">Temps (s)</text>
                ${yAxisHtml}
                ${xAxisHtml}
                <path class="graph-path" d="${pathData}"></path>
                ${symbolsHtml}
                ${legendHtml}
            </g>
        </svg>
    `;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'session-graph-wrapper';
    const title = document.createElement('h4');
    const optionName = document.querySelector(`#session-select option[value=${sessionName}]`);
    title.setAttribute('data-en', optionName ? optionName.dataset.en : sessionName);
    title.setAttribute('data-fr', optionName ? optionName.dataset.fr : sessionName);
    wrapper.appendChild(title);
    wrapper.innerHTML += svg;
    return wrapper;
}

function generateAllSessionGraphs() {
    const container = document.getElementById('session-graphs-container');
    container.innerHTML = '';
    
    for (const key in sessions) {
        if (Object.hasOwnProperty.call(sessions, key) && key !== 'eeg' && sessions[key].length > 0) {
            const graphElement = createSessionGraph(sessions[key], key);
            container.appendChild(graphElement);
        }
    }
    setLanguage(currentLanguage);
}


function openCustomSessionModal(sessionKey) {
    currentlyEditingSession = sessionKey;
    const sessionData = sessions[sessionKey];
    customSessionTableBody.innerHTML = ''; 

    for (let i = 0; i < 6; i++) {
        const segment = sessionData[i] || { startFreq: 0, endFreq: 0, duration: 0, blinkMode: 'alternating' };
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${i + 1}</td>
            <td><input type="number" step="0.1" min="0" max="40" value="${segment.startFreq}" required></td>
            <td><input type="number" step="0.1" min="0" max="40" value="${segment.endFreq}" required></td>
            <td><input type="number" step="1" min="0" value="${segment.duration}" required></td>
            <td>
                <select>
                    <option value="alternating" ${segment.blinkMode === 'alternating' ? 'selected' : ''}>${uiTranslations.blinkModes.alternating[currentLanguage] || uiTranslations.blinkModes.alternating['en']}</option>
                    <option value="synchro" ${segment.blinkMode === 'synchro' ? 'selected' : ''}>${uiTranslations.blinkModes.synchro[currentLanguage] || uiTranslations.blinkModes.synchro['en']}</option>
                    <option value="crossed" ${segment.blinkMode === 'crossed' ? 'selected' : ''}>${uiTranslations.blinkModes.crossed[currentLanguage] || uiTranslations.blinkModes.crossed['en']}</option>
                    <option value="balanced" ${segment.blinkMode === 'balanced' ? 'selected' : ''}>${uiTranslations.blinkModes.balanced[currentLanguage] || uiTranslations.blinkModes.balanced['en']}</option>
                </select>
            </td>
        `;
        customSessionTableBody.appendChild(row);
    }
    customSessionModal.style.display = 'flex';
}

function saveCustomSession() {
    const newSessionData = [];
    const rows = customSessionTableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input, select');
        const startFreq = parseFloat(inputs[0].value);
        const endFreq = parseFloat(inputs[1].value);
        const duration = parseInt(inputs[2].value, 10);
        const blinkMode = inputs[3].value;

        if (duration > 0) {
            newSessionData.push({ startFreq, endFreq, duration, blinkMode });
        }
    });

    sessions[currentlyEditingSession] = newSessionData;
    localStorage.setItem(currentlyEditingSession, JSON.stringify(newSessionData));
    
    customSessionModal.style.display = 'none';
}

function loadCustomSessions() {
    const user1Data = localStorage.getItem('user1');
    const user2Data = localStorage.getItem('user2');

    if (user1Data) {
        sessions.user1 = JSON.parse(user1Data);
    }
    if (user2Data) {
        sessions.user2 = JSON.parse(user2Data);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // DOM Assignments
    appContainer = document.getElementById('app-container');
    leftPanel = document.getElementById('left-panel');
    rightPanel = document.getElementById('right-panel');
    startButton = document.getElementById('startButton');
    colorPicker = document.getElementById('colorPicker');
    carrierFrequencySlider = document.getElementById('carrierFrequencySlider');
    carrierFrequencyInput = document.getElementById('carrierFrequencyInputDisplay');
    blinkRateSlider = document.getElementById('blinkRateSlider');
    blinkFrequencyInput = document.getElementById('blinkFrequencyInputDisplay');
    audioModeRadios = document.querySelectorAll('input[name="audioMode"]');
    bbMultiplierRadios = document.querySelectorAll('input[name="bbMultiplier"]');
    binauralVolumeSlider = document.getElementById('binauralVolumeSlider');
    isochronicVolumeSlider = document.getElementById('isochronicVolumeSlider');
    alternophonyVolumeSlider = document.getElementById('alternophony-volume-slider');
    binauralBeatFrequencyDisplay = document.getElementById('binauralBeatFrequencyDisplay');
    warningButton = document.getElementById('warningButton');
    warningModal = document.getElementById('warningModal');
    understoodButton = document.getElementById('understoodButton');
    helpButton = document.getElementById('helpButton');
    helpModal = document.getElementById('helpModal');
    flagFr = document.getElementById('flag-fr');
    flagEn = document.getElementById('flag-en');
    flagDe = document.getElementById('flag-de');
    flagEs = document.getElementById('flag-es');
    flagIt = document.getElementById('flag-it');
    flagNl = document.getElementById('flag-nl');
    visualPanelsWrapper = document.getElementById('visual-panels-wrapper');
    immersiveExitButton = document.getElementById('immersive-exit-button');
    crackleToggleButton = document.getElementById('crackle-toggle-button');
    crackleVolumeSlider = document.getElementById('crackle-volume-slider');
    alternophonyToggleButton = document.getElementById('alternophony-toggle-button');
    sessionSelect = document.getElementById('session-select');
    sophrologySelect = document.getElementById('sophrology-select');
    voiceGenderRadios = document.querySelectorAll('input[name="voiceGender"]');
    frequencyDisplayOverlay = document.getElementById('frequency-display-overlay');
    blinkModeRadios = document.querySelectorAll('input[name="blinkMode"]');
    set432hzButton = document.getElementById('set432hzButton');
    musicLoopSelect = document.getElementById('music-loop-select');
    musicLoopVolumeSlider = document.getElementById('music-loop-volume-slider');
    musicToggleButton = document.getElementById('music-toggle-button');
    sessionHelpButton = document.getElementById('sessionHelpButton');
    sessionGraphModal = document.getElementById('sessionGraphModal');
    aboutButton = document.getElementById('aboutButton');
    aboutModal = document.getElementById('aboutModal');
    customSessionModal = document.getElementById('customSessionModal');
    customSessionForm = document.getElementById('customSessionForm');
    customSessionTableBody = document.querySelector('#customSessionTable tbody');
    saveCustomSessionButton = document.getElementById('saveCustomSessionButton');
    cancelCustomSessionButton = document.getElementById('cancelCustomSessionButton');
    editSessionButton = document.getElementById('editSessionButton');
    visualModeSelect = document.getElementById('visualModeSelect');
    leftCanvas = document.getElementById('left-canvas');
    rightCanvas = document.getElementById('right-canvas');
    leftCtx = leftCanvas.getContext('2d');
    rightCtx = rightCanvas.getContext('2d');
    
    // Assignations DOM pour le système d'ambiance
    ambianceSelect = document.getElementById('ambiance-select');
    ambianceToggleButton = document.getElementById('ambiance-toggle-button');
    ambianceVolumeSlider = document.getElementById('ambiance-volume-slider');

    const warningCloseButton = warningModal.querySelector('.close-button');
    const helpCloseButton = helpModal.querySelector('.close-button');
    const sessionGraphModalCloseButton = sessionGraphModal.querySelector('.close-button');
    const aboutModalCloseButton = aboutModal.querySelector('.close-button');
    const customSessionModalCloseButton = customSessionModal.querySelector('.close-button');

    const fileAmbianceSources = {
        forest: new Audio('foret.mp3'),
        fireplace: new Audio('feu.mp3'),
        birds: new Audio('oiseaux.mp3')
    };
    Object.values(fileAmbianceSources).forEach(audio => audio.loop = true);

    // Initialisation des variables
    BLINK_FREQUENCY_HZ = parseFloat(blinkRateSlider.value);
    currentCarrierFrequency = parseFloat(carrierFrequencyInput.value);
    currentBBMultiplier = parseFloat(document.querySelector('input[name="bbMultiplier"]:checked').value);
    currentAudioMode = document.querySelector('input[name="audioMode"]:checked').value;
    currentBinauralVolume = parseFloat(binauralVolumeSlider.value) / 100;
    currentIsochronicVolume = parseFloat(isochronicVolumeSlider.value) / 100;
    currentAlternophonyVolume = parseFloat(alternophonyVolumeSlider.value) / 100;
    currentBlinkMode = document.querySelector('input[name="blinkMode"]:checked').value;
    
    if (window.matchMedia('(pointer: coarse)').matches) {
        ambianceVolumeSlider.value = 40;
        musicLoopAudio.volume = 0.30;
    } else {
        musicLoopAudio.volume = parseFloat(musicLoopVolumeSlider.value) / 100;
    }
    
    // Fin du chargement
    loadCustomSessions();
    validateAndSetFrequency(blinkFrequencyInput, blinkRateSlider, true);
    validateAndSetFrequency(carrierFrequencyInput, carrierFrequencySlider, false);
    setLanguage(currentLanguage);
    if (warningModal) warningModal.style.display = 'flex';

    // --- Boucle d'animation principale ---
    function animationLoop(timestamp) {
        if (!visualTimeoutId) return;

        const interval = 1000 / BLINK_FREQUENCY_HZ;
        const isBlinkingThisFrame = (timestamp - lastBlinkTime >= interval);

        if (isBlinkingThisFrame) {
            lastBlinkTime = performance.now();
            if (currentBlinkMode === 'balanced') {
                isLightPhase = !isLightPhase;
            }
            playSound(isLeftLight ? 'left' : 'right');
        }

        updateVisuals(isBlinkingThisFrame);

        if (isBlinkingThisFrame) {
            isLeftLight = !isLeftLight;
        }
        
        visualTimeoutId = requestAnimationFrame(animationLoop);
    }
    
    // --- Écouteurs d'événements ---
    startButton.addEventListener('click', () => {
        initAudioContext();
        
        if (visualTimeoutId) {
            cancelAnimationFrame(visualTimeoutId);
            visualTimeoutId = null;
            clearTimeout(sessionTimeoutId);
            clearInterval(rampIntervalId);
            clearInterval(htmlFadeInterval);
            sessionTimeoutId = null;
            rampIntervalId = null;
            htmlFadeInterval = null;
            isLeftLight = false;
            
            clearAllVisuals();

            stopBinauralBeats();
            stopIsochronicTones();
            stopAlternophony();
            stopCrackles();
            stopGuidedText();
            if(musicLoopAudio) musicLoopAudio.pause();
            if (currentAmbiance) currentAmbiance.pause();
            disconnectEEG();
            
            if (masterGainNode) {
                 masterGainNode.gain.cancelScheduledValues(audioContext.currentTime);
                 masterGainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            }
            
            appContainer.classList.remove('stimulation-active');

            blinkRateSlider.disabled = false;
            blinkFrequencyInput.disabled = false;
            sessionSelect.disabled = false;
            sophrologySelect.disabled = false;
            blinkModeRadios.forEach(radio => radio.disabled = false);
            carrierFrequencySlider.disabled = false;
            carrierFrequencyInput.disabled = false;
            binauralVolumeSlider.disabled = false;
            isochronicVolumeSlider.disabled = false;
            alternophonyVolumeSlider.disabled = false;

        } else {
            appContainer.classList.add('stimulation-active');
            
            let sessionKey;
            let isSophro = false;

            if (sophrologySelect.value !== 'none') {
                sessionKey = sophrologySelect.value;
                isSophro = true;
            } else {
                sessionKey = sessionSelect.value;
            }
            currentSession = sessionKey;

            if (currentAudioMode === 'binaural' || currentAudioMode === 'both') startBinauralBeats();
            if (currentAudioMode === 'isochronic' || currentAudioMode === 'both') startIsochronicTones();
            if (currentAudioMode === 'alternophony') startAlternophony();
            
            lastBlinkTime = performance.now();
            visualTimeoutId = requestAnimationFrame(animationLoop);
            
            if (sessionKey === 'manual') {
                validateAndSetFrequency(blinkFrequencyInput, blinkRateSlider, true);
            } else if (sessionKey === 'eeg') {
                connectEEG();
                blinkRateSlider.disabled = true;
                blinkFrequencyInput.disabled = true;
                blinkModeRadios.forEach(radio => radio.disabled = true);
                carrierFrequencySlider.disabled = true;
                carrierFrequencyInput.disabled = true;
                binauralVolumeSlider.disabled = true;
                isochronicVolumeSlider.disabled = true;
                alternophonyVolumeSlider.disabled = true;
            } else {
                sessionSelect.disabled = true;
                sophrologySelect.disabled = true;
                blinkRateSlider.disabled = true;
                blinkFrequencyInput.disabled = true;
                blinkModeRadios.forEach(radio => radio.disabled = true);
                if (isSophro) {
                    playGuidedText(sessionKey);
                }
                runSession(sessionKey, 0, isSophro);
            }
        }
        setLanguage(currentLanguage);
    });
    
    carrierFrequencySlider.addEventListener('input', () => {
        carrierFrequencyInput.value = carrierFrequencySlider.value;
        validateAndSetFrequency(carrierFrequencyInput, carrierFrequencySlider, false);
    });
    carrierFrequencyInput.addEventListener('change', () => validateAndSetFrequency(carrierFrequencyInput, carrierFrequencySlider, false));
    carrierFrequencyInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            validateAndSetFrequency(carrierFrequencyInput, carrierFrequencySlider, false);
            e.target.blur();
        }
    });

    blinkRateSlider.addEventListener('input', () => {
        blinkFrequencyInput.value = blinkRateSlider.value;
        validateAndSetFrequency(blinkFrequencyInput, blinkRateSlider, true);
    });
    blinkFrequencyInput.addEventListener('change', () => validateAndSetFrequency(blinkFrequencyInput, blinkRateSlider, true));
    blinkFrequencyInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            validateAndSetFrequency(blinkFrequencyInput, blinkRateSlider, true);
            e.target.blur();
        }
    });

    if (set432hzButton) {
        set432hzButton.addEventListener('click', () => {
            carrierFrequencyInput.value = 432;
            validateAndSetFrequency(carrierFrequencyInput, carrierFrequencySlider, false);
        });
    }

    sessionSelect.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        editSessionButton.style.display = (selectedValue === 'user1' || selectedValue === 'user2') ? 'block' : 'none';
        
        if (selectedValue !== 'manual') {
            sophrologySelect.value = 'none';
        }
        
        if (selectedValue === 'user1' || selectedValue === 'user2') {
            openCustomSessionModal(selectedValue);
        } else if (selectedValue !== 'eeg' && eegSocket) {
            disconnectEEG();
        }
    });

    sophrologySelect.addEventListener('change', (e) => {
        if (e.target.value !== 'none') {
            sessionSelect.value = 'manual';
            editSessionButton.style.display = 'none';
        }
    });

    editSessionButton.addEventListener('click', () => {
        const selectedValue = sessionSelect.value;
        if (selectedValue === 'user1' || selectedValue === 'user2') {
            openCustomSessionModal(selectedValue);
        }
    });

    customSessionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveCustomSession();
    });

    cancelCustomSessionButton.addEventListener('click', () => {
        customSessionModal.style.display = 'none';
    });

    customSessionModalCloseButton.addEventListener('click', () => {
        customSessionModal.style.display = 'none';
    });

    visualModeSelect.addEventListener('change', (e) => {
        currentVisualMode = e.target.value; 
    });

    audioModeRadios.forEach(radio => radio.addEventListener('change', e => {
        currentAudioMode = e.target.value;
        if (visualTimeoutId) {
            stopBinauralBeats();
            stopIsochronicTones();
            
            if (currentAudioMode === 'binaural' || currentAudioMode === 'both') startBinauralBeats();
            if (currentAudioMode === 'isochronic' || currentAudioMode === 'both') startIsochronicTones();
        }
    }));

    bbMultiplierRadios.forEach(radio => radio.addEventListener('change', e => {
        currentBBMultiplier = parseFloat(e.target.value);
        updateBinauralFrequencies();
    }));

    voiceGenderRadios.forEach(radio => radio.addEventListener('change', e => {
        if (visualTimeoutId && sophrologySelect.value !== 'none') {
            playGuidedText(sophrologySelect.value);
        }
    }));

    binauralVolumeSlider.addEventListener('input', e => {
        currentBinauralVolume = parseFloat(e.target.value) / 100;
        if (binauralMasterGain && audioContext) binauralMasterGain.gain.setValueAtTime(currentBinauralVolume, audioContext.currentTime);
    });
    isochronicVolumeSlider.addEventListener('input', e => {
        currentIsochronicVolume = parseFloat(e.target.value) / 100;
    });
    alternophonyVolumeSlider.addEventListener('input', (e) => {
        currentAlternophonyVolume = parseFloat(e.target.value) / 100;
        if (alternophonyMasterGain && audioContext) {
            alternophonyMasterGain.gain.setTargetAtTime(currentAlternophonyVolume, audioContext.currentTime, 0.01);
        }
    });

    crackleToggleButton.addEventListener('click', () => {
        if (crackleIsPlaying) {
            stopCrackles();
        } else {
            startCrackles();
        }
    });
    crackleVolumeSlider.addEventListener('input', updateCrackleVolume);
    
    const ambianceControllers = {
        waves: { play: startWaves, pause: stopWaves, setVolume: (vol) => { if (waveMasterVolume) waveMasterVolume.gain.setValueAtTime(vol, audioContext.currentTime, 0.01) } },
        forest: { audio: fileAmbianceSources.forest, play() { this.audio.play() }, pause() { this.audio.pause() }, setVolume(vol) { this.audio.volume = vol } },
        fireplace: { audio: fileAmbianceSources.fireplace, play() { this.audio.play() }, pause() { this.audio.pause() }, setVolume(vol) { this.audio.volume = vol } },
        birds: { audio: fileAmbianceSources.birds, play() { this.audio.play() }, pause() { this.audio.pause() }, setVolume(vol) { this.audio.volume = vol } },
    };

    ambianceSelect.addEventListener('change', (e) => {
        if (currentAmbiance) {
            currentAmbiance.pause();
        }
        
        const selectedKey = e.target.value;
        currentAmbiance = ambianceControllers[selectedKey] || null;
        
        if (currentAmbiance) {
            const currentVolume = parseFloat(ambianceVolumeSlider.value) / 100;
            currentAmbiance.setVolume(currentVolume);
            if (ambianceIsPlaying) {
                currentAmbiance.play();
            }
        }
    });

    ambianceToggleButton.addEventListener('click', () => {
        if (!currentAmbiance) return;
        ambianceIsPlaying = !ambianceIsPlaying;
        if (ambianceIsPlaying) {
            currentAmbiance.play();
            ambianceToggleButton.classList.add('active');
        } else {
            currentAmbiance.pause();
            ambianceToggleButton.classList.remove('active');
        }
    });

    ambianceVolumeSlider.addEventListener('input', (e) => {
        const newVolume = parseFloat(e.target.value) / 100;
        if (currentAmbiance) {
            currentAmbiance.setVolume(newVolume);
        }
    });

    alternophonyToggleButton.addEventListener('click', () => {
        if (alternophonyIsPlaying) {
            stopAlternophony();
        } else {
            startAlternophony();
        }
    });
    
    musicLoopSelect.addEventListener('change', (e) => {
        const track = e.target.value;
        musicLoopAudio.pause();
        musicToggleButton.classList.remove('active');
        musicIsPlaying = false;

        if (track === 'none') {
            musicLoopAudio.src = '';
        } else {
            initAudioContext();
            musicLoopAudio.src = track;
            if(musicIsPlaying) {
               musicLoopAudio.play();
               musicToggleButton.classList.add('active');
            }
        }
    });

    musicToggleButton.addEventListener('click', () => {
        if (!musicLoopAudio.src || musicLoopAudio.src === '') return;

        musicIsPlaying = !musicIsPlaying;
        if(musicIsPlaying) {
            musicLoopAudio.play();
            musicToggleButton.classList.add('active');
        } else {
            musicLoopAudio.pause();
            musicToggleButton.classList.remove('active');
        }
    });
    
    musicLoopVolumeSlider.addEventListener('input', (e) => {
        musicLoopAudio.volume = parseFloat(e.target.value) / 100;
    });

    flagFr.addEventListener('click', () => setLanguage('fr'));
    flagEn.addEventListener('click', () => setLanguage('en'));
    flagDe.addEventListener('click', () => setLanguage('de'));
    flagEs.addEventListener('click', () => setLanguage('es'));
    flagIt.addEventListener('click', () => setLanguage('it'));
    flagNl.addEventListener('click', () => setLanguage('nl'));

    warningButton.addEventListener('click', () => warningModal.style.display = 'flex');
    understoodButton.addEventListener('click', () => warningModal.style.display = 'none');
    warningCloseButton.addEventListener('click', () => warningModal.style.display = 'none');

    helpButton.addEventListener('click', () => helpModal.style.display = 'flex');
    helpCloseButton.addEventListener('click', () => helpModal.style.display = 'none');
    
    aboutButton.addEventListener('click', () => aboutModal.style.display = 'flex');
    aboutModalCloseButton.addEventListener('click', () => aboutModal.style.display = 'none');

    sessionHelpButton.addEventListener('click', () => {
        generateAllSessionGraphs();
        sessionGraphModal.style.display = 'flex';
    });
    sessionGraphModalCloseButton.addEventListener('click', () => sessionGraphModal.style.display = 'none');

    window.addEventListener('click', (event) => {
        if (event.target === warningModal) warningModal.style.display = 'none';
        if (event.target === helpModal) helpModal.style.display = 'none';
        if (event.target === sessionGraphModal) sessionGraphModal.style.display = 'none';
        if (event.target === aboutModal) aboutModal.style.display = 'none';
        if (event.target === customSessionModal) customSessionModal.style.display = 'none';
    });
    
    visualPanelsWrapper.addEventListener('click', (e) => {
        if (e.target.id === 'immersive-exit-button' || immersiveExitButton.contains(e.target)) return;
        appContainer.classList.add('immersive-mode');
    });
    immersiveExitButton.addEventListener('click', (e) => {
        e.stopPropagation();
        appContainer.classList.remove('immersive-mode');
    });
    
    blinkModeRadios.forEach(radio => radio.addEventListener('change', (e) => {
        currentBlinkMode = e.target.value;
    }));
    
});