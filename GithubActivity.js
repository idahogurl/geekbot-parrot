const request = require('request-promise-native');
const { zonedTimeToUtc } = require('date-fns-tz');
const dotenv = require('dotenv');

dotenv.config();

const { GITHUB_TOKEN } = process.env.GITHUB_TOKEN;
const API_URL = 'https://api.github.com';

function gitHubRequest(endPoint) {
  return request({
    'url': `${API_URL}/${endPoint}`,
    'qs': {
      'access_token': GITHUB_TOKEN
    },
    'headers': {
      'User-Agent': 'Geekbot fill'
    },
    'json': true
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
    return activities.filter(
      activity =>
        zonedTimeToUtc(activity.created_at, 'Europe/London').toDateString() === dateString);
  }

  getRepoName(activity) {
    if (!activity) {
      return '';
    } 
    const { 'repo': name } = activity;
    
    return this.sanitizeRepoName(name);
  }

  async getIssueName({ repoName, issueNumber }) {
    if (!issueNumber) {
      return '';
    }
    try {
      const issue = await gitHubRequest(`repos/${repoName}/issues/${issueNumber}`);
      return issue.title;
    } catch (e) {
      return '';
    }
  }

  sanitizeRepoName(name) {
    if (this.organizations.length === 0) {
      return name;
    }
    for (const orgName of this.organizations) {
      const orgPrefix = `${orgName}/`;
      const hasOrg = name.search(orgPrefix) !== -1;
      if (hasOrg) {
        return name.replace(orgPrefix, '');
      }
    }
    return '';
  }
}

module.exports = GithubActivity;
