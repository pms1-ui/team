const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { ListToolsRequestSchema, CallToolRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const fs = require("fs");
const path = require("path");
// const matter = require("gray-matter"); // Removed as requested

// Simple frontmatter parser if gray-matter is not available
function parseFrontmatter(content) {
  const matches = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!matches) return { data: {}, content };
  const yaml = matches[1];
  const data = {};
  yaml.split(/\r?\n/).forEach(line => {
    const [key, ...val] = line.split(":");
    if (key && val.length) {
      data[key.trim()] = val.join(":").trim();
    }
  });
  return { data, content: content.replace(matches[0], "").trim() };
}

const server = new Server(
  {
    name: "stitch-skills-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const SKILLS_DIR = path.join(__dirname, "..", ".agents", "skills");

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = [];
  try {
    if (fs.existsSync(SKILLS_DIR)) {
      const skills = fs.readdirSync(SKILLS_DIR);
      for (const skill of skills) {
        const skillPath = path.join(SKILLS_DIR, skill, "SKILL.md");
        if (fs.existsSync(skillPath)) {
          const content = fs.readFileSync(skillPath, "utf-8");
          const { data } = parseFrontmatter(content);
          tools.push({
            name: `skill_${skill.replace(/[:-]/g, "_")}`,
            description: data.description || `Execute the ${skill} skill`,
            inputSchema: {
              type: "object",
              properties: {
                task: { type: "string", description: "The specific task to perform relative to this skill" },
              },
              required: ["task"],
            },
          });
        }
      }
    }
  } catch (err) {
    console.error("Error reading skills:", err);
  }

  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const skillName = name.replace("skill_", "").replace(/_/g, (m) => {
      // This is a bit tricky to reverse. For now let's just find the matching folder.
      return "-"; // Defaulting back to dash
  });
  
  // Try to find the actual folder
  let actualSkill = "";
  if (fs.existsSync(SKILLS_DIR)) {
      const skills = fs.readdirSync(SKILLS_DIR);
      actualSkill = skills.find(s => s.replace(/[:-]/g, "_") === name.replace("skill_", "")) || "";
  }

  if (!actualSkill) {
    throw new Error(`Skill ${name} not found`);
  }

  const skillDir = path.join(SKILLS_DIR, actualSkill);
  const skillFile = path.join(skillDir, "SKILL.md");
  const skillContent = fs.readFileSync(skillFile, "utf-8");
  
  // Also gather workflows if they exist
  let workflows = "";
  const workflowDir = path.join(skillDir, "workflows");
  if (fs.existsSync(workflowDir)) {
      const files = fs.readdirSync(workflowDir);
      workflows = "\n\n### Workflows\n";
      for (const file of files) {
          if (file.endsWith(".md")) {
              const content = fs.readFileSync(path.join(workflowDir, file), "utf-8");
              workflows += `\n#### ${file}\n${content}\n`;
          }
      }
  }

  return {
    content: [
      {
        type: "text",
        text: `Successfully activated skill: ${actualSkill}\n\nTask: ${args.task}\n\n${skillContent}${workflows}`,
      },
    ],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Stitch Skills MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
