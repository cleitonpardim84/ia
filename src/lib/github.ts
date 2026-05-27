const GITHUB_API = "https://api.github.com";

type GitHubConfig = {
  token: string;
  owner: string;
  repo: string;
  projectNumber?: string;
};

export function getGitHubConfig(): GitHubConfig | null {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  if (!token || !owner || !repo) return null;

  return {
    token,
    owner,
    repo,
    projectNumber: process.env.GITHUB_PROJECT_NUMBER,
  };
}

async function githubFetch(path: string, init?: RequestInit) {
  const config = getGitHubConfig();
  if (!config) {
    throw new Error("GitHub nao configurado. Defina GITHUB_TOKEN, GITHUB_OWNER e GITHUB_REPO.");
  }

  const response = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body}`);
  }

  return response.json();
}

export async function listOpenIssues() {
  const config = getGitHubConfig();
  if (!config) return [];

  return githubFetch(
    `/repos/${config.owner}/${config.repo}/issues?state=open&per_page=20`,
  ) as Promise<
    Array<{
      id: number;
      number: number;
      title: string;
      html_url: string;
      state: string;
      labels: Array<{ name: string }>;
    }>
  >;
}

export async function getProjectSummary() {
  const config = getGitHubConfig();
  if (!config?.projectNumber) {
    return { configured: false as const };
  }

  const data = await githubFetch(
    `/orgs/${config.owner}/projects?per_page=1`,
  ).catch(() =>
    githubFetch(`/users/${config.owner}/projects?per_page=1`),
  );

  return {
    configured: true as const,
    owner: config.owner,
    repo: config.repo,
    projectNumber: config.projectNumber,
    projectsPreview: data,
    docsUrl:
      "https://docs.github.com/pt/issues/planning-and-tracking-with-projects",
  };
}
