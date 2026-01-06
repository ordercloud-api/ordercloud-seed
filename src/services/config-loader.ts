import * as fs from 'fs';
import * as path from 'path';

export interface SeedConfig {
    Name: string;
    OrderCloudBaseUrl: string;
    ApiClientId: string;
    ApiClientSecret: string;
}

export class ConfigLoader {
    private static CONFIG_FILE_NAME = '';

    static load(targetName: string, configPath?: string): SeedConfig {
        const resolvedConfigPath = configPath
            ? path.resolve(configPath)
            : path.join(process.cwd(), this.CONFIG_FILE_NAME);

        if (!fs.existsSync(resolvedConfigPath)) {
            throw new Error(`Configuration file not found: ${resolvedConfigPath}`);
        }

        const fileContent = fs.readFileSync(resolvedConfigPath, 'utf-8');
        const configs: SeedConfig[] = JSON.parse(fileContent);

        const targetConfig = configs.find(c => c.Name === targetName);

        if (!targetConfig) {
            const availableTargets = configs.map(c => c.Name).join(', ');
            throw new Error(`Target "${targetName}" not found in configuration. Available targets: ${availableTargets}`);
        }

        return targetConfig;
    }
}
