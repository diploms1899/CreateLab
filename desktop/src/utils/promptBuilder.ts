/** Assembles the complete AI context from all sources. */
export interface PromptContext {
  project: {
    name: string;
    description: string;
    aiPersonality: string;
    hardware: Record<string, any>;
    codingStandards: string;
  };
  workspaceFiles: Record<string, string>;
  buildOutput: string;
  conversationHistory: { role: string; content: string }[];
}

export function buildSystemPrompt(ctx: PromptContext): string {
  const filesList = Object.keys(ctx.workspaceFiles)
    .map((p) => `  - ${p}`)
    .join("\n");

  return [
    `You are an AI instructor for the CoreV2 Summer Camp.`,
    ``,
    `PROJECT: ${ctx.project.name}`,
    `DESCRIPTION: ${ctx.project.description}`,
    ``,
    `YOUR PERSONALITY: ${ctx.project.aiPersonality}`,
    ``,
    `HARDWARE: ${JSON.stringify(ctx.project.hardware, null, 2)}`,
    ``,
    `CODING STANDARDS: ${ctx.project.codingStandards}`,
    ``,
    `WORKSPACE FILES:`,
    filesList || "  (empty workspace)",
    ``,
    ctx.buildOutput ? `BUILD OUTPUT:\n${ctx.buildOutput}` : "",
    ``,
    `RULES:`,
    `- Only modify files inside the active workspace.`,
    `- Present changes as diffs before applying.`,
    `- Explain reasoning before showing code.`,
    `- Be encouraging but precise.`,
  ]
    .filter(Boolean)
    .join("\n");
}
