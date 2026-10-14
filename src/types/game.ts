export type GenreId = 'scifi' | 'mystery' | 'fantasy';

export type EndingType = 'NONE' | 'SUCCESS' | 'TRAGIC' | 'PARADOX';

export interface ChapterOption {
  number: 1 | 2 | 3;
  archetype: 'Audacia / Riesgo' | 'Cautela / Investigación / Lógica' | 'Inesperada / Cambio Dimensional / Giro';
  text: string;
}

export interface CharacterEntry {
  name: string;
  role: string;
  status: string;
}

export interface InventoryItem {
  name: string;
  origin: string;
}

export interface ContinuityState {
  characters: CharacterEntry[];
  inventory: InventoryItem[];
  events: string[];
  stability: number;
  anomaliesTriggered: number;
}

export interface ChapterData {
  chapterNumber: number;
  title: string;
  location: string;
  dimensionState: string;
  narrative: string;
  hasAnomaly: boolean;
  anomalyNote?: string;
  options: [ChapterOption, ChapterOption, ChapterOption];
  endingType: EndingType;
  endingTitle?: string;
  endingSummary?: string;
  continuityUpdates: {
    newCharacter?: CharacterEntry;
    newItem?: InventoryItem;
    keyEvent: string;
    stabilityDelta: number;
  };
}

export interface DecisionRecord {
  chapterNumber: number;
  chapterTitle: string;
  location: string;
  dimensionState: string;
  chosenOptionNumber: number;
  chosenOptionText: string;
  chosenArchetype: string;
  hadAnomaly: boolean;
  chapterSnapshot: ChapterData;
}

export interface GenreConfig {
  id: GenreId;
  index: 1 | 2 | 3;
  title: string;
  subtitle: string;
  toneDescription: string;
  protagonistRole: string;
  initialDimension: string;
  imagePath: string;
}
