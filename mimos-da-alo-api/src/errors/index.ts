export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class DuplicateDocumentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DuplicateDocumentError'
  }
}

export class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InsufficientStockError'
  }
}

export class InstallmentAlreadyPaidError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InstallmentAlreadyPaidError'
  }
}

export class InvalidInstallmentPlanError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidInstallmentPlanError'
  }
}
