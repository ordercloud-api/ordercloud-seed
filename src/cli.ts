import yargs from 'yargs';
import { download } from './commands/download';
import { validate } from './commands/validate';
import { seed } from './commands/seed';
import fs from 'fs';
import yaml, { YAMLException } from 'js-yaml';
import { defaultLogger, getElapsedTime, MessageType } from './services/logger';
import { SerializedMarketplace } from './models/serialized-marketplace';
import * as SeedingTemplates from '../seeds/meta.json';
import _ from 'lodash';

yargs.scriptName("@ordercloud/seeding")
  .usage('$0 <cmd> [args] -')
  .command('seed [data]', 'Create a new sandbox marketplace and seed data.', (yargs) => {
    yargs.positional('data', {
      type: 'string',
      alias: 'd',
      default: 'ordercloud-seed.yml',
      describe: 'Local file name or HTTP(S) link'
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
    yargs.option('id', {
      type: 'string',
      alias: 'i',
      describe: 'Marketplace ID'
    }),
    yargs.option('name', {
      type: 'string',
      alias: 'n',
      describe: 'Marketplace Name'
    }),
    yargs.option('regionId', {
      type: 'string',
      alias: 'r',
      describe: 'Region for the marketplace. See the API docs for more information'
    })
    yargs.option('target', {
      type: 'string',
      alias: 't',
      describe: 'Target environment name matching the Name attribute in your config file'
    })
    yargs.option('config', {
      type: 'string',
      alias: 'c',
      describe: 'Path to the config file for client credentials authentication'
    })
  }, function (argv) {
    var dataUrl = argv.d as string;
    // Check for short-cut aliases
    var template = SeedingTemplates.templates.find(x => x.name === dataUrl);
    if (!_.isNil(template)) {
        dataUrl = template.dataUrl;
    }

    var stringData;
    if (!dataUrl.startsWith('http')) {
      try {
        stringData = fs.readFileSync(dataUrl, 'utf8') // consider switching to streams
        defaultLogger(`Found file \"${dataUrl}\"`, MessageType.Success);
      } catch (err) {
          defaultLogger(`No such file \"${dataUrl}\" found`, MessageType.Error);
          return;
      }
      try {
        var data = yaml.load(stringData) as SerializedMarketplace;
        seed({
          username: argv.u as string,
          password: argv.p as string,
          marketplaceID: argv.i as string,
          marketplaceName: argv.n as string,
          regionId: argv.r as string,
          target: argv.t as string,
          configPath: argv.c as string,
          rawData: data
        });
        return;
      } catch (e) {
        var ex = e as YAMLException;
        defaultLogger(`YAML Exception in \"${dataUrl}\": ${ex.message}`, MessageType.Error)
        return;
      }
    }
    seed({
      username: argv.u as string,
      password: argv.p as string,
      marketplaceID: argv.i as string,
      marketplaceName: argv.n as string,
      regionId: argv.r as string,
      target: argv.t as string,
      configPath: argv.c as string,
      dataUrl: dataUrl as string
    });
  })
  .command('download [filePath]', 'Create a local seed file from an existing marketplace.', (yargs) => {
    yargs.option('id', {
      type: 'string',
      alias: 'i',
      describe: 'Marketplace ID'
    }),
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
    yargs.option('target', {
      type: 'string',
      alias: 't',
      describe: 'Target environment name matching the Name attribute in your config file'
    })
    yargs.option('config', {
      type: 'string',
      alias: 'c',
      describe: 'Path to the environments config file'
    })
    yargs.positional('fileName', {
      type: 'string',
      alias: 'f',
      default: 'ordercloud-seed.yml',
      describe: 'File name'
    })
  }, async function (argv) {
    var startTime = Date.now();
    var data = await download({
      username: argv.u as string,
      password: argv.p as string,
      marketplaceID: argv.i as string,
      target: argv.t as string,
      configPath: argv.c as string,
    });
    if (data) {
      var path = argv.f as string ?? 'ordercloud-seed.yml';
      fs.writeFileSync(path, yaml.dump(data));
      var endTime = Date.now();
      defaultLogger(`Wrote to file ${path}. Total elapsed time: ${getElapsedTime(startTime, endTime)}`, MessageType.Done);
    }
  })
  .command('validate [data]', 'Validate a potential data source for seeding.', (yargs) => {
    yargs.positional('data', {
      type: 'string',
      alias: 'd',
      default: 'ordercloud-seed.yml',
      describe: 'Local file path or HTTP(S) link'
    })
  }, async function (argv) {
    var filePath = argv.d as string;
    var stringData;
    if (!filePath.startsWith('http')) {
      try {
        stringData = fs.readFileSync(filePath, 'utf8') // consider switching to streams
        defaultLogger(`Found file \"${filePath}\".`, MessageType.Success);
      } catch (err) {
          return defaultLogger(`No such file \"${filePath}\" found`, MessageType.Error);
      }
      try {
        var data = yaml.load(stringData) as SerializedMarketplace;
        await validate({ rawData: data })
        return defaultLogger(`Validation done!`, MessageType.Done);
      } catch (e) {
        var ex = e as YAMLException;
        return defaultLogger(`YAML Exception in \"${filePath}\": ${ex.message}`, MessageType.Error)
      }
    }
    await validate({ dataUrl: argv.d as string });
    defaultLogger(`Validation done!`, MessageType.Done);
  })
  .help()
  .argv
