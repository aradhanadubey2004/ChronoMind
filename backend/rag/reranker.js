/**
 * Reranker Service for ChronoMind AI RAG Architecture
 * Applies multi-factor scoring (vector similarity, recency decay, pinned status,
 * domain importance, confidence score) and deduplicates candidate items for LLM injection.
 */

/**
 * Detect query intent to route ranking logic
 * @param {string} query 
 * @returns {'PERSONAL' | 'TECHNICAL' | 'GENERAL'}
 */
const detectQueryIntent = (query) => {
  if (!query || typeof query !== 'string') return 'GENERAL';
  const lower = query.toLowerCase();

  const personalPatterns = [
    /\bmy\b/i,
    /\bme\b/i,
    /\bI\b/i,
    /\bam i\b/i,
    /\bdo i\b/i,
    /\bwhere do i\b/i,
    /\bwhat am i\b/i,
    /\bwhat is my\b/i,
    /\bwho am i\b/i,
    /\bpreparing for\b/i,
    /\bpersonal\b/i,
    /\bvoice note\b/i,
    /\baudio\b/i,
    /\bremember\b/i,
    /\bwhat do i\b/i,
    /\bwhen is my\b/i,
  ];

  if (personalPatterns.some((pattern) => pattern.test(lower))) {
    return 'PERSONAL';
  }

  const technicalKeywords = [
    'schema', 'database', 'postgres', 'timescaledb', 'sse', 'websocket',
    'argon2id', 'architecture', 'api', 'code', 'docker', 'cloud run',
    'decision tree', 'task', 'jwt', 'encryption', 'pbkdf2', 'monetization'
  ];
  if (technicalKeywords.some((kw) => lower.includes(kw))) {
    return 'TECHNICAL';
  }

  return 'GENERAL';
};

/**
 * Calculate recency boost based on document timestamp
 * @param {Date|string|number} date 
 * @returns {number} Boost score between 0.0 and 0.35
 */
const calculateRecencyBoost = (date) => {
  if (!date) return 0;
  const timestamp = new Date(date).getTime();
  if (isNaN(timestamp)) return 0;

  const now = Date.now();
  const ageInHours = Math.max(0, (now - timestamp) / (1000 * 60 * 60));

  // High boost for very recent memories (newly created voice notes)
  if (ageInHours < 1) return 0.35; // Within 1 hour
  if (ageInHours < 24) return 0.25; // Within 24 hours
  if (ageInHours < 168) return 0.15; // Within 7 days
  if (ageInHours < 720) return 0.08; // Within 30 days
  return 0.01;
};

/**
 * Get domain type priority weight:
 * Personal Memory > Pinned Memory > User Conversation > Tasks > Decisions > General Knowledge / Chat
 * @param {string} type 
 * @param {string} [category]
 * @returns {number} Type boost weight
 */
const getTypeWeight = (type, category) => {
  if (type === 'personal_memory' || category === 'Personal' || category === 'preference') {
    return 0.35; // Priority 1: Personal Memory
  }

  switch (type) {
    case 'pinned_memory':
      return 0.25; // Priority 2: Pinned Memory
    case 'conversation':
    case 'user_conversation':
      return 0.20; // Priority 3: User Conversation
    case 'task':
      return 0.15; // Priority 4: Tasks
    case 'decision':
      return 0.10; // Priority 5: Decisions
    case 'chat_history':
      return 0.05; // Priority 6: General Knowledge / Chat History
    default:
      return 0.02;
  }
};

/**
 * Re-rank candidate items retrieved from vector search
 * @param {Array<Object>} candidates - List of retrieved memory items
 * @param {Object} [options]
 * @param {string} [options.query] - User query string
 * @param {number} [options.topK=8] - Maximum top results to keep
 * @param {number} [options.minFinalScore=0.20] - Minimum composite score threshold
 * @returns {Array<Object>} Re-ranked and deduplicated top context items
 */
const rerankContextItems = (candidates, options = {}) => {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }

  const { query = '', topK = 8, minFinalScore = 0.20 } = options;
  const lowerQ = query.toLowerCase();
  const queryIntent = detectQueryIntent(query);

  const seenIds = new Set();
  const seenContents = new Set();
  const scoredItems = [];

  for (const item of candidates) {
    if (!item) continue;

    // Deduplication by ID
    const itemId = item.id || item._id?.toString();
    if (itemId && seenIds.has(itemId)) {
      continue;
    }

    // Deduplication by text signature
    const textSnippet = (item.content || item.title || '').trim().toLowerCase().slice(0, 80);
    if (textSnippet && seenContents.has(textSnippet)) {
      continue;
    }

    const itemText = `${item.title || ''} ${item.content || ''} ${item.transcript || ''} ${item.notes || ''}`.toLowerCase();
    const similarity = typeof item.similarityScore === 'number' ? item.similarityScore : 0.3;

    const isPersonalItem =
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
        item.content.toLowerCase().includes('name is') ||
        item.content.toLowerCase().includes('college')
      ));

    // Semantic Topic Boost based on query domain
    let topicBoost = 0;

    if (lowerQ.includes('college') || lowerQ.includes('university') || lowerQ.includes('school') || lowerQ.includes('institute')) {
      if (itemText.includes('college') || itemText.includes('university') || itemText.includes('school') || itemText.includes('lu')) {
        topicBoost = 0.50;
      }
    } else if (lowerQ.includes('name') || lowerQ.includes('who am i') || lowerQ.includes('call me')) {
      if (itemText.includes('name is') || itemText.includes('i am') || itemText.includes('call me') || itemText.includes('kittu') || itemText.includes('aradhana')) {
        topicBoost = 0.40;
      }
    } else if (lowerQ.includes('where') || lowerQ.includes('from') || lowerQ.includes('location') || lowerQ.includes('hometown') || lowerQ.includes('native')) {
      if (itemText.includes('from') || itemText.includes('living in') || itemText.includes('bihar')) {
        topicBoost = 0.40;
      }
    } else if (lowerQ.includes('learning') || lowerQ.includes('skills') || lowerQ.includes('working on') || lowerQ.includes('stack')) {
      if (itemText.includes('learning') || itemText.includes('mern') || itemText.includes('react')) {
        topicBoost = 0.40;
      }
    }

    // Intent specific adjustments
    let intentBoost = 0;
    if (queryIntent === 'PERSONAL') {
      if (isPersonalItem) {
        intentBoost = 0.45; // Massive boost for personal memory on personal questions
      } else {
        // Heavy penalty for non-personal technical items on personal questions
        intentBoost = -0.60;
      }
    } else if (queryIntent === 'TECHNICAL' && !isPersonalItem) {
      intentBoost = 0.10;
    }

    const pinnedBoost = item.isPinned ? 0.20 : 0;
    const recencyBoost = calculateRecencyBoost(item.createdAt || item.timestamp);
    const typeWeight = getTypeWeight(item.type, item.category);
    const confidenceScore = typeof item.score === 'number' && item.score <= 1.0 ? item.score * 0.10 : 0.05;

    // Composite Final RAG Score Calculation
    const finalScore = Number(
      (similarity * 0.35 + pinnedBoost + recencyBoost + typeWeight + confidenceScore + intentBoost + topicBoost).toFixed(4)
    );

    if (finalScore >= minFinalScore) {
      if (itemId) seenIds.add(itemId);
      if (textSnippet) seenContents.add(textSnippet);

      scoredItems.push({
        ...item,
        finalScore,
        rankingMetrics: {
          similarityScore: similarity,
          pinnedBoost,
          recencyBoost,
          typeWeight,
          confidenceScore,
          intentBoost,
          topicBoost,
        },
      });
    }
  }

  // Sort descending by composite final score, breaking ties by recency (newest first)
  scoredItems.sort((a, b) => {
    if (Math.abs(b.finalScore - a.finalScore) > 0.01) {
      return b.finalScore - a.finalScore;
    }
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  return scoredItems.slice(0, topK);
};

module.exports = {
  rerankContextItems,
  calculateRecencyBoost,
  getTypeWeight,
  detectQueryIntent,
};
