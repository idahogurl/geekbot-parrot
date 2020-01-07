const chrono = require('chrono-node');
const GithubActivity = require('./GithubActivity');

class Geekbot {
  constructor(username, organizations = [], beforeDateText) {
    organizations = organizations.filter(orgName => !!orgName);

    this.githubActivity = new GithubActivity(username, organizations);
    this.beforeDate = chrono.parseDate(beforeDateText);
  }

  getWhatDidYouDo(separator = '\n') {
    return this.outputActivities({ filterDate: this.beforeDate,
separator });
  }

  getWhatWillYouDo(separator = '\n') {
    const oneDay = 24 * 60 * 60 * 1000;
    const nextDay = new Date(this.beforeDate.getTime() + oneDay);
    return this.outputActivities({ filterDate: nextDay,
separator });
  }

  inOrganizations(activity) {
    return !!this.githubActivity.getRepoName(activity);
  }

  async outputActivities({ filterDate, separator = ', ' }) {
    const items = await this.githubActivity.filter(filterDate);
    const texts = await Promise.all(items.map(i => this.itemToText(i)));

    return texts.filter(t => t).join(separator);
  }

  issueToText(issue) {
    // issue or pr
    const {
      pull_request: pullRequest,
      state,
      title,
      number,
      repository_url: repoUrl
    } = issue;
    const repoName = this.githubActivity.getRepoName(repoUrl);
    if (!repoName) {
      return '';
    }

    if (pullRequest) {
      return `*[${state}]* PR ${repoName}#${number} - ${title}`;
    }
    return `*[${state}]* ${repoName}#${number} - ${title}`;
  }

  itemToText(item) {
    if (item.payload) {
      return this.activityToText(item);
    }
    return this.issueToText(item);
  }

  activityToText(activity) {
    const {
      payload,
      type,
      repo: { name }
    } = activity;
    const repoName = this.githubActivity.getRepoName(name);
    if (!repoName) return '';
    const { ref: refName, ref_type: refType } = payload;

    switch (type) {
      case 'PushEvent':
      case 'CreateEvent': {
        if (refType === 'branch') {
          return `*[created]* Branch ${refName} on ${repoName}`;
        }
        return '';
      }

      case 'PullRequestReviewCommentEvent': {
        const { pull_request: pullRequest } = payload;
        return `*[reviewed]* PR ${repoName}#${pullRequest.number} - ${pullRequest.title}`;
      }
      default:
        return '';
    }
  }

  resetCache() {
    this.activities = [];
  }
}

module.exports = Geekbot;
