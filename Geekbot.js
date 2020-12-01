const dotenv = require('dotenv');
const chrono = require('chrono-node');
const GithubActivity = require('./GithubActivity');
const JiraClient = require('./jira');
const dayjs = require('dayjs');

dotenv.config();

class Geekbot {
  constructor(username, organizations = [], beforeDateText) {
    organizations = organizations.filter(orgName => !!orgName);
    this.jiraClient = new JiraClient({
      jiraToken: process.env.JIRA_TOKEN,
      jiraAccount: process.env.JIRA_ACCOUNT,
      jiraHost: process.env.JIRA_HOST,
      jiraProtocol: process.env.JIRA_PROTOCOL
    });
    this.githubActivity = new GithubActivity(
      username,
      organizations,
      this.jiraClient
    );
    this.beforeDate = dayjs(chrono.parseDate(beforeDateText));
  }

  async getWhatDidYouDo(separator) {
    console.log('Did Do');
    if (separator) {
      return this.outputActivities({
        filterDate: this.beforeDate,
        separator
      });
    }
    const activities = await this.getActivities(this.beforeDate);
    return activities.map(a => this.itemToText(a));
  }

  async getWhatWillYouDo(separator) {
    console.log('Will Do');
    const nextDay = this.beforeDate.add(1, 'day');
    if (separator) {
      return this.outputActivities({
        filterDate: nextDay,
        separator
      });
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
      i => filterTypes.includes(i.type) || i.isIssue
    );
    const processItems = await Promise.all(
      filtered.map(i => this.processItem(i))
    );
    return processItems.filter(i => i);
    // return processed.filter(
    //   (v, i, a) =>
    //     a.findIndex(
    //       t =>
    //         !t.issue ||
    //         !v.issue ||
    //         (t.issue &&
    //           v.issue &&
    //           t.action === v.action &&
    //           t.repoName === v.repoName &&
    //           t.issue.number === v.issue.number)
    //     ) === i
    // );
  }

  async processItem(item) {
    if (item.isIssue) {
      return this.processIssue(item);
    }
    return this.processActivity(item);
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
          transformed.action = 'Review';
          transformed.repoName = '';

          const number = this.jiraClient.getIssueNumber(refName);
          const title = await this.jiraClient.getIssueTitle(number);
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
      key,
      summary,
      status: { name: statusName }
    } = issue;

    return {
      action: statusName,
      repoName: '',
      issue: { number: key, title: summary, isIssue: true }
    };
  }

  issueToText(issue) {
    if (!issue) return '';
    const {
      action,
      repoName,
      issue: { number, title, isIssue }
    } = issue;

    return `*[${action}]* ${isIssue ? '' : 'PR '}${
      repoName === '' ? repoName : repoName + '#'
    }${number} - ${title}`;
  }

  itemToText(item) {
    if (item.issue.isIssue) {
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
