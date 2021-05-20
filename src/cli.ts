import yargs from 'yargs';
import { download } from './commands/download';
import { validate } from './commands/validate';

yargs.scriptName("@ordercloud/seeding")
  .usage('$0 <cmd> [args] -')
  .command('download', 'Download all org data into a file', (yargs) => {
    yargs.option('environment', {
      type: 'string',
      alias: 'e',
      describe: 'Environment'
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
    yargs.option('file', {
      type: 'string',
      alias: 'f',
      default: 'ordercloud-seed.yml',
      describe: 'File'
    })
  }, function (argv) {
    download(argv.u as string, argv.p as string, argv.e as string, argv.o as string, argv.f as string);
  })
  .command('validate', 'Validate a potential file for upload', (yargs) => {
    yargs.option('file', {
      type: 'string',
      alias: 'f',
      default: 'ordercloud-seed.yml',
      describe: 'File'
    })
  }, function (argv) {
      validate(argv.f as string);
  })
  .help()
  .argv