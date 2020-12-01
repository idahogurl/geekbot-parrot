const dotenv = require('dotenv');
const request = require('request-promise');
const API_URL = 'https://api.github.com';
const dayjs = require('dayjs');

dotenv.config();

class GithubActivity {
  constructor(username, organizations = [], jiraClient) {
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
    this.jiraClient = jiraClient;
  }

  async request(path, params) {
    const url = new URL(`${API_URL}/${path}`);
    if (params != null)
      Object.keys(params).forEach(key =>
        url.searchParams.append(key, params[key])
      );
    url.searchParams.append('per_page', 100);
    const response = await request(url, {
      headers: {
        Authorization: `token ${this.githubToken}`,
        ['User-Agent']: 'Geekbot Parrot'
      },
      json: true
    });
    return response;
  }

  async filter(filterDate) {
    const startDate = filterDate.startOf('D');
    const filterType =
      startDate.format('YYYY-MM-DD') ===
      dayjs()
        .subtract(1, 'day')
        .startOf('D')
        .format('YYYY-MM-DD')
        ? 'today'
        : 'tomorrow';
    const activities = await this.request(`users/${this.username}/events`, {
      json: true
    });

    const issues =
      filterType === 'today'
        ? await this.jiraClient.getDidDo(startDate)
        : await this.jiraClient.getWillDo(startDate);

    const dateString = startDate.toISOString();
    return activities.concat(issues).filter(activity => {
      const converted = dayjs(activity.created_at).toISOString();
      // console.log(converted, dateString);
      return converted === dateString;
    });
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
