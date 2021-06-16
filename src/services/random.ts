export default class Random {
    private static readonly charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    static generateWebhookSecret(): string {
        return this.generate(20);
    }

    static generateClientSecret(): string {
        return this.generate(60);
    }

    
    static generateOrgID(): string {
        return this.generate(16);
    }

    private static generate(length: number): string {
        let retVal = "";
        for (var i = 0, n = this.charset.length; i < length; ++i) {
            retVal += this.charset.charAt(Math.floor(Math.random() * n));
        }
        return retVal;
    }
}