const dotenv = require('dotenv');
const fetch = require('node-fetch');

const API_URL = 'https://api.github.com';

dotenv.config();

class GithubActivity {
  constructor(username, organizations = []) {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('You need to supply an GitHub token');
    }
    if (!username) {
      throw new Error('You need to supply an username');
    }

    this.githubToken = githubToken;
    this.username = username;
    this.organizations = organizations;
  }

  async request(path, params) {
    const url = new URL(`${API_URL}/${path}`);
    if (params != null)
      Object.keys(params).forEach(key =>
        url.searchParams.append(key, params[key])
      );
    url.searchParams.append('per_page', 100);
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${this.githubToken}`
      }
    });
    return response.json();
  }

  async filter(filterDate) {
    const dateString = filterDate.toDateString();
    const activities = await this.request(`users/${this.username}/events`);
    const authoredIssues = await this.request(`search/issues`, {
      q: `author:${this.username}`
    });
    const assignedIssues = await this.request(`search/issues`, {
      q: `assignee:${this.username} not author:${this.username}`
    });
    const issues = (authoredIssues.items || []).concat(assignedIssues.items);
    // title, user.login, number
    return activities
      .filter(
        activity => new Date(activity.created_at).toDateString() === dateString
      )
      .concat(
        issues.filter(
          i =>
            i.state === 'open' ||
            new Date(i.closed_at).toDateString() === dateString
        )
      );
  }

  getRepoName(url) {
    const repoUrlParts = url.split('/');
    const repoName = repoUrlParts.pop();
    const ownerName = repoUrlParts.pop();

    return this.sanitizeRepoName({ name: `${ownerName}/${repoName}` });
  }

  sanitizeRepoName({ name }) {
    if (this.organizations.length === 0) {
      return name;
    }
    for (const orgName of this.organizations) {
      const orgPrefix = `${orgName}/`;
      const hasOrg = name.indexOf(orgPrefix) === 0;
      if (hasOrg) {
        return name;
      }
    }
    return '';
  }
}

module.exports = GithubActivity;
