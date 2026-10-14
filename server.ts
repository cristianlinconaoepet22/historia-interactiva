import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { generateProceduralChapter } from './src/data/fallbackEngine.ts';
import { ChapterData, ContinuityState, DecisionRecord, EndingType, GenreId } from './src/types/game.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GENRE_NAMES: Record<GenreId, string> = {
  scifi: '1. Ciencia Ficción / Cyberpunk / Viajes en el tiempo',
  mystery: '2. Misterio / Thriller Psicológico / Detective Noir',
  fantasy: '3. Fantasía Oscura / Alta Fantasía / Multiverso de Magia'
};

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  app.post('/api/game/next-chapter', async (req, res) => {
    const {
      genreId = 'scifi',
      chapterNumber = 1,
      history = [],
      continuity = { characters: [], inventory: [], events: [], stability: 100, anomaliesTriggered: 0 },
      selectedOption,
      forceEnding
    }: {
      genreId: GenreId;
      chapterNumber: number;
      history: DecisionRecord[];
      continuity: ContinuityState;
      selectedOption?: { number: number; text: string; archetype: string };
      forceEnding?: EndingType;
    } = req.body;

    const safeContinuity: ContinuityState = {
      characters: Array.isArray(continuity?.characters) ? continuity.characters : [],
      inventory: Array.isArray(continuity?.inventory) ? continuity.inventory : [],
      events: Array.isArray(continuity?.events) ? continuity.events.filter(Boolean) : [],
      stability: typeof continuity?.stability === 'number' ? continuity.stability : 100,
      anomaliesTriggered: typeof continuity?.anomaliesTriggered === 'number' ? continuity.anomaliesTriggered : 0
    };

    const ai = getGeminiClient();

    // Determine whether this turn should introduce a multiversal anomaly (>= 35% probability)
    const shouldTriggerAnomaly =
      chapterNumber > 1 && (selectedOption?.number === 3 || Math.random() < 0.4);

    // End story ONLY if player explicitly forced an ending or if stability drops to critical level after extensive play
    const shouldEndStory = forceEnding && forceEnding !== 'NONE';

    // If Gemini client is not configured, generate immediately with procedural engine
    if (!ai) {
      const fallback = generateProceduralChapter({
        genreId,
        chapterNumber,
        history,
        continuity: safeContinuity,
        selectedOption,
        forceEnding: shouldEndStory ? forceEnding : 'NONE'
      });
      return res.json({ chapter: fallback, source: 'engine' });
    }

    try {
      const historySummary =
        history.length === 0
          ? 'Inicio de la aventura (Capítulo 1).'
          : history
              .map(
                (h) =>
                  `- Capítulo ${h.chapterNumber} ("${h.chapterTitle}" en ${h.location}): El jugador eligió Opción ${h.chosenOptionNumber} (${h.chosenArchetype}): "${h.chosenOptionText}"`
              )
              .join('\n');

      const charactersList =
        safeContinuity.characters.length > 0
          ? safeContinuity.characters.map((c) => `${c.name} (${c.role} - ${c.status})`).join(', ')
          : 'Ninguno registrado aún';

      const inventoryList =
        safeContinuity.inventory.length > 0
          ? safeContinuity.inventory.map((i) => `${i.name} (${i.origin})`).join(', ')
          : 'Ninguno registrado aún';

      const systemInstruction = `Eres un "Game Master" interactivo y motor narrativo de una experiencia de juego tipo "Elige tu propia aventura: Multiverso Interactivo".
Tu objetivo es sumergir al usuario en historias dinámicas de Ciencia Ficción, Misterio o Fantasía, donde sus elecciones moldean directamente la trama y el destino del multiverso.

REGLAS ESTRICTAS DE NARRATIVA Y FORMATO:
1. Idioma: Español rico, literario e inmersivo.
2. El relato narrativo ("narrative") DEBE tener estrictamente entre 150 y 250 palabras. Mantén un estilo inmersivo, descriptivo, lleno de suspense y decisiones morales o tácticas significativas. Usa formato Markdown enriquecido como **negritas** o *cursivas* dentro del texto narrativo para dar énfasis dramático (separa en 2 párrafos con salto de línea).
3. Consecuencias reales: La última decisión del jugador debe impactar directamente en este capítulo.
4. Sistema de continuidad: Mantén coherencia absoluta con los personajes conocidos (${charactersList}), objetos en inventario (${inventoryList}) y eventos pasados.
5. Eventos imprevistos: ${
        shouldTriggerAnomaly
          ? 'En este capítulo DEBES introducir un giro en la trama, anomalía multiversal o consecuencia dimensional inesperada (hasAnomaly = true) y describir brevemente la anomalía en anomalyNote.'
          : 'Puedes mantener la tensión narrativa o introducir un giro sutil.'
      }
6. Las 3 opciones para continuar (cuando endingType es "NONE") deben corresponder siempre a:
   - Opción 1: Acción o decisión basada en audacia / riesgo.
   - Opción 2: Acción o decisión basada en cautela / investigación / lógica.
   - Opción 3: Acción o decisión inesperada / cambio dimensional / giro de trama.
7. Continuidad de la historia: ${
        shouldEndStory
          ? `Este capítulo DEBE concluir la historia con un desenlace definitivo ("${forceEnding}"). Incluye endingTitle y endingSummary.`
          : 'La historia DEBE CONTINUAR sin detenerse. El campo endingType DEBE ser "NONE", con 3 opciones frescas para seguir avanzando.'
      }`;

      const userPrompt = `Ambientación seleccionada: ${GENRE_NAMES[genreId] || genreId}
Número de Capítulo a generar: ${chapterNumber}
Estabilidad Dimensional actual: ${safeContinuity.stability}%
Historial de decisiones previas:
${historySummary}

${
  selectedOption
    ? `Última acción tomada por el jugador para entrar a este capítulo: [Opción ${selectedOption.number} - ${selectedOption.archetype}]: "${selectedOption.text}"`
    : 'Genera el Capítulo 1 inaugural de esta aventura presentando un conflicto inmediato, misterioso y de alto riesgo en el multiverso.'
}

Genera los datos estructurados del Capítulo ${chapterNumber}. Recuerda: el campo "narrative" debe tener entre 150 y 250 palabras y utilizar **negritas** y *cursivas*.`;

      // Use a strict 3.5s timeout so user never waits or gets frozen if model has 503 spike
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout - switching to dynamic engine')), 3500)
      );

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.85,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Título evocador del capítulo (sin incluir la palabra Capítulo).'
              },
              location: {
                type: Type.STRING,
                description: 'Ubicación actual detallada en el multiverso.'
              },
              dimensionState: {
                type: Type.STRING,
                description: 'Estado actual del protagonista o universo/dimensión.'
              },
              narrative: {
                type: Type.STRING,
                description:
                  'Relato narrativo del capítulo de entre 150 y 250 palabras usando **negritas** y *cursivas*.'
              },
              hasAnomaly: {
                type: Type.BOOLEAN,
                description: 'True si ocurre una anomalía multiversal o giro imprevisto en este capítulo.'
              },
              anomalyNote: {
                type: Type.STRING,
                description: 'Descripción breve de una línea sobre la anomalía o giro ocurrido.'
              },
              option1Text: {
                type: Type.STRING,
                description: 'Texto de la Opción 1: Acción o decisión basada en audacia / riesgo.'
              },
              option2Text: {
                type: Type.STRING,
                description: 'Texto de la Opción 2: Acción o decisión basada en cautela / investigación / lógica.'
              },
              option3Text: {
                type: Type.STRING,
                description:
                  'Texto de la Opción 3: Acción o decisión inesperada / cambio dimensional / giro de trama.'
              },
              endingType: {
                type: Type.STRING,
                description: 'Debe ser "NONE", "SUCCESS", "TRAGIC" o "PARADOX".'
              },
              endingTitle: {
                type: Type.STRING,
                description: 'Título del final si endingType no es NONE.'
              },
              endingSummary: {
                type: Type.STRING,
                description: 'Resumen del destino final alcanzado si endingType no es NONE.'
              },
              newCharacterName: {
                type: Type.STRING,
                description: 'Nombre de un personaje relevante introducido o actualizado en este capítulo.'
              },
              newCharacterRole: {
                type: Type.STRING,
                description: 'Rol del personaje en la trama.'
              },
              newCharacterStatus: {
                type: Type.STRING,
                description: 'Estado actual del personaje frente al protagonista.'
              },
              newItemName: {
                type: Type.STRING,
                description: 'Nombre de un objeto clave o pista obtenida en este capítulo.'
              },
              newItemOrigin: {
                type: Type.STRING,
                description: 'Breve origen o utilidad del objeto.'
              },
              keyEventSummary: {
                type: Type.STRING,
                description: 'Resumen en una frase del evento clave de este capítulo para el registro de continuidad.'
              },
              stabilityDelta: {
                type: Type.INTEGER,
                description: 'Cambio en la estabilidad dimensional (ej. -10, -5, +10).'
              }
            },
            required: [
              'title',
              'location',
              'dimensionState',
              'narrative',
              'hasAnomaly',
              'option1Text',
              'option2Text',
              'option3Text',
              'endingType',
              'keyEventSummary',
              'stabilityDelta'
            ]
          }
        }
      });

      const response = await Promise.race([geminiPromise, timeoutPromise]);
      const rawText = response.text;
      if (!rawText) {
        throw new Error('Empty response from Gemini model');
      }

      const parsed = JSON.parse(rawText.trim());
      const validEndings: EndingType[] = ['NONE', 'SUCCESS', 'TRAGIC', 'PARADOX'];
      const resolvedEnding: EndingType =
        shouldEndStory && forceEnding && validEndings.includes(forceEnding)
          ? forceEnding
          : validEndings.includes(parsed.endingType as EndingType) && shouldEndStory
          ? (parsed.endingType as EndingType)
          : 'NONE';

      const chapter: ChapterData = {
        chapterNumber,
        title: parsed.title || `Capítulo ${chapterNumber}`,
        location: parsed.location || 'Coordenada Temporal Primaria',
        dimensionState: parsed.dimensionState || 'Línea Temporal Activa',
        narrative: parsed.narrative,
        hasAnomaly: Boolean(parsed.hasAnomaly),
        anomalyNote: parsed.anomalyNote || undefined,
        options: [
          {
            number: 1,
            archetype: 'Audacia / Riesgo',
            text: parsed.option1Text || 'Avanzar desafiando las anomalías del sector.'
          },
          {
            number: 2,
            archetype: 'Cautela / Investigación / Lógica',
            text: parsed.option2Text || 'Analizar los patrones causales antes de continuar.'
          },
          {
            number: 3,
            archetype: 'Inesperada / Cambio Dimensional / Giro',
            text: parsed.option3Text || 'Saltar a una frecuencia cuántica divergente.'
          }
        ],
        endingType: resolvedEnding,
        endingTitle: parsed.endingTitle || undefined,
        endingSummary: parsed.endingSummary || undefined,
        continuityUpdates: {
          newCharacter:
            parsed.newCharacterName && parsed.newCharacterName.trim() !== ''
              ? {
                  name: parsed.newCharacterName,
                  role: parsed.newCharacterRole || 'Habitante del Multiverso',
                  status: parsed.newCharacterStatus || 'Activo'
                }
              : undefined,
          newItem:
            parsed.newItemName && parsed.newItemName.trim() !== ''
              ? {
                  name: parsed.newItemName,
                  origin: parsed.newItemOrigin || `Hallado en Cap. ${chapterNumber}`
                }
              : undefined,
          keyEvent: parsed.keyEventSummary || `Capítulo ${chapterNumber} superado`,
          stabilityDelta: typeof parsed.stabilityDelta === 'number' ? parsed.stabilityDelta : -6
        }
      };

      return res.json({ chapter, source: 'gemini' });
    } catch (error) {
      console.warn('Procedural narrative engine generating chapter (reason: ' + (error instanceof Error ? error.message : String(error)) + ')');
      const fallback = generateProceduralChapter({
        genreId,
        chapterNumber,
        history,
        continuity: safeContinuity,
        selectedOption,
        forceEnding: shouldEndStory ? forceEnding : 'NONE'
      });
      return res.json({ chapter: fallback, source: 'engine' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
