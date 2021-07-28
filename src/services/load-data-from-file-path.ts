import fs from 'fs';
import yaml from 'js-yaml';
import { MessageType } from './logger';
import axios from "axios";
import { SerializedMarketplace } from '../models/serialized-marketplace';

export const LoadDataFromFilePath = async (filePath: string, logCallback: (message: string, type: MessageType) => void): Promise<SerializedMarketplace> => {
    let raw;
    if (filePath.startsWith('http')) {
        try {
            raw = (await axios.get(filePath)).data;
            logCallback(`Found \"${filePath}\".`, MessageType.Success);
        } catch {
            logCallback(`Error response from \"${filePath}\".`, MessageType.Error);
            return null;
        }
    } else {
        try {
            raw = fs.readFileSync(filePath, 'utf8') // consider switching to streams
            logCallback(`Found file \"${filePath}\"`, MessageType.Success);
        } catch (err) {
            logCallback(`No such file or directory \"${filePath}\" found`, MessageType.Error);
            return null;
        }
    }
    try {
        var data = yaml.load(raw) as SerializedMarketplace;
        logCallback(`Valid yaml in \"${filePath}\"`, MessageType.Success);
        return data;
    } catch (e) {
        var ex = e as YAMLException;
        logCallback(`YAML Exception in \"${filePath}\": ${ex.message}`, MessageType.Error)
        return null;
    }
    return null;
}

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