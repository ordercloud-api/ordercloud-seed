import yargs from 'yargs';
import { download } from './commands/download';
import { validate } from './commands/validate';
import { upload } from './commands/upload';

yargs.scriptName("@ordercloud/seeding")
  .usage('$0 <cmd> [args] -')
  .command('seed [data]', 'Create a new sandbox organization and seed data.', (yargs) => {
    yargs.positional('data', {
      type: 'string',
      alias: 'd',
      default: 'ordercloud-seed.yml',
      describe: 'Local file path or HTTP(S) link'
    });
    yargs.option('username', {
      type: 'string',
      alias: 'u',
      describe: 'Portal username'
    })
    yargs.option('password', {
      type: 'string',
      alias: 'p',
      describe: 'Portal password'
    })
    yargs.option('orgID', {
      type: 'string',
      alias: 'o',
      describe: 'Organization ID'
    })
  }, function (argv) {
    upload(argv.u as string, argv.p as string, argv.o as string, argv.d as string);
  })
  .command('download [filePath]', 'Create a local seed file from an existing organization.', (yargs) => {
    yargs.option('environment', {
      type: 'string',
      alias: 'e',
      describe: 'Environment',
    })
    yargs.option('orgID', {
      type: 'string',
      alias: 'o',
      describe: 'Organization ID'
    })
    yargs.option('username', {
      type: 'string',
      alias: 'u',
      describe: 'Portal username'
    })
    yargs.option('password', {
      type: 'string',
      alias: 'p',
      describe: 'Portal password'
    })
    yargs.positional('filePath', {
      type: 'string',
      alias: 'f',
      default: 'ordercloud-seed.yml',
      describe: 'File path'
    })
  }, function (argv) {
    download(argv.u as string, argv.p as string, argv.e as string, argv.o as string, argv.f as string);
  })
  .command('validate [data]', 'Validate a potential data source for seeding.', (yargs) => {
    yargs.positional('data', {
      type: 'string',
      alias: 'd',
      default: 'ordercloud-seed.yml',
      describe: 'Local file path or HTTP(S) link'
    })
  }, function (argv) {
      validate(argv.d as string);
  })
  .help()
  .argv