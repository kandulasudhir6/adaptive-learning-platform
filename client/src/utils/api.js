const API_BASE = '/api/v1';

/**
 * Enhanced fetch wrapper that attaches JWT and formats errors
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('alp_auth_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // If token expired or unauthorized, clear storage
      if (response.status === 401 && !endpoint.includes('/login')) {
        localStorage.removeItem('alp_auth_token');
        localStorage.removeItem('alp_user_data');
      }
      throw new Error(data.error || `HTTP ${response.status}: Request failed`);
    }

    return data;
  } catch (err) {
    throw err;
  }
}

export const api = {
  auth: {
    login: (credentials) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    getMe: () => request('/auth/me'),
    getDemoAccounts: () => request('/auth/demo-accounts'),
  },
  courses: {
    list: () => request('/courses'),
    getContent: (courseId) => request(`/courses/${courseId}/content`),
    getModule: (moduleId) => request(`/courses/modules/${moduleId}`),
    updateProgress: (moduleId, progressData) =>
      request(`/courses/modules/${moduleId}/progress`, {
        method: 'POST',
        body: JSON.stringify(progressData),
      }),
  },
  exams: {
    generateEntrance: (courseId) =>
      request('/exams/entrance/generate', {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      }),
    submitEntrance: (examSessionId, responses) =>
      request('/exams/entrance/submit', {
        method: 'POST',
        body: JSON.stringify({ examSessionId, responses }),
      }),
    requestAccess: (moduleId) =>
      request('/exams/request-access', {
        method: 'POST',
        body: JSON.stringify({ moduleId }),
      }),
    startPeriodic: (moduleId) =>
      request('/exams/periodic/start', {
        method: 'POST',
        body: JSON.stringify({ moduleId }),
      }),
    submitPeriodic: (examSessionId, responses) =>
      request('/exams/periodic/submit', {
        method: 'POST',
        body: JSON.stringify({ examSessionId, responses }),
      }),
  },
  mentor: {
    getRequests: () => request('/mentor/requests'),
    reviewRequest: (requestId, payload) =>
      request(`/mentor/requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    getRoster: () => request('/mentor/students'),
    getQuestionBank: () => request('/mentor/question-bank'),
  },
};
