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
    requestOtp: (email) =>
      request('/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
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

    // Faculty QR Authentication
    initiateFacultyQR: () =>
      request('/auth/faculty-qr/initiate', {
        method: 'POST',
      }),
    checkFacultyQR: (token) => request(`/auth/faculty-qr/status/${token}`),
    verifyFacultyQR: (payload) =>
      request('/auth/faculty-qr/verify', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
  courses: {
    list: () => request('/courses'),
    getFaculties: () => request('/courses/faculties'),
    enroll: (courseId, facultyId) =>
      request(`/courses/${courseId}/enroll`, {
        method: 'POST',
        body: JSON.stringify({ facultyId }),
      }),
    getContent: (courseId) => request(`/courses/${courseId}/content`),
    getMyRoadmap: (courseId) => request(`/courses/${courseId}/roadmap`),
    getModule: (moduleId) => request(`/courses/modules/${moduleId}`),
    updateProgress: (moduleId, progressData) =>
      request(`/courses/modules/${moduleId}/progress`, {
        method: 'POST',
        body: JSON.stringify(progressData),
      }),
  },
  code: {
    run: (payload) =>
      request('/code/run', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
  exams: {
    generateEntrance: (courseId) =>
      request('/exams/entrance/generate', {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      }),
    submitEntrance: (examSessionId, responses, codingSubmission) =>
      request('/exams/entrance/submit', {
        method: 'POST',
        body: JSON.stringify({ examSessionId, responses, codingSubmission }),
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
  faculty: {
    getOverview: () => request('/faculty/overview'),
    getMyStudents: () => request('/faculty/my-students'),
    getStudentLogins: (studentId) => request(`/faculty/student/${studentId}/logins`),
    getStudentRoadmap: (studentId) => request(`/faculty/student/${studentId}/roadmap`),
    updateStudentRoadmap: (roadmapId, payload) =>
      request(`/faculty/roadmap/${roadmapId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    getSubjects: () => request('/faculty/subjects'),
    uploadSubject: (payload) =>
      request('/faculty/subjects', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getRequests: () => request('/faculty/requests'),
    reviewRequest: (requestId, payload) =>
      request(`/faculty/requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
  },
};
