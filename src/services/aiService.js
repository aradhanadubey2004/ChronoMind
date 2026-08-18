/**
 * Frontend AI Service
 * Handles API calls to ChronoMind AI endpoints:
 * - POST /api/v1/ai/summary
 * - POST /api/v1/ai/decisions
 * - POST /api/v1/ai/tasks
 */

/**
 * Utility function to retrieve Authorization headers with JWT token
 */
export const ensureAuthToken = async () => {
  let token =
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('chronomind_token') ||
    localStorage.getItem('jwt') ||
    '';

  // Check if token exists and looks like a valid 3-part JWT
  if (token && typeof token === 'string' && token.split('.').length === 3) {
    return token;
  }

  // Token missing or invalid/dummy - request real signed JWT from backend
  try {
    const email = 'alex.vance@quantumtech.io';
    const password = 'password123';

    let res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    let data = await res.json();

    if (!res.ok || !data.token) {
      res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Alex Vance',
          email,
          password,
          role: 'Executive',
          company: 'Quantum Tech',
        }),
      });
      data = await res.json();
    }

    if (data && data.token) {
      token = data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('authToken', token);
      localStorage.setItem('chronomind_token', token);
      localStorage.setItem('jwt', token);
      return token;
    }
  } catch (err) {
    console.warn('[aiService] Auto auth token acquisition error:', err);
  }

  return token;
};

const getAuthHeaders = () => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('chronomind_token') ||
    localStorage.getItem('jwt') ||
    '';
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Authenticated Fetch Wrapper
 * Handles auto-attaching JWT headers and transparent retry if 401 Unauthorized occurs
 */
const fetchWithAuth = async (url, options = {}) => {
  await ensureAuthToken();

  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('chronomind_token') ||
    localStorage.getItem('jwt') ||
    '';

  const isFormData = options.body instanceof FormData;
  const customHeaders = options.headers || {};

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Clear stale or invalid token and re-authenticate with backend
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('chronomind_token');
    localStorage.removeItem('jwt');

    const newToken = await ensureAuthToken();
    const retryHeaders = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
      ...customHeaders,
    };

    response = await fetch(url, { ...options, headers: retryHeaders });
  }

  return response;
};

/**
 * 1. Generate structured meeting summary from conversation transcript
 * @param {string} transcript - Full conversation transcript
 */
export const generateMeetingSummary = async (transcript) => {
  if (!transcript || !transcript.trim()) {
    throw new Error('Transcript cannot be empty.');
  }

  const response = await fetchWithAuth('/api/v1/ai/summary', {
    method: 'POST',
    body: JSON.stringify({ transcript: transcript.trim() }),
  });

  const resData = await response.json();

  if (!response.ok || !resData.success || !resData.data) {
    throw new Error(resData.error || resData.message || 'Failed to generate meeting summary.');
  }

  return resData.data;
};

/**
 * 2. Extract key strategic decisions from conversation transcript
 * @param {string} transcript - Full conversation transcript
 */
export const extractDecisions = async (transcript) => {
  if (!transcript || !transcript.trim()) {
    throw new Error('Transcript cannot be empty.');
  }

  const response = await fetchWithAuth('/api/v1/ai/decisions', {
    method: 'POST',
    body: JSON.stringify({ transcript: transcript.trim() }),
  });

  const resData = await response.json();

  if (!response.ok || !resData.success || !resData.data) {
    throw new Error(resData.error || resData.message || 'Failed to extract decisions.');
  }

  return resData.data;
};

/**
 * 3. Extract actionable tasks and recommendations from conversation transcript
 * @param {string} transcript - Full conversation transcript
 */
export const generateTasks = async (transcript) => {
  if (!transcript || !transcript.trim()) {
    throw new Error('Transcript cannot be empty.');
  }

  const response = await fetchWithAuth('/api/v1/ai/tasks', {
    method: 'POST',
    body: JSON.stringify({ transcript: transcript.trim() }),
  });

  const resData = await response.json();

  if (!response.ok || !resData.success || !resData.data) {
    throw new Error(resData.error || resData.message || 'Failed to generate tasks.');
  }

  return resData.data;
};

/**
 * 4. Send RAG-augmented temporal chat prompt
 * @param {string} prompt - Natural language prompt or query
 * @param {Object} [options]
 * @param {boolean} [options.isAudio] - Whether this message came from an audio voice recording
 */
export const sendChatMessage = async (prompt, options = {}) => {
  if (!prompt || !prompt.trim()) {
    throw new Error('Prompt cannot be empty.');
  }

  const response = await fetchWithAuth('/api/v1/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      prompt: prompt.trim(),
      isAudio: !!options.isAudio,
      source: options.isAudio ? 'audio' : 'text',
      sourceSession: options.isAudio ? 'Audio Voice Note' : 'User Vault Note',
    }),
  });

  const resData = await response.json();

  if (!response.ok || !resData.success || !resData.data) {
    throw new Error(resData.error || resData.message || 'Failed to generate temporal chat response.');
  }

  return resData.data;
};

/**
 * 5. Fetch memory profile (active memories), memory timeline, and grouped memory history
 */
export const fetchMemoryFacts = async (key = '') => {
  const url = key ? `/api/v1/ai/memories?key=${encodeURIComponent(key)}` : '/api/v1/ai/memories';
  const response = await fetchWithAuth(url, {
    method: 'GET',
  });

  const resData = await response.json();

  if (!response.ok || !resData.success) {
    throw new Error(resData.error || resData.message || 'Failed to fetch memory facts.');
  }

  return resData;
};

/**
 * 6. Add or update a memory fact manually
 */
export const addMemoryFact = async (key, value, category = 'personal', source = 'text') => {
  const response = await fetchWithAuth('/api/v1/ai/memories', {
    method: 'POST',
    body: JSON.stringify({ key, value, category, source }),
  });

  const resData = await response.json();

  if (!response.ok || !resData.success) {
    throw new Error(resData.error || resData.message || 'Failed to create memory fact.');
  }

  return resData.data;
};

/**
 * 7. Analyze meeting transcript for Meeting Intelligence
 */
export const analyzeMeetingIntelligence = async (transcript, title = '', durationSeconds = 0) => {
  const response = await fetchWithAuth('/api/v1/meetings/analyze', {
    method: 'POST',
    body: JSON.stringify({ transcript, title, durationSeconds }),
  });

  const resData = await response.json();

  if (!response.ok || !resData.success) {
    throw new Error(resData.error || resData.message || 'Failed to analyze meeting intelligence.');
  }

  return resData.data;
};

/**
 * 8. Fetch meeting history
 */
export const fetchMeetings = async () => {
  const response = await fetchWithAuth('/api/v1/meetings', {
    method: 'GET',
  });

  const resData = await response.json();

  if (!response.ok || !resData.success) {
    throw new Error(resData.error || resData.message || 'Failed to fetch meetings.');
  }

  return resData.data || [];
};

/**
 * 9. Delete meeting record
 */
export const deleteMeeting = async (id) => {
  const response = await fetchWithAuth(`/api/v1/meetings/${id}`, {
    method: 'DELETE',
  });

  const resData = await response.json();

  if (!response.ok || !resData.success) {
    throw new Error(resData.error || resData.message || 'Failed to delete meeting record.');
  }

  return true;
};

/**
 * 9b. Delete meeting raw audio recording manually (preserving structured memories, tasks, decisions, transcript)
 */
export const deleteMeetingRecording = async (id) => {
  const response = await fetchWithAuth(`/api/v1/meetings/${id}/recording`, {
    method: 'DELETE',
  });

  const resData = await response.json();

  if (!response.ok || !resData.success) {
    throw new Error(resData.error || resData.message || 'Failed to delete meeting recording.');
  }

  return resData.data;
};

/**
 * 9c. Trigger automatic background cleanup of expired recordings
 */
export const triggerRecordingCleanup = async (forceAll = false) => {
  const response = await fetchWithAuth('/api/v1/meetings/cleanup-recordings', {
    method: 'POST',
    body: JSON.stringify({ forceAll }),
  });

  const resData = await response.json();

  if (!response.ok || !resData.success) {
    throw new Error(resData.error || resData.message || 'Failed to run recording cleanup.');
  }

  return resData.data;
};

/**
 * 9d. Update User Profile and Settings in Backend MongoDB
 */
export const updateUserSettings = async (profileData) => {
  const response = await fetchWithAuth('/api/v1/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });

  const resData = await response.json();

  if (!response.ok || !resData.success) {
    throw new Error(resData.error || resData.message || 'Failed to update user settings.');
  }

  return resData.user;
};

/**
 * 9e. Fetch Current User Profile from Backend
 */
export const fetchUserProfile = async () => {
  const response = await fetchWithAuth('/api/v1/auth/me', {
    method: 'GET',
  });

  const resData = await response.json();

  if (!response.ok || !resData.success) {
    throw new Error(resData.error || resData.message || 'Failed to fetch user profile.');
  }

  return resData.user;
};

/**
 * 10. Upload Document for Document Memory RAG
 */
export const uploadDocument = async (fileOrTextData) => {
  let response;

  if (fileOrTextData instanceof File) {
    const formData = new FormData();
    formData.append('file', fileOrTextData);

    response = await fetchWithAuth('/api/v1/documents/upload', {
      method: 'POST',
      body: formData,
    });
  } else {
    response = await fetchWithAuth('/api/v1/documents/upload', {
      method: 'POST',
      body: JSON.stringify(fileOrTextData),
    });
  }

  const resData = await response.json();

  if (!response.ok || !resData.success) {
    throw new Error(resData.error || resData.message || 'Failed to upload document.');
  }

  return resData.data;
};

/**
 * 11. Fetch User Uploaded Documents
 */
export const fetchDocuments = async (search = '') => {
  const url = search
    ? `/api/v1/documents?search=${encodeURIComponent(search)}`
    : '/api/v1/documents';

  const response = await fetchWithAuth(url, {
    method: 'GET',
  });

  const resData = await response.json();

  if (!response.ok || !resData.success) {
    throw new Error(resData.error || resData.message || 'Failed to fetch documents.');
  }

  return resData.data || [];
};

/**
 * 12. Delete Document
 */
export const deleteDocument = async (id) => {
  const response = await fetchWithAuth(`/api/v1/documents/${id}`, {
    method: 'DELETE',
  });

  const resData = await response.json();

  if (!response.ok || !resData.success) {
    throw new Error(resData.error || resData.message || 'Failed to delete document.');
  }

  return true;
};

/**
 * 13. Chat with Document Content
 */
export const chatWithDocument = async (message, documentId = null) => {
  const response = await fetchWithAuth('/api/v1/documents/chat', {
    method: 'POST',
    body: JSON.stringify({ message, documentId }),
  });

  const resData = await response.json();

  if (!response.ok || !resData.success) {
    throw new Error(resData.error || resData.message || 'Failed to get document chat response.');
  }

  return resData.data;
};

const aiService = {
  generateMeetingSummary,
  extractDecisions,
  generateTasks,
  sendChatMessage,
  fetchMemoryFacts,
  addMemoryFact,
  analyzeMeetingIntelligence,
  fetchMeetings,
  deleteMeeting,
  deleteMeetingRecording,
  triggerRecordingCleanup,
  updateUserSettings,
  fetchUserProfile,
  uploadDocument,
  fetchDocuments,
  deleteDocument,
  chatWithDocument,
};

export default aiService;
