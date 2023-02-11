export class Random {
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

    public static generate(length: number): string {
        let retVal = "";
        for (var i = 0, n = this.charset.length; i < length; ++i) {
            retVal += this.charset.charAt(Math.floor(Math.random() * n));
        }
        return retVal;
    }
}

class Interval {
    id; 
  
    set(fn: Function, interval: number) {
      this.id = setInterval(fn, interval)
    }
  
    clear() {
      clearInterval(this.id)
    }
  }
  
export const RefreshTimer = new Interval();