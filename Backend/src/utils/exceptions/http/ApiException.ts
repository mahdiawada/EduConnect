export class ApiException extends Error {
    public status: number;
    constructor(status: number, message: string) {
        super(message);
        this.name = "ApiException";
        this.message = `${message}`;
        this.status = status;
    }
}