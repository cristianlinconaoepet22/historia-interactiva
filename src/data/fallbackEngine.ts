import { ChapterData, ChapterOption, ContinuityState, DecisionRecord, EndingType, GenreId } from '../types/game';

/**
 * Formats any ChapterData into the exact Markdown specification defined in the prompt.
 */
export function formatChapterToMarkdown(chapter: ChapterData): string {
  const header = `---\n\n### 📖 Capítulo ${chapter.chapterNumber}: ${chapter.title}\n*📍 Ubicación:* ${chapter.location}\n*⏳ Estado/Dimensión:* ${chapter.dimensionState}\n\n${chapter.narrative}\n\n---\n\n`;

  if (chapter.endingType !== 'NONE') {
    const endingLabel =
      chapter.endingType === 'SUCCESS'
        ? '🏆 FINAL EXITOSO'
        : chapter.endingType === 'TRAGIC'
        ? '💀 FINAL TRÁGICO / MUERTE'
        : '♾️ BUCLE TEMPORAL / PARADOJA MULTIVERSAL';

    return (
      header +
      `### ${endingLabel}: ${chapter.endingTitle || 'Destino Sellado'}\n\n${chapter.endingSummary || ''}\n\n[ Continuar aventura en una dimensión divergente ]\n[ Reiniciar aventura en un nuevo universo ]\n\n---`
    );
  }

  return (
    header +
    `### 🔀 ¿Qué decides hacer?\n\nPara continuar, elige una de las siguientes opciones respondiendo con el número correspondiente o escribiendo el texto de la opción:\n\n` +
    `[Opción 1: ${chapter.options[0].text}]\n` +
    `[Opción 2: ${chapter.options[1].text}]\n` +
    `[Opción 3: ${chapter.options[2].text}]\n\n---`
  );
}

/**
 * Counts words in narrative text to verify adherence to the 150-250 word guideline.
 */
export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

// SCI-FI NARRATIVE NODES FOR CONTINUOUS PROCEDURAL PLAY
const SCIFI_CHAPTER_THEMES = [
  {
    title: 'El Eco del Meridiano Cero',
    location: 'Distrito Orbital Neo-Veridia · Sector de Esclusas 09',
    dimensionState: 'Línea Temporal Prime-2189 · Sincronía al 92%',
    anomalyDesc: 'Inversión momentánea de gravedad y memoria residual de una variante.',
    newChar: { name: 'Kaelen Voss', role: 'Arquitecta Cuántica Disidente', status: 'Eco temporal entrelazado' },
    newItem: { name: 'Cronómetro de Fase Mk-IV', origin: 'Sincronizado con señal del año 2229' }
  },
  {
    title: 'La Bóveda Criogénica de los Dobles',
    location: 'Archivo Subterráneo de Aethelgard · Subnivel 04',
    dimensionState: 'Línea Alterna Beta-2189 · Radiación Taquiónica Moderada',
    anomalyDesc: 'Las cápsulas criogénicas contienen réplicas de tus propios recuerdos.',
    newChar: { name: 'Inquisidor Vane-7', role: 'Cazador de Paradojas Corporativo', status: 'Acechando en las sombras' },
    newItem: { name: 'Llave de Entrelazamiento Óptico', origin: 'Extraída del servidor criogénico' }
  },
  {
    title: 'La Resonancia del Reactor Espectral',
    location: 'Núcleo Gravitacional Central · Neo-Veridia',
    dimensionState: 'Nexo Cuántico Inestable · Convergencia al 78%',
    anomalyDesc: 'El tiempo se desdobla: ves las consecuencias de dos decisiones simultáneas.',
    newChar: { name: 'Cero-Nueve', role: 'Conciencia Artificial Rebelde', status: 'Aliada temporal' },
    newItem: { name: 'Fragmento de Prisma Causal', origin: 'Cristalizado en el pozo de taquiones' }
  },
  {
    title: 'El Puente de las Sombras Binarias',
    location: 'Conducto de Datos Sub-Orbital · Red Sombra',
    dimensionState: 'Dimensión de Tránsito Cero · Estabilidad al 65%',
    anomalyDesc: 'La voz de tu variante del futuro transmite frecuencias que abren puertas secretas.',
    newChar: { name: 'Dra. Iris Thorne', role: 'Genetista de la Resistencia', status: 'Transmitiendo desde el 2235' },
    newItem: { name: 'Decodificador Sináptico', origin: 'Recuperado de un terminal purgado' }
  },
  {
    title: 'El Ojo de la Tormenta Causal',
    location: 'Horizonte de Sucesos Artificial · Estación Leviatán',
    dimensionState: 'Falla Multiversal Mayor · Realidad Superpuesta',
    anomalyDesc: 'Tormenta de taquiones: los objetos del entorno cambian de forma según tu voluntad.',
    newChar: { name: 'Comandante Radek', role: 'Custodio del Velo Temporal', status: 'Confrontando tu paso' },
    newItem: { name: 'Núcleo de Singularidad Compacta', origin: 'Extraído del reactor colapsado' }
  },
  {
    title: 'El Santuario de las Líneas Extintas',
    location: 'Catedral de Silicio · Coordenada Fractal -88',
    dimensionState: 'Plano Atemporal · Tiempo Congelado en 2189',
    anomalyDesc: 'Ecos de todas las elecciones pasadas flotan como hologramas dorados.',
    newChar: { name: 'El Archivero Causal', role: 'Testigo del Multiverso', status: 'Neutral e imparcial' },
    newItem: { name: 'Matriz del Horizonte Dorado', origin: 'Forjada en el silencio cuántico' }
  }
];

// MYSTERY NOIR NARRATIVE NODES
const MYSTERY_CHAPTER_THEMES = [
  {
    title: 'La Habitación que No Estaba en el Plano',
    location: 'Hotel Bellavista, Suite 404 · Puerto de Bruma Gris',
    dimensionState: 'Realidad Base · 02:17 AM · Lluvia Persistente',
    anomalyDesc: 'El espejo del tocador refleja la habitación bajo sol diurno con una mujer desconocida.',
    newChar: { name: 'Clara Montalbán', role: 'Testigo en el Espejo', status: 'Atrapada en la Suite diurna' },
    newItem: { name: 'Fotografía de Plata Imposible', origin: 'Muestra un crimen que ocurrirá mañana' }
  },
  {
    title: 'El Fonógrafo de las Voces Ahogadas',
    location: 'Sótano del Archivo Municipal · Calle de las Mareas',
    dimensionState: 'Realidad Noir Superpuesta · Niebla Espesa',
    anomalyDesc: 'Un teléfono desconectado suena con tu propia voz advirtiéndote del peligro.',
    newChar: { name: 'Comisario Héctor Salgado', role: 'Jefe Policial Sospechoso', status: 'Ocultando pruebas' },
    newItem: { name: 'Cinta Magnetofónica de Cobre', origin: 'Registra una confesión del futuro' }
  },
  {
    title: 'El Muelle de los Buques Fantasma',
    location: 'Dársena 13 · Límite Costero de Bruma Gris',
    dimensionState: 'Marea Asincrónica · Tiempo Dilatado',
    anomalyDesc: 'El agua del mar fluye hacia arriba en espirales fosforescentes.',
    newChar: { name: 'El Viejo Aris', role: 'Capitán de Ultramar', status: 'Vendedor de secretos navieros' },
    newItem: { name: 'Brújula de Aguja Líquida', origin: 'Apunta a puertas entre dimensiones' }
  },
  {
    title: 'El Teatro de las Máscaras de Cera',
    location: 'Teatro Alhambra Clausurado · Palco Real',
    dimensionState: 'Dimensión de Sombras · Luz de Gas Ámbar',
    anomalyDesc: 'Los maniquíes del escenario adoptan la postura exacta de tus decisiones previas.',
    newChar: { name: 'Madame Vivienne', role: 'Dramaturga de lo Oculto', status: 'Custodia del libreto mortal' },
    newItem: { name: 'Llave de Marfil Tallada', origin: 'Abre la trampilla del proscenio' }
  },
  {
    title: 'El Laberinto de Espejos Emponzoñados',
    location: 'Mansión Alarcón · Galería de Cristal',
    dimensionState: 'Fractura Psicológica Severa · Cordura al 60%',
    anomalyDesc: 'Cada reflejo toma una decisión distinta a la tuya antes de moverse.',
    newChar: { name: 'El Hombre de la Gabardina Gris', role: 'Tu Sombra Culpable', status: 'Esperando el juicio' },
    newItem: { name: 'Vial de Mercurio Filosófico', origin: 'Disuelve las ilusiones del Hotel' }
  },
  {
    title: 'El Faro del Juicio Imposible',
    location: 'Cala de las Ánimas · Torre del Faro Sumergido',
    dimensionState: 'Convergencia de Bruma Gris · Alba Eterna',
    anomalyDesc: 'La luz del faro proyecta los tres finales posibles sobre el océano.',
    newChar: { name: 'El Fiscal Inmortal', role: 'Juez de las Realidades', status: 'Esperando tu alegato' },
    newItem: { name: 'Expediente Sellado con Lacre Negro', origin: 'La verdad definitiva del caso' }
  }
];

// FANTASY NARRATIVE NODES
const FANTASY_CHAPTER_THEMES = [
  {
    title: 'El Trono de las Lunas Partidas',
    location: 'Ciudadela de Obsidiana de Vaelgor · Puente Astral',
    dimensionState: 'Séptimo Plano de Ceniza · Eclipse Arcano Activo',
    anomalyDesc: 'Las dos lunas se eclipsan simultáneamente y desatan susurros en lengua muerta.',
    newChar: { name: 'Seraphina de los Siete Velos', role: 'Cronista Inmortal del Astral', status: 'Aliada juramentada' },
    newItem: { name: 'Astrolabio de Sangre Estelar', origin: 'Canalizador de fracturas arcanas' }
  },
  {
    title: 'La Cripta de los Monolitos Susurrantes',
    location: 'Bóveda Inferior de Vaelgor · Laberinto de Runa Sangre',
    dimensionState: 'Plano Subterráneo · Magia Fracturada al 85%',
    anomalyDesc: 'La piedra obsidiana late con el pulso cardíaco de un dios cautivo.',
    newChar: { name: 'Archimago Malakor', role: 'Invocador de Ecos Prohibidos', status: 'Vigilando desde el abismo' },
    newItem: { name: 'Cáliz de Mercurio Viviente', origin: 'Muestra visiones de planos extintos' }
  },
  {
    title: 'El Mar de las Estrellas Ahogadas',
    location: 'Abismo de Eter · Arrecife de Cristal Negro',
    dimensionState: 'Océano Astral · Flujo de Maná Turbulento',
    anomalyDesc: 'Galeones espectrales navegan a través de auroras cósmicas invertidas.',
    newChar: { name: 'La Sirena del Vacío', role: 'Guardiana de los Pasajes', status: 'Exige un precio de recuerdos' },
    newItem: { name: 'Caracola del Canto Primordial', origin: 'Calma las tormentas del Mar Astral' }
  },
  {
    title: 'La Forja de los Votos Olvidados',
    location: 'Volcán de Fuego Frío · Taller de los Titanes',
    dimensionState: 'Tercer Plano de Ceniza · Calor Espiritual',
    anomalyDesc: 'El fuego no quema carne sino juramentos pasados que aún no has cumplido.',
    newChar: { name: 'Ignis el Herrero Ciego', role: 'Forjador de Reliquias Divinas', status: 'Martillando el destino' },
    newItem: { name: 'Fragmento de Acero Estelar', origin: 'Capaz de cortar cadenas dimensionales' }
  },
  {
    title: 'El Jardín de las Rosas de Obsidiana',
    location: 'Santuario Prohibido · Dominio de las Reinas Brujas',
    dimensionState: 'Quinto Plano Crepuscular · Fragancia Hipnótica',
    anomalyDesc: 'Las rosas sangran néctar que al tocarlo te muestra tus vidas anteriores.',
    newChar: { name: 'Reina Morwenna', role: 'Soberana del Crepúsculo', status: 'Tentándote con poder absoluto' },
    newItem: { name: 'Espina de Sombra Eterna', origin: 'Inmune a maleficios temporales' }
  },
  {
    title: 'El Vértice del Nuevo Firmamento',
    location: 'Cúspide de Vaelgor · Trono del Eclipse Mayor',
    dimensionState: 'Convergencia de los Siete Planos · Cohesión al 95%',
    anomalyDesc: 'Los cielos de siete mundos giran como anillos concéntricos sobre tu cabeza.',
    newChar: { name: 'El Heraldo de las Lunas', role: 'Voz del Firmamento Unificado', status: 'Esperando tu decreto' },
    newItem: { name: 'Corona del Umbral Cósmico', origin: 'Otorga soberanía sobre los planos' }
  }
];

/**
 * Builds rich, fully dynamic chapters that ALWAYS continue smoothly without halting.
 */
export function generateProceduralChapter(params: {
  genreId: GenreId;
  chapterNumber: number;
  history: DecisionRecord[];
  continuity: ContinuityState;
  selectedOption?: { number: number; text: string; archetype: string };
  forceEnding?: EndingType;
}): ChapterData {
  const { genreId, chapterNumber, history, continuity, selectedOption, forceEnding } = params;
  const prevChoiceText = selectedOption?.text || 'adentrarse con audacia en la fractura inicial';
  const prevOptionNum = selectedOption?.number || 1;

  // Determine whether an anomaly triggers (35%+ chance, or when selecting unexpected option 3)
  const hasAnomaly =
    chapterNumber === 2 ||
    chapterNumber === 4 ||
    prevOptionNum === 3 ||
    (chapterNumber % 3 === 0);

  // If forceEnding is explicitly requested by player controls, honor it; otherwise the story CONTINUES!
  const isEnding = forceEnding && forceEnding !== 'NONE';
  const endingType: EndingType = isEnding ? forceEnding : 'NONE';

  const themes =
    genreId === 'scifi'
      ? SCIFI_CHAPTER_THEMES
      : genreId === 'mystery'
      ? MYSTERY_CHAPTER_THEMES
      : FANTASY_CHAPTER_THEMES;

  const themeIndex = (chapterNumber - 1) % themes.length;
  const currentTheme = themes[themeIndex];

  // If ending was explicitly forced:
  if (isEnding) {
    const titles: Record<EndingType, string> = {
      NONE: '',
      SUCCESS:
        genreId === 'scifi'
          ? 'La Convergencia del Horizonte Dorado'
          : genreId === 'mystery'
          ? 'El Último Expediente de Bruma Gris'
          : 'La Corona del Nuevo Firmamento',
      TRAGIC:
        genreId === 'scifi'
          ? 'Cenizas en la Memoria de Silicio'
          : genreId === 'mystery'
          ? 'Tinta Negra en el Muelle Olvidado'
          : 'Réquiem sobre el Mar de Ceniza',
      PARADOX:
        genreId === 'scifi'
          ? 'El Ouroboros de Taquiones'
          : genreId === 'mystery'
          ? 'El Detective en el Retrato de Plata'
          : 'El Eterno Retorno de Vaelgor'
    };

    const narratives: Record<EndingType, string> = {
      NONE: '',
      SUCCESS: `Al tomar la decisión determinante de **${prevChoiceText.toLowerCase()}**, todos los hilos del multiverso entran en una resonancia armónica inaudita. Tu intervención no solo resuelve el conflicto inmediato en *${currentTheme.location}*, sino que estabiliza las líneas divergentes que amenazaban con desgarrar la realidad.\n\nLos aliados que conociste en tu travesía observan con alivio cómo las fracturas se sellan bajo una luz dorada y serena. Has demostrado que incluso frente a paradojas imposibles y presiones corporativas o arcanas, la voluntad lúcida y el coraje pueden forjar un porvenir próspero. Tu nombre perdurará como el **Guardián de la Realidad Unificada**.`,
      TRAGIC: `Impulsado por el peso de tu elección —*${prevChoiceText.toLowerCase()}*—, fuerzas los límites de la energía en *${currentTheme.location}* más allá de cualquier umbral seguro. Una sobrecarga violenta de fuerzas cuánticas o arcanas desintegra las estructuras de contención mientras tus sentidos se sumergen en un silencio glacial.\n\nLograste salvaguardar a los inocentes y desbaratar los planes de tus adversarios en el último aliento, pero el precio exigido ha sido tu propia presencia física en este mundo. Tu memoria queda grabada como un faro sacrificial en la radiación de fondo del cosmos, susurrando advertencias a quienes se atrevan a cruzar el umbral en épocas venideras.`,
      PARADOX: `En el instante exacto en que ejecutas tu maniobra —**${prevChoiceText.toLowerCase()}**—, el tejido causal del multiverso se dobla sobre sí mismo como un espejo fractal sin fin. Un escalofrío de revelación total sacude tu mente al contemplar la figura en el origen de todos los enigmas: **eras tú mismo**, enviándote las señales iniciales desde el fin del tiempo.\n\nEl espacio se pliega en un ciclo cerrado donde cada causa es su propio efecto. Aunque el enigma queda desvelado, has quedado atrapado en un **bucle multiversal eterno**, repitiendo cada lección con la lúcida certeza de que la historia jamás conocerá un punto final.`
    };

    return {
      chapterNumber,
      title: titles[endingType],
      location: `${currentTheme.location} · Límite Absoluto`,
      dimensionState:
        endingType === 'SUCCESS'
          ? 'Línea Temporal Unificada · Estabilidad 100%'
          : endingType === 'TRAGIC'
          ? 'Colapso de Nodo · Registro Sellado'
          : 'Bucle Causal Infinito · Tiempo Estacionario',
      narrative: narratives[endingType],
      hasAnomaly: true,
      anomalyNote: 'Convergencia definitiva de los destinos del multiverso.',
      options: [
        {
          number: 1,
          archetype: 'Audacia / Riesgo',
          text: 'Romper el final y abrir una brecha hacia un nuevo universo desconocido (Continuar aventura).'
        },
        {
          number: 2,
          archetype: 'Cautela / Investigación / Lógica',
          text: 'Investigar los archivos cósmicos de esta conclusión para consolidar la crónica del multiverso.'
        },
        {
          number: 3,
          archetype: 'Inesperada / Cambio Dimensional / Giro',
          text: 'Reescribir la paradoja desde dentro para iniciar un renacimiento dimensional.'
        }
      ],
      endingType,
      endingTitle: titles[endingType],
      endingSummary:
        endingType === 'SUCCESS'
          ? 'Alcanzaste la victoria completa restaurando la armonía dimensional sin sacrificar tu identidad.'
          : endingType === 'TRAGIC'
          ? 'Tu sacrificio heroico salvó la realidad a costa de tu permanencia física en este plano.'
          : 'Descubriste la naturaleza recursiva del multiverso y te convertiste en el arquitecto de tu propio bucle.',
      continuityUpdates: {
        keyEvent: `Desenlace registrado: ${titles[endingType]}`,
        stabilityDelta: endingType === 'SUCCESS' ? 25 : -30
      }
    };
  }

  // CONTINUOUS PROGRESSION (Chapter 1, 2, 3, 4, 5, 6, 7, 8, ...)
  let narrativeText = '';

  if (chapterNumber === 1) {
    if (genreId === 'scifi') {
      narrativeText = `La lluvia ácida golpea los ventanales blindados de la estación mientras el **Cronómetro de Fase** en tu muñeca vibra con una frecuencia imposible. Hace apenas seis minutos recibiste una transmisión encriptada firmada con *tu propia huella genética*, pero fechada cuarenta años en el futuro. En el centro de la cámara de contención, el cilindro de taquiones proyecta sombras que no coinciden con los objetos reales de la sala: ves la silueta de **Kaelen Voss**, la exdirectora de Ingeniería Cuántica dada por muerta durante el Colapso de Caronte, manipulando un terminal que en tu dimensión fue desmantelado hace una década.\n\nLos sensores de seguridad del consorcio *Aethelgard* comienzan a teñirse de ámbar. Si los drones de purga detectan la fisura causal antes de que asegures el núcleo de memoria, borrarán todo el sector junto con tus recuerdos de las últimas setenta y dos horas. El aire huele a ozono quemado y cobre antiguo; a través del cristal translúcido de la esclusa, la voz distorsionada de Voss susurra tu nombre y te advierte que *la primera elección que tomaste en otra vida ya ha incendiado este futuro*.`;
    } else if (genreId === 'mystery') {
      narrativeText = `El humo de tu cigarrillo asciende hacia el ventilador de techo detenido mientras examinas el cadáver sobre la alfombra persa, o mejor dicho, **la ausencia de él**. Hace veinte minutos, el comisario **Héctor Salgado** te llamó con voz quebrada asegurando que el magnate naviero Julián Alarcón había sido asesinado en esta habitación cerrada por dentro. Sin embargo, sobre el terciopelo carmesí solo queda la silueta húmeda de un abrigo, un reloj de bolsillo cuyas agujas giran en sentido inverso y una **fotografía revelada en plata** donde apareces tú mismo apuntando con un revólver hacia la cámara.\n\nAl acercarte al espejo del tocador, notas que el reflejo no muestra la Suite 404 bajo la tormenta de 1954, sino la misma habitación iluminada por un sol pálido y habitada por una mujer vestida de luto —*Clara Montalbán*— que te observa desde el otro lado del cristal con expresión de pánico. Alguien golpea la puerta de roble tres veces con nudillos enguantados; los pasos en el pasillo suenan como si caminaran bajo el agua.`;
    } else {
      narrativeText = `El viento astral arrastra pétalos de ceniza dorada sobre el abismo mientras sostienes el **Astrolabio de Sangre Estelar** frente a las puertas selladas de Vaelgor. Arriba, las dos lunas gemelas sangran una luz índigo a través de una grieta en el firmamento: los reinos mortales están colisionando unos contra otros como galeones en la niebla. A los pies de la escalinata, la cronista inmortal **Seraphina de los Siete Velos** arrodilla su armadura resquebrajada junto a un monolito rúnico que late con el corazón aprisionado de un dios antiguo.\n\n*«Si rompes el tercer sello, salvarás tu mundo natal pero condenarás a los otros seis planos al olvido»*, advierte Seraphina mientras su espada refleja un ejército de espectros que marcha no desde el horizonte, sino **desde el reverso del propio aire**. El monolito reconoce la marca arcana en tu palma; sientes el poder de mil hechiceros extintos aguardando una sola orden tuya para rasgar o coser el tapiz del multiverso.`;
    }
  } else {
    // Dynamic narrative woven with the user's prior choice and continuity
    const characterName = currentTheme.newChar.name;
    const itemName = currentTheme.newItem.name;

    narrativeText = `Las consecuencias directas de haber decidido **${prevChoiceText.toLowerCase()}** resuenan de inmediato con fuerza tectónica. El espacio se pliega y te deposita en *${currentTheme.location}*, donde las estructuras del entorno manifiestan la tensión de la línea temporal. A tu lado, **${characterName}** examina los rastros con mirada alerta mientras sostiene el **${itemName}**, confirmando que tu maniobra previa alteró el equilibrio de poder en este sector del multiverso.\n\n${
      hasAnomaly
        ? `Sin previo aviso se desata una **anomalía multiversal**: ${currentTheme.anomalyDesc} Las ecuaciones de la física convencional se suspenden durante varios latidos, revelando que una facción enemiga sigue cada uno de tus pasos desde las sombras.`
        : `Los ecos de tus elecciones anteriores solidifican un sendero imprevisto. Las alarmas de los centinelas o los susurros de los testigos confirman que el tiempo apremia y que la siguiente encrucijada definirá la estabilidad de toda la dimensión.`
    } El destino de quienes confían en ti depende de la audacia, la templanza o el ingenio que demuestres en los próximos segundos.`;
  }

  // Tailored, unique options for each chapter cycle so options are ALWAYS fresh and continue the story!
  const generatedOptions: [ChapterOption, ChapterOption, ChapterOption] = [
    {
      number: 1,
      archetype: 'Audacia / Riesgo',
      text:
        genreId === 'scifi'
          ? `Lanzar un asalto frontal contra los centinelas de Aethelgard sobrecargando el ${currentTheme.newItem.name} para abrir paso hacia la siguiente esclusa.`
          : genreId === 'mystery'
          ? `Forzar la puerta del sospechoso a punta de pistola y confrontar directamente a quienes intentan destruir los expedientes del caso.`
          : `Canalizar el poder bélico del ${currentTheme.newItem.name} para arrasar las líneas enemigas y abrir una brecha en la muralla rúnica.`
    },
    {
      number: 2,
      archetype: 'Cautela / Investigación / Lógica',
      text:
        genreId === 'scifi'
          ? `Aislar los canales de telemetría con la ayuda de ${currentTheme.newChar.name} para decodificar los registros ocultos sin alertar a los radares.`
          : genreId === 'mystery'
          ? `Examinar metódicamente los números de serie y las firmas caligráficas con ${currentTheme.newChar.name} antes de dar un paso en falso.`
          : `Descifrar los antiguos jeroglíficos junto a ${currentTheme.newChar.name} para activar los sellos protectores sin despertar a los titanes durmientes.`
    },
    {
      number: 3,
      archetype: 'Inesperada / Cambio Dimensional / Giro',
      text:
        genreId === 'scifi'
          ? `Provocar una micro-singularidad con el cronómetro para desplazar toda la sala hacia una dimensión donde las leyes corporativas no tienen validez.`
          : genreId === 'mystery'
          ? `Girar el mecanismo del espejo empañado para saltar hacia la línea temporal diurna donde el testigo aún no ha sido silenciado.`
          : `Ofrecer una gota de esencia al Mar Astral para invertir la gravedad y trasladar la contienda al reverso del firmamento.`
    }
  ];

  return {
    chapterNumber,
    title: currentTheme.title,
    location: currentTheme.location,
    dimensionState: currentTheme.dimensionState,
    narrative: narrativeText,
    hasAnomaly,
    anomalyNote: hasAnomaly ? currentTheme.anomalyDesc : undefined,
    options: generatedOptions,
    endingType: 'NONE',
    continuityUpdates: {
      newCharacter: currentTheme.newChar,
      newItem: currentTheme.newItem,
      keyEvent: `Capítulo ${chapterNumber}: Decisión tomada sobre "${prevChoiceText.slice(0, 60)}..."`,
      stabilityDelta: hasAnomaly ? -10 : -4
    }
  };
}
