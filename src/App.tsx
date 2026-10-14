/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Compass,
  RotateCcw,
  Send,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Sparkles,
  History,
  ScrollText,
  AlertTriangle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import {
  ChapterData,
  ChapterOption,
  ContinuityState,
  DecisionRecord,
  EndingType,
  GenreConfig,
  GenreId
} from './types/game';
import {
  countWords,
  formatChapterToMarkdown,
  generateProceduralChapter
} from './data/fallbackEngine';
import { RichNarrative } from './components/RichNarrative';
import { soundFX } from './utils/soundFX';

import heroNexusImg from './assets/images/multiverse_nexus_hero_1790797682654.jpg';
import scifiImg from './assets/images/scifi_cyberpunk_chrono_1790797693680.jpg';
import mysteryImg from './assets/images/mystery_noir_detective_1790797704978.jpg';
import fantasyImg from './assets/images/fantasy_dark_multiverse_1790797728267.jpg';

const GENRE_CONFIGS: GenreConfig[] = [
  {
    id: 'scifi',
    index: 1,
    title: '1. Ciencia Ficción / Cyberpunk / Viajes en el tiempo',
    subtitle: 'Distrito Orbital Neo-Veridia · Paradojas de Taquiones y Megacorporaciones',
    toneDescription:
      'Implantes neurales, lluvias ácidas sobre arquitectura brutalista y señales genéticas enviadas desde un futuro que aún puedes evitar o condenar.',
    protagonistRole: 'Operador Crono-Neural Disidente',
    initialDimension: 'Línea Temporal Prime-2189',
    imagePath: scifiImg
  },
  {
    id: 'mystery',
    index: 2,
    title: '2. Misterio / Thriller Psicológico / Detective Noir',
    subtitle: 'Puerto de Bruma Gris · Crímenes de Habitación Cerrada entre Dos Realidades',
    toneDescription:
      'Humo de cigarrillo, espejos que reflejan el día cuando afuera llueve de madrugada y fotografías de plata donde el culpable tiene tu propio rostro.',
    protagonistRole: 'Investigador Privado de Casos Imposibles',
    initialDimension: 'Realidad Base · 1954',
    imagePath: mysteryImg
  },
  {
    id: 'fantasy',
    index: 3,
    title: '3. Fantasía Oscura / Alta Fantasía / Multiverso de Magia',
    subtitle: 'Ciudadela de Obsidiana de Vaelgor · El Eclipse de los Siete Planos',
    toneDescription:
      'Reliquias de sangre estelar, dioses antiguos cautivos en monolitos rúnicos y reinos mortales colisionando sobre el abismo del Mar Astral.',
    protagonistRole: 'Portador del Astrolabio Astral',
    initialDimension: 'Séptimo Plano de Ceniza',
    imagePath: fantasyImg
  }
];

type GamePhase = 'INITIAL_SETUP' | 'ACTIVE_CHAPTER' | 'GAME_OVER';
type ActiveSection = 'setup' | 'chapter' | 'continuity' | 'chronicle';
type ViewFormat = 'interactive' | 'markdown';

const INITIAL_CONTINUITY: ContinuityState = {
  characters: [],
  inventory: [],
  events: [],
  stability: 100,
  anomaliesTriggered: 0
};

export default function App() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('INITIAL_SETUP');
  const [selectedGenre, setSelectedGenre] = useState<GenreConfig | null>(null);
  const [currentChapter, setCurrentChapter] = useState<ChapterData | null>(null);
  const [history, setHistory] = useState<DecisionRecord[]>([]);
  const [continuity, setContinuity] = useState<ContinuityState>(INITIAL_CONTINUITY);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingOptionNumber, setLoadingOptionNumber] = useState<number | null>(null);
  const [userInput, setUserInput] = useState<string>('');
  const [setupFeedback, setSetupFeedback] = useState<string | null>(null);
  const [viewFormat, setViewFormat] = useState<ViewFormat>('interactive');
  const [activeNavSection, setActiveNavSection] = useState<ActiveSection>('setup');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [copiedMarkdown, setCopiedMarkdown] = useState<boolean>(false);
  const [pendingEndingOverride, setPendingEndingOverride] = useState<EndingType>('NONE');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const chapterTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    soundFX.enabled = soundEnabled;
  }, [soundEnabled]);

  const handleImageError = (id: string) => {
    setBrokenImages((prev) => ({ ...prev, [id]: true }));
  };

  const resetToInitialSetup = () => {
    soundFX.playChoiceSound(2);
    setGamePhase('INITIAL_SETUP');
    setSelectedGenre(null);
    setCurrentChapter(null);
    setHistory([]);
    setContinuity(INITIAL_CONTINUITY);
    setUserInput('');
    setSetupFeedback(null);
    setLoadingOptionNumber(null);
    setPendingEndingOverride('NONE');
    setActiveNavSection('setup');
  };

  const requestChapterFromEngine = async (params: {
    genre: GenreConfig;
    chapterNumber: number;
    currentHistory: DecisionRecord[];
    currentContinuity: ContinuityState;
    selectedOption?: { number: number; text: string; archetype: string };
    forceEnding?: EndingType;
  }) => {
    setIsLoading(true);
    setSetupFeedback(null);

    let nextChap: ChapterData;

    try {
      const response = await fetch('/api/game/next-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genreId: params.genre.id,
          chapterNumber: params.chapterNumber,
          history: params.currentHistory,
          continuity: params.currentContinuity,
          selectedOption: params.selectedOption,
          forceEnding: params.forceEnding
        })
      });

      if (response.ok) {
        const data = await response.json();
        nextChap = data.chapter;
      } else {
        nextChap = generateProceduralChapter({
          genreId: params.genre.id,
          chapterNumber: params.chapterNumber,
          history: params.currentHistory,
          continuity: params.currentContinuity,
          selectedOption: params.selectedOption,
          forceEnding: params.forceEnding
        });
      }
    } catch {
      nextChap = generateProceduralChapter({
        genreId: params.genre.id,
        chapterNumber: params.chapterNumber,
        history: params.currentHistory,
        continuity: params.currentContinuity,
        selectedOption: params.selectedOption,
        forceEnding: params.forceEnding
      });
    }

    // Safely update continuity state
    const updatedCharacters = [...(params.currentContinuity.characters || [])];
    if (nextChap.continuityUpdates?.newCharacter) {
      const incoming = nextChap.continuityUpdates.newCharacter;
      const existingIdx = updatedCharacters.findIndex(
        (c) => c.name.toLowerCase() === incoming.name.toLowerCase()
      );
      if (existingIdx >= 0) {
        updatedCharacters[existingIdx] = incoming;
      } else {
        updatedCharacters.push(incoming);
      }
    }

    const updatedInventory = [...(params.currentContinuity.inventory || [])];
    if (nextChap.continuityUpdates?.newItem) {
      const incomingItem = nextChap.continuityUpdates.newItem;
      const exists = updatedInventory.some(
        (i) => i.name.toLowerCase() === incomingItem.name.toLowerCase()
      );
      if (!exists) {
        updatedInventory.push(incomingItem);
      }
    }

    const updatedEvents = [
      ...(params.currentContinuity.events || []),
      nextChap.continuityUpdates?.keyEvent || `Capítulo ${params.chapterNumber} superado`
    ].filter(Boolean);

    const delta = typeof nextChap.continuityUpdates?.stabilityDelta === 'number'
      ? nextChap.continuityUpdates.stabilityDelta
      : -5;

    const nextStability = Math.max(5, Math.min(100, (params.currentContinuity.stability ?? 100) + delta));
    const nextAnomaliesCount =
      (params.currentContinuity.anomaliesTriggered ?? 0) + (nextChap.hasAnomaly ? 1 : 0);

    if (nextChap.hasAnomaly) {
      soundFX.playAnomalyChime();
    }

    setContinuity({
      characters: updatedCharacters,
      inventory: updatedInventory,
      events: updatedEvents,
      stability: nextStability,
      anomaliesTriggered: nextAnomaliesCount
    });

    setCurrentChapter(nextChap);
    setPendingEndingOverride('NONE');
    setLoadingOptionNumber(null);
    setIsLoading(false);

    if (nextChap.endingType !== 'NONE') {
      setGamePhase('GAME_OVER');
    } else {
      setGamePhase('ACTIVE_CHAPTER');
    }
    setActiveNavSection('chapter');

    setTimeout(() => {
      chapterTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleStartGenre = async (genre: GenreConfig) => {
    soundFX.playChoiceSound(genre.index);
    setSelectedGenre(genre);
    const freshContinuity: ContinuityState = {
      characters: [],
      inventory: [],
      events: [],
      stability: 100,
      anomaliesTriggered: 0
    };
    setContinuity(freshContinuity);
    setHistory([]);
    await requestChapterFromEngine({
      genre,
      chapterNumber: 1,
      currentHistory: [],
      currentContinuity: freshContinuity
    });
  };

  const handleSelectOption = async (option: ChapterOption) => {
    if (!selectedGenre || !currentChapter || isLoading) return;
    soundFX.playChoiceSound(option.number);
    setLoadingOptionNumber(option.number);

    const newDecision: DecisionRecord = {
      chapterNumber: currentChapter.chapterNumber,
      chapterTitle: currentChapter.title,
      location: currentChapter.location,
      dimensionState: currentChapter.dimensionState,
      chosenOptionNumber: option.number,
      chosenOptionText: option.text,
      chosenArchetype: option.archetype,
      hadAnomaly: currentChapter.hasAnomaly,
      chapterSnapshot: currentChapter
    };

    const nextHistory = [...history, newDecision];
    setHistory(nextHistory);
    setUserInput('');

    await requestChapterFromEngine({
      genre: selectedGenre,
      chapterNumber: currentChapter.chapterNumber + 1,
      currentHistory: nextHistory,
      currentContinuity: continuity,
      selectedOption: {
        number: option.number,
        text: option.text,
        archetype: option.archetype
      },
      forceEnding: pendingEndingOverride !== 'NONE' ? pendingEndingOverride : undefined
    });
  };

  // Allows continuing play even if player experienced an ending
  const handleContinueAfterEnding = async () => {
    if (!selectedGenre || !currentChapter || isLoading) return;
    soundFX.playChoiceSound(1);
    setLoadingOptionNumber(1);

    const continueDecision: DecisionRecord = {
      chapterNumber: currentChapter.chapterNumber,
      chapterTitle: currentChapter.title,
      location: currentChapter.location,
      dimensionState: currentChapter.dimensionState,
      chosenOptionNumber: 1,
      chosenOptionText: 'Continuar la travesía hacia una dimensión desconocida',
      chosenArchetype: 'Audacia / Riesgo',
      hadAnomaly: true,
      chapterSnapshot: currentChapter
    };

    const nextHistory = [...history, continueDecision];
    setHistory(nextHistory);

    await requestChapterFromEngine({
      genre: selectedGenre,
      chapterNumber: currentChapter.chapterNumber + 1,
      currentHistory: nextHistory,
      currentContinuity: {
        ...continuity,
        stability: Math.max(50, continuity.stability)
      },
      selectedOption: {
        number: 1,
        text: 'Cruzar la singularidad y abrir una nueva línea temporal',
        archetype: 'Audacia / Riesgo'
      },
      forceEnding: 'NONE'
    });
  };

  const handleFreeformSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = userInput.trim();
    if (!trimmed || isLoading) return;

    const lower = trimmed.toLowerCase();

    // If user types "iniciar" or "comenzar", reset to initial genre selection per prompt rule
    if (lower === 'iniciar' || lower === 'comenzar') {
      resetToInitialSetup();
      setSetupFeedback(
        'Configuración inicial activada. Elige una de las 3 ambientaciones (1, 2 o 3) para abrir el primer capítulo.'
      );
      return;
    }

    if (gamePhase === 'INITIAL_SETUP') {
      if (lower === '1' || lower.includes('ciencia') || lower.includes('cyberpunk') || lower.includes('tiempo')) {
        await handleStartGenre(GENRE_CONFIGS[0]);
        return;
      }
      if (lower === '2' || lower.includes('misterio') || lower.includes('thriller') || lower.includes('noir') || lower.includes('detective')) {
        await handleStartGenre(GENRE_CONFIGS[1]);
        return;
      }
      if (lower === '3' || lower.includes('fantas') || lower.includes('magia') || lower.includes('oscura')) {
        await handleStartGenre(GENRE_CONFIGS[2]);
        return;
      }
      setSetupFeedback(
        'Por favor, responde con 1 (Ciencia Ficción), 2 (Misterio Noir) o 3 (Fantasía Oscura) para comenzar la aventura.'
      );
      return;
    }

    if (gamePhase === 'ACTIVE_CHAPTER' && currentChapter && selectedGenre) {
      if (lower === '1' || lower === 'opción 1' || lower === 'opcion 1') {
        await handleSelectOption(currentChapter.options[0]);
        return;
      }
      if (lower === '2' || lower === 'opción 2' || lower === 'opcion 2') {
        await handleSelectOption(currentChapter.options[1]);
        return;
      }
      if (lower === '3' || lower === 'opción 3' || lower === 'opcion 3') {
        await handleSelectOption(currentChapter.options[2]);
        return;
      }

      // Custom player text or typed option text
      const matchedOpt = currentChapter.options.find((o) =>
        o.text.toLowerCase().includes(lower)
      );
      if (matchedOpt) {
        await handleSelectOption(matchedOpt);
        return;
      }

      // Treat custom text as a direct tactical action
      await handleSelectOption({
        number: 1,
        archetype: 'Audacia / Riesgo',
        text: trimmed
      });
    }
  };

  const handleCopyMarkdown = () => {
    if (!currentChapter) return;
    const md = formatChapterToMarkdown(currentChapter);
    navigator.clipboard.writeText(md).then(() => {
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* Top Bar Contract: Single row, 3 zones (Brand wordmark | 4 Nav links | 2 Primary actions) */}
      <header className="sticky top-0 z-30 bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveNavSection(gamePhase === 'INITIAL_SETUP' ? 'setup' : 'chapter');
          }}
          className="text-lg font-semibold tracking-tight text-slate-100 font-display whitespace-nowrap"
        >
          Multiverso Interactivo
        </a>

        {/* Zone 2: 4 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
          <button
            type="button"
            onClick={() => setActiveNavSection('setup')}
            className={`hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap ${
              activeNavSection === 'setup' ? 'text-amber-400 underline' : ''
            }`}
          >
            Ambientaciones
          </button>
          <button
            type="button"
            onClick={() => setActiveNavSection('chapter')}
            disabled={!currentChapter}
            className={`hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap disabled:opacity-40 disabled:pointer-events-none ${
              activeNavSection === 'chapter' ? 'text-amber-400 underline' : ''
            }`}
          >
            Capítulo Actual {currentChapter ? `(${currentChapter.chapterNumber})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setActiveNavSection('continuity')}
            className={`hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap ${
              activeNavSection === 'continuity' ? 'text-amber-400 underline' : ''
            }`}
          >
            Continuidad
          </button>
          <button
            type="button"
            onClick={() => setActiveNavSection('chronicle')}
            className={`hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap ${
              activeNavSection === 'chronicle' ? 'text-amber-400 underline' : ''
            }`}
          >
            Crónica ({history.length})
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            title={soundEnabled ? 'Silenciar efectos de sonido' : 'Activar efectos de sonido'}
            className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-slate-100 border border-slate-800 rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Audio Activo' : 'Silenciado'}</span>
          </button>

          <button
            type="button"
            onClick={resetToInitialSetup}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar Universo</span>
          </button>
        </div>
      </header>

      {/* Main Content Area (1440px Desktop Container Baseline) */}
      <main id="top" ref={chapterTopRef} className="flex-1 w-full max-w-[1320px] mx-auto px-6 py-8 md:py-10">
        {/* VIEW 1: CONFIGURACIÓN INICIAL (PRIMER TURNO) */}
        {(gamePhase === 'INITIAL_SETUP' || activeNavSection === 'setup') && (
          <section className="space-y-10">
            {/* Hero / Game Master Introduction */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800/90 bg-[#111827]">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-7 p-8 md:p-10 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="text-xs text-amber-400/90 font-mono-tabular">
                      Motor Narrativo Interactivo · Selección de Universo Inicial
                    </div>
                    <h1 className="text-3xl md:text-4xl font-semibold text-slate-100 font-display leading-tight">
                      Elige tu propia aventura: Multiverso Interactivo
                    </h1>
                    <p className="text-slate-300 text-[15px] leading-relaxed max-w-[65ch]">
                      Soy tu <strong className="text-slate-100 font-semibold">Game Master</strong> interactivo. Antes de abrir la primera grieta dimensional y comenzar la crónica, selecciona el género y el tono del universo que deseas explorar. Cada elección continuará moldeando la trama, la persistencia de los personajes y los artefactos sin detenerse.
                    </p>
                  </div>

                  {/* Quick Command Input for Initial Turn ("Iniciar", "1", "2", "3") */}
                  <form onSubmit={handleFreeformSubmit} className="pt-2 space-y-2">
                    <label htmlFor="gm-setup-input" className="block text-xs text-slate-400">
                      Responde con el número de ambientación (<span className="font-mono-tabular text-slate-200">1</span>, <span className="font-mono-tabular text-slate-200">2</span> o <span className="font-mono-tabular text-slate-200">3</span>) o selecciona una tarjeta debajo:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="gm-setup-input"
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Escribe 1, 2, 3 o el nombre de la ambientación..."
                        className="flex-1 bg-[#0B0F17] border border-slate-800 focus:border-amber-500/80 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span>Comenzar</span>
                      </button>
                    </div>
                    {setupFeedback && (
                      <p className="text-xs text-amber-300 pt-1">{setupFeedback}</p>
                    )}
                  </form>
                </div>

                <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full bg-slate-900">
                  {!brokenImages['hero'] ? (
                    <img
                      src={heroNexusImg}
                      alt="Astrolabio del Multiverso en observatorio oscuro"
                      referrerPolicy="no-referrer"
                      onError={() => handleImageError('hero')}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950/40 flex items-center justify-center p-8">
                      <Compass className="w-16 h-16 text-amber-500/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#111827] via-[#111827]/40 to-transparent" />
                </div>
              </div>
            </div>

            {/* 3 Initial Ambientación Options mandated by Prompt */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-800/80 pb-3">
                <h2 className="text-xl font-semibold text-slate-100 font-display">
                  Selecciona una de las 3 Opciones Iniciales de Ambientación
                </h2>
                <span className="text-xs text-slate-400 font-mono-tabular">
                  3 universos disponibles · Continuidad garantizada · Decisiones interactivas
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {GENRE_CONFIGS.map((genre) => {
                  const isCurrentGenre = selectedGenre?.id === genre.id;
                  return (
                    <article
                      key={genre.id}
                      className={`group rounded-xl overflow-hidden border transition-all flex flex-col justify-between bg-[#111827] ${
                        isCurrentGenre
                          ? 'border-amber-500/80'
                          : 'border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="relative h-48 overflow-hidden bg-slate-900">
                          {!brokenImages[genre.id] ? (
                            <img
                              src={genre.imagePath}
                              alt={genre.title}
                              referrerPolicy="no-referrer"
                              onError={() => handleImageError(genre.id)}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                              <BookOpen className="w-10 h-10 text-amber-400/60" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-black/30 to-transparent" />
                          <div className="absolute bottom-3 left-4 right-4 text-xs text-amber-300 font-mono-tabular">
                            Opción Inicial 0{genre.index} · {genre.initialDimension}
                          </div>
                        </div>

                        <div className="p-6 space-y-3">
                          <h3 className="text-lg font-semibold text-slate-100 font-display leading-snug">
                            {genre.title}
                          </h3>
                          <p className="text-xs text-slate-400">
                            {genre.subtitle}
                          </p>
                          <p className="text-sm text-slate-300 leading-relaxed pt-1">
                            {genre.toneDescription}
                          </p>
                        </div>
                      </div>

                      <div className="px-6 pb-6 pt-2 space-y-3">
                        <div className="text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                          Rol inicial: <span className="text-slate-200">{genre.protagonistRole}</span>
                        </div>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleStartGenre(genre)}
                          className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                        >
                          {isLoading && selectedGenre?.id === genre.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Abriendo portal...</span>
                            </>
                          ) : (
                            <span>Elegir Opción {genre.index} e Iniciar Aventura</span>
                          )}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* If a game is already in progress, allow returning to current chapter */}
            {currentChapter && gamePhase !== 'INITIAL_SETUP' && (
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-sm text-slate-300">
                  Tienes una partida activa en <strong className="text-slate-100">Capítulo {currentChapter.chapterNumber}: {currentChapter.title}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveNavSection('chapter')}
                  className="px-4 py-2 text-xs font-semibold text-amber-300 border border-amber-500/40 rounded-lg hover:bg-amber-500/10 transition-colors whitespace-nowrap"
                >
                  Volver al Capítulo {currentChapter.chapterNumber}
                </button>
              </div>
            )}
          </section>
        )}

        {/* VIEW 2: CAPÍTULO ACTIVO Y PANTALLA DE JUEGO */}
        {activeNavSection === 'chapter' && currentChapter && selectedGenre && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Primary Narrative Column (8 cols on desktop) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Chapter Control & View Mode Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
                <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                  <span className="text-amber-400 font-medium">{selectedGenre.title}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">
                    {countWords(currentChapter.narrative)} palabras
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">
                    Estabilidad: {continuity.stability}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Interactive Segmented Control for Interactive vs Raw Markdown View */}
                  <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setViewFormat('interactive')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        viewFormat === 'interactive'
                          ? 'bg-slate-800 text-amber-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Vista Interactiva
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewFormat('markdown')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        viewFormat === 'markdown'
                          ? 'bg-slate-800 text-amber-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Estructura Markdown
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyMarkdown}
                    className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 border border-slate-800 rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  >
                    {copiedMarkdown ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar MD</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Progress indicator when generating next chapter */}
              {isLoading && (
                <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                    <div>
                      <div className="text-xs font-semibold text-amber-200">
                        Tejiendo consecuencias causales en el multiverso...
                      </div>
                      <div className="text-xs text-amber-300/80">
                        Avanzando al Capítulo {currentChapter.chapterNumber + 1}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono-tabular text-amber-400 animate-pulse">
                    Generando trama activa →
                  </span>
                </div>
              )}

              {/* RAW MARKDOWN VIEW */}
              {viewFormat === 'markdown' && (
                <div className="rounded-xl border border-slate-800 bg-[#111827] p-6">
                  <div className="text-xs text-slate-400 pb-3 mb-4 border-b border-slate-800 flex items-center justify-between">
                    <span>Salida estructurada según formato Markdown oficial</span>
                    <span className="font-mono-tabular">Capítulo {currentChapter.chapterNumber}</span>
                  </div>
                  <pre className="text-xs md:text-sm font-mono-tabular text-slate-200 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {formatChapterToMarkdown(currentChapter)}
                  </pre>
                </div>
              )}

              {/* INTERACTIVE GRAPHICAL CHAPTER VIEW */}
              {viewFormat === 'interactive' && (
                <article className="rounded-xl border border-slate-800/90 bg-[#111827] overflow-hidden">
                  {/* Subtle Ambient Banner */}
                  <div className="relative h-36 overflow-hidden bg-slate-900 border-b border-slate-800/80">
                    {!brokenImages[selectedGenre.id] && (
                      <img
                        src={selectedGenre.imagePath}
                        alt={selectedGenre.title}
                        referrerPolicy="no-referrer"
                        onError={() => handleImageError(selectedGenre.id)}
                        className="w-full h-full object-cover opacity-50"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/65 to-transparent" />
                    <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4">
                      <div>
                        <h2 className="text-2xl md:text-3xl font-semibold text-slate-100 font-display">
                          📖 Capítulo {currentChapter.chapterNumber}: {currentChapter.title}
                        </h2>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 space-y-6">
                    {/* Exact Location & Dimension State Header Lines */}
                    <div className="space-y-1.5 text-sm border-b border-slate-800/80 pb-5">
                      <p className="text-slate-300">
                        <em className="text-amber-400 not-italic font-medium">📍 Ubicación:</em>{' '}
                        <span className="text-slate-100">{currentChapter.location}</span>
                      </p>
                      <p className="text-slate-300">
                        <em className="text-amber-400 not-italic font-medium">⏳ Estado/Dimensión:</em>{' '}
                        <span className="text-slate-100">{currentChapter.dimensionState}</span>
                      </p>
                    </div>

                    {/* Multiversal Anomaly Notice */}
                    {currentChapter.hasAnomaly && (
                      <div className="border-l-2 border-amber-500 pl-4 py-1 text-xs text-amber-200/90 space-y-0.5">
                        <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Anomalía Multiversal / Giro Imprevisto Detectado</span>
                        </div>
                        {currentChapter.anomalyNote && (
                          <p className="text-slate-300">{currentChapter.anomalyNote}</p>
                        )}
                      </div>
                    )}

                    {/* Narrative Body (150-250 words with bold/italic) */}
                    <RichNarrative text={currentChapter.narrative} />

                    <hr className="border-slate-800/80" />

                    {/* IF CHAPTER IS AN ENDING: End of Game Screen + Options to CONTINUE or Restart */}
                    {currentChapter.endingType !== 'NONE' ? (
                      <div className="space-y-6 pt-2">
                        <div className="p-6 rounded-xl border border-amber-500/40 bg-[#0B0F17] space-y-3">
                          <div className="text-xs font-mono-tabular text-amber-400">
                            {currentChapter.endingType === 'SUCCESS' && '🏆 CONDICIÓN DE FIN DE JUEGO: FINAL EXITOSO'}
                            {currentChapter.endingType === 'TRAGIC' && '💀 CONDICIÓN DE FIN DE JUEGO: FINAL TRÁGICO / MUERTE'}
                            {currentChapter.endingType === 'PARADOX' && '♾️ CONDICIÓN DE FIN DE JUEGO: BUCLE TEMPORAL / PARADOJA MULTIVERSAL'}
                          </div>
                          <h3 className="text-2xl font-semibold text-slate-100 font-display">
                            {currentChapter.endingTitle || currentChapter.title}
                          </h3>
                          {currentChapter.endingSummary && (
                            <p className="text-sm text-slate-300 leading-relaxed">
                              {currentChapter.endingSummary}
                            </p>
                          )}
                        </div>

                        {/* Summary of All Decisions Taken */}
                        <div className="space-y-4">
                          <h4 className="text-base font-semibold text-slate-100 font-display">
                            Resumen de Decisiones Tomadas en este Universo ({history.length})
                          </h4>
                          <div className="divide-y divide-slate-800/80 border-t border-b border-slate-800/80 max-h-72 overflow-y-auto pr-2">
                            {history.map((record) => (
                              <div key={record.chapterNumber} className="py-3.5 space-y-1">
                                <div className="flex items-center justify-between text-xs text-slate-400 font-mono-tabular">
                                  <span>
                                    Capítulo {record.chapterNumber}: {record.chapterTitle}
                                  </span>
                                  <span>
                                    Opción {record.chosenOptionNumber} · {record.chosenArchetype}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-200">
                                  “{record.chosenOptionText}”
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action buttons: Either CONTINUE to next chapter or RESTART */}
                        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={handleContinueAfterEnding}
                            className="py-3.5 px-6 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ArrowRight className="w-4 h-4" />
                            )}
                            <span>[ Continuar aventura en el multiverso ]</span>
                          </button>

                          <button
                            type="button"
                            onClick={resetToInitialSetup}
                            className="py-3.5 px-6 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-200 hover:text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>[ Reiniciar aventura en un nuevo universo ]</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ACTIVE DECISION ZONE: ### 🔀 ¿Qué decides hacer? */
                      <div className="space-y-5">
                        <div className="space-y-1.5">
                          <h3 className="text-xl font-semibold text-slate-100 font-display">
                            🔀 ¿Qué decides hacer?
                          </h3>
                          <p className="text-xs text-slate-400">
                            Para continuar, elige una de las siguientes opciones respondiendo con el número correspondiente o escribiendo el texto de la opción:
                          </p>
                        </div>

                        <div className="space-y-3">
                          {currentChapter.options.map((option) => {
                            const isBeingSelected = isLoading && loadingOptionNumber === option.number;
                            return (
                              <button
                                key={option.number}
                                type="button"
                                disabled={isLoading}
                                onClick={() => handleSelectOption(option)}
                                className={`w-full text-left p-4 rounded-xl border transition-all group space-y-1.5 ${
                                  isBeingSelected
                                    ? 'border-amber-500 bg-amber-500/15'
                                    : 'border-slate-800 hover:border-amber-500/70 bg-[#0B0F17] hover:bg-slate-900/90'
                                }`}
                              >
                                <div className="flex items-center justify-between text-xs text-slate-400 font-mono-tabular">
                                  <span className="text-amber-400 font-semibold group-hover:text-amber-300 flex items-center gap-1.5">
                                    {isBeingSelected && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />}
                                    Opción {option.number} · {option.archetype}
                                  </span>
                                  <span className="text-slate-500 group-hover:text-slate-300">
                                    {isBeingSelected ? 'Avanzando trama...' : `Seleccionar [${option.number}] →`}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-200 group-hover:text-white leading-relaxed">
                                  [Opción {option.number}: {option.text}]
                                </p>
                              </button>
                            );
                          })}
                        </div>

                        {/* Text Input Response Bar (Respond with 1, 2, 3 or custom decision text) */}
                        <form onSubmit={handleFreeformSubmit} className="pt-3 space-y-2">
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={userInput}
                              onChange={(e) => setUserInput(e.target.value)}
                              placeholder="Responde con 1, 2, 3 o escribe tu decisión para continuar la historia..."
                              className="flex-1 bg-[#0B0F17] border border-slate-800 focus:border-amber-500/80 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                            />
                            <button
                              type="submit"
                              disabled={isLoading || !userInput.trim()}
                              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                            >
                              {isLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              <span>Enviar Decisión</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </article>
              )}
            </div>

            {/* Secondary Continuity & Multiverse Control Column (4 cols on desktop) */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Continuity System Panel */}
              <div className="rounded-xl border border-slate-800/90 bg-[#111827] p-6 space-y-6">
                <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-100 font-display">
                    Sistema de Continuidad
                  </h3>
                  <span className="text-xs font-mono-tabular text-slate-400">
                    Cap. {currentChapter.chapterNumber}
                  </span>
                </div>

                {/* Dimensional Stability Meter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono-tabular">
                    <span className="text-slate-400">Estabilidad del Universo</span>
                    <span className="text-slate-200">
                      {continuity.stability}/100 ·{' '}
                      {continuity.stability >= 70
                        ? 'ESTABLE'
                        : continuity.stability >= 40
                        ? 'DIVERGENTE'
                        : 'CRÍTICA'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${continuity.stability}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 font-mono-tabular">
                    Anomalías experimentadas: {continuity.anomaliesTriggered}
                  </div>
                </div>

                {/* Known Characters */}
                <div className="space-y-2.5 border-t border-slate-800/80 pt-4">
                  <h4 className="text-xs font-semibold text-slate-300">
                    Personajes en la Trama ({continuity.characters.length})
                  </h4>
                  {continuity.characters.length === 0 ? (
                    <p className="text-xs text-slate-500">Sin registros aún.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {continuity.characters.map((char, i) => (
                        <div key={i} className="text-xs space-y-0.5">
                          <div className="font-medium text-slate-200">{char.name}</div>
                          <div className="text-slate-400">
                            {char.role} · <span className="text-amber-300/90">{char.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Inventory / Objects Found */}
                <div className="space-y-2.5 border-t border-slate-800/80 pt-4">
                  <h4 className="text-xs font-semibold text-slate-300">
                    Objetos y Pistas Clave ({continuity.inventory.length})
                  </h4>
                  {continuity.inventory.length === 0 ? (
                    <p className="text-xs text-slate-500">Ningún artefacto en posesión.</p>
                  ) : (
                    <div className="space-y-2">
                      {continuity.inventory.map((item, i) => (
                        <div key={i} className="text-xs space-y-0.5">
                          <div className="font-medium text-amber-200">{item.name}</div>
                          <div className="text-slate-400">{item.origin}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Past Events Log */}
                <div className="space-y-2 border-t border-slate-800/80 pt-4">
                  <h4 className="text-xs font-semibold text-slate-300">
                    Hitos de Continuidad ({continuity.events.length})
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-400">
                    {continuity.events.slice(-4).map((ev, i) => (
                      <li key={i} className="leading-relaxed">
                        · {ev}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Narrative Destination Director */}
                <div className="space-y-2.5 border-t border-slate-800/80 pt-4">
                  <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Control de Desenlace (Opcional)</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Por defecto la historia continúa sin detenerse. Si deseas forzar un final en tu próxima elección, selecciona uno:
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {(
                      [
                        { type: 'NONE', label: 'Sin Final (Continuo)' },
                        { type: 'SUCCESS', label: 'Forzar Victoria' },
                        { type: 'TRAGIC', label: 'Forzar Tragedia' },
                        { type: 'PARADOX', label: 'Forzar Paradoja' }
                      ] as { type: EndingType; label: string }[]
                    ).map((mode) => (
                      <button
                        key={mode.type}
                        type="button"
                        onClick={() => setPendingEndingOverride(mode.type)}
                        className={`px-2.5 py-1.5 text-xs rounded-md border text-left transition-colors whitespace-nowrap truncate ${
                          pendingEndingOverride === mode.type
                            ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-medium'
                            : 'border-slate-800 bg-[#0B0F17] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* VIEW 3: DEDICATED CONTINUITY VIEW */}
        {activeNavSection === 'continuity' && (
          <section className="space-y-8">
            <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-100 font-display">
                  Estado de Continuidad del Multiverso
                </h2>
                <p className="text-sm text-slate-400">
                  Registro persistente de personajes, artefactos y eventos que moldean las consecuencias de cada capítulo.
                </p>
              </div>
              {currentChapter && (
                <button
                  type="button"
                  onClick={() => setActiveNavSection('chapter')}
                  className="px-4 py-2 text-xs font-semibold bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap"
                >
                  Volver al Capítulo Actual
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-100 font-display">
                  Personajes Conocidos
                </h3>
                {continuity.characters.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    Inicia una aventura para registrar personajes del multiverso.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-800/80">
                    {continuity.characters.map((c, idx) => (
                      <div key={idx} className="py-3 space-y-1">
                        <div className="text-sm font-semibold text-slate-100">{c.name}</div>
                        <div className="text-xs text-slate-400">
                          {c.role} · <span className="text-amber-300">{c.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-100 font-display">
                  Objetos e Inventario
                </h3>
                {continuity.inventory.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    Aún no has recolectado reliquias o pruebas clave.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-800/80">
                    {continuity.inventory.map((item, idx) => (
                      <div key={idx} className="py-3 space-y-1">
                        <div className="text-sm font-semibold text-amber-200">{item.name}</div>
                        <div className="text-xs text-slate-400">{item.origin}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-100 font-display">
                  Eventos y Anomalías
                </h3>
                <div className="text-xs text-slate-400 font-mono-tabular">
                  Estabilidad: {continuity.stability}% · Anomalías: {continuity.anomaliesTriggered}
                </div>
                {continuity.events.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    Sin eventos registrados en esta línea temporal.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm text-slate-300">
                    {continuity.events.map((ev, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <span className="font-mono-tabular text-amber-400">0{idx + 1}.</span> {ev}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        )}

        {/* VIEW 4: CRÓNICA DE DECISIONES */}
        {activeNavSection === 'chronicle' && (
          <section className="space-y-8">
            <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-100 font-display flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-400" />
                  <span>Crónica de Decisiones y Capítulos</span>
                </h2>
                <p className="text-sm text-slate-400">
                  Historial íntegro de elecciones tomadas y su impacto en la línea temporal.
                </p>
              </div>
              {currentChapter && (
                <button
                  type="button"
                  onClick={() => setActiveNavSection('chapter')}
                  className="px-4 py-2 text-xs font-semibold bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap"
                >
                  Volver al Capítulo Actual
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-[#111827] p-10 text-center space-y-3">
                <ScrollText className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-base text-slate-300">
                  Aún no has completado ninguna elección de capítulo en esta sesión.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveNavSection(currentChapter ? 'chapter' : 'setup')}
                  className="px-4 py-2 text-xs font-semibold bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400 transition-colors"
                >
                  {currentChapter ? 'Ir al Capítulo 1' : 'Elegir Ambientación'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div
                    key={item.chapterNumber}
                    className="rounded-xl border border-slate-800 bg-[#111827] p-6 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono-tabular">
                      <span>
                        📖 Capítulo {item.chapterNumber}: {item.chapterTitle}
                      </span>
                      <span>
                        📍 {item.location} · ⏳ {item.dimensionState}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-3">
                      {item.chapterSnapshot.narrative.replace(/\*\*|\*/g, '')}
                    </p>
                    <div className="pt-2 border-t border-slate-800/80 text-xs text-amber-300 font-mono-tabular">
                      Decisión tomada → [Opción {item.chosenOptionNumber} · {item.chosenArchetype}]: “{item.chosenOptionText}”
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-800/80 py-5 px-6 text-xs text-slate-500">
        <div className="max-w-[1320px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Elige tu propia aventura: Multiverso Interactivo · Motor Narrativo Dinámico</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={resetToInitialSetup}
              className="hover:text-slate-300 transition-colors"
            >
              Cambiar de Universo
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setViewFormat((v) => (v === 'interactive' ? 'markdown' : 'interactive'))}
              className="hover:text-slate-300 transition-colors"
            >
              Alternar Vista Markdown
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
