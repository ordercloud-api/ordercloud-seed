import chalk from "chalk";
import emoji from 'node-emoji';

export function log(message: string, messageType: MessageType = MessageType.Progress) {
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

export enum MessageType {
    Error,
    Progress,
    Success
}