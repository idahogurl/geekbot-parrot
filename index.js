const arg = require('arg');
const chalk = require('chalk');
const Geekbot = require('./Geekbot');


async function outputActivity(geekbot) {
    // prettier-ignore
    console.log(`
${chalk.bold.white('What did you do yesterday?')}
  ${await geekbot.getWhatDidYouDo('\n  ')}
${chalk.bold.white('What will you do today?')}
  ${await geekbot.getWhatWillYouDo()}
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

async function main() {
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
  args['--user'] = 'idahogurl';
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

  await run(args);
}


main().catch(error =>
  console.error('An error ocurred trying to send the standup\n', error)
);
