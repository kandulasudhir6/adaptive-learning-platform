import admin from 'firebase-admin';

// Check if we have the environment variable for the service account
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully.');
  } catch (error) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', error);
  }
} else {
  console.warn('WARNING: FIREBASE_SERVICE_ACCOUNT environment variable is missing.');
  console.warn('Firebase Admin is NOT initialized. Phone auth will fail.');
}

export default admin;
