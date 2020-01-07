const request = require('request-promise-native');
const dotenv = require('dotenv');

dotenv.config();

// eslint-disable-next-line no-process-env
const { GITHUB_TOKEN } = process.env;
const API_URL = 'https://api.github.com';

function gitHubRequest(endPoint) {
  return request({
    url: `${API_URL}/${endPoint}`,
    qs: {
      // eslint-disable-next-line camelcase
      per_page: 100
    },
    headers: {
      'User-Agent': 'Geekbot fill',
      Authorization: `token ${GITHUB_TOKEN}`
    },
    json: true
  });
}

class GithubActivity {
  constructor(username, organizations = []) {
    if (!username) {
      throw new Error('You need to supply an username');
    }

    this.username = username;
    this.organizations = organizations;
  }

  async filter(filterDate) {
    const dateString = filterDate.toDateString();
    const activities = await gitHubRequest(`users/${this.username}/events`);
    const issues = await gitHubRequest(
      `search/issues?q=author:${this.username}`
    );

    // title, user.login, number
    return activities.
      filter(
        activity => new Date(activity.created_at).toDateString() === dateString
      ).
      concat(
        issues.items.filter(
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
