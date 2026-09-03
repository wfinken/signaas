// Hand-written types for the build script, so the tests can use it without
// pulling Node's type definitions into the Worker's compilation.
import type { Category } from "../src/categories";

export declare class CorpusError extends Error {
  constructor(where: string, message: string);
}

export declare function parseCategory(text: string, file: string): Category;
export declare function listCategoryFiles(directory?: string): string[];
export declare function readCorpus(directory?: string): Category[];
export declare function render(categories: Category[]): string;
