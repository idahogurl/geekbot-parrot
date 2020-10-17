const dotenv = require('dotenv');
const chrono = require('chrono-node');

const GithubActivity = require('./GithubActivity');
const { getIssueTitle, getIssueNumber } = require('./jira');

dotenv.config();

class Geekbot {
  constructor(username, organizations = [], beforeDateText) {
    organizations = organizations.filter(orgName => !!orgName);

    this.githubActivity = new GithubActivity(username, organizations);
    this.beforeDate = chrono.parseDate(beforeDateText);
  }

  async getWhatDidYouDo(separator) {
    if (separator) {
      return this.outputActivities({ filterDate: this.beforeDate, separator });
    }
    const activities = await this.getActivities(this.beforeDate);
    return activities.map(a => this.itemToText(a));
  }

  async getWhatWillYouDo(separator) {
    const oneDay = 24 * 60 * 60 * 1000;
    const nextDay = new Date(this.beforeDate.getTime() + oneDay);
    if (separator) {
      return this.outputActivities({ filterDate: nextDay, separator });
    }
    const activities = await this.getActivities(nextDay);
    return activities.map(a => this.itemToText(a));
  }

  inOrganizations(activity) {
    return !!this.githubActivity.getRepoName(activity);
  }

  async outputActivities({ filterDate, separator = ', ' }) {
    const items = await this.getActivities(filterDate);
    const texts = items.filter(i => i).map(i => this.itemToText(i));
    return texts.join(separator);
  }

  async getActivities(filterDate) {
    const items = await this.githubActivity.filter(filterDate);
    // assigned, opened issue, don't duplicate PR & created branch if on same day
    const filterTypes = [
      'PushEvent',
      'CreateEvent',
      'PullRequestReviewCommentEvent'
    ];
    const filtered = items.filter(
      i => filterTypes.includes(i.type) || !i.payload
    );
    const processItems = await Promise.all(
      filtered.map(i => this.processItem(i))
    );
    const processed = processItems.filter(i => i);
    return processed.filter(
      (v, i, a) =>
        a.findIndex(
          t =>
            !t.issue ||
            !v.issue ||
            (t.issue &&
              v.issue &&
              t.action === v.action &&
              t.repoName === v.repoName &&
              t.issue.number === v.issue.number)
        ) === i
    );
  }

  async processItem(item) {
    if (item.payload) {
      return this.processActivity(item);
    }
    return this.processIssue(item);
  }

  async processActivity(activity) {
    const {
      payload,
      type,
      repo: { name }
    } = activity;
    const repoName = this.githubActivity.getRepoName(name);
    if (!repoName) return;

    const { ref: refName, ref_type: refType } = payload;
    const transformed = {};
    switch (type) {
      case 'PushEvent':
      case 'CreateEvent': {
        if (refType === 'branch') {
          transformed.action = 'in progress';
          transformed.repoName = '';

          const number = getIssueNumber(refName);
          const issue = await getIssueTitle(number);
          const title = issue.fields.summary;
          transformed.issue = { number, title, isIssue: true };
          return transformed;
        }
        return;
      }

      case 'PullRequestReviewCommentEvent': {
        const { pull_request: pullRequest } = payload;
        // check that I am not the author
        if (pullRequest.user.login !== this.githubActivity.username) {
          const { title, number } = pullRequest;
          transformed.action = 'reviewed';
          transformed.issue = { number, title, isIssue: true };
          transformed.repoName = repoName;
          return transformed;
        }
        return;
      }
      default:
        return;
    }
  }

  processIssue(issue) {
    const {
      pull_request: pullRequest,
      state,
      title,
      number,
      repository_url: repoUrl
    } = issue;
    const repoName = this.githubActivity.getRepoName(repoUrl);
    if (!repoName) {
      return;
    }

    return {
      action: state,
      repoName,
      issue: { number, title, isIssue: !pullRequest }
    };
  }

  issueToText(issue) {
    if (!issue) return '';
    const {
      action,
      repoName,
      issue: { number, title, isIssue }
    } = issue;

    return `*[${action}]* ${
      isIssue ? '' : 'PR '
    }${repoName}#${number} - ${title}`;
  }

  itemToText(item) {
    console.log('item', item);

    if (item.issue) {
      return this.issueToText(item);
    }
    return this.activityToText(item);
  }

  activityToText(activity) {
    if (!activity) return '';
    const { action, repoName, branchName, issue: pullRequest } = activity;

    if (pullRequest) {
      return `*[${action}]* PR ${repoName}#${pullRequest.number} - ${pullRequest.title}`;
    }
    return `*[${action}]* Branch ${branchName} on ${repoName}`;
  }

  resetCache() {
    this.activities = [];
  }
}

module.exports = Geekbot;
