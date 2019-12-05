
# [geekbot](https://geekbot.io/) parrot


Tired of having to remember and manually enter what you did yesterday for Geekbot standups?Run this script and to list your GitHub activity that you can copy/paste into Slack.


## Installation
1. git clone geekbot-parrot repository
2. npm install or yarn install
3. Create a GitHub [personal access token](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line) with `repo` scope
4. Copy the generated personal access token
4. Create `.env` file in your `geekbot-parrot` directory
5. Paste personal access token into your `.env` file
6. Type `GITHUB_TOKEN=` before your personal access token

## Run

### With NPX

```bash
$ npx geekbot-parrot --user [GitHub Username]
```
### With Yarn
```bash
$ yarn geekbot-parrot --user [GitHub Username]
```

### With Package Script
1. Open package.json 
2. Under `scripts` locate the `start` script
3. Modify the script to run using `npx` if desired
4. Replace the value of the `user` argument with your GitHub username
4. Run the script using either `npx start` or  `yarn start`

### Example

```
node index.js --user idahogurl

What did you do yesterday?
  PR idahogurl/geekbot-parrot#4 - Update README
  Issue idahogurl/geekbot-parrot#5 - List assigned issues for 'today' output

What will you do today?
  Issue idahogurl/geekbot-parrot#5 - List assigned issues for 'today' output
```