import chalk from "chalk";
import { RESET_PROGRESS_BAR_SUFFIX } from "../constants";
import { JobMetaData } from "../models/job-metadata";
const _progress = require('cli-progress');
const multibar = new _progress.MultiBar({ 
    //clearOnComplete: true,
    format: '{text} [{bar}] {percentage}% | {value}/{total}', 
});
let bar = multibar.create(1, 0, { resource: "Starting" });
// see https://unicode.org/emoji/charts-14.0/full-emoji-list.html
const check_mark = "\u2714";
const red_x = "\u274C"; 
const clock = "\u23F1";
const warning = "\u26A0";

// All logging is going through the multibar because otherwise messages are mangled when the bar re-renders.
export function defaultLogger(message: string, messageType: MessageType = MessageType.Info, job: JobMetaData = null) {
    if (messageType == MessageType.Success || messageType == MessageType.Done) {
        multibar.log(chalk.green(`${check_mark} SUCCESS - ${message}\n`));
        multibar.update();
    } 
    if (messageType == MessageType.Error) {
        multibar.log(chalk.red(`${red_x} ERROR - ${message}\n`));
        multibar.update();
    }
    if (messageType == MessageType.Info) {
        multibar.log(`${clock}  PROGRESS - ${message}\n`);
    }
    if (messageType == MessageType.Warn) {
        multibar.log(chalk.yellow(`${warning}  WARN - ${message}\n`));
    }
    if (messageType == MessageType.Done || messageType == MessageType.Error) {
        multibar.stop();
    }
    if (messageType == MessageType.Progress) {
        if (message.endsWith(RESET_PROGRESS_BAR_SUFFIX)) {
            bar.setTotal(job.total);
            message = message.replace(RESET_PROGRESS_BAR_SUFFIX, "");
        }
        bar.update(job.progress, { text: message });
    }
}

export type LogCallBackFunc = (message: string, type?: MessageType, job?: JobMetaData) => void;

export enum MessageType {
    Error,
    Info,
    Success,
    Warn,
    Progress,
    Done
}

export function getElapsedTime(startTime: number, endTime: number): string {
    var miliseconds = Math.abs(startTime - endTime);
    var minutes = Math.floor(miliseconds / 60000);
    var seconds = ((miliseconds % 60000) / 1000).toFixed(0) as unknown as number;
    return `${minutes}:${(seconds < 10 ? "0" : "")}${seconds}`;
} 