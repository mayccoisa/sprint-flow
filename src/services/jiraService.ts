import { JiraConfig, Task } from "@/types";

/**
 * Jira Service for handling Cloud REST API integration.
 * Note: Browser-based calls to Jira Cloud usually face CORS restrictions.
 * In a production app, these should be proxied through a backend/edge function.
 */
class JiraService {
  private getHeaders(config: JiraConfig) {
    const auth = btoa(`${config.email}:${config.apiToken}`);
    return {
      "Authorization": `Basic ${auth}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
    };
  }

  /**
   * Test connection by fetching project metadata
   */
  async testConnection(config: JiraConfig) {
    try {
      // Test the first project key (Product)
      const response = await fetch(`${config.url}/rest/api/3/project/${config.productProjectKey}`, {
        headers: this.getHeaders(config),
      });
      if (!response.ok) throw new Error(`Jira API Error (Product Project): ${response.statusText}`);
      
      // If different, test the second project key (Engineering)
      if (config.engProjectKey !== config.productProjectKey) {
        const engResponse = await fetch(`${config.url}/rest/api/3/project/${config.engProjectKey}`, {
          headers: this.getHeaders(config),
        });
        if (!engResponse.ok) throw new Error(`Jira API Error (Engineering Project): ${engResponse.statusText}`);
      }

      return { status: "Connected" };
    } catch (error: any) {
      console.error("Jira Connection Test Failed:", error);
      throw error;
    }
  }

  /**
   * Create a new issue in Jira
   */
  async createIssue(task: Task, config: JiraConfig) {
    const isProduct = ['Discovery', 'Refinement'].includes(task.status);
    const projectKey = isProduct ? config.productProjectKey : config.engProjectKey;
    const issueTypeStr = isProduct ? config.productIssueTypes : config.engIssueTypes;
    
    // Use the first issue type from the comma-separated list
    const issueType = issueTypeStr.split(',')[0].trim() || (isProduct ? "Story" : "Task");

    const body = {
      fields: {
        project: { key: projectKey },
        summary: task.title,
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: task.description || "No description provided." }],
            },
          ],
        },
        issuetype: { name: issueType },
      },
    };

    try {
      const response = await fetch(`${config.url}/rest/api/3/issue`, {
        method: "POST",
        headers: this.getHeaders(config),
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.errors ? Object.values(errData.errors).join(", ") : response.statusText);
      }
      return await response.json();
    } catch (error: any) {
      console.error("Jira Create Issue Failed:", error);
      throw error;
    }
  }

  /**
   * Update issue status (transitions)
   */
  async updateStatus(jiraKey: string, statusName: string, config: JiraConfig) {
    // 1. Get available transitions for the issue
    const transitionsRes = await fetch(`${config.url}/rest/api/3/issue/${jiraKey}/transitions`, {
      headers: this.getHeaders(config),
    });
    const { transitions } = await transitionsRes.json();
    
    // 2. Find transition that matches the status name
    const transition = transitions.find((t: any) => t.name.toLowerCase().includes(statusName.toLowerCase()));
    if (!transition) return null;

    // 3. Perform transition
    await fetch(`${config.url}/rest/api/3/issue/${jiraKey}/transitions`, {
      method: "POST",
      headers: this.getHeaders(config),
      body: JSON.stringify({ transition: { id: transition.id } }),
    });
  }

  /**
   * Fetch recent updates from Jira for inbound sync
   */
  async fetchUpdates(config: JiraConfig) {
    const projects = Array.from(new Set([config.productProjectKey, config.engProjectKey]));
    const projectFilter = projects.map(p => `project = "${p}"`).join(" OR ");
    
    const jql = `(${projectFilter}) AND updated >= "-1d" ORDER BY updated DESC`;
    const response = await fetch(`${config.url}/rest/api/3/search?jql=${encodeURIComponent(jql)}`, {
      headers: this.getHeaders(config),
    });
    if (!response.ok) throw new Error(`Jira Search Error: ${response.statusText}`);
    return await response.json();
  }

  /**
   * Get specific issue status
   */
  async getIssueStatus(jiraKey: string, config: JiraConfig) {
    try {
      const response = await fetch(`${config.url}/rest/api/3/issue/${jiraKey}?fields=status`, {
        headers: this.getHeaders(config),
      });
      if (!response.ok) throw new Error(`Jira API Error: ${response.statusText}`);
      const data = await response.json();
      return data.fields.status.name;
    } catch (error) {
      console.error(`Error fetching status for ${jiraKey}:`, error);
      return null;
    }
  }
}

export const jiraService = new JiraService();
