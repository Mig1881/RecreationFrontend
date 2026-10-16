// vitest.setup.ts
import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extiende los matchers de Vitest con los de jest-dom (toBeInTheDocument, etc.)
expect.extend(matchers);