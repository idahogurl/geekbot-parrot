const chrono = require('chrono-node');
const GithubActivity = require('./GithubActivity');
const { last } = require('lodash');


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
    const nextDay = new Date(this.beforeDate.getTime() + 24 * 60 * 60 * 1000);
    return this.outputActivities({ filterDate: nextDay,
      separator });
  }

  inOrganizations(activity) {
    return !!this.githubActivity.getRepoName(activity);
  }

  async outputActivities({ filterDate, separator = ', ' }) {
    const activities = await this.githubActivity.filter(filterDate);

    const texts = await Promise.all(activities.map(async a => {
      const activityText = await this.activityToText(a);
      return activityText;
    }));

    return texts.filter(t => t).join(separator);
  }

  async branchEventToText({ repoName, refName }) {
      const issueNumber = last(refName.split('-'));
      const issueName = await this.githubActivity.getIssueName({
        repoName,
        'issueNumber': last(refName.split('-'))
      });
    if (!issueName) return `Branch ${refName} on ${repoName}`;
    return `Issue ${repoName}#${issueNumber} - ${issueName}`;
  }

   activityToText(activity) {
    const { 'name': repoName } = this.githubActivity.getRepoName(activity);
    if (!repoName) return '';
    const { payload, type } = activity;
    const { 'ref': refName, 'ref_type': refType } = payload;

    switch (type) {
      case 'PushEvent':
      case 'CreateEvent': {
        if (refType === 'branch') {
          return this.branchEventToText({ repoName,
            refName });
        }
        return '';
      }
      case 'PullRequestEvent': {
        const { number, 'pull_request': pullRequest } = payload;
        return `PR ${repoName}#${number} - ${pullRequest.title}`;
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
