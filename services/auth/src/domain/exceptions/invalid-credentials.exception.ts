export class InvalidCredentialsException extends Error {
  constructor() {
    super('Invalid username or password');
  }
}
