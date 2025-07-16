export class ItemNotFoundException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ItemNotFoundException"
    }
}

export class InvalidItemException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InvalidItemException";
    }
}

export class InitializationException extends Error {
    constructor(message: string, error: Error) {
        super(message);
        this.name = "InitializationException";
        this.stack = error.stack;
        this.message = `${message}: ${error.message}`;
    }
}

export class DbException extends Error {
    constructor(message: string, error: Error) {
        super(message);
        this.name = "DcException";
        this.stack = error.stack;
        this.message = `${message}: ${error.message}`;
    }
}