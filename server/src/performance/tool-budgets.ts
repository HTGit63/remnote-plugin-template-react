import { getToolMetadata, TOOL_METADATA } from '../tool-policy.js';

export interface ToolPerformanceBudget {
  toolName: string;
  budgetMs: number;
  category: string;
}

export function getToolPerformanceBudgetMs(toolName: string): number {
  return getToolMetadata(toolName).performanceBudgetMs;
}

export function listToolPerformanceBudgets(): ToolPerformanceBudget[] {
  return TOOL_METADATA.map((tool) => ({
    toolName: tool.name,
    budgetMs: tool.performanceBudgetMs,
    category: tool.category,
  }));
}
