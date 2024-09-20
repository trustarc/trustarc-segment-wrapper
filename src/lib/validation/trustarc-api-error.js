"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustArcApiValidationError = void 0;
/**
 * An Errot that represents that the TrustArc API is not in the expected format.
 * This is not something that could happen unless our API types are wrong and something is very wonky.
 * Not a recoverable error.
 */
class TrustArcApiValidationError extends Error {
    constructor(message, received) {
        super(`Invariant: ${message} (Received: ${JSON.stringify(received)})`);
        this.name = 'TaConsentWrapperValidationError';
    }
}
exports.TrustArcApiValidationError = TrustArcApiValidationError;
