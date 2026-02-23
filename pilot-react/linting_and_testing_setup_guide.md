# Setting Up Linting, Formatting, and Testing in React

This guide walks you through the steps we took to improve the code quality of the K-Pilot React project. You can follow these steps to set up **ESLint**, **Prettier**, and **Vitest** in any standard Vite + React + TypeScript project.

## 1. Why Do We Need These Tools?

- **ESLint:** Analyzes your code to find problems and enforce best practices (e.g., "Don't declare variables you never use," or "Make sure your React Hooks have all their dependencies").
- **Prettier:** An opinionated code formatter. It automatically fixes spacing, quotes, and punctuation so all developers on the team write code that looks exactly the same.
- **Vitest:** A fast testing framework (similar to Jest) built specifically for Vite projects.

---

## 2. Installing Dependencies

First, we installed the necessary Node packages. Run this in your terminal:

```bash
# Install ESLint and its React/TypeScript plugins
npm install -D eslint eslint-plugin-react-hooks eslint-plugin-react-refresh @typescript-eslint/eslint-plugin @typescript-eslint/parser

# Install Prettier and the ESLint config that prevents them from fighting over rules
npm install -D prettier eslint-config-prettier

# Install Vitest and React Testing Library for unit tests
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

---

## 3. Creating Configuration Files

Next, we need to tell these tools how to behave. Create these files in the root of your project:

### `.eslintrc.cjs`

This file configures ESLint to use the recommended rules for React and TypeScript.

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier', // This tells ESLint to let Prettier handle formatting
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
};
```

### `.prettierrc`

This file tells Prettier exactly how we want our code styled.

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100
}
```

### `.prettierignore`

Tells Prettier which folders to ignore (we don't want it formatting our compiled build files).

```text
dist
node_modules
public
```

---

## 4. Updating `package.json` Scripts

To make running these tools easy, we added custom scripts to our `package.json`:

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "type-check": "tsc --noEmit",
    "test": "npm run type-check && npm run lint && vitest run"
  }
```

Now you can run:

- `npm run format` to auto-format all your code.
- `npm run lint` to check for style/logic errors.
- `npm run test` to run type-checks, linters, and unit tests all at once.

---

## 5. Setting up Vitest

To configure Vitest, we updated `vite.config.ts` to include a test environment:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom', // Simulates a browser environment for React components
    css: true,
    setupFiles: './src/test/setup.ts',
  },
});
```

And we created a setup file at `src/test/setup.ts` to add custom DOM matchers (like `.toBeInTheDocument()`):

```typescript
import '@testing-library/jest-dom';
```

---

## 6. What Did We Fix in K-Pilot?

When we ran the linter for the first time, it caught several issues that we had to fix manually:

1.  **Duplicate Imports:** We had `import { FLIGHT_CONFIG } from '../constants/gameConstants'` and then imported other things from the same file on another line. We merged them into one import statement.
2.  **Unused Variables:** ESLint caught that we imported `React` in `ErrorBoundary.tsx` and `screen` in `KillCounter.test.tsx` but never actually used them. We deleted the unused imports.
3.  **Unsafe `any` Types:** In `BulletFactory.ts`, there was logic that bypassed TypeScript's checking using `(oldMat as any).color`. We rewrote this to safely check `if ('color' in oldMat)` instead.
4.  **Global Object Usage:** We replaced `window.location.reload()` with `globalThis.location.reload()` in the Error Boundary.

By making `npm run lint` pass perfectly with zero errors, we ensure the codebase remains clean and bug-free as it grows!
