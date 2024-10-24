import { Session } from "./session";
import { RoleMessage, Tool } from "./interfaces";
import { readFileSync, statSync } from 'fs';
import { prompt } from '../framework/prompt';

import path from "path";
import { JSONSchema4 } from "json-schema";

export const role = (role: string, content: string): RoleMessage => ({ role, content });
export const system = (content: string): RoleMessage => role('system', content);
export const user = (content: string): RoleMessage => role('user', content);
export const assistant = (content: string): RoleMessage => role('assistant', content);
export const tool = (...tools): RoleMessage => ({
  role: 'assistant',
  tool_calls: tools.map(({ name, args }, i) => ({
    index: i,
    type: 'function',
    function:
    {
      name: name,
      arguments: args
    }
  }))
})

type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

export function last<Fns extends any[]>(
  promise: Promise<Fns>
): Promise<Fns extends [...infer _, infer L] ? Awaited<L> : never> {
  return promise.then(result => {
    if (Array.isArray(result)) {
      return result[result.length - 1];
    }
    return result;
  });
}

export const text = <T = string>(...context: RoleMessage[]) => prompt<T>()(...context);
export const schema = <T>(schema: JSONSchema4) => text<T>;
export const image = (prompt: string) => {
  return async function (session: Session): Promise<string> {
    return await session.image(prompt);
  }
}


export const tts = (prompt: string) => {
  // @ts-ignore
  return async function (session: Session = []): Promise<string> {
    return session.tts(prompt);
  }
}

const clearCounter = new Map()

export const clear = (n = 1) => async (s: Session) => {
  const c = clearCounter.get(s) ?? 0;
  if (c + 1 >= n) {
    s.clear()
    clearCounter.set(s, 0);
  } else {
    clearCounter.set(s, c + 1);
  }
}

export const file = (filePath: string): RoleMessage[] => {
  try {
    // Get file stats synchronously
    const fileStats = statSync(filePath);

    // Read the file contents synchronously
    const fileContent = readFileSync(filePath, 'utf-8');

    // Get file name and other details
    const fileName = path.basename(filePath);
    const fileSize = fileStats.size;
    const createdAt = fileStats.birthtime;
    const modifiedAt = fileStats.mtime;

    // Construct the system prompt with detailed file information
    const fileInfo = `
      File Stats:
      File Name: ${fileName}
      File Size: ${fileSize} bytes
      Created At: ${createdAt}
      Modified At: ${modifiedAt}
    `;

    // Return a system RoleMessage with detailed file information
    return [system(fileInfo.trim()), system(fileContent)];
  } catch (error) {
    console.error(`Failed to read file: ${error.message}`);
    return [system("Error: Unable to read file content.")];
  }
};

/**
 * Helper function that takes a JSON schema object and creates a new schema
 * that defines an array with exactly N items, where each item follows the provided schema.
 * @param {Object} schema - The JSON schema object
 * @param {Number} N - The number of items in the array
 * @returns {Object} - A new JSON schema that defines an array of N items following the input schema
 */
export function createArraySchema(items: Object, minItems: number, maxItems: number) {
  if (typeof items !== 'object' || items === null) {
    throw new Error('Invalid schema object');
  }

  if (typeof minItems !== 'number' || minItems <= 0) {
    throw new Error('N must be a positive integer');
  }

  if (typeof maxItems !== 'number' || maxItems <= 0) {
    throw new Error('N must be a positive integer');
  }

  // Return the new schema that contains an array of N items based on the original schema
  return {
    type: "array",
    items,
    minItems,
    maxItems
  };
}
