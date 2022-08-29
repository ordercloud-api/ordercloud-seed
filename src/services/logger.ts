import chalk from "chalk";
import { RESET_PROGRESS_BAR_SUFFIX } from "../constants";
const _progress = require('cli-progress');
const multibar = new _progress.MultiBar({ 
    clearOnComplete: true,
    stopOnComplete: true,
    format: '{resource} [{bar}] {percentage}% | {value}/{total}', 
});
let bar = multibar.create(0, 0);
// see https://unicode.org/emoji/charts-14.0/full-emoji-list.html
const check_mark = "\u2714";
const red_x = "\u274C"; 
const clock = "\u23F1";
const warning = "\u26A0";

export function defaultLogger(message: string, messageType: MessageType = MessageType.Info) {
    if (messageType == MessageType.Success) {
        multibar.log(chalk.green(`${check_mark} SUCCESS - ${message}\n`));
    } 
    if (messageType == MessageType.Error) {
        multibar.log(chalk.red(`${red_x} ERROR - ${message}\n`));
    }
    if (messageType == MessageType.Info) {
        multibar.log(`${clock}  PROGRESS - ${message}\n`);
    }
    if (messageType == MessageType.Warn) {
        multibar.log(chalk.yellow(`${warning}  WARN - ${message}\n`));
    }
    if (messageType == MessageType.Progress) {
        var split = message.split("-");
        var resource = split[0]
        var progress = parseInt(split[1]);
        var total = parseInt(split[2]);

        if (message.endsWith(RESET_PROGRESS_BAR_SUFFIX)) {
            bar.setTotal(total);
        }
        bar.update(progress, { resource });
    }
}

export type LogCallBackFunc = (message: string, type: MessageType) => void;

export enum MessageType {
    Error,
    Info,
    Success,
    Warn,
    Progress
}

export function getElapsedTime(startTime: number, endTime: number): string {
    var miliseconds = Math.abs(startTime - endTime);
    var minutes = Math.floor(miliseconds / 60000);
    var seconds = ((miliseconds % 60000) / 1000).toFixed(0) as unknown as number;
    return `${minutes}:${(seconds < 10 ? "0" : "")}${seconds}`;
} 