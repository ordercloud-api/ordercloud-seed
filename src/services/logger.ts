import chalk from "chalk";
import emoji from 'node-emoji';

export function defaultLogger(message: string, messageType: MessageType = MessageType.Progress) {
    if (messageType == MessageType.Success) {
        console.log(emoji.get('heavy_check_mark'), chalk.green(' SUCCESS -', message));
    } 
    if (messageType == MessageType.Error) {
        console.log(emoji.get('x'), chalk.red('ERROR -', message));
    }
    if (messageType == MessageType.Progress) {
        console.log(emoji.get('clock1'), 'PROGRESS -', message);
    }
}
export type LogCallBackFunc = (message: string, type: MessageType) => void;

export enum MessageType {
    Error,
    Progress,
    Success
}

export function getElapsedTime(startTime: number, endTime: number): string {
    var miliseconds = Math.abs(startTime - endTime);
    var minutes = Math.floor(miliseconds / 60000);
    var seconds = ((miliseconds % 60000) / 1000).toFixed(0) as unknown as number;
    return `${minutes}:${(seconds < 10 ? "0" : "")}${seconds}`;
} 