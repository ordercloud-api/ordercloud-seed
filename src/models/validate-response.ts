import chalk from "chalk";
import emoji from 'node-emoji';

export class ValidateResponse {
    public errors: ValidateError[] = [];

    isValid(): boolean {
        return this.errors.length == 0;
    }

    writeErrors(): void {
        for (const error of this.errors) {
            log(error.message, MessageType.Error)
        }
    }
}

export function log(message: string, messageType: MessageType = MessageType.Progress) {
    if (messageType == MessageType.Progress) {
        console.log(emoji.get('heavy_check_mark'), chalk.green(' PROGRESS -', message));
    } 
    if (messageType == MessageType.Error) {
        console.log(emoji.get('x'), chalk.red('ERROR -', message));
    }
}

export enum MessageType {
    Error,
    Progress
}

export interface ValidateError {
    lineNumber: number // from source file
    message: string
}