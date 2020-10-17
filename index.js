const arg = require('arg');
const chalk = require('chalk');
const Geekbot = require('./Geekbot');
const dotenv = require('dotenv');

dotenv.config();

// eslint-disable-next-line no-process-env
const { GITHUB_TOKEN } = process.env;

async function outputActivity(geekbot) {
  const yesterday = await geekbot.getWhatDidYouDo('\n');
  const today = await geekbot.getWhatWillYouDo('\n');
  console.log(`
${chalk.bold.white('What did you do yesterday?')}
  ${yesterday}
${chalk.bold.white('What will you do today?')}
  ${today}
${chalk.bold.white('Anything blocking your progress?')}`);
}

async function run(args) {
  const geekbot = new Geekbot(
    args['--user'],
    args['--organizations'].split(','),
    args['--from']
  );

  await outputActivity(geekbot);
}

function main() {
  let args = {};

  try {
    args = arg({
      '--user': String,
      '--organizations': String,
      '--from': String,
      '--help': Boolean
    });
  } catch (error) {
    // Ignore unknown flag error
  }
  args = {
    '--organizations': '',
    '--from': 'yesterday',
    ...args
  };

  if (process.env.DEBUG) {
    args['--user'] = 'idahogurl';
    args['--organizations'] = 'healthline';
  }

  if (!args['--user'] || args['--help']) {
    console.log(`
      ${chalk.bold.white('Flags')}:
        --user          Github username. Required

        --organizations Which organizations to use when filtering github activity. It supports multiple organizations separated by commas (no spaces).
                        An username might acts as an organization, so bear that in mind. The repo names look like: 'orgName/repoName'.
                        Example: --organizations 'facebook,google'. Defaults to all organizations

        --from          Timeframe to look for Github activity. Defaults to yesterday (for each run). It supports natural language via https://github.com/wanasit/chrono

        --help          Print this help
      `);
    return process.exit();
  }

  return run(args);
}

main().catch(error =>
  console.error('An error ocurred trying to send the standup\n', error)
);
