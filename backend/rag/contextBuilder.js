/**
 * Context Builder for ChronoMind AI RAG Architecture
 * Assembles token-aware, structured prompt contexts from top-ranked semantic memories,
 * pinned knowledge, active decisions, tasks, and user preferences for Gemini API requests.
 */

const { storeMemoryFact, getAllActiveFacts } = require('../services/memoryFactStore');

const MAX_CONTEXT_CHARS = 12000; // Safe character cap (~3000 tokens)

/**
 * Convert retrieved memories into structured facts with recency prioritization
 * and sync them into unique ID memory fact store
 * @param {Array<Object>} items - Candidate memory items
 * @param {string} [userId='default_user'] - User ID
 * @param {boolean} [shouldStore=false] - Whether to persist extracted facts to store
 * @returns {Promise<Object>} Structured facts { name, college, origin, education, skills, goals, age, preferences, tasks, metadataList }
 */
const extractStructuredFacts = async (items = [], userId = 'default_user', shouldStore = false) => {
  const facts = {
    name: '',
    college: '',
    origin: '',
    education: '',
    skills: '',
    goals: '',
    age: '',
    preferences: '',
    tasks: '',
    sister: '',
    brother: '',
    role: '',
    metadataList: [],
  };

  if (!Array.isArray(items) || items.length === 0) return facts;

  // Sort items newest first to ensure recency prioritization
  const sortedItems = items.slice().sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
    return timeB - timeA;
  });

  for (const item of sortedItems) {
    const text = `${item.title || ''}. ${item.content || ''}. ${item.transcript || ''}. ${item.notes || ''}`.trim();
    if (!text) continue;

    const source = item.sourceSession || item.category || 'voice';

    // 1. College extraction
    if (!facts.college) {
      const collegeMatch =
        text.match(/(?:my\s+)?college\s+(?:name\s+)?(?:is|:|=)?\s*([A-Za-z0-9_\s]+?)(?=\.|\,|\;|\!|\?|\s+and\b|\s+my\b|\s+is\b|\s+i\b|\s+age\b|\s+from\b|$)/i) ||
        text.match(/(?:at|in|going to)\s+([A-Za-z0-9_\s]{1,30}\s+(?:college|university|institute|school))/i) ||
        text.match(/(?:college|university|school|institute)\s*(?:is|:|=)\s*([A-Za-z0-9_\s]+?)(?=\.|\,|\;|\!|\?|\s+and\b|\s+my\b|$)/i);

      if (collegeMatch && collegeMatch[1]) {
        const val = collegeMatch[1].split('.')[0].split(',')[0].trim();
        if (val && !['a', 'an', 'the', 'is', 'in'].includes(val.toLowerCase())) {
          facts.college = val;
          if (shouldStore) {
            await storeMemoryFact({ userId, category: 'education', key: 'college', value: val, source });
          }
        }
      }
    }

    // 2. Sister name extraction
    if (!facts.sister) {
      const sisterMatch =
        text.match(/(?:sister(?:'s)?\s+name\s+(?:is|:|=)?|sister\s+(?:is|named))\s*([A-Za-z0-9_\s]+?)(?=\.|\,|\;|\!|\?|\s+and\b|\s+my\b|\s+is\b|\s+age\b|\s+college\b|\s+from\b|$)/i);
      if (sisterMatch && sisterMatch[1]) {
        const val = sisterMatch[1].trim();
        if (val && val.length <= 35) {
          facts.sister = val;
          if (shouldStore) {
            await storeMemoryFact({ userId, category: 'family', key: "sister's name", value: val, source });
            await storeMemoryFact({ userId, category: 'family', key: 'sister', value: val, source });
          }
        }
      }
    }

    // 3. Brother name extraction
    if (!facts.brother) {
      const brotherMatch =
        text.match(/(?:brother(?:'s)?\s+name\s+(?:is|:|=)?|brother\s+(?:is|named))\s*([A-Za-z0-9_\s]+?)(?=\.|\,|\;|\!|\?|\s+and\b|\s+my\b|\s+is\b|\s+age\b|\s+college\b|\s+from\b|$)/i);
      if (brotherMatch && brotherMatch[1]) {
        const val = brotherMatch[1].trim();
        if (val && val.length <= 35) {
          facts.brother = val;
          if (shouldStore) {
            await storeMemoryFact({ userId, category: 'family', key: "brother's name", value: val, source });
            await storeMemoryFact({ userId, category: 'family', key: 'brother', value: val, source });
          }
        }
      }
    }

    // 4. Role / Job extraction
    if (!facts.role) {
      const roleMatch =
        text.match(/(?:current\s+role|my\s+role|job|designation|working as|work as)\s+(?:is|:|=)?\s*([A-Za-z0-9_\s]+?)(?=\.|\,|\;|\!|\?|\s+and\b|\s+my\b|\s+at\b|\s+in\b|$)/i);
      if (roleMatch && roleMatch[1]) {
        const val = roleMatch[1].trim();
        if (val && val.length <= 40) {
          facts.role = val;
          if (shouldStore) {
            await storeMemoryFact({ userId, category: 'career', key: 'current role', value: val, source });
            await storeMemoryFact({ userId, category: 'career', key: 'role', value: val, source });
          }
        }
      }
    }

    // 5. Name extraction
    if (!facts.name) {
      const nameMatch =
        text.match(/(?:my name is|i am|i'm|name is|call me)\s+([A-Za-z0-9_\s]+?)(?=\.|\,|\;|\!|\?|\s+and\b|\s+my\b|\s+is\b|\s+age\b|\s+college\b|\s+from\b|\s+living\b|$)/i);

      if (nameMatch && nameMatch[1]) {
        const candidate = nameMatch[1].trim();
        const firstWord = candidate.split(' ')[0].toLowerCase();
        const forbidden = ['a', 'an', 'the', 'busy', 'student', 'learning', 'studying', 'preparing', 'working', 'from', 'currently', 'doing', 'pursuing', 'living', 'brother', 'sister'];
        if (!forbidden.includes(firstWord) && candidate.length <= 35) {
          facts.name = candidate;
          if (shouldStore) {
            await storeMemoryFact({ userId, category: 'personal', key: 'name', value: candidate, source });
          }
        }
      }
    }

    // 6. Origin / Location extraction
    if (!facts.origin) {
      const originMatch =
        text.match(/(?:from|living in|live in|located in|hometown is|native of|origin is|location is)\s+([A-Za-z0-9_\s]+?)(?=\.|\,|\;|\!|\?|\s+and\b|\s+my\b|\s+is\b|\s+college\b|$)/i) ||
        text.match(/i am from\s+([A-Za-z0-9_\s]{2,25})/i);

      if (originMatch && originMatch[1]) {
        const location = originMatch[1].split('.')[0].split(',')[0].trim();
        if (location && !['a', 'an', 'the', 'is', 'in'].includes(location.toLowerCase())) {
          facts.origin = location;
          if (shouldStore) {
            await storeMemoryFact({ userId, category: 'location', key: 'location', value: location, source });
          }
        }
      }
    }

    // 7. Education / Degree extraction
    if (!facts.education) {
      const eduMatch =
        text.match(/(?:pursuing|studying|enrolled in|degree in|doing|education is)\s+([A-Za-z0-9_.\s]+?)(?=\.|\,|\;|\!|\?|\s+and\b|\s+my\b|\s+at\b|\s+in\b|$)/i) ||
        text.match(/\b(BCA|MCA|B\.?Tech|M\.?Tech|B\.?Sc|M\.?Sc|MBA|Ph\.?D)\b/i);

      if (eduMatch) {
        const eduVal = (eduMatch[1] || eduMatch[0]).trim();
        facts.education = eduVal;
        if (shouldStore) {
          await storeMemoryFact({ userId, category: 'education', key: 'education', value: eduVal, source });
        }
      }
    }

    // 8. Skills extraction
    if (!facts.skills) {
      const skillMatch =
        text.match(/(?:learning|studying|working on|skills? in|skills? are)\s+([A-Za-z0-9_.\s]+?)(?=\.|\,|\;|\!|\?|\s+and\b|\s+my\b|$)/i) ||
        text.match(/\b(MERN stack|MERN|React|Node\.js|JavaScript|TypeScript|Python)\b/i);

      if (skillMatch && skillMatch[1]) {
        facts.skills = skillMatch[1].trim();
        if (shouldStore) {
          await storeMemoryFact({ userId, category: 'education', key: 'skills', value: skillMatch[1].trim(), source });
        }
      }
    }

    // 9. Goals extraction
    if (!facts.goals) {
      const goalMatch = text.match(/(?:preparing for|aiming for|goal is|target is)\s+([A-Za-z0-9_\s]+?)(?=\.|\,|\;|\!|\?|\s+and\b|\s+my\b|$)/i);
      if (goalMatch && goalMatch[1]) {
        facts.goals = goalMatch[1].trim();
        if (shouldStore) {
          await storeMemoryFact({ userId, category: 'goals', key: 'goals', value: goalMatch[1].trim(), source });
        }
      }
    }

    // 10. Age extraction
    if (!facts.age) {
      const ageMatch = text.match(/(?:my age is|i am|i'm|age:?)\s*(\d{1,2})\s*(?:years old|yrs old|yr old)?/i);
      if (ageMatch && ageMatch[1]) {
        const val = `${ageMatch[1]} years old`;
        facts.age = val;
        if (shouldStore) {
          await storeMemoryFact({ userId, category: 'personal', key: 'age', value: val, source });
        }
      }
    }

    // 11. Preferences extraction
    if (!facts.preferences) {
      const prefMatch = text.match(/(?:preference is|prefer|favorite is|likes?)\s+([A-Za-z0-9_\s]+?)(?=\.|\,|\;|\!|\?|\s+and\b|\s+my\b|$)/i);
      if (prefMatch && prefMatch[1]) {
        facts.preferences = prefMatch[1].trim();
        if (shouldStore) {
          await storeMemoryFact({ userId, category: 'preferences', key: 'preferences', value: prefMatch[1].trim(), source });
        }
      }
    }

    // 12. Tasks extraction
    if (!facts.tasks) {
      const taskMatch = text.match(/(?:task is|active task|todo is)\s+([A-Za-z0-9_\s]+?)(?=\.|\,|\;|\!|\?|\s+and\b|\s+my\b|$)/i);
      if (taskMatch && taskMatch[1]) {
        facts.tasks = taskMatch[1].trim();
        if (shouldStore) {
          await storeMemoryFact({ userId, category: 'tasks', key: 'tasks', value: taskMatch[1].trim(), source });
        }
      }
    }
  }

  return facts;
};

/**
 * Filter structured facts based on user query target
 * @param {Object} facts - Extracted structured facts
 * @param {string} query - User prompt/query
 * @returns {Object} Query-filtered structured facts object
 */
const filterFactsByQuery = (facts = {}, query = '') => {
  const lowerQ = query.toLowerCase();

  // Check if user is asking for everything / summary
  const isEverythingQuery =
    lowerQ.includes('everything') ||
    lowerQ.includes('all facts') ||
    lowerQ.includes('all memories') ||
    lowerQ.includes('what do you know') ||
    lowerQ.includes('remember about me') ||
    lowerQ.includes('tell me about me') ||
    lowerQ.includes('summary of me');

  if (isEverythingQuery) {
    const allFacts = {};
    for (const [key, val] of Object.entries(facts)) {
      if (val && typeof val === 'string' && val.trim() && key !== 'metadataList') {
        allFacts[key] = val.trim();
      }
    }
    return allFacts;
  }

  const filtered = {};

  const isCollegeQuery = lowerQ.includes('college') || lowerQ.includes('university') || lowerQ.includes('school') || lowerQ.includes('institute') || lowerQ.includes('campus');
  const isSisterQuery = lowerQ.includes('sister') || lowerQ.includes('behen') || lowerQ.includes('behan') || lowerQ.includes('bahan') || lowerQ.includes('bahn') || lowerQ.includes('behn') || lowerQ.includes('बहन') || lowerQ.includes('बहिन');
  const isBrotherQuery = lowerQ.includes('brother') || lowerQ.includes('bhai') || lowerQ.includes('bhaiya') || lowerQ.includes('bhiya') || lowerQ.includes('bhaia') || lowerQ.includes('भाई') || lowerQ.includes('भैया');
  const isRoleQuery = lowerQ.includes('role') || lowerQ.includes('job') || lowerQ.includes('designation') || lowerQ.includes('position');
  const isNameQuery = lowerQ.includes('name') || lowerQ.includes('who am i') || lowerQ.includes('who i am') || lowerQ.includes('call me') || lowerQ.includes('naam') || lowerQ.includes('nam') || lowerQ.includes('नाम');
  const isFromQuery = lowerQ.includes('where') || lowerQ.includes('from') || lowerQ.includes('live') || lowerQ.includes('location') || lowerQ.includes('hometown') || lowerQ.includes('native') || lowerQ.includes('city') || lowerQ.includes('state') || lowerQ.includes('kaha') || lowerQ.includes('kahan');
  const isEduQuery = lowerQ.includes('studying') || lowerQ.includes('pursuing') || lowerQ.includes('education') || lowerQ.includes('degree') || lowerQ.includes('bca') || lowerQ.includes('mca');
  const isSkillQuery = lowerQ.includes('learning') || lowerQ.includes('skill') || lowerQ.includes('working on') || lowerQ.includes('stack') || lowerQ.includes('tech');
  const isGoalQuery = lowerQ.includes('goal') || lowerQ.includes('preparing') || lowerQ.includes('target') || lowerQ.includes('aim');
  const isAgeQuery = lowerQ.includes('age') || lowerQ.includes('how old') || lowerQ.includes('umar') || lowerQ.includes('aayu');
  const isPrefQuery = lowerQ.includes('preference') || lowerQ.includes('favorite') || lowerQ.includes('like') || lowerQ.includes('pasand');
  const isTaskQuery = lowerQ.includes('task') || lowerQ.includes('todo') || lowerQ.includes('assignment');

  if (isSisterQuery) {
    const val = facts["sister's name"] || facts.sister_name || facts.sister;
    if (val) filtered["sister's name"] = val;
  }
  if (isBrotherQuery) {
    const val = facts["brother's name"] || facts.brother_name || facts.brother;
    if (val) filtered["brother's name"] = val;
  }
  if (isRoleQuery) {
    const val = facts["current role"] || facts.role || facts.current_role || facts.job;
    if (val) filtered.role = val;
  }
  if (isCollegeQuery && facts.college) {
    filtered.college = facts.college;
  }
  if (isNameQuery && !isSisterQuery && !isBrotherQuery && facts.name) {
    filtered.name = facts.name;
  }
  if (isFromQuery && facts.origin) {
    filtered.origin = facts.origin;
  }
  if (isEduQuery && (facts.education || facts.college)) {
    filtered.education = facts.education || facts.college;
  }
  if (isSkillQuery && facts.skills) {
    filtered.skills = facts.skills;
  }
  if (isGoalQuery && facts.goals) {
    filtered.goals = facts.goals;
  }
  if (isAgeQuery && facts.age) {
    filtered.age = facts.age;
  }
  if (isPrefQuery && facts.preferences) {
    filtered.preferences = facts.preferences;
  }
  if (isTaskQuery && facts.tasks) {
    filtered.tasks = facts.tasks;
  }

  for (const [k, v] of Object.entries(facts)) {
    if (v && typeof v === 'string' && v.trim() && k !== 'metadataList') {
      if (lowerQ.includes(k.toLowerCase())) {
        filtered[k] = v;
      }
    }
  }

  if (Object.keys(filtered).length > 0) {
    return filtered;
  }

  const nonEmptyFacts = {};
  for (const [key, val] of Object.entries(facts)) {
    if (val && typeof val === 'string' && val.trim() && key !== 'metadataList') {
      nonEmptyFacts[key] = val.trim();
    }
  }
  return nonEmptyFacts;
};

/**
 * Calculate an overall Context Confidence Score (0% to 100%)
 * @param {Array<Object>} rankedItems 
 * @returns {number} Confidence percentage integer
 */
const calculateContextConfidenceScore = (rankedItems) => {
  if (!Array.isArray(rankedItems) || rankedItems.length === 0) {
    return 0;
  }

  const avgScore =
    rankedItems.reduce((acc, item) => acc + (item.finalScore || item.similarityScore || 0.3), 0) /
    rankedItems.length;

  const topScore = Math.max(...rankedItems.map((i) => i.finalScore || i.similarityScore || 0));

  const blended = topScore * 0.6 + avgScore * 0.4;
  return Math.min(98, Math.max(15, Math.round(blended * 100)));
};

/**
 * Group ranked items into domain categories
 * @param {Array<Object>} rankedItems 
 * @returns {Object} Grouped items
 */
const groupContextByDomain = (rankedItems) => {
  const grouped = {
    personal: [],
    pinned: [],
    decisions: [],
    tasks: [],
    conversations: [],
    chatHistory: [],
    other: [],
  };

  if (!Array.isArray(rankedItems)) return grouped;

  for (const item of rankedItems) {
    if (
      item.type === 'personal_memory' ||
      item.category === 'Personal' ||
      item.sourceSession === 'Audio Voice Note' ||
      item.sourceSession?.toLowerCase().includes('audio') ||
      item.sourceSession?.toLowerCase().includes('vault') ||
      (item.title && (item.title.toLowerCase().includes('personal') || item.title.toLowerCase().includes('audio'))) ||
      (item.content && (
        /\bmy\b/i.test(item.content) ||
        /\bi am\b/i.test(item.content) ||
        /\bi'm\b/i.test(item.content) ||
        /\bpreparing\b/i.test(item.content) ||
        /\bpersonal\b/i.test(item.content) ||
        /\baudio note\b/i.test(item.content) ||
        item.content.toLowerCase().includes('name is')
      ))
    ) {
      grouped.personal.push(item);
    } else if (item.isPinned || item.type === 'pinned_memory') {
      grouped.pinned.push(item);
    } else if (item.type === 'decision') {
      grouped.decisions.push(item);
    } else if (item.type === 'task') {
      grouped.tasks.push(item);
    } else if (item.type === 'conversation' || item.type === 'meeting') {
      grouped.conversations.push(item);
    } else if (item.type === 'chat_history') {
      grouped.chatHistory.push(item);
    } else {
      grouped.other.push(item);
    }
  }

  return grouped;
};

/**
 * Build clean Markdown prompt context block for Gemini
 * @param {Object} params
 * @param {Array<Object>} params.rankedItems - Top re-ranked candidate memories
 * @param {Object} [params.userProfile] - User profile / preferences
 * @param {string} [params.basePrompt] - Optional existing system prompt
 * @param {string} [params.query] - User query for memory filtering
 * @param {string} [params.userId='default_user'] - User ID
 * @returns {Promise<Object>} Structured context payload { formattedPrompt, confidenceScore, itemCounts }
 */
const buildAugmentedContext = async ({ rankedItems = [], userProfile = null, basePrompt = '', query = '', userId = 'default_user' }) => {
  const confidenceScore = calculateContextConfidenceScore(rankedItems);
  const grouped = groupContextByDomain(rankedItems);

  const itemCounts = {
    total: rankedItems.length,
    personal: grouped.personal.length,
    pinned: grouped.pinned.length,
    decisions: grouped.decisions.length,
    tasks: grouped.tasks.length,
    conversations: grouped.conversations.length,
    chatHistory: grouped.chatHistory.length,
  };

  let contextString = '';

  // Extract structured facts from personal memories & retrieved items
  const allPersonalItems = [...grouped.personal, ...rankedItems];
  const extractedFacts = await extractStructuredFacts(allPersonalItems, userId);

  // Retrieve active memory facts from memory fact store for this user
  const activeStoreFacts = await getAllActiveFacts(userId);
  const activeStoreObj = {};
  for (const [k, fact] of Object.entries(activeStoreFacts)) {
    activeStoreObj[k] = fact.value;
  }

  const structuredFacts = {
    ...extractedFacts,
    ...activeStoreObj,
  };

  if (userProfile && userProfile.name && !structuredFacts.name) {
    structuredFacts.name = userProfile.name;
  }

  const filteredFacts = filterFactsByQuery(structuredFacts, query);

  // 1. Structured Personal Facts Context
  if (Object.keys(filteredFacts).length > 0) {
    contextString += `### 👤 Active Personal Facts\n`;
    contextString += `\`\`\`json\n${JSON.stringify(filteredFacts, null, 2)}\n\`\`\`\n\n`;
  }

  // 2. Relevant Conversations & Meeting Transcripts
  const convs = [...grouped.conversations, ...grouped.chatHistory];
  if (convs.length > 0) {
    contextString += `### 💬 Relevant Conversations & Transcripts\n`;
    convs.forEach((item, idx) => {
      contextString += `${idx + 1}. [${item.category || 'Conversation'}] **${item.title}**: ${item.content}\n`;
    });
    contextString += `\n`;
  }

  // 3. Pinned & Core Memories
  if (grouped.pinned.length > 0) {
    contextString += `### 📌 Pinned & Core Memories\n`;
    grouped.pinned.forEach((item, idx) => {
      contextString += `${idx + 1}. [${item.category || 'Core'}] **${item.title}**: ${item.content}\n`;
    });
    contextString += `\n`;
  }

  // 4. Personal Memory Vault & Voice Notes
  if (grouped.personal.length > 0) {
    contextString += `### 🎙️ Personal Vault & Audio Notes\n`;
    grouped.personal.forEach((item, idx) => {
      contextString += `${idx + 1}. **${item.title}**: ${item.content}\n`;
    });
    contextString += `\n`;
  }

  // 5. Relevant Decisions
  if (grouped.decisions.length > 0) {
    contextString += `### 🎯 Strategic Decisions\n`;
    grouped.decisions.forEach((item, idx) => {
      contextString += `${idx + 1}. **${item.title}**: ${item.content}\n`;
    });
    contextString += `\n`;
  }

  // 6. Active Tasks
  if (grouped.tasks.length > 0) {
    contextString += `### ⚡ Active Tasks\n`;
    grouped.tasks.forEach((item, idx) => {
      contextString += `${idx + 1}. **${item.title}**: ${item.content}\n`;
    });
    contextString += `\n`;
  }

  // Truncation & Compression Check
  if (contextString.length > MAX_CONTEXT_CHARS) {
    contextString = contextString.slice(0, MAX_CONTEXT_CHARS) + '\n...[Context compressed for length]';
  }

  // Final Assembly with Gemini System Framing
  const systemInstructionBlock = `
You are ChronoMind AI, an enterprise temporal intelligence and memory synthesizer.
You have access to the user's persistent long-term memory graph, conversations, meeting transcripts, decisions, and tasks.

==================================================
RETRIEVED MEMORY & CONVERSATION CONTEXT (Confidence: ${confidenceScore}%)
==================================================
${contextString ? contextString : 'No prior structured memories or relevant conversations retrieved for this query.'}
==================================================

STRICT INSTRUCTIONS FOR RESPONSE GENERATION:
1. If the user asks for a specific structured personal fact (e.g., "What is my name?", "What is my college?", "What is my sister's name?", "What is my current role?"), provide a direct, clean 1-sentence answer stating the fact.
2. If the user asks about past conversations, discussions, meeting details, or what someone said (e.g., "What did my brother say about my sister?", "What did I discuss with my brother?", "What task was given to Ragini?", "What was decided in the meeting?"), answer clearly using the relevant retrieved conversation context provided above.
3. Keep answers concise, natural, accurate, and direct.
4. Never return generic placeholders like "All active memory nodes have been queried." Answer directly based on the context.
`.trim();

  const fullAugmentedPrompt = basePrompt
    ? `${systemInstructionBlock}\n\n${basePrompt}`
    : systemInstructionBlock;

  return {
    systemInstructionBlock,
    fullAugmentedPrompt,
    contextString,
    confidenceScore,
    itemCounts,
    hasMemories: rankedItems.length > 0,
    structuredFacts,
    filteredFacts,
  };
};

module.exports = {
  buildAugmentedContext,
  calculateContextConfidenceScore,
  groupContextByDomain,
  extractStructuredFacts,
  filterFactsByQuery,
  MAX_CONTEXT_CHARS,
};

