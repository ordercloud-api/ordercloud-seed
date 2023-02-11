import yargs from 'yargs';
import fs from 'fs';
import yaml from 'js-yaml';
import { AllMarketplaceData } from './models/serialized-marketplace';
import * as SeedingTemplates from '../seeds/meta.json';
import _ from 'lodash';
import { LogCallBackFunc, MessageType, OCSeeding } from './js-api';
import chalk from "chalk";
import axios from 'axios';
import { Random, RefreshTimer } from './services/util';
import { RESET_PROGRESS_BAR_SUFFIX } from './constants';
const _progress = require('cli-progress');

interface YAMLException {
  name: string; // always "YAMLException"
  reason: string;
  message: string;
  stack: string; 
  mark: YAMLExceptionMark
}

interface YAMLExceptionMark {
  postion: number; 
  line: number;
  column: number;
  snippet: string; 
}

class CLI {
  // see https://unicode.org/emoji/charts-14.0/full-emoji-list.html;
  private static readonly emoji = {
    red_x: "\u274C",
    check_mark: "\u2714",
    clock: "\u23F1",
    warning: "\u26A0",
  };
  private static readonly multibar = new _progress.MultiBar({ 
    //clearOnComplete: true,
    format: '{text} [{bar}] {percentage}% | {value}/{total}', 
  });
  private static readonly bar = this.multibar.create(1, 0, { text: "Starting" });


  private static logger: LogCallBackFunc = (message, messageType = MessageType.Info, job = null) => {
    if (messageType == MessageType.Success || messageType == MessageType.Done) {
        this.multibar.log(chalk.green(`${this.emoji.check_mark} SUCCESS - ${message}\n`));
        this.multibar.update();
    } 
    if (messageType == MessageType.Error) {
      this.multibar.log(chalk.red(`${this.emoji.red_x} ERROR - ${message}\n`));
      this.multibar.update();
    }
    if (messageType == MessageType.Info) {
      this.multibar.log(`${this.emoji.clock}  PROGRESS - ${message}\n`);
    }
    if (messageType == MessageType.Warn) {
      this.multibar.log(chalk.yellow(`${this.emoji.warning}  WARN - ${message}\n`));
    }
    if (messageType == MessageType.Done || messageType == MessageType.Error) {
      this.multibar.stop();
      RefreshTimer.clear();
    }
    if (messageType == MessageType.Progress) {
        if (message.endsWith(RESET_PROGRESS_BAR_SUFFIX)) {
            this.bar.setTotal(job.total);
            message = message.replace(RESET_PROGRESS_BAR_SUFFIX, "");
        }
        this.bar.update(job.progress, { text: message });
    }
  }

  public static async seed(args: any) {
    var startTime = Date.now();
    let path = args.d as string;
    let data = await this.readDataToJSObject(path);
    let marketplaceName = args.n || path?.split("/")?.pop()?.split(".")[0];
    let marketplaceID = args.i || Random.generateOrgID()
    
    await OCSeeding.seed({
          username: args.u as string,
          password: args.p as string,
          marketplaceID: marketplaceID,
          marketplaceName: marketplaceName,
          regionId: args.r as string,
          logger: this.logger,
          rawData: data
    }); 
    var endTime = Date.now();
    this.logger(`Done! Seeded a new marketplace with ID \"${marketplaceID}\" and Name \"${marketplaceName}\". Total elapsed time: ${this.formatElapsedTime(startTime, endTime)}`, MessageType.Done); 
  }

  public static async download(args: any) {
    var startTime = Date.now();
    var data = await OCSeeding.download({
      username: args.u as string,
      password: args.p as string,
      marketplaceID: args.i as string, 
      logger: this.logger
    });
    if (!data) return;
    var path = args.f as string ?? 'ordercloud-seed.yml';
    fs.writeFileSync(path, yaml.dump(data));
    var endTime = Date.now();
    this.logger(`Wrote to file ${path}. Total elapsed time: ${this.formatElapsedTime(startTime, endTime)}`, MessageType.Done);
  }

  public static async validate(args) {
      let path = args.d as string;
      let data = await this.readDataToJSObject(path);
      await OCSeeding.validate({ rawData: data, logger: this.logger });
      this.logger(`Validation done!`, MessageType.Done);
  }

  private static formatElapsedTime(startTime: number, endTime: number): string {
    var miliseconds = Math.abs(startTime - endTime);
    var minutes = Math.floor(miliseconds / 60000);
    var seconds = ((miliseconds % 60000) / 1000).toFixed(0) as unknown as number;
    return `${minutes}:${(seconds < 10 ? "0" : "")}${seconds}`;
} 

  private static async readPublicUrl(url: string): Promise<string> {
    try {
      let string = (await axios.get(url)).data;
      this.logger(`Found marketplace data at url \"${url}\".`, MessageType.Success);
      return string;
    } catch {
      this.logger(`Error repsonse from url \"${url}\" when trying to find marketplace data.`, MessageType.Error);
      return null;
    }
  }

  private static async readLocalFile(filePath: string): Promise<string> {
    try {
      let string = fs.readFileSync(filePath, 'utf8') // consider switching to streams
      this.logger(`Found file \"${filePath}\"`, MessageType.Success);
      return string;
    } catch (err) {
      this.logger(`No such file \"${filePath}\" found`, MessageType.Error);
      return null;
    }
  }

  private static async readDataFromUrlOrFile(dataPath: string): Promise<string> 
  {
    if (!dataPath.startsWith('http')) {
      return await this.readPublicUrl(dataPath);
    } else {
      return await this.readLocalFile(dataPath);
    }
  }

  private static async readDataToJSObject(dataPath: string): Promise<AllMarketplaceData> {
    var template = SeedingTemplates.templates.find(x => x.name === dataPath);
    if (!_.isNil(template)) {
      dataPath = template.dataUrl;
    }

    var yamlStr = await this.readDataFromUrlOrFile(dataPath);
    if (yamlStr == null) return null;

    var marketplaceData = this.convertYamlToJSObject(yamlStr);

    return marketplaceData
  }

  private static convertYamlToJSObject(yamlString: string): AllMarketplaceData 
  {
    try {
      let data = yaml.load(yamlString) as AllMarketplaceData;
      this.logger(`Yaml parsed successfully.`, MessageType.Success);
      return data;
    } catch (e) {
      var ex = e as YAMLException;
      this.logger(`YAML formatting exception: ${ex.message}`, MessageType.Error)
      return null;
    }
  }
}

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
  }, CLI.seed)
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
    yargs.positional('fileName', {
      type: 'string',
      alias: 'f',
      default: 'ordercloud-seed.yml',
      describe: 'File name'
    })
  }, CLI.download)
  .command('validate [data]', 'Validate a potential data source for seeding.', (yargs) => {
    yargs.positional('data', {
      type: 'string',
      alias: 'd',
      default: 'ordercloud-seed.yml',
      describe: 'Local file path or HTTP(S) link'
    })
  }, CLI.validate)
  .help()
  .argv
