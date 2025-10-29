console.log('🎨 Initializing Svelte app...');

import './app.css';
import App from './App.svelte';

console.log('📦 Imports loaded');

const appElement = document.getElementById('app');
console.log('🎯 App element:', appElement);

if (!appElement) {
  console.error('❌ App element not found!');
  throw new Error('App element not found');
}

console.log('🚀 Creating Svelte app instance...');
const app = new App({
  target: appElement
});

console.log('✅ Svelte app created successfully');

export default app;
