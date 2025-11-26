// Simple script to call the fixImageUrl function
// Run with: node call-fix-url.js

const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

const firebaseConfig = {
  projectId: 'renomate-1b214'
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);
const fixImageUrl = httpsCallable(functions, 'fixImageUrl');

fixImageUrl({ projectId: 'ZOURUL7sMk5gnIjEe4dI' })
  .then((result) => {
    console.log('✅ Success!', result.data);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
  });


