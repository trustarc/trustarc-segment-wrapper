/**
 * An Errot that represents that the TrustArc API is not in the expected format.
 * This is not something that could happen unless our API types are wrong and something is very wonky.
 * Not a recoverable error.
 */
export class TrustArcApiValidationError extends Error {
  name = 'TaConsentWrapperValidationError'
  constructor(message: string, received: any) {
    super(`Invariant: ${message} (Received: ${JSON.stringify(received)})`)
  }
}
