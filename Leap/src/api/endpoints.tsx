<<<<<<< HEAD

const BASE_URL = "http://127.0.0.1:8000"; // or your deployed backend URL

=======
export const BASE_URL = "http://127.0.0.1:8000"; 
>>>>>>> b74972c9 (main chla leave per)
const endpoints = {
  auth: {
    login: `${BASE_URL}/login`,
  },
  dashboard: {
    student: `${BASE_URL}/student`,
    teacher: `${BASE_URL}/teacher`,
  },
  schools: { 
    list: `${BASE_URL}/api/schools`,
    studentsBySchool: `${BASE_URL}/api/schools/students`,
  },
  batches: {
    get: `${BASE_URL}/api/batches`,
    create: `${BASE_URL}/api/batches`,
    update: (batchId: number) => `${BASE_URL}/api/batches/${batchId}`,
    delete: (batchId: number) => `${BASE_URL}/api/batches/${batchId}`,
    filterStudents: `${BASE_URL}/api/batches/students/filter`,
    classes: `${BASE_URL}/api/batches/classes`,
    sections: `${BASE_URL}/api/batches/sections`,
    sessions: `${BASE_URL}/api/batches/sessions`,
    all: `${BASE_URL}/api/batches/batches`,
    promote: `${BASE_URL}/api/batches/promote`,
  },
  quizzes: {
    create: `${BASE_URL}/api/quizzes/quiz`,
    getById: (quizId: number) => `${BASE_URL}/api/quizzes/quiz/${quizId}`,
    update: (quizId: number) => `${BASE_URL}/api/quizzes/quiz/${quizId}`,
    delete: (quizId: number) => `${BASE_URL}/api/quizzes/quiz/${quizId}`,
    getAll: `${BASE_URL}/api/quizzes/`,
    assignToBatch: `${BASE_URL}/api/quizzes/assign-quiz-to-batch`,
    assignedToStudent: (studentId: number) => `${BASE_URL}/api/quizzes/assigned-quizzes/${studentId}`,
    report: (quizId: number) => `${BASE_URL}/api/quizzes/report/${quizId}`,
    attempt: `${BASE_URL}/api/quizzes/attempt`,
    attemptsByQuiz: (quizId: number) => `${BASE_URL}/api/quizzes/attempts/${quizId}`,
    attemptCount: `${BASE_URL}/api/quizzes/attempt/count`,
    quizData: `${BASE_URL}/api/quizzes/quiz-data`,
    assignedToBatch: (batchId: number) => `${BASE_URL}/api/quizzes/assign-quiz-to-batch/batch/${batchId}`,

  },
  badges: {
    getByEmail: (email: string) => `${BASE_URL}/student/badges/${email}`,
  },
  projects: {
    upload: `${BASE_URL}/api/projects/upload-project`,
    count: (studentId: number) => `${BASE_URL}/api/projects/count/${studentId}`,
    languages: `${BASE_URL}/api/projects/languages`,
    topics: `${BASE_URL}/api/projects/topics`,
    fileTypes: `${BASE_URL}/api/projects/file-types`,
    subjects: `${BASE_URL}/api/projects/subjects`,
  },
  posts: {
    uploadImage: `${BASE_URL}/api/posts/upload-image`,
    create: `${BASE_URL}/api/posts/create`,
    latest: `${BASE_URL}/api/posts/latest`,
    all: `${BASE_URL}/api/posts/all`,
  },
};

export default endpoints;

