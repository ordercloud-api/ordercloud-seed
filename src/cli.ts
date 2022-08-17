import yargs from 'yargs';
import { download } from './commands/download';
import { validate } from './commands/validate';
import { seed } from './commands/seed';
import fs from 'fs';
import yaml, { YAMLException } from 'js-yaml';
import { defaultLogger, MessageType } from './services/logger';
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
          return defaultLogger(`No such file or directory \"${dataUrl}\" found`, MessageType.Error);
      }
      try {
        var data = yaml.load(stringData) as SerializedMarketplace;
        return seed({
          username: argv.u as string,
          password: argv.p as string,
          marketplaceID: argv.i as string,
          marketplaceName: argv.n as string,
          regionId: argv.r as string,
          rawData: data
        });
      } catch (e) {
        var ex = e as YAMLException;
        return defaultLogger(`YAML Exception in \"${dataUrl}\": ${ex.message}`, MessageType.Error)
      }
    }
    seed({
      username: argv.u as string,
      password: argv.p as string,
      marketplaceID: argv.i as string,
      marketplaceName: argv.n as string,
      regionId: argv.r as string,
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
    yargs.positional('filePath', {
      type: 'string',
      alias: 'f',
      default: 'ordercloud-seed.yml',
      describe: 'File path'
    })
  }, async function (argv) {
    var data = await download({
      username: argv.u as string,
      password: argv.p as string,
      marketplaceID: argv.i as string, 
    });
    if (data) {
      var path = argv.f as string ?? 'ordercloud-seed.yml';
      defaultLogger(`Writing to file ${path}`);
      fs.writeFileSync(path, yaml.dump(data));
    }
  })
  .command('validate [data]', 'Validate a potential data source for seeding.', (yargs) => {
    yargs.positional('data', {
      type: 'string',
      alias: 'd',
      default: 'ordercloud-seed.yml',
      describe: 'Local file path or HTTP(S) link'
    })
  }, function (argv) {
    var filePath = argv.d as string;
    var stringData;
    if (!filePath.startsWith('http')) {
      try {
        stringData = fs.readFileSync(filePath, 'utf8') // consider switching to streams
        defaultLogger(`Found file \"${filePath}\".`, MessageType.Success);
      } catch (err) {
          return defaultLogger(`No such file or directory \"${filePath}\" found`, MessageType.Error);
      }
      try {
        var data = yaml.load(stringData) as SerializedMarketplace;
        return validate({ rawData: data })
      } catch (e) {
        var ex = e as YAMLException;
        return defaultLogger(`YAML Exception in \"${filePath}\": ${ex.message}`, MessageType.Error)
      }
    }
    validate({ dataUrl: argv.d as string })
  })
  .help()
  .argv