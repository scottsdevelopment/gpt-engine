import { RoleMessage } from "../framework/interfaces";

export interface PromptMetadata {
  propertyName?: string;
  description?: string | ((entity: any) => RoleMessage[]);  // Updated to use RoleMessage
  instructions?: string;
  maxTokens?: number;  // Optional max token allocation per property
}

export function Prompt(description?: string | ((entity: any) => RoleMessage[]), instructions?: string, maxTokens?: number) {
  return function (target: any, propertyName?: string): void {
    if (propertyName) {
      const existingSummaries: PromptMetadata[] = Reflect.getMetadata('summaryFields', target) || [];
      existingSummaries.push({ propertyName, description, instructions, maxTokens });
      Reflect.defineMetadata('summaryFields', existingSummaries, target);
    } else {
      const classSummaries: PromptMetadata[] = Reflect.getMetadata('classSummary', target.prototype) || [];
      classSummaries.push({ description, instructions, maxTokens });
      Reflect.defineMetadata('classSummary', classSummaries, target.prototype);
    }
  };
}

