# NullBot for Discord

![](https://github.com/nullforce-public/discord-nullbot/workflows/NullBot%20CI/badge.svg)

## Usage

### Documentation

Please see the wiki for documentation on the usage of the bot, such as commands.

### Installation / Hosting (TBD)


## Developing NullBot features

### Prerequisites

You'll need:
- node.js
- Discord client
- Your own Discord server for testing the bot
- Application credentials from the Discord developer portal

#### Discord

In order to test the changes you make, you'll need to create an Application via
the [Discord website](https://discordapp.com/developers).

You'll also need to invite your bot to your test server. Replace
`<your client id>` with the one from the application you created in the previous
step.

```
https://discordapp.com/oauth2/authorize?client_id=<your client id>&scope=bot
```

#### Dev Container (TBD)

### Development Configuration

You'll need to copy `.sample-env` to `.env` and provide values for each of the
keys within.

### npm tasks / gulp tasks

Run the bot locally and watch for changes to the source files:

```shell
npm start
```

You can use `npm run` by itself to list all the available scripts.


### Testing (TBD)

### Linting

Linting rules are enforced by tslint. Please refer to
[TSLint Rules](https://palantir.github.io/tslint/rules) for more information.

### References

#### API Documentation

- [Discord](https://discordapp.com/developers/docs/intro)
- [discord.js](https://discordjs.guide/)
