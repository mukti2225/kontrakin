export type DomainEventName =
  | "lease.activated"
  | "lease.terminated"
  | "invoice.issued"
  | "invoice.overdue"
  | "payment.received"
  | "payment.allocated"
  | "payment.refunded"
  | "maintenance.created"
  | "maintenance.status_updated";

export interface LeaseActivatedPayload {
  leaseId: string;
  penghuniId: string;
  kamarId: string;
  rentAmount: number;
  organizationId: string;
  actorUserId?: string;
}

export interface InvoiceIssuedPayload {
  invoiceId: string;
  invoiceNumber: string;
  total: number;
  dueDate: string;
  penghuniId: string;
  organizationId: string;
}

export interface InvoiceOverduePayload {
  invoiceId: string;
  invoiceNumber: string;
  balanceDue: number;
  dueDate: string;
  penghuniId: string;
  organizationId: string;
}

export interface PaymentReceivedPayload {
  paymentId: string;
  amount: number;
  paymentMethod: string;
  penghuniId: string;
  organizationId: string;
}

export interface PaymentAllocatedPayload {
  paymentId: string;
  invoiceId: string;
  allocatedAmount: number;
  newBalanceDue: number;
  isFullyPaid: boolean;
  penghuniId: string;
  organizationId: string;
}

export interface MaintenanceCreatedPayload {
  ticketId: string;
  judul: string;
  prioritas: "rendah" | "sedang" | "tinggi";
  kategori: string;
  kamarId: string;
  penghuniId: string;
  organizationId: string;
}

export interface MaintenanceStatusUpdatedPayload {
  ticketId: string;
  oldStatus: string;
  newStatus: string;
  organizationId: string;
}

export interface PaymentRefundedPayload {
  paymentId: string;
  amount: number;
  organizationId: string;
}

export interface DomainEventMap {
  "lease.activated": LeaseActivatedPayload;
  "lease.terminated": { leaseId: string; organizationId: string };
  "invoice.issued": InvoiceIssuedPayload;
  "invoice.overdue": InvoiceOverduePayload;
  "payment.received": PaymentReceivedPayload;
  "payment.allocated": PaymentAllocatedPayload;
  "payment.refunded": PaymentRefundedPayload;
  "maintenance.created": MaintenanceCreatedPayload;
  "maintenance.status_updated": MaintenanceStatusUpdatedPayload;
}
