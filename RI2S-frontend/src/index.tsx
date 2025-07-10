import * as React from 'react';
import { createRoot } from 'react-dom/client';
import LoginPage from './app/page';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

const root = createRoot(rootElement);
root.render(<LoginPage />);