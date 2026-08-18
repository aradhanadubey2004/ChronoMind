const { GoogleGenAI, Type } = require('@google/genai');
const { orchestrateRAGContext } = require('../rag/ragService');

/**
 * Standard model alias for ChronoMind AI analysis
 * As per guidelines, gemini-3.6-flash is used for basic text and structured JSON tasks.
 */
const GEMINI_MODEL = 'gemini-3.6-flash';

/**
 * Helper to initialize the GoogleGenAI client lazily using process.env.GEMINI_API_KEY
 */
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

/**
 * 1. Generate a structured meeting summary from a raw transcript with RAG context injection.
 * Output schema aligns cleanly with Conversation model.
 *
 * @param {string} transcript - Raw text or dialogue transcript of meeting
 * @param {string} [userId] - Optional authenticated user ID for RAG context retrieval
 * @returns {Promise<Object>} Structured meeting summary object
 */
const generateMeetingSummary = async (transcript, userId = null) => {
  if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
    throw new Error('Please provide a valid transcript for summary generation.');
  }

  try {
    const ai = getAiClient();

    // RAG Pipeline Context Augmentation
    let ragInstruction = 'Analyze meeting conversations accurately. Format responses strictly adhering to the requested JSON schema.';
    let ragMeta = null;

    if (userId) {
      try {
        ragMeta = await orchestrateRAGContext({
          userId,
          query: transcript,
          options: { basePrompt: ragInstruction },
        });
        if (ragMeta && ragMeta.systemInstructionBlock) {
          ragInstruction = `${ragMeta.systemInstructionBlock}\n\n${ragInstruction}`;
        }
      } catch (ragErr) {
        console.warn('[GeminiService] RAG context retrieval skipped for summary:', ragErr.message);
      }
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'A concise, professional title summarizing the meeting topic',
        },
        summary: {
          type: Type.STRING,
          description: 'Detailed executive summary of main discussion points and consensus reached',
        },
        keyPoints: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of main key takeaways and highlights',
        },
        category: {
          type: Type.STRING,
          description: 'Category: Architecture, Strategy, Product, Engineering, Financial, or General',
        },
        tags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Relevant tags (e.g. API, Database, Roadmap)',
        },
        contextSnippet: {
          type: Type.STRING,
          description: '1-2 sentence quick overview snippet for rapid search indexing',
        },
        notes: {
          type: Type.STRING,
          description: 'Additional qualitative observations or unresolved questions',
        },
        participants: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              role: { type: Type.STRING },
            },
            required: ['name'],
          },
          description: 'Speakers or participants identified in the transcript',
        },
      },
      required: ['title', 'summary', 'category', 'keyPoints'],
    };

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `You are an AI Memory Assistant for executive conversations. Analyze the following meeting transcript and produce a structured summary:\n\nTRANSCRIPT:\n${transcript}`,
      config: {
        systemInstruction: ragInstruction,
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.2,
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Gemini API returned an empty response.');
    }

    const parsedData = JSON.parse(textOutput.trim());

    // Clean defaults matching Conversation schema constraints
    const allowedCategories = ['Architecture', 'Strategy', 'Product', 'Engineering', 'Financial', 'General'];
    const finalCategory = allowedCategories.includes(parsedData.category) ? parsedData.category : 'General';

    return {
      title: parsedData.title || 'Executive Synapse Sync',
      summary: parsedData.summary || 'Summary unavailable',
      keyPoints: Array.isArray(parsedData.keyPoints) ? parsedData.keyPoints : [],
      category: finalCategory,
      tags: Array.isArray(parsedData.tags) ? parsedData.tags : [],
      contextSnippet: parsedData.contextSnippet || (parsedData.summary ? parsedData.summary.slice(0, 150) + '...' : ''),
      notes: parsedData.notes || '',
      participants: Array.isArray(parsedData.participants) ? parsedData.participants : [],
      rawResponse: textOutput,
      ragConfidenceScore: ragMeta?.confidenceScore || 0,
      recalledContextCount: ragMeta?.retrievedCount || 0,
    };
  } catch (error) {
    console.error('Error in geminiService.generateMeetingSummary:', error.message);
    throw new Error(`AI Summary Generation failed: ${error.message}`);
  }
};

/**
 * 2. Extract strategic or technical decisions from a meeting transcript with RAG context.
 *
 * @param {string} transcript - Raw text or transcript of conversation
 * @param {string} [userId] - Optional authenticated user ID for RAG context retrieval
 * @returns {Promise<Array<Object>>} List of extracted decision records
 */
const extractDecisions = async (transcript, userId = null) => {
  if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
    throw new Error('Please provide a valid transcript for decision extraction.');
  }

  try {
    const ai = getAiClient();

    let ragInstruction = 'Extract explicit and implicit decisions from conversations into structured corporate memory records.';

    if (userId) {
      try {
        const ragMeta = await orchestrateRAGContext({
          userId,
          query: transcript,
          options: { basePrompt: ragInstruction },
        });
        if (ragMeta && ragMeta.systemInstructionBlock) {
          ragInstruction = `${ragMeta.systemInstructionBlock}\n\n${ragInstruction}`;
        }
      } catch (ragErr) {
        console.warn('[GeminiService] RAG context retrieval skipped for decisions:', ragErr.message);
      }
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        decisions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Clear title of the decision made or choice selected',
              },
              description: {
                type: Type.STRING,
                description: 'Detailed rationale, context, and reasoning behind the decision',
              },
              status: {
                type: Type.STRING,
                description: 'Status: Executed, Evaluating, Simulated, or Archived',
              },
              impactScore: {
                type: Type.INTEGER,
                description: 'Estimated impact score from 1 (low) to 10 (critical)',
              },
              riskLevel: {
                type: Type.STRING,
                description: 'Risk rating: Low, Medium, High, or Critical',
              },
              author: {
                type: Type.STRING,
                description: 'Decision champion or executive owner if mentioned',
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              choices: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING, description: 'Option or alternative considered' },
                    selected: { type: Type.BOOLEAN, description: 'Whether this option was chosen' },
                    aiConfidence: { type: Type.NUMBER, description: 'Confidence score (0-100)' },
                    projectedOutcome: { type: Type.STRING, description: 'Expected outcome' },
                    riskIndex: { type: Type.NUMBER, description: 'Risk rating (0-100)' },
                  },
                  required: ['label'],
                },
              },
            },
            required: ['title', 'description'],
          },
        },
      },
      required: ['decisions'],
    };

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Analyze the following meeting transcript to extract all key strategic, architectural, or technical decisions made or under evaluation:\n\nTRANSCRIPT:\n${transcript}`,
      config: {
        systemInstruction: ragInstruction,
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.2,
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Gemini API returned an empty response.');
    }

    const parsedData = JSON.parse(textOutput.trim());
    const rawDecisions = Array.isArray(parsedData.decisions) ? parsedData.decisions : [];

    const validStatuses = ['Executed', 'Evaluating', 'Simulated', 'Archived'];
    const validRiskLevels = ['Low', 'Medium', 'High', 'Critical'];

    return rawDecisions.map((dec) => {
      const status = validStatuses.includes(dec.status) ? dec.status : 'Evaluating';
      const riskLevel = validRiskLevels.includes(dec.riskLevel) ? dec.riskLevel : 'Medium';
      const impactScore = Math.max(1, Math.min(10, parseInt(dec.impactScore, 10) || 5));

      return {
        title: dec.title || 'Untitled Decision',
        description: dec.description || '',
        status,
        impactScore,
        riskLevel,
        author: dec.author || 'Executive Committee',
        tags: Array.isArray(dec.tags) ? dec.tags : [],
        choices: Array.isArray(dec.choices) ? dec.choices : [],
      };
    });
  } catch (error) {
    console.error('Error in geminiService.extractDecisions:', error.message);
    throw new Error(`AI Decision Extraction failed: ${error.message}`);
  }
};

/**
 * 3. Extract actionable tasks and to-dos from a meeting transcript with RAG context.
 *
 * @param {string} transcript - Raw text or transcript of conversation
 * @param {string} [userId] - Optional authenticated user ID for RAG context retrieval
 * @returns {Promise<Array<Object>>} List of extracted task action items
 */
const extractTasks = async (transcript, userId = null) => {
  if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
    throw new Error('Please provide a valid transcript for task extraction.');
  }

  try {
    const ai = getAiClient();

    let ragInstruction = 'Extract concrete, assigned, or required action items from meeting discussions into structured tasks.';

    if (userId) {
      try {
        const ragMeta = await orchestrateRAGContext({
          userId,
          query: transcript,
          options: { basePrompt: ragInstruction },
        });
        if (ragMeta && ragMeta.systemInstructionBlock) {
          ragInstruction = `${ragMeta.systemInstructionBlock}\n\n${ragInstruction}`;
        }
      } catch (ragErr) {
        console.warn('[GeminiService] RAG context retrieval skipped for tasks:', ragErr.message);
      }
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        tasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Clear, actionable title for the task',
              },
              description: {
                type: Type.STRING,
                description: 'Detailed instructions, background, or acceptance criteria',
              },
              priority: {
                type: Type.STRING,
                description: 'High, Medium, or Low',
              },
              priorityScore: {
                type: Type.INTEGER,
                description: 'Calculated urgency/importance score from 1 to 100',
              },
              energyNeeded: {
                type: Type.STRING,
                description: 'High Focus, Medium Flow, or Low Energy / Quick',
              },
              deadline: {
                type: Type.STRING,
                description: 'Estimated deadline or due date mentioned (YYYY-MM-DD or relative string if any)',
              },
              aiScheduleRecommendation: {
                type: Type.STRING,
                description: 'Recommendation on when to execute based on cognitive load',
              },
            },
            required: ['title'],
          },
        },
      },
      required: ['tasks'],
    };

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Analyze the following meeting transcript and identify all explicit and implicit action items or tasks assigned:\n\nTRANSCRIPT:\n${transcript}`,
      config: {
        systemInstruction: ragInstruction,
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.2,
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Gemini API returned an empty response.');
    }

    const parsedData = JSON.parse(textOutput.trim());
    const rawTasks = Array.isArray(parsedData.tasks) ? parsedData.tasks : [];

    const validEnergies = ['High Focus', 'Medium Flow', 'Low Energy / Quick'];

    return rawTasks.map((t) => {
      let finalPriorityScore = 50;
      if (t.priorityScore !== undefined) {
        finalPriorityScore = Math.max(1, Math.min(100, parseInt(t.priorityScore, 10) || 50));
      } else if (t.priority) {
        const p = t.priority.toLowerCase();
        if (p === 'high' || p === 'urgent') finalPriorityScore = 85;
        else if (p === 'medium') finalPriorityScore = 50;
        else if (p === 'low') finalPriorityScore = 20;
      }

      const energyNeeded = validEnergies.includes(t.energyNeeded) ? t.energyNeeded : 'Medium Flow';

      let dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      if (t.deadline) {
        const parsedDate = new Date(t.deadline);
        if (!isNaN(parsedDate.getTime())) {
          dueDate = parsedDate;
        }
      }

      return {
        title: t.title || 'Action Item',
        description: t.description || '',
        priorityScore: finalPriorityScore,
        energyNeeded,
        status: 'todo',
        dueDate,
        aiScheduleRecommendation: t.aiScheduleRecommendation || 'Recommended for optimal deep work focus slot',
      };
    });
  } catch (error) {
    console.error('Error in geminiService.extractTasks:', error.message);
    throw new Error(`AI Task Extraction failed: ${error.message}`);
  }
};

/**
 * Helper to clean and format direct fact answers
 */
const formatFactAnswer = (rawText = '', query = '', filteredFacts = {}) => {
  const lowerQ = query.toLowerCase();

  // 1. Clean raw markdown/JSON dumps or technical phrases if any leaked in output
  let cleaned = rawText
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/###[\s\S]*?\n/g, '')
    .replace(/==================================/g, '')
    .replace(/All active memory nodes have been queried\.?/gi, '')
    .replace(/memory vault nodes are loaded\.?/gi, '')
    .replace(/decision trees are loaded\.?/gi, '')
    .replace(/I have analyzed your query\.?/gi, '')
    .trim();

  // 2. Memory Profile / Everything Query Check
  const isMemoryProfileQuery =
    lowerQ.includes('current memories') ||
    lowerQ.includes('active memories') ||
    lowerQ.includes('memory profile') ||
    lowerQ.includes('show my memories') ||
    lowerQ.includes('show active') ||
    lowerQ.includes('current memory');

  const isEverythingQuery =
    isMemoryProfileQuery ||
    lowerQ.includes('everything') ||
    lowerQ.includes('all facts') ||
    lowerQ.includes('all memories') ||
    lowerQ.includes('what do you know') ||
    lowerQ.includes('remember about me') ||
    lowerQ.includes('tell me about me') ||
    lowerQ.includes('summary of me');

  if (isEverythingQuery) {
    if (cleaned && !cleaned.includes('{') && !cleaned.includes('}')) {
      return cleaned;
    }

    const factEntries = Object.entries(filteredFacts);
    if (factEntries.length > 0) {
      const summaryLines = factEntries.map(([k, v]) => `- ${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`);
      const header = isMemoryProfileQuery ? 'Here are your current active memories:' : 'Here is everything I remember about you:';
      return `${header}\n${summaryLines.join('\n')}`;
    }
  }

  // 3. Structured Personal Memory Recall Handlers for direct profile fact queries
  const isSister =
    lowerQ.includes('sister') ||
    lowerQ.includes('behen') ||
    lowerQ.includes('behan') ||
    lowerQ.includes('bahan') ||
    lowerQ.includes('bahn') ||
    lowerQ.includes('behn') ||
    lowerQ.includes('बहन') ||
    lowerQ.includes('बहिन');

  const isBrother =
    lowerQ.includes('brother') ||
    lowerQ.includes('bhai') ||
    lowerQ.includes('bhaiya') ||
    lowerQ.includes('bhiya') ||
    lowerQ.includes('bhaia') ||
    lowerQ.includes('भाई') ||
    lowerQ.includes('भैया');

  const isNameOrQuestion =
    lowerQ.includes('name') ||
    lowerQ.includes('who') ||
    lowerQ.includes('naam') ||
    lowerQ.includes('nam') ||
    lowerQ.includes('नाम') ||
    lowerQ.includes('kya') ||
    lowerQ.includes('kaun');

  if (isSister && isNameOrQuestion) {
    const val = filteredFacts["sister's name"] || filteredFacts.sister_name || filteredFacts.sister;
    if (val) {
      if (val.toLowerCase().includes('sister') || val.toLowerCase().includes('name is')) {
        return val;
      }
      return `Your sister's name is ${val}.`;
    }
  }

  if (isBrother && isNameOrQuestion) {
    const val = filteredFacts["brother's name"] || filteredFacts.brother_name || filteredFacts.brother;
    if (val) {
      if (val.toLowerCase().includes('brother') || val.toLowerCase().includes('name is')) {
        return val;
      }
      return `Your brother's name is ${val}.`;
    }
  }

  if (
    (lowerQ.includes('my role') || lowerQ.includes('my job') || lowerQ.includes('work as') || lowerQ.includes('working as')) &&
    !lowerQ.includes('task')
  ) {
    const val = filteredFacts.role || filteredFacts.current_role || filteredFacts.job;
    if (val) {
      return `My current role is ${val}.`;
    }
  }

  if (
    lowerQ.includes('my college') || lowerQ.includes('my university') || lowerQ.includes('my school') || lowerQ.includes('my institute')
  ) {
    if (filteredFacts.college) {
      return `My college is ${filteredFacts.college}.`;
    }
  }

  if (
    !isSister &&
    !isBrother &&
    (lowerQ.includes('my name') || lowerQ.includes('who am i') || lowerQ.includes('call me') || lowerQ.includes('mera naam') || lowerQ.includes('mera nam') || lowerQ.includes('मेरा नाम') || lowerQ.includes('what is my name'))
  ) {
    if (filteredFacts.name) {
      return `Your name is ${filteredFacts.name}.`;
    }
  }

  if (lowerQ.includes('my age') || lowerQ.includes('how old am i') || lowerQ.includes('meri umar')) {
    if (filteredFacts.age) {
      return `My age is ${filteredFacts.age}.`;
    }
  }

  if (lowerQ.includes('where am i from') || lowerQ.includes('my location') || lowerQ.includes('my hometown') || lowerQ.includes('my native')) {
    if (filteredFacts.origin) {
      return `My location/hometown is ${filteredFacts.origin}.`;
    }
  }

  if (lowerQ.includes('my education') || lowerQ.includes('my degree') || lowerQ.includes('what am i studying') || lowerQ.includes('what am i pursuing')) {
    if (filteredFacts.education) {
      const edu = filteredFacts.education;
      if (edu.toLowerCase().startsWith('pursuing')) {
        return `I am ${edu}.`;
      }
      return `I am pursuing ${edu}.`;
    }
    if (filteredFacts.college) {
      return `My college is ${filteredFacts.college}.`;
    }
  }

  if (lowerQ.includes('my skill') || lowerQ.includes('what am i learning') || lowerQ.includes('what am i working on')) {
    if (filteredFacts.skills) {
      return `I am learning ${filteredFacts.skills}.`;
    }
  }

  if (lowerQ.includes('my goal') || lowerQ.includes('what am i preparing for') || lowerQ.includes('my target') || lowerQ.includes('my aim')) {
    if (filteredFacts.goals) {
      return `I am preparing for ${filteredFacts.goals}.`;
    }
  }

  if (lowerQ.includes('my preference') || lowerQ.includes('my favorite') || lowerQ.includes('what do i like')) {
    if (filteredFacts.preferences) {
      return `My preference is ${filteredFacts.preferences}.`;
    }
  }

  if (lowerQ.includes('my active task') || lowerQ.includes('my task list') || lowerQ.includes('my current task')) {
    if (filteredFacts.tasks) {
      return `My active task is ${filteredFacts.tasks}.`;
    }
  }

  // 4. For all other queries (including Hinglish/Hindi/English conversational queries, meeting details, assigned tasks),
  // return Gemini's context-grounded response.
  if (cleaned) {
    return cleaned;
  }

  return "I couldn't find any specific details about that in your saved memories or notes.";
};

/**
 * 4. Generate RAG-augmented conversational AI responses for Temporal Chat
 *
 * @param {Object} params
 * @param {string} params.prompt - Natural language user message/query
 * @param {string} params.userId - Authenticated user ID for vector memory retrieval
 * @param {Object} [params.options]
 * @returns {Promise<Object>} { responseText, confidenceScore, retrievedCount, domainsCovered }
 */
const generateTemporalChatResponse = async ({ prompt, userId, options = {} }) => {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('Prompt is required for chat generation.');
  }

  try {
    const ai = getAiClient();

    // Execute full RAG context orchestration pipeline
    const ragContext = await orchestrateRAGContext({
      userId,
      query: prompt,
      options,
    });

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: ragContext.fullAugmentedPrompt,
        temperature: 0.1,
      },
    });

    const rawOutput = response.text || "I couldn't find any specific details about that in your saved memories or notes.";
    const activeFacts = ragContext.filteredFacts || ragContext.structuredFacts || {};
    const finalFormattedText = formatFactAnswer(rawOutput, prompt, activeFacts);

    return {
      responseText: finalFormattedText,
      confidenceScore: ragContext.confidenceScore,
      retrievedCount: ragContext.retrievedCount,
      domainsCovered: ragContext.domainsCovered,
      recalledMemories: ragContext.rankedItems || [],
      filteredFacts: activeFacts,
    };
  } catch (error) {
    console.error('Error in geminiService.generateTemporalChatResponse:', error.message);
    throw new Error(`AI Chat generation failed: ${error.message}`);
  }
};

/**
 * 5. Analyze meeting transcript for full Meeting Intelligence
 * Generates Summary, Key Points, Decisions, Action Items, Deadlines, People Mentioned, and Memory Facts.
 */
const analyzeMeetingIntelligence = async (transcript, userId = null) => {
  if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
    throw new Error('Please provide a valid transcript for meeting intelligence analysis.');
  }

  try {
    const ai = getAiClient();

    let ragInstruction = 'Analyze executive and technical meeting transcripts. Extract comprehensive meeting intelligence accurately.';

    if (userId) {
      try {
        const ragMeta = await orchestrateRAGContext({
          userId,
          query: transcript,
          options: { basePrompt: ragInstruction },
        });
        if (ragMeta && ragMeta.systemInstructionBlock) {
          ragInstruction = `${ragMeta.systemInstructionBlock}\n\n${ragInstruction}`;
        }
      } catch (ragErr) {
        console.warn('[GeminiService] RAG context retrieval skipped for meeting intelligence:', ragErr.message);
      }
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'Short descriptive meeting title',
        },
        summary: {
          type: Type.STRING,
          description: 'Comprehensive executive summary of the meeting',
        },
        keyPoints: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Key discussion points and highlights',
        },
        decisions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Decision title or choice made' },
              context: { type: Type.STRING, description: 'Context or rationale' },
              impact: { type: Type.STRING, description: 'High, Medium, or Low' },
            },
            required: ['title'],
          },
          description: 'Important decisions agreed upon during the meeting',
        },
        actionItems: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              task: { type: Type.STRING, description: 'Task or action item description' },
              assignee: { type: Type.STRING, description: 'Person assigned to complete task' },
              deadline: { type: Type.STRING, description: 'Deadline or target date' },
              priority: { type: Type.STRING, description: 'High, Medium, or Low' },
            },
            required: ['task'],
          },
          description: 'Action items and tasks assigned during the meeting',
        },
        deadlines: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING, description: 'Description of milestone or deadline' },
              dateOrTimeframe: { type: Type.STRING, description: 'Target date, day, or timeframe' },
              owner: { type: Type.STRING, description: 'Person or team responsible' },
            },
            required: ['description'],
          },
          description: 'Deadlines and timelines mentioned in the meeting',
        },
        peopleMentioned: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Important people or team members mentioned in transcript',
        },
        memoryFacts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              key: { type: Type.STRING, description: 'Fact key, e.g. database, college, skills, goals' },
              value: { type: Type.STRING, description: 'Fact value, e.g. MongoDB Atlas, LU, MERN Stack' },
              category: { type: Type.STRING, description: 'personal, education, goals, location, preferences, or tasks' },
            },
            required: ['key', 'value'],
          },
          description: 'Important persistent user/project facts to store in long-term AI memory',
        },
        category: {
          type: Type.STRING,
          description: 'Architecture, Strategy, Product, Engineering, Financial, Personal, or General',
        },
      },
      required: ['title', 'summary', 'keyPoints', 'decisions', 'actionItems', 'deadlines', 'peopleMentioned', 'memoryFacts'],
    };

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `You are ChronoMind AI Meeting Intelligence Engine. Analyze the following meeting transcript and extract structured meeting intelligence including summary, key discussion points, important decisions, action items/tasks, deadlines, people mentioned, and memory facts to store in long-term AI memory.\n\nTRANSCRIPT:\n${transcript}`,
      config: {
        systemInstruction: ragInstruction,
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.1,
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Gemini API returned an empty response.');
    }

    const parsedData = JSON.parse(textOutput.trim());

    return {
      title: parsedData.title || 'Meeting Intelligence Log',
      summary: parsedData.summary || 'Summary unavailable',
      keyPoints: Array.isArray(parsedData.keyPoints) ? parsedData.keyPoints : [],
      decisions: Array.isArray(parsedData.decisions) ? parsedData.decisions : [],
      actionItems: Array.isArray(parsedData.actionItems) ? parsedData.actionItems : [],
      deadlines: Array.isArray(parsedData.deadlines) ? parsedData.deadlines : [],
      peopleMentioned: Array.isArray(parsedData.peopleMentioned) ? parsedData.peopleMentioned : [],
      memoryFacts: Array.isArray(parsedData.memoryFacts) ? parsedData.memoryFacts : [],
      category: parsedData.category || 'General',
    };
  } catch (error) {
    console.error('Error in geminiService.analyzeMeetingIntelligence:', error.message);
    throw new Error(`Meeting Intelligence analysis failed: ${error.message}`);
  }
};

module.exports = {
  generateMeetingSummary,
  extractDecisions,
  extractTasks,
  generateTemporalChatResponse,
  analyzeMeetingIntelligence,
};
