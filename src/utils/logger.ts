import logger = require("node-color-log");

class Logger {
    readonly prefix: string = "";

    constructor(parent: string)
    {
        this.prefix = parent;
    }

    log(...args: any[]): any {
        logger.color("green")
        logger.log(`[${this.prefix}]:`,...args);
    }

    err(...args: any[]): any {
        logger.color("red")
        logger.log(`[${this.prefix}]:`,...args);
    }
}

export const LogAPI = new Logger("MODDY");