# Stitch Agent Skills Implementation

All Stitch Agent Skills have been successfully installed and a custom MCP server has been created to expose them as tools.

## 1. Installed Skills
The following skills are now available in your project at `c:/Users/childy/Documents/KIRO/team/.agents/skills/`:

| Skill | Purpose |
| :--- | :--- |
| **stitch-design** | Unified entry point for UI/UX design work. |
| **enhance-prompt** | Refines vague ideas into high-fidelity Stitch prompts. |
| **design-md** | Synthesizes a semantic design system into `DESIGN.md`. |
| **react:components** | Converts Stitch designs into modular React components. |
| **stitch-loop** | Iteratively builds multi-page websites autonomously. |
| **taste-design** | Enforces premium UI standards and anti-generic styles. |
| **shadcn-ui** | Expert guidance for integrating shadcn/ui components. |
| **remotion** | Generates walkthrough videos for your designs. |

## 2. Using the Stitch Skills MCP Server
I have created a dedicated MCP server that wraps these skills into structured tools. You can add this server to your IDE (VS Code, Cursor, etc.) to allow all agents to benefit from these high-level workflows.

### Configuration for your IDE:
Add the following to your `mcp_config.json` (or equivalent IDE settings):

```json
{
  "mcpServers": {
    "stitch-skills": {
      "command": "node",
      "args": ["c:/Users/childy/Documents/KIRO/team/stitch-skills-mcp/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## 3. How to Execute
Once the server is configured, you (or I) can call tools like:
- `skill_stitch_design`: "Plan a new dashboard for a financial app"
- `skill_react_components`: "Covert the Home screen to React"
- `skill_enhance_prompt`: "I want a dark mode landing page"

These tools will return a **Mission Control** document containing specific instructions, references, and workflows to ensure the highest quality output.

## 4. Internal Application
As **Antigravity**, I have automatically applied these skills to my internal processing. When you ask me to do design work, I will now automatically:
1.  **Enhance your prompts** using the `enhance-prompt` terminology.
2.  **Consult your `DESIGN.md`** (or create one) before generating new screens.
3.  **Follow the `stitch-design` workflow** for better consistency.
