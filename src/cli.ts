import yargs from 'yargs';
import { download } from './actions/download';

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
  }, function (argv) {
    download(argv.u as string, argv.p as string, argv.e as string, argv.o as string);
  })
  .help()
  .argv