export class PortalError extends Error {
    code: string;
    retryable: boolean;

    constructor(message: string, code: string, retryable: boolean) {
        super(message);
        this.name = 'PortalError';
        this.code = code;
        this.retryable = retryable;
    }
}

export class ValidationError extends PortalError {
    field?: string;

    constructor(message: string, field?: string) {
        super(message, 'VALIDATION_ERROR', false);
        this.name = 'ValidationError';
        this.field = field;
    }
}

export class DatabaseError extends PortalError {
    constructor(message: string, retryable: boolean = true) {
        super(message, 'DATABASE_ERROR', retryable);
        this.name = 'DatabaseError';
    }
}

export class NotFoundError extends PortalError {
    constructor(message: string) {
        super(message, 'NOT_FOUND', false);
        this.name = 'NotFoundError';
    }
}

export class ExternalServiceError extends PortalError {
    constructor(message: string) {
        super(message, 'EXTERNAL_SERVICE_ERROR', true);
        this.name = 'ExternalServiceError';
    }
}
