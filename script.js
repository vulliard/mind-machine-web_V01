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
let speechPauseTimeoutId = null; // Ajout pour la gestion des pauses de la synthèse vocale

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
        sommeil: `Bonjour et bienvenue dans cette séance conçue pour vous accompagner vers un sommeil profond et réparateur. Prenez le temps de vous installer le plus confortablemant possible, dans la pénombre, prêt à vous laisser aller. Assurez-vous que rien ne vous dérangera pour les prochains instants. ... ... ... Fermez doucement les yeux, et laissez le monde extérieur s'estomper. Prenez une profonde inspiration, et en expirant, laissez partir le poids de la journée. Chaque souffle vous éloigne un peu plus de l'agitation, vous rapprochant de votre sanctuaire intérieur de paix. ... ... ... Portez maintenant toute votre attention sur votre respiration. Sentez l'air frais qui entre par vos narines... et le souffle tiède qui en ressort. Ne cherchez pas à la contrôler, observez simplement son rythme naturel, comme le flux et le reflux d'une vague apaisante. ... ... ... Inspirez le calme... et à chaque expiration, imaginez que vous soufflez au loin les tensions, les soucis, les pensées de la journée... Chaque expiration est un soupir de soulagement qui vous enfonce un peu plus dans le matelas, dans la détente... Visualisez les nuages de vos préoccupations qui se dissipent à l'horizon. ... ... ... Nous allons maintenant relâcher chaque partie de votre corps. Prenez conscience de votre tête, de votre visage. Relâchez votre front, laissez-le devenir lisse, sans expression. Détendez vos sourcils, vos paupières qui deviennent lourdes de sommeil. Desserrez vos mâchoires, laissez vos dents se séparer légèrement. Votre langue se dépose tranquillement dans votre bouche. ... ... ... Sentez la détente glisser le long de votre nuque et de vos épaules. Sentez vos épaules devenir lourdes, très lourdes, et s'éloigner de vos oreilles. Relâchez vos bras, vos coudes, vos poignets, jusqu'au bout de vos doigts. Vos bras sont maintenant complètement inertes, lourds et parfaitement détendus. ... ... ... Portez attention à votre dos. Sentez chaque vertèbre se déposer, se relâcher sur le support, l'une après l'autre. Libérez toutes les tensions accumulées dans votre dos, du haut jusqu'en bas. Votre colonne vertébrale est entièrement soutenue. ... ... ... Votre poitrine et votre ventre se soulèvent et s'abaissent au rythme calme de votre respiration. Votre cœur bat tranquillement, sereinement, à un rythme lent et régulier. Sentez la paix s'installer dans votre ventre, relâchant tous les organes internes. ... ... ... Relâchez votre bassin, vos hanches. Sentez vos jambes devenir lourdes et totalement passives... des genoux jusqu'aux chevilles... et jusqu'à la pointe de vos pieds. Vos pieds sont détendus, peut-être légèrement tournés vers l'extérieur, signe d'un abandon total. ... ... ... Votre corps tout entier est maintenant lourd, détendu, et prêt pour le repos. Vous êtes dans un état de confort et de bien-être total. Savourez cette sensation de lourdeur agréable, de chaleur douce qui vous envahit. ... ... ... Imaginez maintenant un escalier devant vous. Un escalier magnifique, doux et accueillant. Il descend en spirale vers un lieu de calme et de silence absolu. La rampe est lisse et fraîche sous votre main. ... ... ... Nous allons le descendre ensemble. Chaque marche que vous descendez vous emmène plus profondément dans la relaxation, plus près du sommeil. Chaque chiffre vous plonge dans un état de sérénité encore plus grand. ... ... ... Dix... la relaxation s'approfondit... Neuf... votre esprit devient plus clair... Huit... vous êtes de plus en plus calme... Sept... les bruits extérieurs s'estompent... Six... vous vous sentez en sécurité... Cinq... votre esprit s'apaise... Quatre... vous flottez presque... Trois... vous êtes aux portes du sommeil... Deux... une dernière étape avant le repos total... Un... ... ... ... Vous voici au bas de l'escalier. Vous entrez dans un jardin de nuit, baigné par la douce lumière d'une lune bienveillante. L'air est frais et pur, parfumé de jasmin nocturne. Le sol est une mousse douce et fraîche sous vos pieds nus. C'est votre sanctuaire de repos. ... ... ... Au centre de ce jardin se trouve le lit le plus confortable que vous puissiez imaginer. Approchez-vous... remarquez la texture des draps, la perfection de l'oreiller. Allongez-vous... et sentez la douceur des draps, le moelleux de l'oreiller qui épouse la forme de votre tête. ... ... ... Ici, dans ce lieu magique, rien ne peut vous déranger. Vous êtes complètement en sécurité, enveloppé de calme et d'une énergie protectrice. Une brise légère caresse votre peau. ... ... ... Chaque son lointain, chaque sensation, devient une berceuse qui vous guide encore plus profondément vers le sommeil. Le sommeil vient à vous, naturellement, sans effort. ... ... ... Laissez-vous aller maintenant... Laissez votre esprit se dissoudre dans le repos... et votre corps se régénérer. Glissez doucement... paisiblement... dans un sommeil profond, continu, et merveilleusement réparateur. Dormez bien.`,
        relaxation: `Bonjour. Prenez le temps de vous installer dans une position confortable, assise ou allongée, et fermez les yeux. Aujourd'hui, nous allons relâcher toutes les tensions, une par une, pour retrouver un état de calme profond. ... ... ... Commencez par prendre une grande, très grande inspiration, en remplissant vos poumons d'air nouveau... et expirez lentement, très lentement, comme si vous souffliez à travers une paille. Répétez encore deux fois à votre rythme. ... ... ... Sentez dès maintenant avec cette expiration vos épaules se détendre... votre mâchoire se desserrer... votre front se lisser... Laissez un léger sourire se dessiner sur vos lèvres, invitant la détente à s'installer. ... ... ... Imaginez que chaque partie de votre corps est une bougie, et que votre souffle est une douce brise qui vient éteindre la flamme de la tension... Votre souffle est doux, mais certain. Il apporte l'obscurité et le repos là où il y avait une flamme agitée. ... ... ... D'abord vos pieds... sentez la flamme de l'agitation vaciller, puis s'éteindre. Vos pieds deviennent lourds et détendus. Puis vos mollets, vos genoux, vos cuisses... la brise de votre souffle les parcourt, éteignant chaque tension. ... ... ... Vos jambes sont maintenant complètement lourdes et relaxées. Remontez vers votre bassin... votre ventre... votre dos... tout se relâche... la flamme de la tension dans votre bas du dos s'éteint, laissant place à une chaleur agréable. ... ... ... Votre poitrine s'ouvre, votre cœur bat calmement... la bougie de l'anxiété près de votre cœur est doucement soufflée. Vos bras, vos mains, jusqu'au bout de vos doigts, sont complètement relâchés... la chaleur coule jusqu'à vos paumes. ... ... ... Enfin, votre cou, votre nuque, et votre tête. Le souffle éteint les dernières flammes de pensées incessantes. Votre esprit devient clair et calme. Tout votre corps est maintenant dans une obscurité paisible et reposante. ... ... ... Visualisez maintenant une plage de sable chaud, au coucher du soleil. Vous êtes seul, ou avec des présences bienveillantes. Le ciel est peint de couleurs orange, rose et violet. C'est un spectacle magnifique, rien que pour vous. ... ... ... Le bruit des vagues est un rythme lent et régulier qui vous berce. C'est le métronome de votre tranquillité. Chaque vague qui se retire emporte avec elle une parcelle de vos soucis. Regardez-les partir au loin. ... ... ... La chaleur douce du sable détend chaque muscle de votre corps... Sentez votre dos, vos jambes, s'enfoncer légèrement dans ce sable chaud et accueillant. Vous êtes parfaitement soutenu, en parfaite sécurité. ... ... ... Une légère brise marine caresse votre visage. Elle a une odeur fraîche et salée. Vous êtes parfaitement bien... en paix... complètement immergé dans ce paysage de sérénité. ... ... ... Prenez un instant pour ne rien faire, juste être. Être sur cette plage, à ce moment précis. Savourez cet instant de calme total... d'unité avec la nature. ... ... ... Ancrez cette sensation de détente profonde en vous... Prenez une photo mentale de ce lieu. Sachez que vous pouvez y revenir chaque fois que vous en aurez besoin... simplement en fermant les yeux et en respirant.`,
        antiStress: `Bienvenue dans cette séance pour apaiser le stress et retrouver votre calme intérieur. Asseyez-vous ou allongez-vous confortablemant. Fermez les yeux et laissez votre corps se déposer. ... ... ... Prenez conscience des points de contact de votre corps avec le support... Sentez le sol, la chaise, le lit qui vous soutient... Sentez le poids de votre corps qui s'abandonne à la gravité. Vous êtes en sécurité, parfaitement soutenu. ... ... ... Portez maintenant votre attention sur votre respiration, sans chercher à la modifier. Sans la forcer, observez-la simplement. Observez le chemin de l'air, de vos narines à vos poumons, puis le chemin inverse. ... ... ... Imaginez qu'à chaque inspiration, vous inhalez un air pur et calme, d'une magnifique couleur bleue, apaisante et fraîche... Cette air bleu est l'énergie de la sérénité. Elle remplit vos poumons, puis votre sang, et se diffuse dans chaque cellule de votre corps. ... ... ... Et à chaque expiration, vous soufflez un nuage gris et opaque. Ce nuage contient toutes vos tensions, vos soucis, votre stress, votre fatigue... Regardez-le s'éloigner et se dissoudre dans l'air, sans laisser de trace. ... ... ... Inspirez le calme bleu... Expirez le stress gris... Continuez ce cycle plusieurs fois. Sentez comment, à chaque cycle, le bleu prend plus de place à l'intérieur, et le gris s'estompe à l'extérieur. Votre espace intérieur devient plus propre, plus pur. ... ... ... Visualisez maintenant une bulle de protection tout autour de vous. Une sphère de lumière blanche ou dorée. C'est votre espace personnel de sécurité, votre sanctuaire de paix. ... ... ... Cette bulle est semi-perméable. Elle laisse entrer tout ce qui est positif – l'amour, la joie, la paix – mais elle filtre et repousse tout ce qui est négatif. À l'intérieur de cette bulle, rien ne peut vous atteindre. ... ... ... Les bruits extérieurs, les pensées agitées des autres, les exigences, tout reste à l'extérieur. Les sons deviennent étouffés, lointains, sans importance. Ici, vous êtes souverain, vous êtes calme. ... ... ... Prenez conscience de l'espace que vous occupez à l'intérieur de cette bulle. C'est un espace de force tranquille et de confiance. Répétez intérieurement : 'Je suis calme... je suis serein(e)... je gère la situation avec confiance.' ... ... ... Sentez cette force tranquille grandir en vous, depuis le centre de votre poitrine. Le stress n'a plus de prise, car il ne peut pénétrer votre espace. Vous êtes centré(e), ancré(e) et prêt(e) à faire face aux défis avec une nouvelle perspective, calme et détachée.`,
        meditation: `Bonjour et bienvenue. Cette séance est une invitation à vous reconnecter avec l'instant présent. Trouvez une posture digne et confortable, le dos droit mais sans raideur. Fermez les yeux. ... ... ... Portez simplement votre attention sur les sensations de votre respiration... l'air qui entre par vos narines... peut-être un peu frais... et qui en ressort, peut-être un peu plus tiède. Sentez le mouvement de votre ventre ou de votre poitrine qui se soulève et s'abaisse. ... ... ... Ne cherchez à changer quoi que ce soit... juste en observant. Votre souffle est votre ancre dans le moment présent. Chaque fois que vous vous sentez perdu, revenez à lui. Il est toujours là. ... ... ... Votre esprit va probablement s'évader. Vers une pensée, un souvenir, un projet. C'est la nature même de l'esprit. C'est normal, et ce n'est pas une erreur. ... ... ... Chaque fois que vous remarquez que vos pensées sont parties ailleurs, félicitez-vous d'avoir remarqué. C'est un moment de pleine conscience. Puis, ramenez doucement, et sans jugement, votre attention sur votre souffle. C'est l'exercice même de la méditation. Des milliers de fois s'il le faut. ... ... ... Il n'y a rien à réussir, rien à atteindre. Il n'y a pas de "bonne" ou de "mauvaise" méditation. Juste être là, présent à ce qui est. Avec douceur et bienveillance envers vous-même. ... ... ... Élargissez maintenant votre champ de conscience. Soyez conscient des sons autour de vous... les plus proches, les plus lointains. Accueillez-les sans les nommer, sans les juger. Ils font partie de l'instant présent. ... ... ... Prenez conscience des sensations dans votre corps... la température de l'air sur votre peau, les points de contact, une éventuelle tension ou un picotement. Observez ces sensations comme vous observez votre souffle. ... ... ... Observez maintenant les pensées qui passent comme des nuages dans le ciel de votre esprit. Certaines sont grosses et sombres, d'autres légères et blanches. Laissez-les passer sans vous y accrocher. ... ... ... Vous n'êtes pas vos pensées, vous êtes celui ou celle qui les observe. Vous êtes le ciel, pas les nuages. Restez dans cet espace de pure conscience, un observateur silencieux et paisible... ... ... ... Chaque instant est une nouvelle occasion de revenir ici et maintenant. Chaque souffle est un nouveau départ. Profitez de ce silence intérieur, de cette clarté... C'est votre nature profonde, toujours accessible.`,
        arretTabac: `Bonjour. Aujourd'hui, vous renforcez votre décision de vous libérer du tabac. Installez-vous confortablemant et fermez les yeux. Soyez fier de prendre ce moment pour vous, pour votre santé. ... ... ... Prenez trois grandes respirations... et à chaque expiration, relâchez les tensions et le besoin de fumer... Sentez votre corps se détendre, et votre esprit s'ouvrir à la liberté que vous avez choisie. ... ... ... Vous avez pris une décision pour votre santé, pour votre liberté, pour votre avenir. C'est un acte de grand respect envers vous-même. Honorez ce choix, ressentez sa justesse au plus profond de vous. ... ... ... Visualisez maintenant deux chemins devant vous. L'un est gris, enfumé, brumeux. C'est le chemin de la dépendance. Il sent le renfermé, le tabac froid. L'air y est lourd, difficile à respirer. ... ... ... L'autre est lumineux, clair, plein d'air pur et de couleurs vives. C'est le chemin de la liberté. L'herbe est verte, le ciel est bleu. Sentez la différence. Faites un pas conscient et délibéré sur ce chemin lumineux. ... ... ... Ressentez l'odeur de l'air frais, la vitalité dans vos poumons, l'énergie qui circule dans votre corps sur ce chemin lumineux. Chaque pas vous rend plus fort, plus sain, plus vivant. Votre respiration est ample et facile. ... ... ... Imaginez-vous dans quelques semaines, quelques mois... sans tabac. Vous marchez sur ce chemin. Ressentez la fierté. Sentez votre souffle plus ample, votre odorat plus fin, les saveurs plus présentes. Voyez votre peau plus lumineuse, votre sourire plus franc. ... ... ... Voyez-vous utiliser l'argent économisé pour quelque chose qui vous fait vraiment plaisir, un projet, un voyage. Voyez-vous bouger, courir, monter des escaliers sans effort, plein d'une nouvelle énergie. ... ... ... À chaque envie de fumer qui pourrait apparaître, souvenez-vous qu'elle n'est qu'une vieille habitude, une ombre du passé. Vous disposez d'une ancre. Posez une main sur votre ventre, et respirez profondément trois fois. ... ... ... À chaque inspiration, rappelez-vous cette image du chemin lumineux. À chaque expiration, soufflez sur l'ombre de l'envie et regardez-la se dissiper. C'est un simple écho, qui perd de sa force chaque jour. ... ... ... Vous êtes plus fort que cette vieille habitude. Vous avez choisi la vie, la santé. Chaque jour sans tabac est une victoire qui renforce votre liberté. Vous respirez la vie à pleins poumons. Vous êtes libre.`,
        amincissement: `Bonjour. Bienvenue dans cette séance dédiée à l'harmonisation de votre corps et de votre esprit. Installez-vous confortablemant... fermez les yeux... et prenez une profonde respiration, en laissant votre ventre se gonfler. ... ... ... À chaque expiration, laissez partir les jugements sur votre corps, les frustrations, les régimes passés... Soufflez au loin les mots durs, les images négatives. Vous commencez un nouveau chapitre aujourd'hui. ... ... ... Accueillez-vous avec bienveillance, ici et maintenant. Placez une main sur votre cœur et une sur votre ventre, et envoyez de la gratitude à votre corps pour tout ce qu'il fait pour vous chaque jour. C'est votre véhicule pour la vie, votre allié. ... ... ... Prenez conscience de votre corps, de sa forme, de sa présence... sans jugement, avec une simple curiosité. Sentez le contact de vos vêtements, la température de votre peau. Soyez simplement présent à votre enveloppe corporelle. ... ... ... Imaginez maintenant une douce lumière dorée, comme le soleil du matin, qui entre par le sommet de votre crâne. C'est une lumière de guérison, d'acceptation et d'énergie saine. Elle est chaude et réconfortante. ... ... ... Elle descend lentement, remplissant chaque cellule de votre corps d'une sensation de bien-être. Elle traverse votre cerveau, apaisant les pensées critiques. Elle coule dans votre gorge, votre poitrine, votre cœur. ... ... ... Elle continue son chemin dans votre estomac, votre système digestif, apportant la paix et l'équilibre. Elle enveloppe chaque organe d'une chaleur bienfaisante. Elle dissout les blocages et les tensions. ... ... ... Cette lumière vous aide à vous reconnecter à vos véritables sensations de faim et de satiété. Imaginez qu'elle réveille l'intelligence innée de votre corps. Elle vous guide vers des choix alimentaires sains, qui nourrissent et respectent votre corps. ... ... ... Visualisez la personne que vous souhaitez devenir : pleine d'énergie, à l'aise dans son corps, en paix avec la nourriture. Ne vous concentrez pas sur un poids, mais sur une sensation. Une sensation de légèreté, de vitalité, de joie. ... ... ... Voyez-vous bouger avec aisance, faire des activités que vous aimez, que ce soit marcher dans la nature, danser, jouer. Votre corps est un instrument de joie, pas une source de préoccupation. ... ... ... Votre corps sait ce qui est bon pour lui. Écoutez-le. Il vous parle à travers des murmures de faim réelle, et des soupirs de satiété. Apprenez à écouter ces signaux subtils. ... ... ... Chaque jour, vous faites des choix conscients et bienveillants pour votre bien-être. Vous mangez pour vous nourrir, pour vous donner de l'énergie, pas pour combler un vide. Vous êtes en harmonie avec vous-même.`,
        douleur: `Bonjour. Cette séance est un espace pour vous aider à gérer la sensation de douleur. Installez-vous aussi confortablemant que votre corps vous le permet aujourd'hui. Fermez les yeux et laissez votre souffle trouver un rythme naturel et apaisant. ... ... ... Pour commencer, nous n'allons pas nous concentrer sur la douleur, mais sur le confort. Parcourez mentalement votre corps et trouvez une zone qui, en ce moment même, est neutre, ou même agréable. Peut-être la chaleur de vos mains... la sensation de vos cheveux sur votre front... le contact de vos pieds avec le sol, ou la douceur de vos vêtements. ... ... ... Choisissez une de ces zones, et plongez votre conscience à l'intérieur. Explorez cette sensation de non-douleur, de confort. Est-elle chaude, fraîche, douce, neutre ? Imprégnez-vous de cette sensation. C'est votre point d'ancrage. ... ... ... À chaque inspiration, imaginez que cette sensation de bien-être grandit, s'amplifie. Imaginez-la comme une lumière douce qui s'étend un peu plus à chaque souffle, créant un havre de paix à l'intérieur de vous. ... ... ... Maintenant, avec cette ressource de confort bien présente et solide, vous pouvez laisser la zone de douleur entrer dans votre champ de conscience. Sans peur, sans jugement. Observez la sensation de loin, comme un scientifique observe un phénomène météorologique à travers une vitre. ... ... ... Donnez-lui des caractéristiques neutres. Une forme, une couleur, une texture. Est-elle chaude, froide ? Piquante, sourde ? Dense, diffuse ? Vibrante, constante ? Simplement observer, sans la juger 'mauvaise', sans y coller d'histoire. ... ... ... Vous dissociez la sensation pure de la réaction émotionnelle. Vous n'êtes pas la douleur. Vous êtes la conscience qui l'observe. Cette simple prise de distance peut déjà modifier votre perception. ... ... ... Maintenant, utilisez votre respiration comme un outil de transformation. Imaginez qu'à chaque inspiration, vous puisez dans votre zone de confort, cette lumière douce, et vous l'envoyez comme un souffle apaisant vers la zone douloureuse. ... ... ... Et à chaque expiration, imaginez que la sensation douloureuse perd un peu de son intensité, de sa solidité. Visualisez sa couleur qui devient plus pâle, plus transparente. Ses bords, qui étaient peut-être nets et durs, deviennent flous et mous. ... ... ... Continuez ce processus... Inspirez le confort vers la douleur... Expirez pour la dissoudre, la diffuser, l'adoucir. Vous pouvez aussi imaginer que la sensation se transforme. Une plaque de glace qui fond sous un soleil doux... un nœud serré qui se desserre fibre par fibre... une couleur vive qui s'estompe. ... ... ... Vous reprenez le contrôle non pas par la lutte, mais par la douceur, l'attention et la respiration. Vous êtes l'alchimiste qui transforme une sensation brute en quelque chose de plus gérable. Continuez de respirer. Vous êtes en sécurité.`,
        alcool: `Bonjour. Prenez ce moment pour vous, pour reconnaître le chemin que vous parcourez et la force de votre décision. Installez-vous dans une position confortable, fermez les yeux, et laissez-vous guider. ... ... ... Prenez une grande et profonde inspiration, et en expirant, laissez aller les tensions de la journée. Une deuxième fois, inspirez la fierté de votre choix... et expirez le poids du passé, des habitudes. Une dernière fois, inspirez le calme... et expirez toute agitation intérieure. ... ... ... Prenez conscience de votre corps, ici, maintenant. Sentez la clarté qui revient dans votre esprit, jour après jour. Sentez la vitalité qui s'installe dans vos cellules. Votre corps est un système intelligent qui sait se réparer. Il se régénère, il vous remercie pour ce respect que vous lui accordez. ... ... ... Visualisez une cascade de lumière blanche et pure qui coule sur le sommet de votre tête. C'est une lumière de clarté, de pureté, de renouveau. Elle descend en vous, nettoyant tout sur son passage. ... ... ... Elle nettoie vos pensées, apportant la lucidité. Elle coule dans votre gorge, votre poitrine, apaisant votre cœur. Elle purifie votre foie, votre sang, emportant avec elle toutes les mémoires toxiques. Elle vous laisse propre, renouvelé, plein d'une énergie saine et vibrante. ... ... ... L'envie, ou le besoin, est une pensée, une vieille habitude neurologique. Ce n'est pas vous. Ce n'est pas un ordre. Vous avez le pouvoir de ne pas y répondre. Imaginez que vous êtes assis au bord d'une rivière large et calme. ... ... ... Les envies sont comme des feuilles ou des branches qui flottent sur l'eau. Elles apparaissent en amont, passent devant vous, et continuent leur chemin en aval jusqu'à disparaître à l'horizon. Elles ne font que passer. ... ... ... Vous êtes l'observateur sur la rive, calme et stable. Vous n'avez pas besoin de sauter dans l'eau pour attraper chaque feuille. Vous pouvez simplement la regarder passer, avec une curiosité détachée. "Tiens, une pensée, une envie." Et vous la laissez continuer son chemin. ... ... ... Quand une envie se présente, respirez. Dites-vous : 'Je vois cette pensée. C'est juste une vague du passé.' Et comme une vague, elle montera, atteindra un pic, puis inévitablement, elle redescendra et s'éloignera. Vous, vous restez sur la rive, en sécurité. ... ... ... Maintenant, projetez-vous dans un futur proche. Imaginez-vous dans une situation sociale, entouré d'amis. Vous tenez un verre d'eau fraîche, de jus, ou de votre boisson non-alcoolisée préférée. Vous êtes parfaitement à l'aise. ... ... ... Vous êtes présent, votre esprit est vif, vous participez pleinement à la conversation. Vous riez, vous partagez, vous connectez authentiquement. Vous vous sentez bien. Vous êtes en contrôle. Vous n'avez besoin de rien d'autre pour apprécier ce moment. ... ... ... Ressentez la fierté, la simplicité, la liberté de ce choix. Cette personne, c'est vous. Ancrez cette image et cette sensation en vous. C'est votre nouvelle réalité, celle que vous construisez chaque jour, avec force et dignité.`,
        confiance: `Bonjour et bienvenue dans cet espace pour renforcer votre confiance en vous. Installez-vous confortablemant, fermez les yeux, et prenez une grande inspiration. En expirant, laissez aller les doutes, les peurs, les critiques intérieures. ... ... ... Prenez conscience de votre posture, ici et maintenant. Redressez-vous légèrement, ouvrez vos épaules, comme pour faire de la place à votre confiance. Sentez l'ancrage de vos pieds sur le sol, ou le soutien de votre corps sur la chaise. Vous êtes stable, solide, et présent. ... ... ... Visualisez au centre de votre poitrine, au niveau du cœur, une petite sphère de lumière chaude et dorée. C'est le noyau de votre confiance, votre force intérieure. Elle est peut-être petite pour l'instant, mais elle est là. ... ... ... À chaque inspiration, imaginez que vous nourrissez cette sphère. Elle grandit un peu, sa lumière devient plus intense, plus rayonnante. À chaque expiration, elle se stabilise, se renforce. ... ... ... Continuez de respirer, et observez cette lumière qui s'étend. Elle remplit votre torse, descend dans votre ventre, apportant une sensation de calme et de force. Elle remonte le long de votre colonne vertébrale, vous redressant sans effort. ... ... ... Elle coule dans vos épaules, vos bras, jusqu'au bout de vos doigts. Elle monte dans votre cou, votre tête, éclairant vos pensées. Tout votre être est rempli de cette lumière de confiance. Vous la rayonnez. ... ... ... Pensez maintenant à un moment, même bref, même lointain, où vous vous êtes senti fier de vous. Un moment où vous avez été compétent, où vous avez réussi quelque chose, où vous vous êtes senti en pleine possession de vos moyens. ... ... ... Revivez cette scène. Ne la regardez pas seulement, plongez dedans. Que voyiez-vous ? Qu'entendiez-vous ? Plus important encore, que ressentiez-vous dans votre corps ? Retrouvez cette sensation de fierté, de force, de capacité. Ancrez cette sensation. ... ... ... Cette force, cette capacité, est en vous. Elle a toujours été là. C'est une ressource inépuisable à laquelle vous pouvez vous connecter à tout moment. La lumière dorée dans votre poitrine est la manifestation de cette ressource. ... ... ... Répétez intérieurement : 'Je suis capable. Je crois en moi. Je mérite le succès et le respect.' Sentez la résonance de ces mots en vous, amplifiée par la lumière dorée. ... ... ... Chaque jour, vous nourrissez cette lumière intérieure. Vous marchez dans le monde avec assurance et sérénité. Vous savez que vous avez les ressources en vous pour faire face à ce qui se présente. Vous êtes confiant(e).`,
        prosperite: `Bonjour et bienvenue dans cette séance dédiée à l'ouverture à la prospérité et à l'abondance. Installez-vous confortablemant, prêt à accueillir de nouvelles énergies. Fermez les yeux. ... ... ... Prenez une profonde inspiration, et en expirant, relâchez toutes les idées de manque, toutes les peurs liées à l'avenir. Chaque souffle est une invitation à vous sentir plus riche, plus complet. ... ... ... Portez votre attention sur votre corps, et avec chaque expiration, libérez les tensions. Sentez votre corps devenir léger, réceptif. Relâchez le front, les mâchoires, les épaules. Laissez aller tout ce qui vous pèse. ... ... ... Imaginez que vous vous tenez au bord d'une rivière magnifique. Cette rivière n'est pas faite d'eau, mais d'une pure lumière dorée, scintillante. C'est le courant infini de l'opportunité, de la joie, et de la richesse sous toutes ses formes. ... ... ... Observez ce courant. Il est inépuisable. Il coule avec force et sérénité. Maintenant, faites un pas et entrez dans cette rivière de lumière. Sentez la chaleur dorée qui vous enveloppe, qui circule à travers vous. ... ... ... Vous n'êtes pas séparé de ce courant, vous en faites partie. Sentez cette énergie d'abondance nettoyer chaque cellule de votre corps, emportant sur son passage les doutes, les croyances limitantes, les sentiments de ne pas mériter. Répétez intérieurement : 'Je suis ouvert et réceptif à toute l'abondance que la vie a à m'offrir'. ... ... ... Visualisez maintenant un de vos objectifs. Imaginez qu'il est déjà réalisé. Ne regardez pas seulement l'image, mais ressentez les émotions. La joie, la fierté, la sécurité, la gratitude. Comment vous sentez-vous avec cet objectif atteint ? Ancrez profondément ce sentiment de succès. ... ... ... Cette rivière d'or est toujours en vous. Vous pouvez vous y connecter à tout moment. Pour ancrer cette sensation, serrez doucement le pouce et l'index de votre main droite. C'est votre interrupteur personnel pour vous reconnecter à cette énergie d'abondance. ... ... ... Prenez encore quelques instants pour flotter dans cette lumière dorée. Sachez que vous êtes un être de valeur, méritant le meilleur. Vous attirez à vous les opportunités et la prospérité, car vous êtes en harmonie avec leur énergie. ... ... ... Doucement, vous allez revenir ici et maintenant, en gardant cette sensation de richesse intérieure. Commencez à bouger vos doigts, vos pieds. Étirez-vous si vous le souhaitez. Et quand vous serez prêt, ouvrez les yeux, avec un nouveau regard sur le monde, un regard de prospérité.`
    },
    en: {
        sommeil: `Hello and welcome to this session designed to guide you towards a deep and restorative sleep. Take the time to get as comfortable as possible, in the dim light, ready to let go. Make sure that nothing will disturb you for the next few moments. ... ... ... Gently close your eyes, and let the outside world fade away. Take a deep breath, and as you exhale, let go of the weight of the day. Each breath takes you further from the hustle and bustle, bringing you closer to your inner sanctuary of peace. ... ... ... Now, bring all your attention to your breath. Feel the cool air entering your nostrils... and the warm breath leaving. Do not try to control it, simply observe its natural rhythm, like the ebb and flow of a soothing wave. ... ... ... Breathe in calm... and with each exhale, imagine you are blowing away the tensions, the worries, the thoughts of the day... Each exhale is a sigh of relief that sinks you a little deeper into the mattress, into relaxation... Visualize the clouds of your worries dissipating on the horizon. ... ... ... We will now relax each part of your body. Become aware of your head, your face. Relax your forehead, let it become smooth, without expression. Relax your eyebrows, your eyelids which are becoming heavy with sleep. Unclench your jaw, let your teeth separate slightly. Your tongue rests peacefully in your mouth. ... ... ... Feel the relaxation slide down your neck and shoulders. Feel your shoulders becoming heavy, very heavy, and moving away from your ears. Relax your arms, your elbows, your wrists, to the very tips of your fingers. Your arms are now completely inert, heavy, and perfectly relaxed. ... ... ... Pay attention to your back. Feel each vertebra setting down, relaxing on the support, one after the other. Release all the accumulated tension in your back, from top to bottom. Your spine is fully supported. ... ... ... Your chest and your belly rise and fall with the calm rhythm of your breath. Your heart beats quietly, serenely, at a slow and steady pace. Feel peace settling in your belly, relaxing all the internal organs. ... ... ... Relax your pelvis, your hips. Feel your legs becoming heavy and totally passive... from the knees to the ankles... and to the tips of your toes. Your feet are relaxed, perhaps slightly turned outwards, a sign of total surrender. ... ... ... Your entire body is now heavy, relaxed, and ready for rest. You are in a state of total comfort and well-being. Savor this pleasant feeling of heaviness, of gentle warmth that envelops you. ... ... ... Now imagine a staircase before you. A magnificent, soft, and inviting staircase. It spirals down to a place of absolute calm and silence. The handrail is smooth and cool under your hand. ... ... ... We will descend it together. Each step you take down brings you deeper into relaxation, closer to sleep. Each number plunges you into an even greater state of serenity. ... ... ... Ten... the relaxation deepens... Nine... your mind becomes clearer... Eight... you are more and more calm... Seven... outside noises fade away... Six... you feel safe... Five... your mind calms down... Four... you are almost floating... Three... you are at the gates of sleep... Two... one last step before total rest... One... ... ... ... Here you are at the bottom of the stairs. You enter a night garden, bathed in the soft light of a benevolent moon. The air is fresh and pure, scented with night-blooming jasmine. The ground is a soft, cool moss under your bare feet. This is your sanctuary of rest. ... ... ... In the center of this garden is the most comfortable bed you can imagine. Come closer... notice the texture of the sheets, the perfection of the pillow. Lie down... and feel the softness of the sheets, the fluffiness of the pillow that conforms to the shape of your head. ... ... ... Here, in this magical place, nothing can disturb you. You are completely safe, wrapped in calm and a protective energy. A light breeze caresses your skin. ... ... ... Every distant sound, every sensation, becomes a lullaby that guides you even deeper into sleep. Sleep comes to you, naturally, effortlessly. ... ... ... Let go now... Let your mind dissolve into rest... and your body regenerate. Gently... peacefully... drift into a deep, continuous, and wonderfully restorative sleep. Sleep well.`,
        relaxation: `Hello. Take the time to settle into a comfortable position, either sitting or lying down, and close your eyes. Today, we will release all tensions, one by one, to find a state of deep calm. ... ... ... Start by taking a big, very big breath, filling your lungs with new air... and exhale slowly, very slowly, as if you were blowing through a straw. Repeat twice more at your own pace. ... ... ... Feel right now with this exhalation your shoulders relax... your jaw loosen... your forehead smooth out... Let a slight smile appear on your lips, inviting relaxation to settle in. ... ... ... Imagine that each part of your body is a candle, and your breath is a gentle breeze that extinguishes the flame of tension... Your breath is gentle, yet certain. It brings darkness and rest where there was a restless flame. ... ... ... First your feet... feel the flame of restlessness flicker, then go out. Your feet become heavy and relaxed. Then your calves, your knees, your thighs... the breeze of your breath passes through them, extinguishing every tension. ... ... ... Your legs are now completely heavy and relaxed. Move up to your pelvis... your belly... your back... everything releases... the flame of tension in your lower back goes out, leaving a pleasant warmth. ... ... ... Your chest opens, your heart beats calmly... the candle of anxiety near your heart is gently blown out. Your arms, your hands, to the tips of yourfingers, are completely relaxed... warmth flows to your palms. ... ... ... Finally, your neck, your nape, and your head. The breath extinguishes the last flames of incessant thoughts. Your mind becomes clear and calm. Your whole body is now in a peaceful and restful darkness. ... ... ... Now visualize a warm sandy beach at sunset. You are alone, or with benevolent presences. The sky is painted with orange, pink, and purple colors. It is a magnificent spectacle, just for you. ... ... ... The sound of the waves is a slow, regular rhythm that lulls you. It is the metronome of your tranquility. Each wave that recedes takes with it a piece of your worries. Watch them go far away. ... ... ... The gentle warmth of the sand relaxes every muscle in your body... Feel your back, your legs, sink slightly into this warm and welcoming sand. You are perfectly supported, in perfect safety. ... ... ... A light sea breeze caresses your face. It has a fresh, salty smell. You are perfectly fine... at peace... completely immersed in this landscape of serenity. ... ... ... Take a moment to do nothing, just be. To be on this beach, at this very moment. Savor this moment of total calm... of unity with nature. ... ... ... Anchor this feeling of deep relaxation within you... Take a mental picture of this place. Know that you can return to it whenever you need... simply by closing your eyes and breathing.`,
        antiStress: `Welcome to this session to soothe stress and find your inner calm. Sit or lie down comfortably. Close your eyes and let your body settle. ... ... ... Become aware of your body's contact points with the support... Feel the floor, the chair, the bed supporting you... Feel the weight of your body surrendering to gravity. You are safe, perfectly supported. ... ... ... Now, bring your attention to your breath, without trying to change it. Without forcing it, just observe it. Observe the path of the air, from your nostrils to your lungs, and then the reverse path. ... ... ... Imagine that with each inhalation, you breathe in pure, calm air, of a beautiful blue color, soothing and fresh... This blue air is the energy of serenity. It fills your lungs, then your blood, and spreads to every cell of your body. ... ... ... And with each exhalation, you breathe out a gray, opaque cloud. This cloud contains all your tensions, your worries, your stress, your fatigue... Watch it move away and dissolve into the air, leaving no trace. ... ... ... Breathe in the blue calm... Breathe out the gray stress... Continue this cycle several times. Feel how, with each cycle, the blue takes up more space inside, and the gray fades outside. Your inner space becomes cleaner, purer. ... ... ... Now visualize a protective bubble all around you. A sphere of white or golden light. This is your personal space of safety, your sanctuary of peace. ... ... ... This bubble is semi-permeable. It lets in everything that is positive – love, joy, peace – but it filters and repels everything that is negative. Inside this bubble, nothing can reach you. ... ... ... External noises, the restless thoughts of others, demands, everything stays outside. The sounds become muffled, distant, unimportant. Here, you are sovereign, you are calm. ... ... ... Become aware of the space you occupy inside this bubble. It is a space of quiet strength and confidence. Repeat inwardly: 'I am calm... I am serene... I handle the situation with confidence.' ... ... ... Feel this quiet strength growing within you, from the center of your chest. Stress no longer has a hold, because it cannot penetrate your space. You are centered, grounded, and ready to face challenges with a new, calm, and detached perspective.`,
        meditation: `Hello and welcome. This session is an invitation to reconnect with the present moment. Find a dignified and comfortable posture, with your back straight but not stiff. Close your eyes. ... ... ... Simply bring your attention to the sensations of your breath... the air entering your nostrils... perhaps a little cool... and leaving, perhaps a little warmer. Feel the movement of your belly or chest rising and falling. ... ... ... Do not try to change anything... just observe. Your breath is your anchor in the present moment. Whenever you feel lost, return to it. It is always there. ... ... ... Your mind will likely wander. To a thought, a memory, a plan. This is the very nature of the mind. It is normal, and it is not a mistake. ... ... ... Whenever you notice that your thoughts have gone elsewhere, congratulate yourself for noticing. It is a moment of mindfulness. Then, gently, and without judgment, bring your attention back to your breath. This is the very exercise of meditation. Thousands of times if necessary. ... ... ... There is nothing to achieve, nothing to attain. There is no 'good' or 'bad' meditation. Just be here, present to what is. With gentleness and kindness towards yourself. ... ... ... Now expand your field of awareness. Be aware of the sounds around you... the closest, the most distant. Welcome them without naming them, without judging them. They are part of the present moment. ... ... ... Become aware of the sensations in your body... the temperature of the air on your skin, the points of contact, any tension or tingling. Observe these sensations as you observe your breath. ... ... ... Now observe the thoughts that pass like clouds in the sky of your mind. Some are large and dark, others are light and white. Let them pass without clinging to them. ... ... ... You are not your thoughts, you are the one who observes them. You are the sky, not the clouds. Remain in this space of pure consciousness, a silent and peaceful observer... ... ... ... Every moment is a new opportunity to return here and now. Every breath is a new beginning. Enjoy this inner silence, this clarity... It is your true nature, always accessible.`,
        arretTabac: `Hello. Today, you are strengthening your decision to free yourself from tobacco. Get comfortable and close your eyes. Be proud to take this moment for yourself, for your health. ... ... ... Take three deep breaths... and with each exhale, release the tension and the craving to smoke... Feel your body relax, and your mind open to the freedom you have chosen. ... ... ... You have made a decision for your health, for your freedom, for your future. It is an act of great respect for yourself. Honor this choice, feel its rightness deep within you. ... ... ... Now visualize two paths before you. One is gray, smoky, foggy. This is the path of addiction. It smells stale, of cold tobacco. The air is heavy, difficult to breathe. ... ... ... The other is bright, clear, full of fresh air and vibrant colors. This is the path of freedom. The grass is green, the sky is blue. Feel the difference. Take a conscious and deliberate step onto this bright path. ... ... ... Feel the smell of fresh air, the vitality in your lungs, the energy flowing through your body on this bright path. Each step makes you stronger, healthier, more alive. Your breathing is full and easy. ... ... ... Imagine yourself in a few weeks, a few months... without tobacco. You are walking on this path. Feel the pride. Feel your breath fuller, your sense of smell sharper, the flavors more present. See your skin brighter, your smile more genuine. ... ... ... See yourself using the money saved for something that truly pleases you, a project, a trip. See yourself moving, running, climbing stairs effortlessly, full of a new energy. ... ... ... Whenever a craving might appear, remember that it is just an old habit, a shadow from the past. You have an anchor. Place a hand on your belly, and breathe deeply three times. ... ... ... With each inhalation, remember this image of the bright path. With each exhalation, blow on the shadow of the craving and watch it dissipate. It is a simple echo, which loses its strength every day. ... ... ... You are stronger than this old habit. You have chosen life, health. Every day without tobacco is a victory that strengthens your freedom. You are breathing life to the fullest. You are free.`,
        amincissement: `Hello. Welcome to this session dedicated to harmonizing your body and mind. Get comfortable... close your eyes... and take a deep breath, letting your belly expand. ... ... ... With each exhale, let go of judgments about your body, frustrations, past diets... Blow away the harsh words, the negative images. You are starting a new chapter today. ... ... ... Welcome yourself with kindness, here and now. Place one hand on your heart and one on your belly, and send gratitude to your body for all it does for you every day. It is your vehicle for life, your ally. ... ... ... Become aware of your body, its shape, its presence... without judgment, with simple curiosity. Feel the contact of your clothes, the temperature of your skin. Simply be present to your physical self. ... ... ... Now imagine a soft golden light, like the morning sun, entering through the top of your head. It is a light of healing, acceptance, and healthy energy. It is warm and comforting. ... ... ... It slowly descends, filling every cell of your body with a sense of well-being. It flows through your brain, soothing critical thoughts. It flows down your throat, your chest, your heart. ... ... ... It continues its path into your stomach, your digestive system, bringing peace and balance. It envelops each organ in a beneficent warmth. It dissolves blockages and tensions. ... ... ... This light helps you reconnect with your true feelings of hunger and satiety. Imagine that it awakens your body's innate intelligence. It guides you towards healthy food choices that nourish and respect your body. ... ... ... Visualize the person you want to become: full of energy, comfortable in your body, at peace with food. Do not focus on a weight, but on a feeling. A feeling of lightness, vitality, joy. ... ... ... See yourself moving with ease, doing activities you love, whether it's walking in nature, dancing, playing. Your body is an instrument of joy, not a source of worry. ... ... ... Your body knows what is good for it. Listen to it. It speaks to you through whispers of real hunger, and sighs of satiety. Learn to listen to these subtle signals. ... ... ... Every day, you make conscious and kind choices for your well-being. You eat to nourish yourself, to give yourself energy, not to fill a void. You are in harmony with yourself.`,
        douleur: `Hello. This session is a space to help you manage the sensation of pain. Make yourself as comfortable as your body allows today. Close your eyes and let your breath find a natural and soothing rhythm. ... ... ... To begin, we will not focus on the pain, but on comfort. Mentally scan your body and find an area that, right now, is neutral, or even pleasant. Perhaps the warmth of your hands... the sensation of your hair on your forehead... the contact of your feet with the floor, or the softness of your clothes. ... ... ... Choose one of these areas, and immerse your consciousness within it. Explore this sensation of non-pain, of comfort. Is it warm, cool, soft, neutral? Immerse yourself in this sensation. This is your anchor point. ... ... ... With each inhalation, imagine this feeling of well-being growing, amplifying. Imagine it as a soft light that expands a little more with each breath, creating a haven of peace inside you. ... ... ... Now, with this resource of comfort firmly present and solid, you can allow the area of pain to enter your field of awareness. Without fear, without judgment. Observe the sensation from a distance, like a scientist observing a weather phenomenon through a window. ... ... ... Give it neutral characteristics. A shape, a color, a texture. Is it hot, cold? Sharp, dull? Dense, diffuse? Vibrating, constant? Simply observe, without judging it as 'bad', without attaching a story to it. ... ... ... You are dissociating the pure sensation from the emotional reaction. You are not the pain. You are the consciousness that observes it. This simple act of distancing can already change your perception. ... ... ... Now, use your breath as a tool for transformation. Imagine that with each inhalation, you draw from your comfort zone, this soft light, and you send it as a soothing breath towards the painful area. ... ... ... And with each exhalation, imagine that the painful sensation loses some of its intensity, its solidity. Visualize its color becoming paler, more transparent. Its edges, which were perhaps sharp and hard, become blurry and soft. ... ... ... Continue this process... Breathe comfort towards the pain... Exhale to dissolve, diffuse, and soften it. You can also imagine the sensation transforming. A block of ice melting under a gentle sun... a tight knot loosening fiber by fiber... a bright color fading. ... ... ... You regain control not through struggle, but through gentleness, attention, and breath. You are the alchemist who transforms a raw sensation into something more manageable. Continue to breathe. You are safe.`,
        alcool: `Hello. Take this moment for yourself, to acknowledge the path you are on and the strength of your decision. Get into a comfortable position, close your eyes, and let yourself be guided. ... ... ... Take a big, deep breath, and as you exhale, let go of the day's tensions. A second time, breathe in the pride of your choice... and breathe out the weight of the past, of habits. One last time, breathe in calm... and breathe out all inner agitation. ... ... ... Become aware of your body, here, now. Feel the clarity returning to your mind, day after day. Feel the vitality settling into your cells. Your body is an intelligent system that knows how to repair itself. It is regenerating, it thanks you for the respect you are giving it. ... ... ... Visualize a waterfall of pure white light flowing over the top of your head. It is a light of clarity, purity, and renewal. It descends into you, cleansing everything in its path. ... ... ... It cleanses your thoughts, bringing lucidity. It flows into your throat, your chest, soothing your heart. It purifies your liver, your blood, carrying away all toxic memories. It leaves you clean, renewed, full of healthy and vibrant energy. ... ... ... The craving, or the need, is a thought, an old neurological habit. It is not you. It is not an order. You have the power not to respond to it. Imagine you are sitting by a wide, calm river. ... ... ... Cravings are like leaves or branches floating on the water. They appear upstream, pass in front of you, and continue their way downstream until they disappear on the horizon. They are just passing through. ... ... ... You are the observer on the bank, calm and stable. You do not need to jump into the water to catch every leaf. You can simply watch it pass, with detached curiosity. 'Oh, a thought, a craving.' And you let it continue on its way. ... ... ... When a craving arises, breathe. Tell yourself: 'I see this thought. It's just a wave from the past.' And like a wave, it will rise, reach a peak, and then inevitably, it will recede and move away. You, you remain on the bank, safe. ... ... ... Now, project yourself into the near future. Imagine yourself in a social situation, surrounded by friends. You are holding a glass of fresh water, juice, or your favorite non-alcoholic drink. You are perfectly at ease. ... ... ... You are present, your mind is sharp, you are fully participating in the conversation. You laugh, you share, you connect authentically. You feel good. You are in control. You don't need anything else to enjoy this moment. ... ... ... Feel the pride, the simplicity, the freedom of this choice. This person is you. Anchor this image and this feeling within you. This is your new reality, the one you are building every day, with strength and dignity.`,
        confiance: `Hello and welcome to this space to strengthen your self-confidence. Settle in comfortably, close your eyes, and take a deep breath. As you exhale, let go of doubts, fears, inner criticisms. ... ... ... Become aware of your posture, here and now. Straighten up slightly, open your shoulders, as if to make room for your confidence. Feel the grounding of your feet on the floor, or the support of your body on the chair. You are stable, solid, and present. ... ... ... Visualize in the center of your chest, at the level of your heart, a small sphere of warm, golden light. This is the core of your confidence, your inner strength. It may be small for now, but it is there. ... ... ... With each inhalation, imagine that you are nurturing this sphere. It grows a little, its light becomes more intense, more radiant. With each exhalation, it stabilizes, it strengthens. ... ... ... Continue to breathe, and observe this light expanding. It fills your torso, descends into your belly, bringing a sense of calm and strength. It rises along your spine, straightening you effortlessly. ... ... ... It flows into your shoulders, your arms, to the tips of your fingers. It rises into your neck, your head, illuminating your thoughts. Your entire being is filled with this light of confidence. You radiate it. ... ... ... Now think of a moment, however brief, however distant, when you felt proud of yourself. A moment when you were competent, when you succeeded at something, when you felt in full command of your abilities. ... ... ... Relive that scene. Don't just watch it, dive into it. What did you see? What did you hear? More importantly, what did you feel in your body? Find that feeling of pride, of strength, of capability. Anchor that feeling. ... ... ... This strength, this capability, is within you. It has always been there. It is an inexhaustible resource that you can connect to at any time. The golden light in your chest is the manifestation of this resource. ... ... ... Repeat inwardly: 'I am capable. I believe in myself. I deserve success and respect.' Feel the resonance of these words within you, amplified by the golden light. ... ... ... Every day, you nourish this inner light. You walk in the world with assurance and serenity. You know that you have the resources within you to face what comes. You are confident.`,
        prosperite: `Hello and welcome to this session dedicated to opening yourself to prosperity and abundance. Make yourself comfortable, ready to welcome new energies. Close your eyes. ... ... ... Take a deep breath, and as you exhale, release all ideas of lack, all fears about the future. Each breath is an invitation to feel richer, more complete. ... ... ... Bring your attention to your body, and with each exhalation, release the tensions. Feel your body becoming light, receptive. Relax your forehead, your jaw, your shoulders. Let go of everything that weighs you down. ... ... ... Imagine you are standing on the bank of a magnificent river. This river is not made of water, but of pure, shimmering golden light. It is the infinite stream of opportunity, joy, and wealth in all its forms. ... ... ... Observe this stream. It is inexhaustible. It flows with strength and serenity. Now, take a step and enter this river of light. Feel the golden warmth enveloping you, circulating through you. ... ... ... You are not separate from this stream; you are part of it. Feel this energy of abundance cleansing every cell in your body, washing away doubts, limiting beliefs, and feelings of unworthiness. Repeat inwardly: 'I am open and receptive to all the abundance life has to offer me.' ... ... ... Now visualize one of your goals. Imagine it is already achieved. Don't just look at the image, but feel the emotions. The joy, the pride, the security, the gratitude. How do you feel with this goal accomplished? Anchor this feeling of success deeply. ... ... ... This golden river is always within you. You can connect to it at any time. To anchor this sensation, gently press your thumb and index finger together on your right hand. This is your personal switch to reconnect with this energy of abundance. ... ... ... Take a few more moments to float in this golden light. Know that you are a being of value, deserving of the best. You attract opportunities and prosperity to yourself because you are in harmony with their energy. ... ... ... Gently, you will now return to the here and now, keeping this feeling of inner wealth. Begin to move your fingers and toes. Stretch if you wish. And when you are ready, open your eyes, with a new outlook on the world, an outlook of prosperity.`
    },
    de: {
        sommeil: `Hallo und willkommen zu dieser Sitzung, die Sie in einen tiefen und erholsamen Schlaf begleiten soll. Machen Sie es sich so bequem wie möglich, im Halbdunkel, bereit loszulassen. Stellen Sie sicher, dass Sie für die nächsten Momente ungestört sind. ... ... ... Schließen Sie sanft Ihre Augen und lassen Sie die Außenwelt verblassen. Atmen Sie tief ein und lassen Sie beim Ausatmen das Gewicht des Tages los. Jeder Atemzug entfernt Sie weiter vom Trubel und bringt Sie näher zu Ihrem inneren Heiligtum des Friedens. ... ... ... Richten Sie nun Ihre ganze Aufmerksamkeit auf Ihren Atem. Spüren Sie die kühle Luft, die durch Ihre Nasenlöcher einströmt... und den warmen Atem, der wieder ausströmt. Versuchen Sie nicht, ihn zu kontrollieren, beobachten Sie einfach seinen natürlichen Rhythmus, wie das Ebbe und Flut einer beruhigenden Welle. ... ... ... Atmen Sie Ruhe ein... und stellen Sie sich bei jedem Ausatmen vor, wie Sie die Anspannungen, Sorgen und Gedanken des Tages wegblasen... Jedes Ausatmen ist ein Seufzer der Erleichterung, der Sie ein wenig tiefer in die Matratze, in die Entspannung sinken lässt... Visualisieren Sie, wie sich die Wolken Ihrer Sorgen am Horizont auflösen. ... ... ... Wir werden nun jeden Teil Ihres Körpers entspannen. Nehmen Sie Ihren Kopf, Ihr Gesicht wahr. Entspannen Sie Ihre Stirn, lassen Sie sie glatt und ausdruckslos werden. Entspannen Sie Ihre Augenbrauen, Ihre Augenlider, die schwer von Schlaf werden. Lockern Sie Ihren Kiefer, lassen Sie Ihre Zähne sich leicht voneinander lösen. Ihre Zunge liegt ruhig in Ihrem Mund. ... ... ... Spüren Sie, wie die Entspannung Ihren Nacken und Ihre Schultern hinabgleitet. Spüren Sie, wie Ihre Schultern schwer werden, sehr schwer, und sich von Ihren Ohren entfernen. Entspannen Sie Ihre Arme, Ihre Ellbogen, Ihre Handgelenke, bis in die Fingerspitzen. Ihre Arme sind nun völlig träge, schwer und vollkommen entspannt. ... ... ... Achten Sie auf Ihren Rücken. Spüren Sie, wie sich jeder Wirbel ablegt, sich auf der Unterlage entspannt, einer nach dem anderen. Lassen Sie alle angesammelten Spannungen im Rücken los, von oben bis unten. Ihre Wirbelsäule ist vollständig gestützt. ... ... ... Ihre Brust und Ihr Bauch heben und senken sich im ruhigen Rhythmus Ihres Atems. Ihr Herz schlägt ruhig, gelassen, in einem langsamen und gleichmäßigen Takt. Spüren Sie, wie sich Frieden in Ihrem Bauch ausbreitet und alle inneren Organe entspannt. ... ... ... Entspannen Sie Ihr Becken, Ihre Hüften. Spüren Sie, wie Ihre Beine schwer und völlig passiv werden... von den Knien bis zu den Knöcheln... und bis zu den Zehenspitzen. Ihre Füße sind entspannt, vielleicht leicht nach außen gedreht, ein Zeichen völliger Hingabe. ... ... ... Ihr ganzer Körper ist jetzt schwer, entspannt und bereit für die Ruhe. Sie befinden sich in einem Zustand völligen Komforts und Wohlbefindens. Genießen Sie dieses angenehme Gefühl der Schwere, der sanften Wärme, die Sie umhüllt. ... ... ... Stellen Sie sich nun eine Treppe vor Ihnen vor. Eine prächtige, sanfte und einladende Treppe. Sie führt spiralförmig hinab an einen Ort absoluter Ruhe und Stille. Das Geländer ist glatt und kühl unter Ihrer Hand. ... ... ... Wir werden sie gemeinsam hinabsteigen. Jede Stufe, die Sie hinabsteigen, führt Sie tiefer in die Entspannung, näher an den Schlaf. Jede Zahl versetzt Sie in einen noch größeren Zustand der Gelassenheit. ... ... ... Zehn... die Entspannung vertieft sich... Neun... Ihr Geist wird klarer... Acht... Sie werden immer ruhiger... Sieben... die Außengeräusche verblassen... Sechs... Sie fühlen sich sicher... Fünf... Ihr Geist beruhigt sich... Vier... Sie schweben fast... Drei... Sie stehen an der Schwelle zum Schlaf... Zwei... ein letzter Schritt vor der totalen Ruhe... Eins... ... ... ... Sie sind am Ende der Treppe angekommen. Sie betreten einen nächtlichen Garten, getaucht in das sanfte Licht eines wohlwollenden Mondes. Die Luft ist frisch und rein, duftet nach nachtblühendem Jasmin. Der Boden ist ein weiches, kühles Moos unter Ihren nackten Füßen. Dies ist Ihr Zufluchtsort der Ruhe. ... ... ... In der Mitte dieses Gartens steht das bequemste Bett, das Sie sich vorstellen können. Treten Sie näher... bemerken Sie die Textur der Laken, die Perfektion des Kissens. Legen Sie sich hin... und spüren Sie die Weichheit der Laken, die Flauschigkeit des Kissens, das sich der Form Ihres Kopfes anpasst. ... ... ... Hier, an diesem magischen Ort, kann Sie nichts stören. Sie sind vollkommen sicher, in Ruhe und schützender Energie gehüllt. Eine leichte Brise streichelt Ihre Haut. ... ... ... Jeder ferne Klang, jede Empfindung wird zu einem Wiegenlied, das Sie noch tiefer in den Schlaf führt. Der Schlaf kommt zu Ihnen, natürlich, mühelos. ... ... ... Lassen Sie sich nun gehen... Lassen Sie Ihren Geist in der Ruhe aufgehen... und Ihren Körper sich regenerieren. Gleiten Sie sanft... friedlich... in einen tiefen, ununterbrochenen und wunderbar erholsamen Schlaf. Schlafen Sie gut.`,
        relaxation: `Hallo. Nehmen Sie sich Zeit, um eine bequeme Position einzunehmen, entweder sitzend oder liegend, und schließen Sie Ihre Augen. Heute werden wir alle Spannungen lösen, eine nach der anderen, um einen Zustand tiefer Ruhe zu finden. ... ... ... Beginnen Sie mit einem tiefen, sehr tiefen Atemzug, füllen Sie Ihre Lungen mit neuer Luft... und atmen Sie langsam, sehr langsam aus, als ob Sie durch einen Strohhalm blasen würden. Wiederholen Sie dies noch zweimal in Ihrem eigenen Tempo. ... ... ... Spüren Sie schon jetzt mit dieser Ausatmung, wie sich Ihre Schultern entspannen... Ihr Kiefer lockert sich... Ihre Stirn glättet sich... Lassen Sie ein leichtes Lächeln auf Ihren Lippen erscheinen und laden Sie die Entspannung ein, sich niederzulassen. ... ... ... Stellen Sie sich vor, jeder Teil Ihres Körpers ist eine Kerze, und Ihr Atem ist eine sanfte Brise, die die Flamme der Spannung auslöscht... Ihr Atem ist sanft und doch bestimmt. Er bringt Dunkelheit und Ruhe dorthin, wo eine unruhige Flamme war. ... ... ... Zuerst Ihre Füße... spüren Sie, wie die Flamme der Unruhe flackert und dann erlischt. Ihre Füße werden schwer und entspannt. Dann Ihre Waden, Ihre Knie, Ihre Oberschenkel... die Brise Ihres Atems durchströmt sie und löscht jede Spannung aus. ... ... ... Ihre Beine sind nun völlig schwer und entspannt. Gehen Sie nach oben zu Ihrem Becken... Ihrem Bauch... Ihrem Rücken... alles entspannt sich... die Flamme der Spannung in Ihrem unteren Rücken erlischt und macht einer angenehmen Wärme Platz. ... ... ... Ihre Brust öffnet sich, Ihr Herz schlägt ruhig... die Kerze der Angst in der Nähe Ihres Herzens wird sanft ausgeblasen. Ihre Arme, Ihre Hände, bis in die Fingerspitzen, sind völlig entspannt... Wärme fließt in Ihre Handflächen. ... ... ... Schließlich Ihr Hals, Ihr Nacken und Ihr Kopf. Der Atem löscht die letzten Flammen unaufhörlicher Gedanken aus. Ihr Geist wird klar und ruhig. Ihr ganzer Körper ist nun in einer friedlichen und erholsamen Dunkelheit. ... ... ... Visualisieren Sie nun einen warmen Sandstrand bei Sonnenuntergang. Sie sind allein oder mit wohlwollenden Anwesenheiten. Der Himmel ist in Orange-, Rosa- und Lilatönen gemalt. Es ist ein herrliches Schauspiel, nur für Sie. ... ... ... Das Rauschen der Wellen ist ein langsamer, regelmäßiger Rhythmus, der Sie wiegt. Es ist der Metronom Ihrer Ruhe. Jede Welle, die sich zurückzieht, nimmt ein Stück Ihrer Sorgen mit sich. Sehen Sie ihnen nach, wie sie in die Ferne ziehen. ... ... ... Die sanfte Wärme des Sandes entspannt jeden Muskel in Ihrem Körper... Spüren Sie, wie Ihr Rücken, Ihre Beine, leicht in diesen warmen und einladenden Sand sinken. Sie sind perfekt gestützt, in perfekter Sicherheit. ... ... ... Eine leichte Meeresbrise streichelt Ihr Gesicht. Sie hat einen frischen, salzigen Geruch. Es geht Ihnen vollkommen gut... in Frieden... völlig eingetaucht in diese Landschaft der Gelassenheit. ... ... ... Nehmen Sie sich einen Moment Zeit, um nichts zu tun, einfach nur zu sein. An diesem Strand zu sein, in diesem genauen Moment. Genießen Sie diesen Moment totaler Ruhe... der Einheit mit der Natur. ... ... ... Verankern Sie dieses Gefühl tiefer Entspannung in sich... Machen Sie ein mentales Foto von diesem Ort. Wissen Sie, dass Sie jederzeit dorthin zurückkehren können... einfach indem Sie die Augen schließen und atmen.`,
        antiStress: `Willkommen zu dieser Sitzung, um Stress abzubauen und Ihre innere Ruhe wiederzufinden. Setzen oder legen Sie sich bequem hin. Schließen Sie Ihre Augen und lassen Sie Ihren Körper zur Ruhe kommen. ... ... ... Nehmen Sie die Kontaktpunkte Ihres Körpers mit der Unterlage wahr... Spüren Sie den Boden, den Stuhl, das Bett, das Sie stützt... Spüren Sie das Gewicht Ihres Körpers, das sich der Schwerkraft hingibt. Sie sind sicher, perfekt gestützt. ... ... ... Richten Sie nun Ihre Aufmerksamkeit auf Ihren Atem, ohne zu versuchen, ihn zu verändern. Ohne ihn zu erzwingen, beobachten Sie ihn einfach. Beobachten Sie den Weg der Luft von Ihren Nasenlöchern zu Ihren Lungen und dann den umgekehrten Weg. ... ... ... Stellen Sie sich vor, dass Sie bei jeder Einatmung reine, ruhige Luft von einer wunderschönen blauen Farbe einatmen, beruhigend und frisch... Diese blaue Luft ist die Energie der Gelassenheit. Sie füllt Ihre Lungen, dann Ihr Blut und breitet sich in jeder Zelle Ihres Körpers aus. ... ... ... Und bei jeder Ausatmung blasen Sie eine graue, undurchsichtige Wolke aus. Diese Wolke enthält all Ihre Spannungen, Sorgen, Ihren Stress, Ihre Müdigkeit... Sehen Sie, wie sie sich entfernt und in der Luft auflöst, ohne eine Spur zu hinterlassen. ... ... ... Atmen Sie die blaue Ruhe ein... Atmen Sie den grauen Stress aus... Setzen Sie diesen Zyklus mehrmals fort. Spüren Sie, wie mit jedem Zyklus das Blau im Inneren mehr Platz einnimmt und das Grau im Äußeren verblasst. Ihr innerer Raum wird sauberer, reiner. ... ... ... Visualisieren Sie nun eine Schutzblase um sich herum. Eine Kugel aus weißem oder goldenem Licht. Dies ist Ihr persönlicher Raum der Sicherheit, Ihr Heiligtum des Friedens. ... ... ... Diese Blase ist halbdurchlässig. Sie lässt alles Positive herein – Liebe, Freude, Frieden – aber sie filtert und stößt alles Negative ab. Innerhalb dieser Blase kann Sie nichts erreichen. ... ... ... Äußere Geräusche, die unruhigen Gedanken anderer, Anforderungen, alles bleibt draußen. Die Geräusche werden gedämpft, fern, unwichtig. Hier sind Sie souverän, Sie sind ruhig. ... ... ... Nehmen Sie den Raum wahr, den Sie innerhalb dieser Blase einnehmen. Es ist ein Raum stiller Stärke und Zuversicht. Wiederholen Sie innerlich: 'Ich bin ruhig... ich bin gelassen... ich meistere die Situation mit Zuversicht.' ... ... ... Spüren Sie, wie diese ruhige Kraft in Ihnen wächst, aus der Mitte Ihrer Brust. Stress hat keinen Halt mehr, denn er kann Ihren Raum nicht durchdringen. Sie sind zentriert, geerdet und bereit, Herausforderungen mit einer neuen, ruhigen und distanzierten Perspektive zu begegnen.`,
        meditation: `Hallo und willkommen. Diese Sitzung ist eine Einladung, sich wieder mit dem gegenwärtigen Moment zu verbinden. Finden Sie eine würdevolle und bequeme Haltung, mit geradem, aber nicht steifem Rücken. Schließen Sie Ihre Augen. ... ... ... Richten Sie Ihre Aufmerksamkeit einfach auf die Empfindungen Ihres Atems... die Luft, die durch Ihre Nasenlöcher einströmt... vielleicht etwas kühl... und wieder ausströmt, vielleicht etwas wärmer. Spüren Sie die Bewegung Ihres Bauches oder Ihrer Brust, die sich hebt und senkt. ... ... ... Versuchen Sie nicht, etwas zu ändern... nur beobachten. Ihr Atem ist Ihr Anker im gegenwärtigen Moment. Wann immer Sie sich verloren fühlen, kehren Sie zu ihm zurück. Er ist immer da. ... ... ... Ihr Geist wird wahrscheinlich abschweifen. Zu einem Gedanken, einer Erinnerung, einem Plan. Das ist die Natur des Geistes. Das ist normal und kein Fehler. ... ... ... Immer wenn Sie bemerken, dass Ihre Gedanken woanders sind, gratulieren Sie sich dazu, es bemerkt zu haben. Es ist ein Moment der Achtsamkeit. Dann bringen Sie Ihre Aufmerksamkeit sanft und ohne Urteil zurück zu Ihrem Atem. Das ist die eigentliche Übung der Meditation. Tausende Male, wenn nötig. ... ... ... Es gibt nichts zu erreichen, nichts zu erzielen. Es gibt keine 'gute' oder 'schlechte' Meditation. Nur hier sein, präsent für das, was ist. Mit Sanftmut und Wohlwollen sich selbst gegenüber. ... ... ... Erweitern Sie nun Ihr Bewusstseinsfeld. Seien Sie sich der Geräusche um Sie herum bewusst... der nächsten, der fernsten. Nehmen Sie sie an, ohne sie zu benennen, ohne sie zu beurteilen. Sie sind Teil des gegenwärtigen Moments. ... ... ... Nehmen Sie die Empfindungen in Ihrem Körper wahr... die Temperatur der Luft auf Ihrer Haut, die Kontaktpunkte, eine eventuelle Spannung oder ein Kribbeln. Beobachten Sie diese Empfindungen, wie Sie Ihren Atem beobachten. ... ... ... Beobachten Sie nun die Gedanken, die wie Wolken am Himmel Ihres Geistes vorbeiziehen. Einige sind groß und dunkel, andere leicht und weiß. Lassen Sie sie vorüberziehen, ohne sich an sie zu klammern. ... ... ... Sie sind nicht Ihre Gedanken, Sie sind derjenige, der sie beobachtet. Sie sind der Himmel, nicht die Wolken. Verweilen Sie in diesem Raum reinen Bewusstseins, ein stiller und friedlicher Beobachter... ... ... ... Jeder Moment ist eine neue Gelegenheit, hier und jetzt zurückzukehren. Jeder Atemzug ist ein Neuanfang. Genießen Sie diese innere Stille, diese Klarheit... Es ist Ihre wahre Natur, immer zugänglich.`,
        arretTabac: `Hallo. Heute stärken Sie Ihre Entscheidung, sich vom Tabak zu befreien. Machen Sie es sich bequem und schließen Sie die Augen. Seien Sie stolz darauf, sich diesen Moment für sich selbst und Ihre Gesundheit zu nehmen. ... ... ... Nehmen Sie drei tiefe Atemzüge... und mit jedem Ausatmen lassen Sie die Anspannung und das Verlangen nach dem Rauchen los... Spüren Sie, wie sich Ihr Körper entspannt und Ihr Geist sich für die von Ihnen gewählte Freiheit öffnet. ... ... ... Sie haben eine Entscheidung für Ihre Gesundheit, für Ihre Freiheit, für Ihre Zukunft getroffen. Es ist ein Akt großen Respekts vor sich selbst. Ehren Sie diese Wahl, spüren Sie ihre Richtigkeit tief in Ihnen. ... ... ... Stellen Sie sich nun zwei Wege vor Ihnen vor. Einer ist grau, rauchig, neblig. Das ist der Weg der Sucht. Er riecht abgestanden, nach kaltem Tabak. Die Luft ist schwer, schwer zu atmen. ... ... ... Der andere ist hell, klar, voller frischer Luft und leuchtender Farben. Das ist der Weg der Freiheit. Das Gras ist grün, der Himmel ist blau. Spüren Sie den Unterschied. Machen Sie einen bewussten und entschlossenen Schritt auf diesen hellen Weg. ... ... ... Spüren Sie den Duft frischer Luft, die Vitalität in Ihren Lungen, die Energie, die auf diesem hellen Weg durch Ihren Körper fließt. Jeder Schritt macht Sie stärker, gesünder, lebendiger. Ihre Atmung ist voll und leicht. ... ... ... Stellen Sie sich vor, in ein paar Wochen, ein paar Monaten... ohne Tabak. Sie gehen auf diesem Weg. Spüren Sie den Stolz. Spüren Sie Ihren volleren Atem, Ihren feineren Geruchssinn, die präsenteren Geschmäcker. Sehen Sie Ihre hellere Haut, Ihr ehrlicheres Lächeln. ... ... ... Sehen Sie sich, wie Sie das gesparte Geld für etwas ausgeben, das Ihnen wirklich Freude bereitet, ein Projekt, eine Reise. Sehen Sie sich, wie Sie sich bewegen, laufen, Treppen mühelos steigen, voller neuer Energie. ... ... ... Jedes Mal, wenn ein Verlangen aufkommen könnte, erinnern Sie sich daran, dass es nur eine alte Gewohnheit ist, ein Schatten aus der Vergangenheit. Sie haben einen Anker. Legen Sie eine Hand auf Ihren Bauch und atmen Sie dreimal tief durch. ... ... ... Mit jeder Einatmung erinnern Sie sich an dieses Bild des hellen Weges. Mit jeder Ausatmung blasen Sie auf den Schatten des Verlangens und sehen zu, wie er sich auflöst. Es ist ein einfaches Echo, das jeden Tag an Kraft verliert. ... ... ... Sie sind stärker als diese alte Gewohnheit. Sie haben das Leben, die Gesundheit gewählt. Jeder Tag ohne Tabak ist ein Sieg, der Ihre Freiheit stärkt. Sie atmen das Leben in vollen Zügen. Sie sind frei.`,
        amincissement: `Hallo. Willkommen zu dieser Sitzung, die der Harmonisierung von Körper und Geist gewidmet ist. Machen Sie es sich bequem... schließen Sie die Augen... und atmen Sie tief ein, lassen Sie Ihren Bauch sich ausdehnen. ... ... ... Lassen Sie bei jedem Ausatmen die Urteile über Ihren Körper, die Frustrationen, vergangene Diäten los... Blasen Sie die harten Worte, die negativen Bilder weg. Sie beginnen heute ein neues Kapitel. ... ... ... Nehmen Sie sich mit Wohlwollen an, hier und jetzt. Legen Sie eine Hand auf Ihr Herz und eine auf Ihren Bauch und senden Sie Dankbarkeit an Ihren Körper für alles, was er jeden Tag für Sie tut. Er ist Ihr Fahrzeug für das Leben, Ihr Verbündeter. ... ... ... Nehmen Sie Ihren Körper wahr, seine Form, seine Präsenz... ohne Urteil, mit einfacher Neugier. Spüren Sie den Kontakt Ihrer Kleidung, die Temperatur Ihrer Haut. Seien Sie einfach präsent für Ihre körperliche Hülle. ... ... ... Stellen Sie sich nun vor, wie ein sanftes goldenes Licht, wie die Morgensonne, durch Ihren Scheitel eintritt. Es ist ein Licht der Heilung, der Akzeptanz und der gesunden Energie. Es ist warm und beruhigend. ... ... ... Es senkt sich langsam herab und erfüllt jede Zelle Ihres Körpers mit einem Gefühl des Wohlbefindens. Es fließt durch Ihr Gehirn und beruhigt kritische Gedanken. Es fließt Ihren Hals, Ihre Brust, Ihr Herz hinunter. ... ... ... Es setzt seinen Weg in Ihren Magen, Ihr Verdauungssystem fort und bringt Frieden und Gleichgewicht. Es umhüllt jedes Organ mit einer wohltuenden Wärme. Es löst Blockaden und Verspannungen. ... ... ... Dieses Licht hilft Ihnen, sich wieder mit Ihren wahren Hunger- und Sättigungsgefühlen zu verbinden. Stellen Sie sich vor, es weckt die angeborene Intelligenz Ihres Körpers. Es leitet Sie zu gesunden Essensentscheidungen, die Ihren Körper nähren und respektieren. ... ... ... Visualisieren Sie die Person, die Sie werden möchten: voller Energie, wohl in Ihrem Körper, im Frieden mit dem Essen. Konzentrieren Sie sich nicht auf ein Gewicht, sondern auf ein Gefühl. Ein Gefühl von Leichtigkeit, Vitalität, Freude. ... ... ... Sehen Sie sich, wie Sie sich mit Leichtigkeit bewegen, Aktivitäten nachgehen, die Sie lieben, sei es in der Natur spazieren gehen, tanzen, spielen. Ihr Körper ist ein Instrument der Freude, keine Quelle der Sorge. ... ... ... Ihr Körper weiß, was gut für ihn ist. Hören Sie auf ihn. Er spricht zu Ihnen durch Flüstern echten Hungers und Seufzer der Sättigung. Lernen Sie, auf diese subtilen Signale zu hören. ... ... ... Jeden Tag treffen Sie bewusste und wohlwollende Entscheidungen für Ihr Wohlbefinden. Sie essen, um sich zu nähren, um sich Energie zu geben, nicht um eine Leere zu füllen. Sie sind im Einklang mit sich selbst.`,
        douleur: `Hallo. Diese Sitzung ist ein Raum, der Ihnen hilft, mit dem Schmerzempfinden umzugehen. Machen Sie es sich so bequem, wie es Ihr Körper heute zulässt. Schließen Sie die Augen und lassen Sie Ihren Atem einen natürlichen und beruhigenden Rhythmus finden. ... ... ... Zuerst konzentrieren wir uns nicht auf den Schmerz, sondern auf das Wohlbefinden. Gehen Sie gedanklich durch Ihren Körper und finden Sie einen Bereich, der im Moment neutral oder sogar angenehm ist. Vielleicht die Wärme Ihrer Hände... das Gefühl Ihrer Haare auf der Stirn... der Kontakt Ihrer Füße mit dem Boden oder die Weichheit Ihrer Kleidung. ... ... ... Wählen Sie einen dieser Bereiche und tauchen Sie mit Ihrem Bewusstsein hinein. Erforschen Sie dieses Gefühl von Nicht-Schmerz, von Behaglichkeit. Ist es warm, kühl, weich, neutral? Tauchen Sie in dieses Gefühl ein. Das ist Ihr Ankerpunkt. ... ... ... Lassen Sie bei jeder Einatmung dieses Gefühl des Wohlbefindens wachsen, sich verstärken. Stellen Sie es sich als ein sanftes Licht vor, das sich mit jedem Atemzug ein wenig mehr ausbreitet und einen Hafen des Friedens in Ihnen schafft. ... ... ... Jetzt, mit dieser Ressource des Wohlbefindens fest präsent und solide, können Sie den Schmerzbereich in Ihr Bewusstseinsfeld treten lassen. Ohne Angst, ohne Urteil. Beobachten Sie das Gefühl aus der Ferne, wie ein Wissenschaftler ein Wetterphänomen durch ein Fenster beobachtet. ... ... ... Geben Sie ihm neutrale Eigenschaften. Eine Form, eine Farbe, eine Textur. Ist es heiß, kalt? Stechend, dumpf? Dicht, diffus? Vibrierend, konstant? Einfach beobachten, ohne es als 'schlecht' zu beurteilen, ohne eine Geschichte daran zu heften. ... ... ... Sie trennen das reine Gefühl von der emotionalen Reaktion. Sie sind nicht der Schmerz. Sie sind das Bewusstsein, das ihn beobachtet. Allein dieser Abstand kann Ihre Wahrnehmung bereits verändern. ... ... ... Nutzen Sie nun Ihren Atem als Werkzeug zur Transformation. Stellen Sie sich vor, dass Sie bei jeder Einatmung aus Ihrem Komfortbereich schöpfen, diesem sanften Licht, und es als beruhigenden Hauch zum schmerzhaften Bereich senden. ... ... ... Und bei jeder Ausatmung stellen Sie sich vor, dass das Schmerzempfinden etwas an Intensität, an Festigkeit verliert. Visualisieren Sie, wie seine Farbe blasser, transparenter wird. Seine Kanten, die vielleicht scharf und hart waren, werden unscharf und weich. ... ... ... Setzen Sie diesen Prozess fort... Atmen Sie Komfort zum Schmerz... Atmen Sie aus, um ihn aufzulösen, zu verteilen, zu mildern. Sie können sich auch vorstellen, dass sich das Gefühl verwandelt. Eine Eisplatte, die unter einer sanften Sonne schmilzt... ein fester Knoten, der sich Faser für Faser löst... eine leuchtende Farbe, die verblasst. ... ... ... Sie gewinnen die Kontrolle zurück, nicht durch Kampf, sondern durch Sanftheit, Aufmerksamkeit und Atmung. Sie sind der Alchemist, der ein rohes Gefühl in etwas Handhabbareres verwandelt. Atmen Sie weiter. Sie sind in Sicherheit.`,
        alcool: `Hallo. Nehmen Sie sich diesen Moment für sich selbst, um den Weg anzuerkennen, den Sie gehen, und die Stärke Ihrer Entscheidung. Nehmen Sie eine bequeme Position ein, schließen Sie die Augen und lassen Sie sich führen. ... ... ... Atmen Sie tief und kräftig ein, und lassen Sie beim Ausatmen die Anspannungen des Tages los. Ein zweites Mal, atmen Sie den Stolz Ihrer Wahl ein... und atmen Sie die Last der Vergangenheit, der Gewohnheiten aus. Ein letztes Mal, atmen Sie Ruhe ein... und atmen Sie alle innere Unruhe aus. ... ... ... Nehmen Sie Ihren Körper wahr, hier und jetzt. Spüren Sie die Klarheit, die Tag für Tag in Ihren Geist zurückkehrt. Spüren Sie die Vitalität, die sich in Ihren Zellen ansiedelt. Ihr Körper ist ein intelligentes System, das sich selbst reparieren kann. Er regeneriert sich, er dankt Ihnen für den Respekt, den Sie ihm entgegenbringen. ... ... ... Visualisieren Sie einen Wasserfall aus reinem weißem Licht, der über Ihren Scheitel fließt. Es ist ein Licht der Klarheit, der Reinheit, der Erneuerung. Es senkt sich in Sie herab und reinigt alles auf seinem Weg. ... ... ... Es reinigt Ihre Gedanken und bringt Klarheit. Es fließt in Ihren Hals, Ihre Brust und beruhigt Ihr Herz. Es reinigt Ihre Leber, Ihr Blut und nimmt alle toxischen Erinnerungen mit sich. Es hinterlässt Sie sauber, erneuert, voller gesunder und lebendiger Energie. ... ... ... Das Verlangen oder das Bedürfnis ist ein Gedanke, eine alte neurologische Gewohnheit. Es ist nicht Sie. Es ist kein Befehl. Sie haben die Macht, nicht darauf zu reagieren. Stellen Sie sich vor, Sie sitzen an einem breiten, ruhigen Fluss. ... ... ... Verlangen ist wie Blätter oder Äste, die auf dem Wasser treiben. Sie erscheinen stromaufwärts, ziehen an Ihnen vorbei und setzen ihren Weg stromabwärts fort, bis sie am Horizont verschwinden. Sie ziehen nur vorbei. ... ... ... Sie sind der Beobachter am Ufer, ruhig und stabil. Sie müssen nicht ins Wasser springen, um jedes Blatt zu fangen. Sie können es einfach vorbeiziehen sehen, mit distanzierter Neugier. 'Oh, ein Gedanke, ein Verlangen.' Und Sie lassen es seinen Weg gehen. ... ... ... Wenn ein Verlangen aufkommt, atmen Sie. Sagen Sie sich: 'Ich sehe diesen Gedanken. Er ist nur eine Welle aus der Vergangenheit.' Und wie eine Welle wird er ansteigen, einen Höhepunkt erreichen und dann unweigerlich wieder abklingen und sich entfernen. Sie bleiben am Ufer, sicher. ... ... ... Projezieren Sie sich nun in die nahe Zukunft. Stellen Sie sich eine soziale Situation vor, umgeben von Freunden. Sie halten ein Glas frisches Wasser, Saft oder Ihr Lieblingsgetränk ohne Alkohol in der Hand. Sie fühlen sich vollkommen wohl. ... ... ... Sie sind präsent, Ihr Geist ist wach, Sie nehmen voll am Gespräch teil. Sie lachen, Sie teilen, Sie verbinden sich authentisch. Sie fühlen sich gut. Sie haben die Kontrolle. Sie brauchen nichts anderes, um diesen Moment zu genießen. ... ... ... Spüren Sie den Stolz, die Einfachheit, die Freiheit dieser Wahl. Diese Person sind Sie. Verankern Sie dieses Bild und dieses Gefühl in sich. Dies ist Ihre neue Realität, die Sie jeden Tag mit Stärke und Würde aufbauen.`,
        confiance: `Hallo und willkommen in diesem Raum, um Ihr Selbstvertrauen zu stärken. Machen Sie es sich bequem, schließen Sie die Augen und atmen Sie tief ein. Beim Ausatmen lassen Sie Zweifel, Ängste, innere Kritik los. ... ... ... Werden Sie sich Ihrer Haltung bewusst, hier und jetzt. Richten Sie sich leicht auf, öffnen Sie Ihre Schultern, als ob Sie Platz für Ihr Vertrauen schaffen wollten. Spüren Sie die Erdung Ihrer Füße auf dem Boden oder die Stütze Ihres Körpers auf dem Stuhl. Sie sind stabil, solide und präsent. ... ... ... Visualisieren Sie in der Mitte Ihrer Brust, auf Herzhöhe, eine kleine Kugel aus warmem, goldenem Licht. Dies ist der Kern Ihres Vertrauens, Ihre innere Stärke. Sie mag im Moment klein sein, aber sie ist da. ... ... ... Stellen Sie sich bei jeder Einatmung vor, dass Sie diese Kugel nähren. Sie wächst ein wenig, ihr Licht wird intensiver, strahlender. Bei jeder Ausatmung stabilisiert sie sich, wird stärker. ... ... ... Atmen Sie weiter und beobachten Sie, wie sich dieses Licht ausdehnt. Es füllt Ihren Rumpf, senkt sich in Ihren Bauch und bringt ein Gefühl von Ruhe und Stärke. Es steigt Ihre Wirbelsäule hinauf und richtet Sie mühelos auf. ... ... ... Es fließt in Ihre Schultern, Ihre Arme, bis in die Fingerspitzen. Es steigt in Ihren Hals, Ihren Kopf und erhellt Ihre Gedanken. Ihr ganzes Wesen ist von diesem Licht des Vertrauens erfüllt. Sie strahlen es aus. ... ... ... Denken Sie nun an einen Moment, wie kurz, wie fern auch immer, in dem Sie stolz auf sich waren. Ein Moment, in dem Sie kompetent waren, in dem Sie etwas geschafft haben, in dem Sie sich in voller Beherrschung Ihrer Fähigkeiten gefühlt haben. ... ... ... Erleben Sie diese Szene noch einmal. Schauen Sie sie nicht nur an, tauchen Sie ein. Was haben Sie gesehen? Was haben Sie gehört? Wichtiger noch, was haben Sie in Ihrem Körper gefühlt? Finden Sie dieses Gefühl von Stolz, von Stärke, von Fähigkeit. Verankern Sie dieses Gefühl. ... ... ... Diese Stärke, diese Fähigkeit ist in Ihnen. Sie war schon immer da. Es ist eine unerschöpfliche Ressource, mit der Sie sich jederzeit verbinden können. Das goldene Licht in Ihrer Brust ist die Manifestation dieser Ressource. ... ... ... Wiederholen Sie innerlich: 'Ich bin fähig. Ich glaube an mich. Ich verdiene Erfolg und Respekt.' Spüren Sie die Resonanz dieser Worte in sich, verstärkt durch das goldene Licht. ... ... ... Jeden Tag nähren Sie dieses innere Licht. Sie gehen mit Sicherheit und Gelassenheit durch die Welt. Sie wissen, dass Sie die Ressourcen in sich haben, um dem zu begegnen, was kommt. Sie sind zuversichtlich.`,
        prosperite: `Hallo und willkommen zu dieser Sitzung, die der Öffnung für Wohlstand und Fülle gewidmet ist. Machen Sie es sich bequem, bereit, neue Energien aufzunehmen. Schließen Sie Ihre Augen. ... ... ... Atmen Sie tief ein, und beim Ausatmen lassen Sie alle Vorstellungen von Mangel, alle Zukunftsängste los. Jeder Atemzug ist eine Einladung, sich reicher und vollständiger zu fühlen. ... ... ... Richten Sie Ihre Aufmerksamkeit auf Ihren Körper und lassen Sie mit jedem Ausatmen die Spannungen los. Spüren Sie, wie Ihr Körper leicht und empfänglich wird. Entspannen Sie Ihre Stirn, Ihre Kiefer, Ihre Schultern. Lassen Sie alles los, was Sie belastet. ... ... ... Stellen Sie sich vor, Sie stehen am Ufer eines prächtigen Flusses. Dieser Fluss besteht nicht aus Wasser, sondern aus reinem, schimmerndem goldenem Licht. Es ist der unendliche Strom von Möglichkeiten, Freude und Reichtum in all seinen Formen. ... ... ... Beobachten Sie diesen Strom. Er ist unerschöpflich. Er fließt mit Kraft und Gelassenheit. Machen Sie nun einen Schritt und treten Sie in diesen Fluss aus Licht. Spüren Sie die goldene Wärme, die Sie umhüllt und durch Sie fließt. ... ... ... Sie sind nicht von diesem Strom getrennt; Sie sind ein Teil von ihm. Spüren Sie, wie diese Energie der Fülle jede Zelle Ihres Körpers reinigt und Zweifel, einschränkende Überzeugungen und Gefühle der Wertlosigkeit mit sich fortspült. Wiederholen Sie innerlich: 'Ich bin offen und empfänglich für all die Fülle, die das Leben mir zu bieten hat.' ... ... ... Visualisieren Sie nun eines Ihrer Ziele. Stellen Sie sich vor, es ist bereits erreicht. Schauen Sie nicht nur auf das Bild, sondern fühlen Sie die Emotionen. Die Freude, den Stolz, die Sicherheit, die Dankbarkeit. Wie fühlen Sie sich, wenn dieses Ziel erreicht ist? Verankern Sie dieses Gefühl des Erfolgs tief. ... ... ... Dieser goldene Fluss ist immer in Ihnen. Sie können sich jederzeit mit ihm verbinden. Um dieses Gefühl zu verankern, drücken Sie sanft Daumen und Zeigefinger Ihrer rechten Hand zusammen. Dies ist Ihr persönlicher Schalter, um sich wieder mit dieser Energie der Fülle zu verbinden. ... ... ... Nehmen Sie sich noch ein paar Momente Zeit, um in diesem goldenen Licht zu schweben. Wissen Sie, dass Sie ein wertvolles Wesen sind, das das Beste verdient. Sie ziehen Möglichkeiten und Wohlstand an, weil Sie mit ihrer Energie im Einklang sind. ... ... ... Sanft werden Sie nun ins Hier und Jetzt zurückkehren und dieses Gefühl des inneren Reichtums bewahren. Beginnen Sie, Ihre Finger und Zehen zu bewegen. Strecken Sie sich, wenn Sie möchten. Und wenn Sie bereit sind, öffnen Sie Ihre Augen mit einem neuen Blick auf die Welt, einem Blick des Wohlstands.`
    },
    es: {
        sommeil: `Hola y bienvenido a esta sesión diseñada para guiarte hacia un sueño profundo y reparador. Tómate tu tiempo para instalarte lo más cómodamente posible, en la penumbra, listo para dejarte llevar. Asegúrate de que nada te molestará durante los próximos momentos. ... ... ... Cierra suavemente los ojos y deja que el mundo exterior se desvanezca. Toma una respiración profunda y, al exhalar, suelta el peso del día. Cada respiración te aleja un poco más del ajetreo, acercándote a tu santuario interior de paz. ... ... ... Ahora, lleva toda tu atención a tu respiración. Siente el aire fresco que entra por tus fosas nasales... y el aliento tibio que sale. No intentes controlarla, simplemente observa su ritmo natural, como el flujo y reflujo de una ola relajante. ... ... ... Inspira calma... y con cada exhalación, imagina que soplas lejos las tensiones, las preocupaciones, los pensamientos del día... Cada exhalación es un suspiro de alivio que te hunde un poco más en el colchón, en la relajación... Visualiza las nubes de tus preocupaciones disipándose en el horizonte. ... ... ... Ahora vamos a relajar cada parte de tu cuerpo. Toma conciencia de tu cabeza, de tu rostro. Relaja tu frente, deja que se vuelva lisa, sin expresión. Relaja tus cejas, tus párpados que se vuelven pesados de sueño. Afloja tus mandíbulas, deja que tus dientes se separen ligeramente. Tu lengua descansa tranquilamente en tu boca. ... ... ... Siente la relajación deslizarse por tu cuello y tus hombros. Siente cómo tus hombros se vuelven pesados, muy pesados, y se alejan de tus orejas. Relaja tus brazos, tus codos, tus muñecas, hasta la punta de tus dedos. Tus brazos están ahora completamente inertes, pesados y perfectamente relajados. ... ... ... Presta atención a tu espalda. Siente cada vértebra asentarse, relajarse sobre el soporte, una tras otra. Libera todas las tensiones acumuladas en tu espalda, de arriba a abajo. Tu columna vertebral está completamente sostenida. ... ... ... Tu pecho y tu vientre suben y bajan al ritmo tranquilo de tu respiración. Tu corazón late tranquilamente, serenamente, a un ritmo lento y constante. Siente la paz instalarse en tu vientre, relajando todos los órganos internos. ... ... ... Relaja tu pelvis, tus caderas. Siente tus piernas volverse pesadas y totalmente pasivas... desde las rodillas hasta los tobillos... y hasta la punta de tus pies. Tus pies están relajados, quizás ligeramente girados hacia afuera, señal de una entrega total. ... ... ... Todo tu cuerpo está ahora pesado, relajado y listo para el descanso. Estás en un estado de total comodidad y bienestar. Saborea esta agradable sensación de pesadez, de suave calor que te envuelve. ... ... ... Ahora imagina una escalera frente a ti. Una escalera magnífica, suave y acogedora. Desciende en espiral hacia un lugar de calma y silencio absoluto. La barandilla está lisa y fresca bajo tu mano. ... ... ... Vamos a bajarla juntos. Cada escalón que bajas te lleva más profundamente a la relajación, más cerca del sueño. Cada número te sumerge en un estado de serenidad aún mayor. ... ... ... Diez... la relajación se profundiza... Nueve... tu mente se vuelve más clara... Ocho... estás cada vez más tranquilo... Siete... los ruidos exteriores se desvanecen... Seis... te sientes seguro... Cinco... tu mente se calma... Cuatro... casi flotas... Tres... estás a las puertas del sueño... Dos... un último paso antes del descanso total... Uno... ... ... ... Ya estás al final de la escalera. Entras en un jardín nocturno, bañado por la suave luz de una luna benévola. El aire es fresco y puro, perfumado de jazmín nocturno. El suelo es un musgo suave y fresco bajo tus pies descalzos. Es tu santuario de descanso. ... ... ... En el centro de este jardín se encuentra la cama más cómoda que puedas imaginar. Acércate... nota la textura de las sábanas, la perfección de la almohada. Acuéstate... y siente la suavidad de las sábanas, la esponjosidad de la almohada que se amolda a la forma de tu cabeza. ... ... ... Aquí, en este lugar mágico, nada puede molestarte. Estás completamente seguro, envuelto en calma y en una energía protectora. Una ligera brisa acaricia tu piel. ... ... ... Cada sonido lejano, cada sensación, se convierte en una canción de cuna que te guía aún más profundamente hacia el sueño. El sueño viene a ti, de forma natural, sin esfuerzo. ... ... ... Déjate llevar ahora... Deja que tu mente se disuelva en el descanso... y que tu cuerpo se regenere. Deslízate suavemente... pacíficamente... hacia un sueño profundo, continuo y maravillosamente reparador. Duerme bien.`,
        relaxation: `Hola. Tómate el tiempo para instalarte en una posición cómoda, ya sea sentado o acostado, y cierra los ojos. Hoy vamos a liberar todas las tensiones, una por una, para encontrar un estado de calma profunda. ... ... ... Comienza tomando una respiración grande, muy grande, llenando tus pulmones de aire nuevo... y exhala lentamente, muy lentamente, como si soplaras a través de una pajita. Repite dos veces más a tu propio ritmo. ... ... ... Siente ahora mismo con esta exhalación cómo se relajan tus hombros... cómo se afloja tu mandíbula... cómo se alisa tu frente... Permite que una ligera sonrisa se dibuje en tus labios, invitando a la relajación a instalarse. ... ... ... Imagina que cada parte de tu cuerpo es una vela, y tu aliento es una suave brisa que apaga la llama de la tensión... Tu aliento es suave, pero certero. Trae oscuridad y descanso donde había una llama inquieta. ... ... ... Primero tus pies... siente la llama de la inquietud parpadear y luego apagarse. Tus pies se vuelven pesados y relajados. Luego tus pantorrillas, tus rodillas, tus muslos... la brisa de tu aliento los recorre, apagando cada tensión. ... ... ... Tus piernas están ahora completamente pesadas y relajadas. Sube hacia tu pelvis... tu vientre... tu espalda... todo se suelta... la llama de la tensión en tu espalda baja se apaga, dejando un calor agradable. ... ... ... Tu pecho se abre, tu corazón late con calma... la vela de la ansiedad cerca de tu corazón se apaga suavemente. Tus brazos, tus manos, hasta la punta de tus dedos, están completamente relajados... el calor fluye hasta tus palmas. ... ... ... Finalmente, tu cuello, tu nuca y tu cabeza. El aliento apaga las últimas llamas de pensamientos incesantes. Tu mente se vuelve clara y tranquila. Todo tu cuerpo está ahora en una oscuridad pacífica y reparadora. ... ... ... Ahora visualiza una playa de arena cálida al atardecer. Estás solo, o con presencias benevolentes. El cielo está pintado de colores naranja, rosa y morado. Es un espectáculo magnífico, solo para ti. ... ... ... El sonido de las olas es un ritmo lento y regular que te arrulla. Es el metrónomo de tu tranquilidad. Cada ola que se retira se lleva consigo un trozo de tus preocupaciones. Míralas alejarse a lo lejos. ... ... ... El suave calor de la arena relaja cada músculo de tu cuerpo... Siente tu espalda, tus piernas, hundirse ligeramente en esta arena cálida y acogedora. Estás perfectamente sostenido, en perfecta seguridad. ... ... ... Una ligera brisa marina acaricia tu rostro. Tiene un olor fresco y salado. Estás perfectamente bien... en paz... completamente inmerso en este paisaje de serenidad. ... ... ... Tómate un momento para no hacer nada, solo ser. Estar en esta playa, en este preciso momento. Saborea este momento de calma total... de unidad con la naturaleza. ... ... ... Ancla esta sensación de relajación profunda en ti... Toma una foto mental de este lugar. Sé consciente de que puedes volver a él cada vez que lo necesites... simplemente cerrando los ojos y respirando.`,
        antiStress: `Bienvenido a esta sesión para calmar el estrés y encontrar tu calma interior. Siéntate o acuéstate cómodamente. Cierra los ojos y deja que tu cuerpo se asiente. ... ... ... Toma conciencia de los puntos de contacto de tu cuerpo con el soporte... Siente el suelo, la silla, la cama que te sostiene... Siente el peso de tu cuerpo entregándose a la gravedad. Estás a salvo, perfectamente sostenido. ... ... ... Ahora, lleva tu atención a tu respiración, sin intentar cambiarla. Sin forzarla, simplemente obsérvala. Observa el camino del aire, desde tus fosas nasales hasta tus pulmones, y luego el camino inverso. ... ... ... Imagina que con cada inhalación, respiras un aire puro y tranquilo, de un hermoso color azul, relajante y fresco... Este aire azul es la energía de la serenidad. Llena tus pulmones, luego tu sangre, y se extiende a cada célula de tu cuerpo. ... ... ... Y con cada exhalación, exhalas una nube gris y opaca. Esta nube contiene todas tus tensiones, tus preocupaciones, tu estrés, tu fatiga... Mírala alejarse y disolverse en el aire, sin dejar rastro. ... ... ... Inspira la calma azul... Exhala el estrés gris... Continúa este ciclo varias veces. Siente cómo, con cada ciclo, el azul ocupa más espacio en tu interior, y el gris se desvanece en el exterior. Tu espacio interior se vuelve más limpio, más puro. ... ... ... Ahora visualiza una burbuja protectora a tu alrededor. Una esfera de luz blanca o dorada. Este es tu espacio personal de seguridad, tu santuario de paz. ... ... ... Esta burbuja es semipermeable. Deja entrar todo lo que es positivo – amor, alegría, paz – pero filtra y repele todo lo que es negativo. Dentro de esta burbuja, nada puede alcanzarte. ... ... ... Los ruidos externos, los pensamientos inquietos de los demás, las exigencias, todo queda fuera. Los sonidos se vuelven amortiguados, lejanos, sin importancia. Aquí, eres soberano, estás en calma. ... ... ... Toma conciencia del espacio que ocupas dentro de esta burbuja. Es un espacio de fuerza tranquila y confianza. Repite interiormente: 'Estoy en calma... estoy sereno(a)... manejo la situación con confianza.' ... ... ... Siente cómo esta fuerza tranquila crece dentro de ti, desde el centro de tu pecho. El estrés ya no tiene poder, porque no puede penetrar tu espacio. Estás centrado(a), anclado(a) y listo(a) para enfrentar los desafíos con una nueva perspectiva, tranquila y desapegada.`,
        meditation: `Hola y bienvenido. Esta sesión es una invitación a reconectar con el momento presente. Encuentra una postura digna y cómoda, con la espalda recta pero sin rigidez. Cierra los ojos. ... ... ... Simplemente lleva tu atención a las sensaciones de tu respiración... el aire que entra por tus fosas nasales... quizás un poco fresco... y que sale, quizás un poco más tibio. Siente el movimiento de tu abdomen o tu pecho que se eleva y desciende. ... ... ... No intentes cambiar nada... solo observa. Tu respiración es tu ancla en el momento presente. Cada vez que te sientas perdido, vuelve a ella. Siempre está ahí. ... ... ... Es probable que tu mente divague. Hacia un pensamiento, un recuerdo, un plan. Es la naturaleza misma de la mente. Es normal, y no es un error. ... ... ... Cada vez que notes que tus pensamientos se han ido a otra parte, felicítate por haberlo notado. Es un momento de plena conciencia. Luego, con suavidad y sin juzgar, devuelve tu atención a tu respiración. Este es el ejercicio mismo de la meditación. Miles de veces si es necesario. ... ... ... No hay nada que lograr, nada que alcanzar. No hay una meditación 'buena' o 'mala'. Solo estar aquí, presente a lo que es. Con suavidad y amabilidad hacia ti mismo. ... ... ... Ahora expande tu campo de conciencia. Sé consciente de los sonidos a tu alrededor... los más cercanos, los más lejanos. Acógelos sin nombrarlos, sin juzgarlos. Son parte del momento presente. ... ... ... Toma conciencia de las sensaciones en tu cuerpo... la temperatura del aire en tu piel, los puntos de contacto, una posible tensión o un hormigueo. Observa estas sensaciones como observas tu respiración. ... ... ... Ahora observa los pensamientos que pasan como nubes en el cielo de tu mente. Algunas son grandes y oscuras, otras ligeras y blancas. Déjalas pasar sin aferrarte a ellas. ... ... ... No eres tus pensamientos, eres quien los observa. Eres el cielo, no las nubes. Permanece en este espacio de pura conciencia, un observador silencioso y pacífico... ... ... ... Cada momento es una nueva oportunidad para volver aquí y ahora. Cada respiración es un nuevo comienzo. Disfruta de este silencio interior, de esta claridad... Es tu verdadera naturaleza, siempre accesible.`,
        arretTabac: `Hola. Hoy estás fortaleciendo tu decisión de liberarte del tabaco. Ponte cómodo y cierra los ojos. Siéntete orgulloso de tomar este momento para ti, para tu salud. ... ... ... Toma tres respiraciones profundas... y con cada exhalación, libera la tensión y el deseo de fumar... Siente tu cuerpo relajarse y tu mente abrirse a la libertad que has elegido. ... ... ... Has tomado una decisión por tu salud, por tu libertad, por tu futuro. Es un acto de gran respeto hacia ti mismo. Honra esta elección, siente su acierto en lo más profundo de ti. ... ... ... Ahora visualiza dos caminos frente a ti. Uno es gris, lleno de humo, neblinoso. Es el camino de la adicción. Huele a rancio, a tabaco frío. El aire es pesado, difícil de respirar. ... ... ... El otro es brillante, claro, lleno de aire puro y colores vivos. Es el camino de la libertad. La hierba es verde, el cielo es azul. Siente la diferencia. Da un paso consciente y deliberado hacia este camino brillante. ... ... ... Siente el olor del aire fresco, la vitalidad en tus pulmones, la energía que fluye por tu cuerpo en este camino brillante. Cada paso te hace más fuerte, más sano, más vivo. Tu respiración es amplia y fácil. ... ... ... Imagínate en unas pocas semanas, unos pocos meses... sin tabaco. Estás caminando por este sendero. Siente el orgullo. Siente tu respiración más plena, tu olfato más agudo, los sabores más presentes. Ve tu piel más luminosa, tu sonrisa más genuina. ... ... ... Mírate usando el dinero ahorrado para algo que realmente te da placer, un proyecto, un viaje. Mírate moviéndote, corriendo, subiendo escaleras sin esfuerzo, lleno de una nueva energía. ... ... ... Cada vez que aparezca un antojo, recuerda que es solo un viejo hábito, una sombra del pasado. Tienes un ancla. Coloca una mano sobre tu vientre y respira profundamente tres veces. ... ... ... Con cada inhalación, recuerda esta imagen del camino brillante. Con cada exhalación, sopla sobre la sombra del antojo y observa cómo se disipa. Es un simple eco, que pierde su fuerza cada día. ... ... ... Eres más fuerte que este viejo hábito. Has elegido la vida, la salud. Cada día sin tabaco es una victoria que fortalece tu libertad. Estás respirando vida a pleno pulmón. Eres libre.`,
        amincissement: `Hola. Bienvenido a esta sesión dedicada a armonizar tu cuerpo y tu mente. Ponte cómodo... cierra los ojos... y respira profundamente, dejando que tu vientre se expanda. ... ... ... Con cada exhalación, deja ir los juicios sobre tu cuerpo, las frustraciones, las dietas pasadas... Sopla lejos las palabras duras, las imágenes negativas. Hoy comienzas un nuevo capítulo. ... ... ... Acógete con amabilidad, aquí y ahora. Coloca una mano sobre tu corazón y otra sobre tu vientre, y envía gratitud a tu cuerpo por todo lo que hace por ti cada día. Es tu vehículo para la vida, tu aliado. ... ... ... Toma conciencia de tu cuerpo, de su forma, de su presencia... sin juicio, con simple curiosidad. Siente el contacto de tu ropa, la temperatura de tu piel. Simplemente está presente en tu envoltura corporal. ... ... ... Ahora imagina una suave luz dorada, como el sol de la mañana, que entra por la parte superior de tu cabeza. Es una luz de sanación, aceptación y energía saludable. Es cálida y reconfortante. ... ... ... Desciende lentamente, llenando cada célula de tu cuerpo con una sensación de bienestar. Fluye a través de tu cerebro, calmando los pensamientos críticos. Fluye por tu garganta, tu pecho, tu corazón. ... ... ... Continúa su camino hacia tu estómago, tu sistema digestivo, trayendo paz y equilibrio. Envuelve cada órgano con un calor benéfico. Disuelve bloqueos y tensiones. ... ... ... Esta luz te ayuda a reconectar con tus verdaderos sentimientos de hambre y saciedad. Imagina que despierta la inteligencia innata de tu cuerpo. Te guía hacia elecciones alimentarias saludables que nutren y respetan tu cuerpo. ... ... ... Visualiza a la persona en la que quieres convertirte: llena de energía, cómoda en tu cuerpo, en paz con la comida. No te concentres en un peso, sino en una sensación. Una sensación de ligereza, vitalidad, alegría. ... ... ... Mírate moviéndote con facilidad, haciendo actividades que amas, ya sea caminar en la naturaleza, bailar, jugar. Tu cuerpo es un instrumento de alegría, no una fuente de preocupación. ... ... ... Tu cuerpo sabe lo que es bueno para él. Escúchalo. Te habla a través de susurros de hambre real y suspiros de saciedad. Aprende a escuchar estas señales sutiles. ... ... ... Cada día, tomas decisiones conscientes y amables para tu bienestar. Comes para nutrirte, para darte energía, no para llenar un vacío. Estás en armonía contigo mismo.`,
        douleur: `Hola. Esta sesión es un espacio para ayudarte a manejar la sensación de dolor. Ponte tan cómodo como tu cuerpo te lo permita hoy. Cierra los ojos y deja que tu respiración encuentre un ritmo natural y relajante. ... ... ... Para empezar, no nos centraremos en el dolor, sino en la comodidad. Recorre mentalmente tu cuerpo y encuentra una zona que, en este momento, sea neutral o incluso agradable. Tal vez el calor de tus manos... la sensación de tu cabello en la frente... el contacto de tus pies con el suelo o la suavidad de tu ropa. ... ... ... Elige una de estas zonas y sumerge tu conciencia en ella. Explora esta sensación de no-dolor, de confort. ¿Es cálida, fresca, suave, neutra? Imprégnate de esta sensación. Es tu punto de anclaje. ... ... ... Con cada inhalación, imagina que esta sensación de bienestar crece, se amplifica. Imagínala como una luz suave que se expande un poco más con cada respiración, creando un remanso de paz en tu interior. ... ... ... Ahora, con este recurso de confort firmemente presente y sólido, puedes permitir que la zona de dolor entre en tu campo de conciencia. Sin miedo, sin juicio. Observa la sensación desde la distancia, como un científico observa un fenómeno meteorológico a través de una ventana. ... ... ... Dale características neutras. Una forma, un color, una textura. ¿Es caliente, fría? ¿Punzante, sorda? ¿Densa, difusa? ¿Vibrante, constante? Simplemente observa, sin juzgarla como 'mala', sin añadirle una historia. ... ... ... Estás disociando la sensación pura de la reacción emocional. Tú no eres el dolor. Eres la conciencia que lo observa. Este simple distanciamiento ya puede modificar tu percepción. ... ... ... Ahora, utiliza tu respiración como una herramienta de transformación. Imagina que con cada inhalación, extraes de tu zona de confort, esta luz suave, y la envías como un soplo calmante hacia la zona dolorosa. ... ... ... Y con cada exhalación, imagina que la sensación dolorosa pierde algo de su intensidad, de su solidez. Visualiza su color volviéndose más pálido, más transparente. Sus bordes, que quizás eran nítidos y duros, se vuelven borrosos y suaves. ... ... ... Continúa este proceso... Inspira confort hacia el dolor... Exhala para disolverlo, difundirlo, suavizarlo. También puedes imaginar que la sensación se transforma. Un bloque de hielo que se derrite bajo un sol suave... un nudo apretado que se afloja fibra por fibra... un color brillante que se desvanece. ... ... ... Recuperas el control no a través de la lucha, sino a través de la suavidad, la atención y la respiración. Eres el alquimista que transforma una sensación cruda en algo más manejable. Sigue respirando. Estás a salvo.`,
        alcool: `Hola. Tómate este momento para ti, para reconocer el camino que estás recorriendo y la fuerza de tu decisión. Ponte en una posición cómoda, cierra los ojos y déjate guiar. ... ... ... Toma una respiración grande y profunda, y al exhalar, deja ir las tensiones del día. Una segunda vez, inspira el orgullo de tu elección... y exhala el peso del pasado, de los hábitos. Una última vez, inspira calma... y exhala toda agitación interior. ... ... ... Toma conciencia de tu cuerpo, aquí y ahora. Siente la claridad que regresa a tu mente, día tras día. Siente la vitalidad que se instala en tus células. Tu cuerpo es un sistema inteligente que sabe cómo repararse. Se está regenerando, te agradece el respeto que le estás dando. ... ... ... Visualiza una cascada de luz blanca y pura que fluye sobre la parte superior de tu cabeza. Es una luz de claridad, pureza y renovación. Desciende dentro de ti, limpiando todo a su paso. ... ... ... Limpia tus pensamientos, trayendo lucidez. Fluye hacia tu garganta, tu pecho, calmando tu corazón. Purifica tu hígado, tu sangre, llevándose todos los recuerdos tóxicos. Te deja limpio, renovado, lleno de energía sana y vibrante. ... ... ... El antojo, o la necesidad, es un pensamiento, un viejo hábito neurológico. No eres tú. No es una orden. Tienes el poder de no responderle. Imagina que estás sentado junto a un río ancho y tranquilo. ... ... ... Los antojos son como hojas o ramas que flotan en el agua. Aparecen río arriba, pasan frente a ti y continúan su camino río abajo hasta desaparecer en el horizonte. Solo están de paso. ... ... ... Tú eres el observador en la orilla, tranquilo y estable. No necesitas saltar al agua para atrapar cada hoja. Simplemente puedes verla pasar, con curiosidad desapegada. 'Vaya, un pensamiento, un antojo.' Y lo dejas seguir su camino. ... ... ... Cuando surja un antojo, respira. Dite a ti mismo: 'Veo este pensamiento. Es solo una ola del pasado.' Y como una ola, subirá, alcanzará un pico y luego, inevitablemente, retrocederá y se alejará. Tú permaneces en la orilla, a salvo. ... ... ... Ahora, proyéctate en el futuro cercano. Imagínate en una situación social, rodeado de amigos. Sostienes un vaso de agua fresca, jugo o tu bebida sin alcohol favorita. Estás perfectamente a gusto. ... ... ... Estás presente, tu mente está aguda, participas plenamente en la conversación. Ríes, compartes, conectas auténticamente. Te sientes bien. Tienes el control. No necesitas nada más para disfrutar este momento. ... ... ... Siente el orgullo, la simplicidad, la libertad de esta elección. Esa persona eres tú. Ancla esta imagen y esta sensación dentro de ti. Esta es tu nueva realidad, la que estás construyendo cada día, con fuerza y dignidad.`,
        confiance: `Hola y bienvenido a este espacio para fortalecer tu confianza en ti mismo. Acomódate, cierra los ojos y respira profundamente. Al exhalar, deja ir las dudas, los miedos, las críticas internas. ... ... ... Toma conciencia de tu postura, aquí y ahora. Endereza ligeramente la espalda, abre los hombros, como para hacer espacio a tu confianza. Siente el anclaje de tus pies en el suelo, o el apoyo de tu cuerpo en la silla. Eres estable, sólido y presente. ... ... ... Visualiza en el centro de tu pecho, a la altura del corazón, una pequeña esfera de luz cálida y dorada. Este es el núcleo de tu confianza, tu fuerza interior. Puede que sea pequeña por ahora, pero está ahí. ... ... ... Con cada inhalación, imagina que estás nutriendo esta esfera. Crece un poco, su luz se vuelve más intensa, más radiante. Con cada exhalación, se estabiliza, se fortalece. ... ... ... Continúa respirando y observa cómo se expande esta luz. Llena tu torso, desciende a tu vientre, trayendo una sensación de calma y fuerza. Sube por tu columna vertebral, enderezándote sin esfuerzo. ... ... ... Fluye hacia tus hombros, tus brazos, hasta la punta de tus dedos. Sube a tu cuello, tu cabeza, iluminando tus pensamientos. Todo tu ser se llena de esta luz de confianza. La irradias. ... ... ... Ahora piensa en un momento, por breve que sea, por lejano que sea, en el que te sentiste orgulloso de ti mismo. Un momento en el que fuiste competente, en el que lograste algo, en el que te sentiste en pleno dominio de tus capacidades. ... ... ... Revive esa escena. No solo la mires, sumérgete en ella. ¿Qué veías? ¿Qué oías? Más importante aún, ¿qué sentías en tu cuerpo? Encuentra esa sensación de orgullo, de fuerza, de capacidad. Ancla esa sensación. ... ... ... Esta fuerza, esta capacidad, está dentro de ti. Siempre ha estado ahí. Es un recurso inagotable al que puedes conectarte en cualquier momento. La luz dorada en tu pecho es la manifestación de este recurso. ... ... ... Repite interiormente: 'Soy capaz. Creo en mí. Merezco el éxito y el respeto.' Siente la resonancia de estas palabras en tu interior, amplificada por la luz dorada. ... ... ... Cada día, nutres esta luz interior. Caminas por el mundo con seguridad y serenidad. Sabes que tienes los recursos dentro de ti para enfrentar lo que se presente. Tienes confianza.`,
        prosperite: `Hola y bienvenido a esta sesión dedicada a abrirse a la prosperidad y la abundancia. Ponte cómodo, listo para recibir nuevas energías. Cierra los ojos. ... ... ... Toma una respiración profunda y, al exhalar, suelta todas las ideas de carencia, todos los miedos sobre el futuro. Cada respiración es una invitación a sentirte más rico, más completo. ... ... ... Lleva tu atención a tu cuerpo y, con cada exhalación, libera las tensiones. Siente cómo tu cuerpo se vuelve ligero, receptivo. Relaja la frente, las mandíbulas, los hombros. Suelta todo lo que te pesa. ... ... ... Imagina que estás a la orilla de un río magnífico. Este río no está hecho de agua, sino de pura luz dorada y resplandeciente. Es la corriente infinita de oportunidades, alegría y riqueza en todas sus formas. ... ... ... Observa esta corriente. Es inagotable. Fluye con fuerza y serenidad. Ahora, da un paso y entra en este río de luz. Siente el calor dorado que te envuelve, circulando a través de ti. ... ... ... No estás separado de esta corriente; eres parte de ella. Siente esta energía de abundancia limpiando cada célula de tu cuerpo, llevándose a su paso las dudas, las creencias limitantes y los sentimientos de no merecer. Repite interiormente: 'Estoy abierto y receptivo a toda la abundancia que la vida tiene para ofrecerme'. ... ... ... Ahora visualiza una de tus metas. Imagina que ya la has alcanzado. No te limites a mirar la imagen, siente las emociones. La alegría, el orgullo, la seguridad, la gratitud. ¿Cómo te sientes con esta meta cumplida? Ancla profundamente este sentimiento de éxito. ... ... ... Este río dorado está siempre dentro de ti. Puedes conectar con él en cualquier momento. Para anclar esta sensación, presiona suavemente el pulgar y el índice de tu mano derecha. Este es tu interruptor personal para reconectar con esta energía de abundancia. ... ... ... Tómate unos momentos más para flotar en esta luz dorada. Sé consciente de que eres un ser de valor, merecedor de lo mejor. Atraes hacia ti las oportunidades y la prosperidad porque estás en armonía con su energía. ... ... ... Suavemente, vas a regresar al aquí y ahora, conservando este sentimiento de riqueza interior. Comienza a mover los dedos de las manos y los pies. Estírate si lo deseas. Y cuando estés listo, abre los ojos, con una nueva mirada sobre el mundo, una mirada de prosperidad.`
    },
    it: {
        sommeil: `Ciao e benvenuto a questa sessione progettata per guidarti verso un sonno profondo e ristoratore. Prenditi il tempo per metterti il più comodo possibile, nella penombra, pronto a lasciarti andare. Assicurati che nulla ti disturberà per i prossimi istanti. ... ... ... Chiudi dolcemente gli occhi e lascia che il mondo esterno svanisca. Fai un respiro profondo e, espirando, lascia andare il peso della giornata. Ogni respiro ti allontana sempre di più dalla frenesia, avvicinandoti al tuo santuario interiore di pace. ... ... ... Ora, porta tutta la tua attenzione sul tuo respiro. Senti l'aria fresca che entra dalle narici... e il respiro caldo che esce. Non cercare di controllarlo, osserva semplicemente il suo ritmo naturale, come il flusso e riflusso di un'onda calmante. ... ... ... Inspira la calma... e ad ogni espirazione, immagina di soffiare via le tensioni, le preoccupazioni, i pensieri della giornata... Ogni espirazione è un sospiro di sollievo che ti fa sprofondare un po' di più nel materasso, nel rilassamento... Visualizza le nuvole delle tue preoccupazioni che si dissipano all'orizzonte. ... ... ... Ora rilasseremo ogni parte del tuo corpo. Prendi coscienza della tua testa, del tuo viso. Rilassa la fronte, lasciala diventare liscia, senza espressione. Rilassa le sopracciglia, le palpebre che diventano pesanti di sonno. Allenta la mascella, lascia che i denti si separino leggermente. La tua lingua riposa tranquillamente in bocca. ... ... ... Senti il rilassamento scivolare lungo il collo e le spalle. Senti le tue spalle diventare pesanti, molto pesanti, e allontanarsi dalle orecchie. Rilassa le braccia, i gomiti, i polsi, fino alla punta delle dita. Le tue braccia sono ora completamente inerti, pesanti e perfettamente rilassate. ... ... ... Presta attenzione alla tua schiena. Senti ogni vertebra che si posa, si rilassa sul supporto, una dopo l'altra. Libera tutte le tensioni accumulate nella schiena, dall'alto in basso. La tua colonna vertebrale è completamente sostenuta. ... ... ... Il tuo petto e il tuo ventre si alzano e si abbassano al ritmo calmo del tuo respiro. Il tuo cuore batte tranquillamente, serenamente, a un ritmo lento e costante. Senti la pace installarsi nel tuo ventre, rilassando tutti gli organi interni. ... ... ... Rilassa il bacino, i fianchi. Senti le tue gambe diventare pesanti e totalmente passive... dalle ginocchia alle caviglie... e fino alla punta dei piedi. I tuoi piedi sono rilassati, forse leggermente rivolti verso l'esterno, segno di un abbandono totale. ... ... ... Tutto il tuo corpo è ora pesante, rilassato e pronto per il riposo. Sei in uno stato di totale comfort e benessere. Assapora questa piacevole sensazione di pesantezza, di dolce calore che ti avvolge. ... ... ... Ora immagina una scala di fronte a te. Una scala magnifica, dolce e accogliente. Scende a spirale verso un luogo di calma e silenzio assoluti. Il corrimano è liscio e fresco sotto la tua mano. ... ... ... La scenderemo insieme. Ogni gradino che scendi ti porta più in profondità nel rilassamento, più vicino al sonno. Ogni numero ti immerge in uno stato di serenità ancora più grande. ... ... ... Dieci... il rilassamento si approfondisce... Nove... la tua mente diventa più chiara... Otto... sei sempre più calmo... Sette... i rumori esterni svaniscono... Sei... ti senti al sicuro... Cinque... la tua mente si calma... Quattro... quasi galleggi... Tre... sei alle porte del sonno... Due... un ultimo passo prima del riposo totale... Uno... ... ... ... Eccoti in fondo alle scale. Entri in un giardino notturno, immerso nella luce soffusa di una luna benevola. L'aria è fresca e pura, profumata di gelsomino notturno. Il terreno è un muschio soffice e fresco sotto i tuoi piedi nudi. Questo è il tuo santuario di riposo. ... ... ... Al centro di questo giardino c'è il letto più comodo che tu possa immaginare. Avvicinati... nota la consistenza delle lenzuola, la perfezione del cuscino. Sdraiati... e senti la morbidezza delle lenzuola, la sofficità del cuscino che si adatta alla forma della tua testa. ... ... ... Qui, in questo luogo magico, nulla può disturbarti. Sei completamente al sicuro, avvolto nella calma e in un'energia protettiva. Una leggera brezza accarezza la tua pelle. ... ... ... Ogni suono lontano, ogni sensazione, diventa una ninna nanna che ti guida ancora più profondamente nel sonno. Il sonno viene a te, naturalmente, senza sforzo. ... ... ... Lasciati andare ora... Lascia che la tua mente si dissolva nel riposo... e il tuo corpo si rigeneri. Scivola dolcemente... pacificamente... in un sonno profondo, continuo e meravigliosamente ristoratore. Dormi bene.`,
        relaxation: `Ciao. Prenditi il tempo di sistemarti in una posizione comoda, seduto o sdraiato, e chiudi gli occhi. Oggi rilasceremo tutte le tensioni, una per una, per ritrovare uno stato di calma profonda. ... ... ... Inizia facendo un respiro grande, molto grande, riempiendo i polmoni di aria nuova... ed espira lentamente, molto lentamente, come se soffiassi attraverso una cannuccia. Ripeti altre due volte al tuo ritmo. ... ... ... Senti fin da ora con questa espirazione le spalle che si rilassano... la mascella che si allenta... la fronte che si distende... Lascia che un leggero sorriso si disegni sulle tue labbra, invitando il rilassamento a installarsi. ... ... ... Immagina che ogni parte del tuo corpo sia una candela e che il tuo respiro sia una brezza leggera che spegne la fiamma della tensione... Il tuo respiro è dolce, ma sicuro. Porta oscurità e riposo dove c'era una fiamma irrequieta. ... ... ... Prima i piedi... senti la fiamma dell'irrequietezza tremolare, poi spegnersi. I tuoi piedi diventano pesanti e rilassati. Poi i polpacci, le ginocchia, le cosce... la brezza del tuo respiro li attraversa, spegnendo ogni tensione. ... ... ... Le tue gambe sono ora completamente pesanti e rilassate. Sali verso il bacino... la pancia... la schiena... tutto si rilascia... la fiamma della tensione nella parte bassa della schiena si spegne, lasciando un piacevole calore. ... ... ... Il petto si apre, il cuore batte con calma... la candela dell'ansia vicino al tuo cuore viene dolcemente soffiata via. Le tue braccia, le tue mani, fino alla punta delle dita, sono completamente rilassate... il calore scorre fino ai palmi. ... ... ... Infine, il collo, la nuca e la testa. Il respiro spegne le ultime fiamme di pensieri incessanti. La tua mente diventa chiara e calma. Tutto il tuo corpo è ora in un'oscurità pacifica e riposante. ... ... ... Ora visualizza una spiaggia di sabbia calda al tramonto. Sei solo, o con presenze benevole. Il cielo è dipinto di colori arancione, rosa e viola. È uno spettacolo magnifico, solo per te. ... ... ... Il suono delle onde è un ritmo lento e regolare che ti culla. È il metronomo della tua tranquillità. Ogni onda che si ritira porta via con sé un pezzetto delle tue preoccupazioni. Guardale allontanarsi in lontananza. ... ... ... Il dolce calore della sabbia rilassa ogni muscolo del tuo corpo... Senti la tua schiena, le tue gambe, sprofondare leggermente in questa sabbia calda e accogliente. Sei perfettamente sostenuto, in perfetta sicurezza. ... ... ... Una leggera brezza marina accarezza il tuo viso. Ha un odore fresco e salato. Stai perfettamente bene... in pace... completamente immerso in questo paesaggio di serenità. ... ... ... Prenditi un momento per non fare nulla, solo essere. Essere su questa spiaggia, in questo preciso momento. Assapora questo momento di calma totale... di unità con la natura. ... ... ... Ancora questa sensazione di profondo rilassamento dentro di te... Fai una fotografia mentale di questo luogo. Sappi che puoi tornarci ogni volta che ne avrai bisogno... semplicemente chiudendo gli occhi e respirando.`,
        antiStress: `Benvenuto a questa sessione per alleviare lo stress e ritrovare la tua calma interiore. Siediti o sdraiati comodamente. Chiudi gli occhi e lascia che il tuo corpo si assesti. ... ... ... Prendi coscienza dei punti di contatto del tuo corpo con il supporto... Senti il pavimento, la sedia, il letto che ti sostiene... Senti il peso del tuo corpo che si arrende alla gravità. Sei al sicuro, perfettamente sostenuto. ... ... ... Ora porta la tua attenzione sul respiro, senza cercare di modificarlo. Senza forzarlo, osservalo semplicemente. Osserva il percorso dell'aria, dalle narici ai polmoni, e poi il percorso inverso. ... ... ... Immagina che ad ogni inspirazione, inspiri un'aria pura e calma, di un magnifico colore blu, calmante e fresca... Quest'aria blu è l'energia della serenità. Riempie i tuoi polmoni, poi il tuo sangue, e si diffonde in ogni cellula del tuo corpo. ... ... ... E ad ogni espirazione, soffi una nuvola grigia e opaca. Questa nuvola contiene tutte le tue tensioni, le tue preoccupazioni, il tuo stress, la tua stanchezza... Guardala allontanarsi e dissolversi nell'aria, senza lasciare traccia. ... ... ... Inspira la calma blu... Espira lo stress grigio... Continua questo ciclo diverse volte. Senti come, ad ogni ciclo, il blu occupa più spazio all'interno, e il grigio svanisce all'esterno. Il tuo spazio interiore diventa più pulito, più puro. ... ... ... Ora visualizza una bolla protettiva tutto intorno a te. Una sfera di luce bianca o dorata. Questo è il tuo spazio personale di sicurezza, il tuo santuario di pace. ... ... ... Questa bolla è semi-permeabile. Lascia entrare tutto ciò che è positivo – amore, gioia, pace – ma filtra e respinge tutto ciò che è negativo. All'interno di questa bolla, nulla può raggiungerti. ... ... ... I rumori esterni, i pensieri irrequieti degli altri, le esigenze, tutto rimane fuori. I suoni diventano ovattati, lontani, senza importanza. Qui, sei sovrano, sei calmo. ... ... ... Prendi coscienza dello spazio che occupi all'interno di questa bolla. È uno spazio di forza tranquilla e fiducia. Ripeti interiormente: 'Sono calmo... sono sereno(a)... gestisco la situazione con fiducia.' ... ... ... Senti questa forza tranquilla crescere dentro di te, dal centro del tuo petto. Lo stress non ha più presa, perché non può penetrare il tuo spazio. Sei centrato(a), radicato(a) e pronto(a) ad affrontare le sfide con una nuova prospettiva, calma e distaccata.`,
        meditation: `Ciao e benvenuto. Questa sessione è un invito a riconnetterti con il momento presente. Trova una postura dignitosa e comoda, con la schiena dritta ma non rigida. Chiudi gli occhi. ... ... ... Porta semplicemente la tua attenzione alle sensazioni del tuo respiro... l'aria che entra dalle narici... forse un po' fresca... e che esce, forse un po' più calda. Senti il movimento del tuo addome o del tuo petto che si alza e si abbassa. ... ... ... Non cercare di cambiare nulla... solo osservando. Il tuo respiro è la tua ancora nel momento presente. Ogni volta che ti senti perso, torna ad esso. È sempre lì. ... ... ... La tua mente probabilmente vagherà. Verso un pensiero, un ricordo, un progetto. È la natura stessa della mente. È normale, e non è un errore. ... ... ... Ogni volta che noti che i tuoi pensieri sono andati altrove, congratulati con te stesso per averlo notato. È un momento di piena consapevolezza. Poi, dolcemente e senza giudizio, riporta la tua attenzione al tuo respiro. Questo è l'esercizio stesso della meditazione. Migliaia di volte se necessario. ... ... ... Non c'è nulla da raggiungere, nulla da ottenere. Non c'è una meditazione 'buona' o 'cattiva'. Solo essere qui, presente a ciò che è. Con dolcezza e benevolenza verso te stesso. ... ... ... Ora espandi il tuo campo di consapevolezza. Sii consapevole dei suoni intorno a te... i più vicini, i più lontani. Accoglili senza nominarli, senza giudicarli. Fanno parte del momento presente. ... ... ... Prendi coscienza delle sensazioni nel tuo corpo... la temperatura dell'aria sulla tua pelle, i punti di contatto, un'eventuale tensione o un formicolio. Osserva queste sensazioni come osservi il tuo respiro. ... ... ... Ora osserva i pensieri che passano come nuvole nel cielo della tua mente. Alcune sono grandi e scure, altre leggere e bianche. Lasciale passare senza aggrappartici. ... ... ... Tu non sei i tuoi pensieri, sei colui che li osserva. Tu sei il cielo, non le nuvole. Rimani in questo spazio di pura coscienza, un osservatore silenzioso e pacifico... ... ... ... Ogni momento è una nuova opportunità per tornare qui e ora. Ogni respiro è un nuovo inizio. Goditi questo silenzio interiore, questa chiarezza... È la tua vera natura, sempre accessibile.`,
        arretTabac: `Ciao. Oggi rafforzi la tua decisione di liberarti dal tabacco. Mettiti comodo e chiudi gli occhi. Sii orgoglioso di prendere questo momento per te, per la tua salute. ... ... ... Fai tre respiri profondi... e ad ogni espirazione, rilascia la tensione e il desiderio di fumare... Senti il tuo corpo rilassarsi e la tua mente aprirsi alla libertà che hai scelto. ... ... ... Hai preso una decisione per la tua salute, per la tua libertà, per il tuo futuro. È un atto di grande rispetto verso te stesso. Onora questa scelta, senti la sua giustezza nel profondo di te. ... ... ... Ora visualizza due sentieri di fronte a te. Uno è grigio, fumoso, nebbioso. È il sentiero della dipendenza. Odora di stantio, di tabacco freddo. L'aria è pesante, difficile da respirare. ... ... ... L'altro è luminoso, chiaro, pieno di aria fresca e colori vivaci. È il sentiero della libertà. L'erba è verde, il cielo è blu. Senti la differenza. Fai un passo consapevole e deliberato su questo sentiero luminoso. ... ... ... Senti l'odore dell'aria fresca, la vitalità nei tuoi polmoni, l'energia che scorre nel tuo corpo su questo sentiero luminoso. Ogni passo ti rende più forte, più sano, più vivo. La tua respirazione è ampia e facile. ... ... ... Immaginati tra qualche settimana, qualche mese... senza tabacco. Stai camminando su questo sentiero. Senti l'orgoglio. Senti il tuo respiro più pieno, il tuo olfatto più acuto, i sapori più presenti. Vedi la tua pelle più luminosa, il tuo sorriso più genuino. ... ... ... Vediti usare i soldi risparmiati per qualcosa che ti fa veramente piacere, un progetto, un viaggio. Vediti muoverti, correre, salire le scale senza sforzo, pieno di una nuova energia. ... ... ... Ogni volta che potrebbe apparire un desiderio, ricorda che è solo una vecchia abitudine, un'ombra del passato. Hai un'ancora. Metti una mano sulla pancia e respira profondamente tre volte. ... ... ... Ad ogni inspirazione, ricorda questa immagine del sentiero luminoso. Ad ogni espirazione, soffia sull'ombra del desiderio e guardala dissiparsi. È un semplice eco, che perde la sua forza ogni giorno. ... ... ... Sei più forte di questa vecchia abitudine. Hai scelto la vita, la salute. Ogni giorno senza tabacco è una vittoria che rafforza la tua libertà. Stai respirando la vita a pieni polmoni. Sei libero.`,
        amincissement: `Ciao. Benvenuto a questa sessione dedicata all'armonizzazione del tuo corpo e della tua mente. Mettiti comodo... chiudi gli occhi... e respira profondamente, lasciando che la pancia si gonfi. ... ... ... Ad ogni espirazione, lascia andare i giudizi sul tuo corpo, le frustrazioni, le diete passate... Soffia via le parole dure, le immagini negative. Oggi inizi un nuovo capitolo. ... ... ... Accogliti con benevolenza, qui e ora. Metti una mano sul cuore e una sulla pancia, e invia gratitudine al tuo corpo per tutto ciò che fa per te ogni giorno. È il tuo veicolo per la vita, il tuo alleato. ... ... ... Prendi coscienza del tuo corpo, della sua forma, della sua presenza... senza giudizio, con semplice curiosità. Senti il contatto dei tuoi vestiti, la temperatura della tua pelle. Sii semplicemente presente al tuo involucro corporeo. ... ... ... Ora immagina una morbida luce dorata, come il sole del mattino, che entra dalla sommità della tua testa. È una luce di guarigione, accettazione ed energia sana. È calda e confortante. ... ... ... Scende lentamente, riempiendo ogni cellula del tuo corpo con una sensazione di benessere. Attraversa il tuo cervello, calmando i pensieri critici. Scorre nella tua gola, nel tuo petto, nel tuo cuore. ... ... ... Continua il suo percorso nel tuo stomaco, nel tuo sistema digestivo, portando pace ed equilibrio. Avvolge ogni organo in un calore benefico. Dissolve blocchi e tensioni. ... ... ... Questa luce ti aiuta a riconnetterti con le tue vere sensazioni di fame e sazietà. Immagina che risvegli l'intelligenza innata del tuo corpo. Ti guida verso scelte alimentari sane che nutrono e rispettano il tuo corpo. ... ... ... Visualizza la persona che vuoi diventare: piena di energia, a tuo agio nel tuo corpo, in pace con il cibo. Non concentrarti su un peso, ma su una sensazione. Una sensazione di leggerezza, vitalità, gioia. ... ... ... Vediti muoverti con facilità, fare attività che ami, che si tratti di camminare nella natura, ballare, giocare. Il tuo corpo è uno strumento di gioia, non una fonte di preoccupazione. ... ... ... Il tuo corpo sa cosa è buono per lui. Ascoltalo. Ti parla attraverso sussurri di fame reale e sospiri di sazietà. Impara ad ascoltare questi segnali sottili. ... ... ... Ogni giorno, fai scelte consapevoli e benevole per il tuo benessere. Mangi per nutrirti, per darti energia, non per colmare un vuoto. Sei in armonia con te stesso.`,
        douleur: `Ciao. Questa sessione è uno spazio per aiutarti a gestire la sensazione di dolore. Mettiti comodo quanto il tuo corpo te lo permette oggi. Chiudi gli occhi e lascia che il tuo respiro trovi un ritmo naturale e rilassante. ... ... ... Per cominciare, non ci concentreremo sul dolore, ma sul comfort. Scansiona mentalmente il tuo corpo e trova una zona che, in questo momento, è neutra o addirittura piacevole. Forse il calore delle tue mani... la sensazione dei tuoi capelli sulla fronte... o il contatto dei tuoi piedi con il pavimento, o la morbidezza dei tuoi vestiti. ... ... ... Scegli una di queste zone e immergi la tua coscienza al suo interno. Esplora questa sensazione di non-dolore, di comfort. È calda, fresca, morbida, neutra? Immergiti in questa sensazione. Questo è il tuo punto di ancoraggio. ... ... ... Ad ogni inspirazione, immagina che questa sensazione di benessere cresca, si amplifichi. Immaginala come una luce soffusa che si espande un po' di più ad ogni respiro, creando un'oasi di pace dentro di te. ... ... ... Ora, con questa risorsa di comfort ben presente e solida, puoi permettere all'area del dolore di entrare nel tuo campo di consapevolezza. Senza paura, senza giudizio. Osserva la sensazione da lontano, come uno scienziato osserva un fenomeno meteorologico attraverso una finestra. ... ... ... Dagli caratteristiche neutre. Una forma, un colore, una consistenza. È calda, fredda? Pungente, sorda? Densa, diffusa? Vibrante, costante? Semplicemente osserva, senza giudicarla 'cattiva', senza attaccarci una storia. ... ... ... Stai dissociando la sensazione pura dalla reazione emotiva. Tu non sei il dolore. Sei la coscienza che lo osserva. Questo semplice atto di distanziamento può già modificare la tua percezione. ... ... ... Ora, usa il tuo respiro come strumento di trasformazione. Immagina che ad ogni inspirazione, attingi dalla tua zona di comfort, questa luce soffusa, e la invii come un soffio calmante verso la zona dolorosa. ... ... ... E ad ogni espirazione, immagina che la sensazione dolorosa perda un po' della sua intensità, della sua solidità. Visualizza il suo colore che diventa più pallido, più trasparente. I suoi bordi, che forse erano netti e duri, diventano sfocati e morbidi. ... ... ... Continua questo processo... Inspira comfort verso il dolore... Espira per dissolverlo, diffonderlo, ammorbidirlo. Puoi anche immaginare che la sensazione si trasformi. Un blocco di ghiaccio che si scioglie sotto un sole gentile... un nodo stretto che si allenta fibra per fibra... un colore vivo che sbiadisce. ... ... ... Riacquisti il controllo non attraverso la lotta, ma attraverso la dolcezza, l'attenzione e il respiro. Sei l'alchimista che trasforma una sensazione grezza in qualcosa di più gestibile. Continua a respirare. Sei al sicuro.`,
        alcool: `Ciao. Prenditi questo momento per te stesso, per riconoscere il cammino che stai percorrendo e la forza della tua decisione. Mettiti in una posizione comoda, chiudi gli occhi e lasciati guidare. ... ... ... Fai un respiro grande e profondo, e mentre espiri, lascia andare le tensioni della giornata. Una seconda volta, inspira l'orgoglio della tua scelta... ed espira il peso del passato, delle abitudini. Un'ultima volta, inspira la calma... ed espira ogni agitazione interiore. ... ... ... Prendi coscienza del tuo corpo, qui e ora. Senti la chiarezza che torna nella tua mente, giorno dopo giorno. Senti la vitalità che si insedia nelle tue cellule. Il tuo corpo è un sistema intelligente che sa come ripararsi. Si sta rigenerando, ti ringrazia per il rispetto che gli stai dando. ... ... ... Visualizza una cascata di luce bianca e pura che scorre sulla sommità della tua testa. È una luce di chiarezza, purezza e rinnovamento. Scende dentro di te, purificando tutto sul suo cammino. ... ... ... Pulisce i tuoi pensieri, portando lucidità. Scorre nella tua gola, nel tuo petto, calmando il tuo cuore. Purifica il tuo fegato, il tuo sangue, portando via tutti i ricordi tossici. Ti lascia pulito, rinnovato, pieno di energia sana e vibrante. ... ... ... La voglia, o il bisogno, è un pensiero, una vecchia abitudine neurologica. Non sei tu. Non è un ordine. Hai il potere di non rispondergli. Immagina di essere seduto in riva a un fiume ampio e calmo. ... ... ... Le voglie sono come foglie o rami che galleggiano sull'acqua. Appaiono a monte, passano davanti a te e continuano il loro cammino a valle fino a scomparire all'orizzonte. Sono solo di passaggio. ... ... ... Tu sei l'osservatore sulla riva, calmo e stabile. Non hai bisogno di saltare in acqua per afferrare ogni foglia. Puoi semplicemente guardarla passare, con curiosità distaccata. 'Oh, un pensiero, una voglia.' E la lasci continuare per la sua strada. ... ... ... Quando sorge una voglia, respira. Dì a te stesso: 'Vedo questo pensiero. È solo un'onda del passato.' E come un'onda, salirà, raggiungerà un picco e poi, inevitabilmente, si ritirerà e si allontanerà. Tu rimani sulla riva, al sicuro. ... ... ... Ora, proiettati nel futuro prossimo. Immaginati in una situazione sociale, circondato da amici. Stai tenendo un bicchiere di acqua fresca, succo o la tua bevanda analcolica preferita. Sei perfettamente a tuo agio. ... ... ... Sei presente, la tua mente è acuta, partecipi pienamente alla conversazione. Ridi, condividi, ti connetti autenticamente. Ti senti bene. Hai il controllo. Non hai bisogno di nient'altro per goderti questo momento. ... ... ... Senti l'orgoglio, la semplicità, la libertà di questa scelta. Quella persona sei tu. Ancora questa immagine e questa sensazione dentro di te. Questa è la tua nuova realtà, quella che stai costruendo ogni giorno, con forza e dignità.`,
        confiance: `Ciao e benvenuto in questo spazio per rafforzare la tua autostima. Mettiti comodo, chiudi gli occhi e fai un respiro profondo. Mentre espiri, lascia andare dubbi e paure, critiche interiori. ... ... ... Prendi coscienza della tua postura, qui e ora. Raddrizzati leggermente, apri le spalle, come per fare spazio alla tua fiducia. Senti il radicamento dei tuoi piedi sul pavimento, o il sostegno del tuo corpo sulla sedia. Sei stabile, solido e presente. ... ... ... Visualizza al centro del tuo petto, all'altezza del cuore, una piccola sfera di luce calda e dorata. Questo è il nucleo della tua fiducia, la tua forza interiore. Forse è piccola per ora, ma è lì. ... ... ... Ad ogni inspirazione, immagina di nutrire questa sfera. Cresce un po', la sua luce diventa più intensa, più radiosa. Ad ogni espirazione, si stabilizza, si rafforza. ... ... ... Continua a respirare e osserva questa luce che si espande. Riempie il tuo torso, scende nella tua pancia, portando una sensazione di calma e forza. Sale lungo la tua colonna vertebrale, raddrizzandoti senza sforzo. ... ... ... Scorre nelle tue spalle, nelle tue braccia, fino alla punta delle dita. Sale nel tuo collo, nella tua testa, illuminando i tuoi pensieri. Tutto il tuo essere è pieno di questa luce di fiducia. La irradi. ... ... ... Ora pensa a un momento, per quanto breve, per quanto lontano, in cui ti sei sentito orgoglioso di te stesso. Un momento in cui sei stato competente, in cui sei riuscito in qualcosa, in cui ti sei sentito in pieno controllo delle tue capacità. ... ... ... Rivivi quella scena. Non solo guardarla, immergiti in essa. Cosa vedevi? Cosa sentivi? Ancora più importante, cosa sentivi nel tuo corpo? Ritrova quella sensazione di orgoglio, di forza, di capacità. Ancora quella sensazione. ... ... ... Questa forza, questa capacità, è dentro di te. È sempre stata lì. È una risorsa inesauribile a cui puoi connetterti in qualsiasi momento. La luce dorata nel tuo petto è la manifestazione di questa risorsa. ... ... ... Ripeti interiormente: 'Sono capace. Credo in me stesso. Merito successo e rispetto.' Senti la risonanza di queste parole dentro di te, amplificata dalla luce dorata. ... ... ... Ogni giorno, nutri questa luce interiore. Cammini nel mondo con sicurezza e serenità. Sai di avere le risorse dentro di te per affrontare ciò che si presenta. Sei fiducioso.`,
        prosperite: `Ciao e benvenuto a questa sessione dedicata all'apertura alla prosperità e all'abbondanza. Mettiti comodo, pronto ad accogliere nuove energie. Chiudi gli occhi. ... ... ... Fai un respiro profondo e, espirando, rilascia tutte le idee di mancanza, tutte le paure legate al futuro. Ogni respiro è un invito a sentirti più ricco, più completo. ... ... ... Porta la tua attenzione al tuo corpo e, con ogni espirazione, rilascia le tensioni. Senti il tuo corpo diventare leggero, ricettivo. Rilassa la fronte, la mascella, le spalle. Lascia andare tutto ciò che ti appesantisce. ... ... ... Immagina di trovarti sulla riva di un fiume magnifico. Questo fiume non è fatto d'acqua, ma di pura luce dorata e scintillante. È il flusso infinito di opportunità, gioia e ricchezza in tutte le sue forme. ... ... ... Osserva questa corrente. È inesauribile. Scorre con forza e serenità. Ora, fai un passo ed entra in questo fiume di luce. Senti il calore dorato che ti avvolge, che circola attraverso di te. ... ... ... Non sei separato da questa corrente; ne fai parte. Senti questa energia di abbondanza purificare ogni cellula del tuo corpo, portando via con sé dubbi, credenze limitanti e sentimenti di non meritare. Ripeti dentro di te: 'Sono aperto e ricettivo a tutta l'abbondanza che la vita ha da offrirmi'. ... ... ... Ora visualizza uno dei tuoi obiettivi. Immagina che sia già stato raggiunto. Non limitarti a guardare l'immagine, ma senti le emozioni. La gioia, l'orgoglio, la sicurezza, la gratitudine. Come ti senti con questo obiettivo raggiunto? Ancora profondamente questa sensazione di successo. ... ... ... Questo fiume d'oro è sempre dentro di te. Puoi connetterti ad esso in qualsiasi momento. Per ancorare questa sensazione, premi delicatamente il pollice e l'indice della mano destra. Questo è il tuo interruttore personale per riconnetterti a questa energia di abbondanza. ... ... ... Prenditi ancora qualche istante per fluttuare in questa luce dorata. Sappi di essere un essere di valore, che merita il meglio. Attiri a te opportunità e prosperità perché sei in armonia con la loro energia. ... ... ... Dolcemente, tornerai ora al qui e ora, conservando questa sensazione di ricchezza interiore. Inizia a muovere le dita delle mani e dei piedi. Stiracchiati se lo desideri. E quando sarai pronto, apri gli occhi, con un nuovo sguardo sul mondo, uno sguardo di prosperità.`
    },
    nl: {
        sommeil: `Hallo en welkom bij deze sessie, ontworpen om je te begeleiden naar een diepe en herstellende slaap. Neem de tijd om je zo comfortabel mogelijk te installeren, in het schemerdonker, klaar om los te laten. Zorg ervoor dat niets je de komende momenten zal storen. ... ... ... Sluit zachtjes je ogen en laat de buitenwereld vervagen. Haal diep adem en laat bij het uitademen het gewicht van de dag los. Elke ademhaling brengt je verder weg van de drukte en dichter bij je innerlijke heiligdom van vrede. ... ... ... Breng nu al je aandacht naar je ademhaling. Voel de koele lucht die je neusgaten binnenkomt... en de warme adem die er weer uitgaat. Probeer het niet te beheersen, observeer gewoon het natuurlijke ritme, als de eb en vloed van een kalmerende golf. ... ... ... Adem kalmte in... en stel je bij elke uitademing voor dat je de spanningen, de zorgen, de gedachten van de dag wegblaast... Elke uitademing is een zucht van verlichting die je een beetje dieper in de matras, in ontspanning brengt... Visualiseer de wolken van je zorgen die aan de horizon verdwijnen. ... ... ... We gaan nu elk deel van je lichaam ontspannen. Word je bewust van je hoofd, je gezicht. Ontspan je voorhoofd, laat het glad worden, zonder uitdrukking. Ontspan je wenkbrauwen, je oogleden die zwaar worden van de slaap. Ontspan je kaken, laat je tanden iets van elkaar komen. Je tong rust rustig in je mond. ... ... ... Voel de ontspanning langs je nek en schouders glijden. Voel hoe je schouders zwaar worden, heel zwaar, en van je oren wegzakken. Ontspan je armen, je ellebogen, je polsen, tot aan je vingertoppen. Je armen zijn nu volledig inert, zwaar en perfect ontspannen. ... ... ... Richt je aandacht op je rug. Voel hoe elke wervel zich neerlegt, zich ontspant op de ondergrond, de een na de ander. Laat alle opgebouwde spanning in je rug los, van boven tot onder. Je wervelkolom wordt volledig ondersteund. ... ... ... Je borst en je buik rijzen en dalen op het kalme ritme van je ademhaling. Je hart klopt rustig, sereen, in een langzaam en gestaag tempo. Voel de vrede neerdalen in je buik, waardoor alle interne organen ontspannen. ... ... ... Ontspan je bekken, je heupen. Voel hoe je benen zwaar en totaal passief worden... van de knieën tot de enkels... en tot aan de toppen van je tenen. Je voeten zijn ontspannen, misschien iets naar buiten gedraaid, een teken van totale overgave. ... ... ... Je hele lichaam is nu zwaar, ontspannen en klaar voor rust. Je bent in een staat van totaal comfort en welzijn. Geniet van dit aangename gevoel van zwaarte, van zachte warmte die je omhult. ... ... ... Stel je nu een trap voor je voor. Een prachtige, zachte en uitnodigende trap. Hij daalt in een spiraal af naar een plaats van absolute rust en stilte. De leuning is glad en koel onder je hand. ... ... ... We gaan hem samen afdalen. Elke trede die je afdaalt, brengt je dieper in ontspanning, dichter bij de slaap. Elk getal dompelt je onder in een nog grotere staat van sereniteit. ... ... ... Tien... de ontspanning verdiept... Negen... je geest wordt helderder... Acht... je wordt steeds kalmer... Zeven... buitengeluiden vervagen... Zes... je voelt je veilig... Vijf... je geest wordt rustig... Vier... je zweeft bijna... Drie... je staat aan de poorten van de slaap... Twee... nog een laatste stap voor totale rust... Eén... ... ... ... Je bent aan de voet van de trap. Je betreedt een nachttuin, badend in het zachte licht van een welwillende maan. De lucht is fris en zuiver, geurend naar nachtbloeiende jasmijn. De grond is een zacht, koel mos onder je blote voeten. Dit is jouw toevluchtsoord van rust. ... ... ... In het midden van deze tuin staat het meest comfortabele bed dat je je kunt voorstellen. Kom dichterbij... merk de textuur van de lakens op, de perfectie van het kussen. Ga liggen... en voel de zachtheid van de lakens, de luchtigheid van het kussen dat zich naar de vorm van je hoofd vormt. ... ... ... Hier, op deze magische plek, kan niets je storen. Je bent volkomen veilig, omhuld door kalmte en een beschermende energie. Een lichte bries streelt je huid. ... ... ... Elk geluid in de verte, elke sensatie, wordt een slaapliedje dat je nog dieper in de slaap leidt. De slaap komt naar je toe, natuurlijk, moeiteloos. ... ... ... Laat je nu gaan... Laat je geest oplossen in rust... en je lichaam regenereren. Glijd zachtjes... vredig... in een diepe, ononderbroken en heerlijk herstellende slaap. Slaap lekker.`,
        relaxation: `Hallo. Neem de tijd om in een comfortabele houding te gaan zitten of liggen, en sluit je ogen. Vandaag gaan we alle spanningen loslaten, één voor één, om een staat van diepe rust te vinden. ... ... ... Begin met een diepe, heel diepe ademhaling, vul je longen met nieuwe lucht... en adem langzaam, heel langzaam uit, alsof je door een rietje blaast. Herhaal dit nog twee keer op je eigen tempo. ... ... ... Voel nu al bij deze uitademing hoe je schouders ontspannen... je kaak losser wordt... je voorhoofd gladder wordt... Laat een lichte glimlach op je lippen verschijnen en nodig de ontspanning uit om zich te nestelen. ... ... ... Stel je voor dat elk deel van je lichaam een kaars is, en je adem een zachte bries die de vlam van de spanning dooft... Je adem is zacht, maar zeker. Het brengt duisternis en rust waar een rusteloze vlam was. ... ... ... Eerst je voeten... voel de vlam van rusteloosheid flikkeren en dan doven. Je voeten worden zwaar en ontspannen. Dan je kuiten, je knieën, je dijen... de bries van je adem stroomt erdoorheen en dooft elke spanning. ... ... ... Je benen zijn nu volledig zwaar en ontspannen. Ga omhoog naar je bekken... je buik... je rug... alles ontspant... de vlam van spanning in je onderrug dooft en maakt plaats voor een aangename warmte. ... ... ... Je borst opent zich, je hart klopt rustig... de kaars van angst bij je hart wordt zachtjes uitgeblazen. Je armen, je handen, tot aan je vingertoppen, zijn volledig ontspannen... warmte stroomt naar je handpalmen. ... ... ... Tot slot, je nek, je nek en je hoofd. De adem dooft de laatste vlammen van onophoudelijke gedachten. Je geest wordt helder en kalm. Je hele lichaam is nu in een vredige en rustgevende duisternis. ... ... ... Visualiseer nu een warm zandstrand bij zonsondergang. Je bent alleen, of met welwillende aanwezigheden. De hemel is geschilderd in oranje, roze en paarse kleuren. Het is een prachtig schouwspel, speciaal voor jou. ... ... ... Het geluid van de golven is een langzaam, regelmatig ritme dat je wiegt. Het is de metronoom van je rust. Elke golf die zich terugtrekt, neemt een stukje van je zorgen mee. Kijk ze in de verte verdwijnen. ... ... ... De zachte warmte van het zand ontspant elke spier in je lichaam... Voel je rug, je benen, lichtjes wegzakken in dit warme en gastvrije zand. Je wordt perfect ondersteund, in perfecte veiligheid. ... ... ... Een lichte zeebries streelt je gezicht. Het heeft een frisse, zoute geur. Je voelt je perfect... in vrede... volledig ondergedompeld in dit landschap van sereniteit. ... ... ... Neem een moment om niets te doen, gewoon te zijn. Op dit strand zijn, op dit precieze moment. Geniet van dit moment van totale rust... van eenheid met de natuur. ... ... ... Veranker dit gevoel van diepe ontspanning in jezelf... Maak een mentale foto van deze plek. Weet dat je er altijd naar terug kunt keren wanneer je het nodig hebt... gewoon door je ogen te sluiten en te ademen.`,
        antiStress: `Welkom bij deze sessie om stress te kalmeren en je innerlijke rust te vinden. Ga comfortabel zitten of liggen. Sluit je ogen en laat je lichaam tot rust komen. ... ... ... Word je bewust van de contactpunten van je lichaam met de ondergrond... Voel de vloer, de stoel, het bed dat je ondersteunt... Voel het gewicht van je lichaam dat zich overgeeft aan de zwaartekracht. Je bent veilig, perfect ondersteund. ... ... ... Breng nu je aandacht naar je ademhaling, zonder te proberen die te veranderen. Zonder het te forceren, observeer het gewoon. Observeer het pad van de lucht, van je neusgaten naar je longen, en dan de omgekeerde weg. ... ... ... Stel je voor dat je bij elke inademing zuivere, kalme lucht inademt, van een prachtige blauwe kleur, rustgevend en fris... Deze blauwe lucht is de energie van sereniteit. Het vult je longen, dan je bloed, en verspreidt zich naar elke cel van je lichaam. ... ... ... En bij elke uitademing blaas je een grijze, ondoorzichtige wolk uit. Deze wolk bevat al je spanningen, je zorgen, je stress, je vermoeidheid... Zie hoe het weggaat en oplost in de lucht, zonder een spoor achter te laten. ... ... ... Adem de blauwe rust in... Adem de grijze stress uit... Ga meerdere keren door met deze cyclus. Voel hoe bij elke cyclus het blauw meer ruimte inneemt van binnen, en het grijs van buiten vervaagt. Je innerlijke ruimte wordt schoner, zuiverder. ... ... ... Visualiseer nu een beschermende bel om je heen. Een bol van wit of goudkleurig licht. Dit is je persoonlijke ruimte van veiligheid, je heiligdom van vrede. ... ... ... Deze bel is semi-permeabel. Het laat alles wat positief is binnen – liefde, vreugde, vrede – maar het filtert en stoot alles af wat negatief is. Binnen deze bel kan niets je bereiken. ... ... ... Externe geluiden, de rusteloze gedachten van anderen, eisen, alles blijft buiten. De geluiden worden gedempt, ver, onbelangrijk. Hier ben jij de baas, je bent kalm. ... ... ... Word je bewust van de ruimte die je inneemt binnen deze bel. Het is een ruimte van stille kracht en vertrouwen. Herhaal innerlijk: 'Ik ben kalm... ik ben sereen... ik ga met vertrouwen met de situatie om.' ... ... ... Voel deze stille kracht in je groeien, vanuit het midden van je borst. Stress heeft geen vat meer op je, want het kan je ruimte niet binnendringen. Je bent gecentreerd, geaard en klaar om uitdagingen met een nieuw, kalm en afstandelijk perspectief aan te gaan.`,
        meditation: `Hallo en welkom. Deze sessie is een uitnodiging om je opnieuw te verbinden met het huidige moment. Zoek een waardige en comfortabele houding, met een rechte maar niet stijve rug. Sluit je ogen. ... ... ... Breng je aandacht gewoon naar de sensaties van je ademhaling... de lucht die door je neusgaten naar binnen stroomt... misschien een beetje koel... en die weer naar buiten gaat, misschien een beetje warmer. Voel de beweging van je buik of je borst die op en neer gaat. ... ... ... Probeer niets te veranderen... observeer gewoon. Je adem is je anker in het huidige moment. Telkens als je je verloren voelt, keer je ernaar terug. Het is er altijd. ... ... ... Je geest zal waarschijnlijk afdwalen. Naar een gedachte, een herinnering, een plan. Dat is de aard van de geest. Dat is normaal, en het is geen fout. ... ... ... Telkens als je merkt dat je gedachten ergens anders zijn, feliciteer jezelf dan dat je het opgemerkt hebt. Het is een moment van mindfulness. Breng dan zachtjes en zonder oordeel je aandacht terug naar je adem. Dit is de essentie van meditatie. Duizenden keren indien nodig. ... ... ... Er is niets te bereiken, niets te behalen. Er is geen 'goede' of 'slechte' meditatie. Gewoon hier zijn, aanwezig in wat is. Met zachtheid en vriendelijkheid voor jezelf. ... ... ... Verruim nu je bewustzijnsveld. Wees je bewust van de geluiden om je heen... de dichtstbijzijnde, de verste. Verwelkom ze zonder ze te benoemen, zonder ze te beoordelen. Ze maken deel uit van het huidige moment. ... ... ... Word je bewust van de sensaties in je lichaam... de temperatuur van de lucht op je huid, de contactpunten, een eventuele spanning of tinteling. Observeer deze sensaties zoals je je adem observeert. ... ... ... Observeer nu de gedachten die voorbijgaan als wolken in de lucht van je geest. Sommige zijn groot en donker, andere licht en wit. Laat ze voorbijgaan zonder je eraan vast te klampen. ... ... ... Je bent niet je gedachten, je bent degene die ze observeert. Je bent de hemel, niet de wolken. Blijf in deze ruimte van puur bewustzijn, een stille en vredige waarnemer... ... ... ... Elk moment is een nieuwe kans om hier en nu terug te keren. Elke ademhaling is een nieuw begin. Geniet van deze innerlijke stilte, deze helderheid... Het is je ware aard, altijd toegankelijk.`,
        arretTabac: `Hallo. Vandaag versterk je je beslissing om je te bevrijden van tabak. Maak het je gemakkelijk en sluit je ogen. Wees trots dat je dit moment voor jezelf, voor je gezondheid neemt. ... ... ... Haal drie keer diep adem... en bij elke uitademing laat je de spanning en de drang om te roken los... Voel je lichaam ontspannen en je geest zich openen voor de vrijheid die je gekozen hebt. ... ... ... Je hebt een beslissing genomen voor je gezondheid, voor je vrijheid, voor je toekomst. Het is een daad van groot respect voor jezelf. Eer deze keuze, voel de juistheid ervan diep in je. ... ... ... Visualiseer nu twee paden voor je. Het ene is grijs, rokerig, mistig. Dat is het pad van verslaving. Het ruikt muf, naar koude tabak. De lucht is zwaar, moeilijk te ademen. ... ... ... Het andere is licht, helder, vol frisse lucht en levendige kleuren. Dat is het pad van vrijheid. Het gras is groen, de lucht is blauw. Voel het verschil. Zet een bewuste en doelbewuste stap op dit lichte pad. ... ... ... Voel de geur van frisse lucht, de vitaliteit in je longen, de energie die door je lichaam stroomt op dit lichte pad. Elke stap maakt je sterker, gezonder, levendiger. Je ademhaling is ruim en gemakkelijk. ... ... ... Stel je voor dat je over een paar weken, een paar maanden... zonder tabak bent. Je loopt op dit pad. Voel de trots. Voel je adem ruimer, je reukvermogen scherper, de smaken meer aanwezig. Zie je huid stralender, je glimlach oprechter. ... ... ... Zie jezelf het bespaarde geld gebruiken voor iets dat je echt plezier doet, een project, een reis. Zie jezelf bewegen, rennen, traplopen zonder moeite, vol nieuwe energie. ... ... ... Telkens als er een verlangen opkomt, onthoud dan dat het slechts een oude gewoonte is, een schaduw uit het verleden. Je hebt een anker. Leg een hand op je buik en haal drie keer diep adem. ... ... ... Bij elke inademing, herinner je dit beeld van het lichte pad. Bij elke uitademing, blaas je op de schaduw van het verlangen en zie je het verdwijnen. Het is een simpele echo, die elke dag aan kracht verliest. ... ... ... Je bent sterker dan deze oude gewoonte. Je hebt gekozen voor het leven, voor gezondheid. Elke dag zonder tabak is een overwinning die je vrijheid versterkt. Je ademt het leven met volle teugen. Je bent vrij.`,
        amincissement: `Hallo. Welkom bij deze sessie gewijd aan het harmoniseren van je lichaam en geest. Maak het je gemakkelijk... sluit je ogen... en adem diep in, laat je buik uitzetten. ... ... ... Laat bij elke uitademing de oordelen over je lichaam, de frustraties, de diëten uit het verleden los... Blaas de harde woorden, de negatieve beelden weg. Je begint vandaag aan een nieuw hoofdstuk. ... ... ... Verwelkom jezelf met welwillendheid, hier en nu. Leg een hand op je hart en een op je buik, en stuur dankbaarheid naar je lichaam voor alles wat het elke dag voor je doet. Het is je voertuig voor het leven, je bondgenoot. ... ... ... Word je bewust van je lichaam, zijn vorm, zijn aanwezigheid... zonder oordeel, met simpele nieuwsgierigheid. Voel het contact van je kleding, de temperatuur van je huid. Wees gewoon aanwezig in je lichamelijke omhulsel. ... ... ... Stel je nu een zacht gouden licht voor, zoals de ochtendzon, dat via de kruin van je hoofd binnenkomt. Het is een licht van genezing, acceptatie en gezonde energie. Het is warm en geruststellend. ... ... ... Het daalt langzaam af en vult elke cel van je lichaam met een gevoel van welzijn. Het stroomt door je hersenen en kalmeert kritische gedachten. Het stroomt door je keel, je borst, je hart. ... ... ... Het vervolgt zijn weg naar je maag, je spijsverteringsstelsel, en brengt vrede en evenwicht. Het omhult elk orgaan met een weldadige warmte. Het lost blokkades en spanningen op. ... ... ... Dit licht helpt je om je weer te verbinden met je ware gevoelens van honger en verzadiging. Stel je voor dat het de aangeboren intelligentie van je lichaam wekt. Het leidt je naar gezonde voedingskeuzes die je lichaam voeden en respecteren. ... ... ... Visualiseer de persoon die je wilt worden: vol energie, comfortabel in je lichaam, in vrede met voedsel. Concentreer je niet op een gewicht, maar op een gevoel. Een gevoel van lichtheid, vitaliteit, vreugde. ... ... ... Zie jezelf met gemak bewegen, activiteiten doen waar je van houdt, of het nu wandelen in de natuur is, dansen, spelen. Je lichaam is een instrument van vreugde, geen bron van zorg. ... ... ... Je lichaam weet wat goed voor het is. Luister ernaar. Het spreekt tot je via gefluister van echte honger en zuchten van verzadiging. Leer luisteren naar deze subtiele signalen. ... ... ... Elke dag maak je bewuste en welwillende keuzes voor je welzijn. Je eet om jezelf te voeden, om jezelf energie te geven, niet om een leegte te vullen. Je bent in harmonie met jezelf.`,
        douleur: `Hallo. Deze sessie is een ruimte om je te helpen om te gaan met de gewaarwording van pijn. Maak het jezelf zo comfortabel als je lichaam vandaag toelaat. Sluit je ogen en laat je adem een natuurlijk en rustgevend ritme vinden. ... ... ... Om te beginnen zullen we ons niet richten op de pijn, maar op comfort. Ga mentaal door je lichaam en zoek een gebied dat op dit moment neutraal of zelfs aangenaam is. Misschien de warmte van je handen... het gevoel van je haar op je voorhoofd... het contact van je voeten met de vloer, of de zachtheid van je kleding. ... ... ... Kies een van deze gebieden en dompel je bewustzijn erin onder. Verken dit gevoel van niet-pijn, van comfort. Is het warm, koel, zacht, neutraal? Dompel jezelf onder in dit gevoel. Dit is je ankerpunt. ... ... ... Bij elke inademing, stel je voor dat dit gevoel van welzijn groeit, zich versterkt. Stel het je voor als een zacht licht dat zich bij elke ademhaling een beetje meer uitbreidt en een oase van rust in je creëert. ... ... ... Nu, met deze bron van comfort stevig aanwezig en solide, kun je het pijngebied in je bewustzijnsveld laten komen. Zonder angst, zonder oordeel. Observeer de gewaarwording van een afstand, zoals een wetenschapper een weerfenomeen door een raam observeert. ... ... ... Geef het neutrale kenmerken. Een vorm, een kleur, een textuur. Is het warm, koud? Stekend, dof? Dicht, diffuus? Trillend, constant? Observeer gewoon, zonder het als 'slecht' te beoordelen, zonder er een verhaal aan te koppelen. ... ... ... Je dissocieert de zuivere gewaarwording van de emotionele reactie. Jij bent niet de pijn. Jij bent het bewustzijn dat het observeert. Deze eenvoudige afstand nemen kan je perceptie al veranderen. ... ... ... Gebruik nu je adem als een instrument voor transformatie. Stel je voor dat je bij elke inademing uit je comfortzone put, dit zachte licht, en het als een kalmerende adem naar het pijnlijke gebied stuurt. ... ... ... En bij elke uitademing stel je je voor dat de pijnlijke gewaarwording wat van zijn intensiteit, zijn stevigheid verliest. Visualiseer de kleur die bleker, transparanter wordt. De randen, die misschien scherp en hard waren, worden wazig en zacht. ... ... ... Zet dit proces voort... Adem comfort naar de pijn... Adem uit om het op te lossen, te verspreiden, te verzachten. Je kunt je ook voorstellen dat de gewaarwording verandert. Een ijsblok dat smelt onder een zachte zon... een strakke knoop die vezel voor vezel loskomt... een felle kleur die vervaagt. ... ... ... Je herwint de controle niet door strijd, maar door zachtheid, aandacht en ademhaling. Jij bent de alchemist die een ruwe gewaarwording omzet in iets meer beheersbaars. Blijf ademen. Je bent veilig.`,
        alcool: `Hallo. Neem dit moment voor jezelf, om het pad dat je bewandelt en de kracht van je beslissing te erkennen. Neem een comfortabele houding aan, sluit je ogen en laat je leiden. ... ... ... Haal diep en krachtig adem, en laat bij het uitademen de spanningen van de dag los. Een tweede keer, adem de trots van je keuze in... en adem het gewicht van het verleden, van gewoonten uit. Een laatste keer, adem kalmte in... en adem alle innerlijke onrust uit. ... ... ... Word je bewust van je lichaam, hier en nu. Voel de helderheid die dag na dag terugkeert in je geest. Voel de vitaliteit die zich in je cellen nestelt. Je lichaam is een intelligent systeem dat zichzelf kan herstellen. Het regenereert, het bedankt je voor het respect dat je het geeft. ... ... ... Visualiseer een waterval van zuiver wit licht die over je kruin stroomt. Het is een licht van helderheid, zuiverheid en vernieuwing. Het daalt in je af en reinigt alles op zijn pad. ... ... ... Het reinigt je gedachten en brengt helderheid. Het stroomt in je keel, je borst, en kalmeert je hart. Het zuivert je lever, je bloed, en neemt alle giftige herinneringen mee. Het laat je schoon, vernieuwd, vol gezonde en levendige energie achter. ... ... ... Het verlangen, of de behoefte, is een gedachte, een oude neurologische gewoonte. Het is niet jij. Het is geen bevel. Je hebt de macht om er niet op te reageren. Stel je voor dat je aan de oever van een brede, rustige rivier zit. ... ... ... Verlangens zijn als bladeren of takken die op het water drijven. Ze verschijnen stroomopwaarts, drijven langs je heen en vervolgen hun weg stroomafwaarts tot ze aan de horizon verdwijnen. Ze zijn slechts op doorreis. ... ... ... Jij bent de waarnemer op de oever, kalm en stabiel. Je hoeft niet in het water te springen om elk blad te vangen. Je kunt het gewoon voorbij zien gaan, met afstandelijke nieuwsgierigheid. 'Oh, een gedachte, een verlangen.' En je laat het zijn weg gaan. ... ... ... Als er een verlangen opkomt, adem dan. Zeg tegen jezelf: 'Ik zie deze gedachte. Het is slechts een golf uit het verleden.' En als een golf zal het opkomen, een piek bereiken en dan onvermijdelijk weer afnemen en verdwijnen. Jij blijft aan de oever, veilig. ... ... ... Projecteer jezelf nu in de nabije toekomst. Stel je een sociale situatie voor, omringd door vrienden. Je houdt een glas vers water, sap of je favoriete alcoholvrije drank vast. Je bent volkomen op je gemak. ... ... ... Je bent aanwezig, je geest is scherp, je neemt volledig deel aan het gesprek. Je lacht, je deelt, je verbindt je authentiek. Je voelt je goed. Je hebt de controle. Je hebt niets anders nodig om van dit moment te genieten. ... ... ... Voel de trots, de eenvoud, de vrijheid van deze keuze. Die persoon ben jij. Veranker dit beeld en dit gevoel in jezelf. Dit is je nieuwe realiteit, die je elke dag opbouwt, met kracht en waardigheid.`,
        confiance: `Hallo en welkom in deze ruimte om je zelfvertrouwen te versterken. Maak het jezelf gemakkelijk, sluit je ogen en haal diep adem. Laat bij het uitademen twijfels, angsten en innerlijke kritiek los. ... ... ... Word je bewust van je houding, hier en nu. Richt je iets op, open je schouders, alsof je ruimte wilt maken voor je vertrouwen. Voel de gronding van je voeten op de vloer, of de ondersteuning van je lichaam op de stoel. Je bent stabiel, stevig en aanwezig. ... ... ... Visualiseer in het midden van je borst, op harthoogte, een kleine bol van warm, gouden licht. Dit is de kern van je vertrouwen, je innerlijke kracht. Het is misschien klein op dit moment, maar het is er. ... ... ... Bij elke inademing, stel je voor dat je deze bol voedt. Het groeit een beetje, het licht wordt intenser, stralender. Bij elke uitademing stabiliseert het zich, wordt het sterker. ... ... ... Blijf ademen en observeer dit licht dat zich uitbreidt. Het vult je romp, daalt af in je buik, en brengt een gevoel van kalmte en kracht. Het stijgt langs je wervelkolom en richt je moeiteloos op. ... ... ... Het stroomt in je schouders, je armen, tot aan je vingertoppen. Het stijgt op naar je nek, je hoofd, en verlicht je gedachten. Je hele wezen is vervuld van dit licht van vertrouwen. Je straalt het uit. ... ... ... Denk nu aan een moment, hoe kort, hoe ver ook, waarop je trots was op jezelf. Een moment waarop je competent was, waarop je iets bereikte, waarop je je volledig in controle voelde over je capaciteiten. ... ... ... Herleef die scène. Kijk er niet alleen naar, duik erin. Wat zag je? Wat hoorde je? Nog belangrijker, wat voelde je in je lichaam? Vind dat gevoel van trots, van kracht, van bekwaamheid. Veranker dat gevoel. ... ... ... Deze kracht, deze bekwaamheid, zit in je. Het is er altijd geweest. Het is een onuitputtelijke bron waarmee je je op elk moment kunt verbinden. Het gouden licht in je borst is de manifestatie van deze bron. ... ... ... Herhaal innerlijk: 'Ik ben capabel. Ik geloof in mezelf. Ik verdien succes en respect.' Voel de resonantie van deze woorden in je, versterkt door het gouden licht. ... ... ... Elke dag voed je dit innerlijke licht. Je loopt met zelfvertrouwen en sereniteit door de wereld. Je weet dat je de middelen in je hebt om aan te pakken wat er op je afkomt. Je hebt vertrouwen.`,
        prosperite: `Hallo en welkom bij deze sessie gewijd aan het openstellen voor voorspoed en overvloed. Maak het jezelf gemakkelijk, klaar om nieuwe energieën te verwelkomen. Sluit je ogen. ... ... ... Haal diep adem, en laat bij het uitademen alle ideeën van tekort, alle angsten voor de toekomst los. Elke ademhaling is een uitnodiging om je rijker, completer te voelen. ... ... ... Breng je aandacht naar je lichaam en laat bij elke uitademing de spanningen los. Voel hoe je lichaam licht en ontvankelijk wordt. Ontspan je voorhoofd, je kaken, je schouders. Laat alles los wat je bezwaart. ... ... ... Stel je voor dat je aan de oever van een prachtige rivier staat. Deze rivier is niet van water, maar van puur, glinsterend gouden licht. Het is de oneindige stroom van kansen, vreugde en rijkdom in al zijn vormen. ... ... ... Observeer deze stroom. Hij is onuitputtelijk. Hij stroomt met kracht en sereniteit. Zet nu een stap en betreed deze rivier van licht. Voel de gouden warmte je omhullen, door je heen circuleren. ... ... ... Je bent niet gescheiden van deze stroom; je bent er deel van. Voel hoe deze energie van overvloed elke cel in je lichaam reinigt en twijfels, beperkende overtuigingen en gevoelens van onwaardigheid wegspoelt. Herhaal innerlijk: 'Ik sta open en ben ontvankelijk voor alle overvloed die het leven me te bieden heeft.' ... ... ... Visualiseer nu een van je doelen. Stel je voor dat het al bereikt is. Kijk niet alleen naar het beeld, maar voel de emoties. De vreugde, de trots, de zekerheid, de dankbaarheid. Hoe voel je je nu dit doel bereikt is? Veranker dit gevoel van succes diep. ... ... ... Deze gouden rivier is altijd in jou. Je kunt er op elk moment mee verbinden. Om dit gevoel te verankeren, druk je zachtjes je duim en wijsvinger van je rechterhand tegen elkaar. Dit is jouw persoonlijke schakelaar om je opnieuw te verbinden met deze energie van overvloed. ... ... ... Neem nog een paar momenten de tijd om in dit gouden licht te drijven. Weet dat je een waardevol wezen bent dat het beste verdient. Je trekt kansen en voorspoed aan omdat je in harmonie bent met hun energie. ... ... ... Zachtjes keer je nu terug naar het hier en nu, met behoud van dit gevoel van innerlijke rijkdom. Begin je vingers en tenen te bewegen. Rek je uit als je dat wilt. En wanneer je er klaar voor bent, open je ogen, met een nieuwe kijk op de wereld, een kijk van voorspoed.`
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
    ],

// NOUVELLE PROGRAMMATION DE SÉANCE AJOUTÉE ICI
    prosperite: [
        { startFreq: 12, endFreq: 10, duration: 180, blinkMode: 'synchro' },
        { startFreq: 10, endFreq: 8, duration: 420, blinkMode: 'alternating' },
        { startFreq: 8,  endFreq: 13, duration: 420, blinkMode: 'crossed' },
        { startFreq: 13, endFreq: 13, duration: 180, blinkMode: 'synchro' }
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
    // Arrête toute séance précédente (y compris les pauses en attente)
    stopGuidedText();

    const langTexts = sophrologyTexts[currentLanguage] || sophrologyTexts['fr'];
    const fullText = langTexts[sessionKey];

    if (!fullText || fullText.includes('//')) {
        console.warn(`Texte de sophrologie non disponible pour la langue: ${currentLanguage}`);
        return;
    }

    // 1. Découper le texte en paragraphes
    const paragraphs = fullText.split('... ... ...').map(p => p.trim()).filter(p => p.length > 0);
    let paragraphIndex = 0;
    let sentenceIndex = 0;

    // 2. Définir les deux durées de pause
    const PAUSE_BETWEEN_SENTENCES_MS = 	2000;  // 3 secondes
    const PAUSE_BETWEEN_PARAGRAPHS_MS = 5000; // 7 secondes

    function speak() {
        if (paragraphIndex >= paragraphs.length) {
            console.log("La séance guidée est terminée.");
            return; // Fin de la séance
        }

        // 3. Découper le paragraphe actuel en phrases
        const currentParagraph = paragraphs[paragraphIndex];
        const sentences = currentParagraph.match(/[^.!?]+[.!?]+/g) || [currentParagraph];

        if (sentenceIndex >= sentences.length) {
            // Fin du paragraphe, passer au suivant après une longue pause
            paragraphIndex++;
            sentenceIndex = 0;
            // Utilise la pause de 7 secondes avant de commencer le paragraphe suivant
            speechPauseTimeoutId = setTimeout(speak, PAUSE_BETWEEN_PARAGRAPHS_MS);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(sentences[sentenceIndex].trim());
        utterance.rate = 0.7; // Conserve une vitesse de parole lente

        const setVoiceAndSpeak = () => {
            const voices = window.speechSynthesis.getVoices();
            selectVoice(utterance, voices); // La fonction existante est réutilisée

            utterance.onend = () => {
                sentenceIndex++;
                // 4. Programmer la phrase suivante après une courte pause de 3 secondes
                speechPauseTimeoutId = setTimeout(speak, PAUSE_BETWEEN_SENTENCES_MS);
            };
            
            utterance.onerror = (event) => console.error("Erreur de synthèse vocale:", event.error);

            window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
        } else {
            setVoiceAndSpeak();
        }
    }

    // Lancer la lecture de la première phrase du premier paragraphe
    speak();
}
function selectVoice(utterance, voices) {
    const langMap = { en: 'en-US', fr: 'fr-FR', de: 'de-DE', es: 'es-ES', it: 'it-IT', nl: 'nl-NL' };
    const ttsLang = langMap[currentLanguage] || 'fr-FR';
    utterance.lang = ttsLang;

    const selectedGender = document.querySelector('input[name="voiceGender"]:checked').value;
    
    let filteredVoices = voices.filter(voice => voice.lang === ttsLang);
    let genderedVoices = [];

    const femaleKeywords = ['female', 'femme', 'weiblich', 'mujer', 'donna', 'aurelie', 'audrey', 'amelie', 'chantal', 'julie', 'anna', 'elena', 'laura', 'vrouw', 'zira', 'susan', 'hazel', 'catherine', 'elizabeth', 'amy', 'emma', 'serena', 'paola', 'lotte', 'femke'];
    const maleKeywords = ['male', 'homme', 'männlich', 'hombre', 'uomo', 'man', 'david', 'mark', 'james', 'george', 'paul', 'thomas', 'antoine', 'hans', 'klaus', 'jorge', 'pablo', 'diego', 'luca', 'paolo', 'roberto', 'daan', 'rik', 'willem', 'alex', 'daniel', 'oliver', 'yannick', 'christoph', 'cosimo', 'frank'];


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
        // Annule la pause programmée s'il y en a une
        if (speechPauseTimeoutId) {
            clearTimeout(speechPauseTimeoutId);
            speechPauseTimeoutId = null;
        }
        // Arrête la synthèse vocale en cours
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