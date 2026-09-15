export type EmailMessage = Readonly<{ to: readonly string[]; subject: string; text: string; html?: string; replyTo?: string }>;
export interface EmailSender { send(message: EmailMessage): Promise<{ messageId: string }>; }

export type StoredObject = Readonly<{ key: string; contentType: string; size: number }>;
export interface ObjectStorage { put(key: string, data: Uint8Array, contentType: string): Promise<StoredObject>; get(key: string): Promise<Uint8Array | undefined>; delete(key: string): Promise<void>; createDownloadUrl(key: string, expiresInSeconds: number): Promise<string>; }

export type CheckoutRequest = Readonly<{ referenceId: string; amount: number; currency: string; successUrl: string; cancelUrl: string }>;
export interface BillingGateway { createCheckout(request: CheckoutRequest): Promise<{ checkoutId: string; url: string }>; refund(paymentId: string, amount?: number): Promise<{ refundId: string }>; }

export type Job<T = unknown> = Readonly<{ id: string; name: string; payload: T; attempts: number }>;
export type JobHandler<T = unknown> = (job: Job<T>) => Promise<void>;
export interface JobQueue { enqueue<T>(name: string, payload: T): Promise<{ jobId: string }>; register<T>(name: string, handler: JobHandler<T>): void; }
