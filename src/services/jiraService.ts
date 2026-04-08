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
      const response = await fetch(`${config.url}/rest/api/3/project/${config.projectKey}`, {
        headers: this.getHeaders(config),
      });
      if (!response.ok) throw new Error(`Jira API Error: ${response.statusText}`);
      return await response.json();
    } catch (error: any) {
      console.error("Jira Connection Test Failed:", error);
      throw error;
    }
  }

  /**
   * Create a new issue in Jira
   */
  async createIssue(task: Task, config: JiraConfig) {
    const body = {
      fields: {
        project: { key: config.projectKey },
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
        issuetype: { 
          name: task.status === 'Discovery' || task.status === 'Refinement' 
            ? (config.productIssueType || "Story") 
            : (config.engIssueType || "Task") 
        },
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
    const jql = `project = "${config.projectKey}" AND updated >= "-1d" ORDER BY updated DESC`;
    const response = await fetch(`${config.url}/rest/api/3/search?jql=${encodeURIComponent(jql)}`, {
      headers: this.getHeaders(config),
    });
    if (!response.ok) throw new Error(`Jira Search Error: ${response.statusText}`);
    return await response.json();
  }
}

export const jiraService = new JiraService();
