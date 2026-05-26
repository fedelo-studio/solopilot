import { Badge } from "@/components/ui/badge";
import type {
  InvoiceStatus,
  DealStage,
  ProjectStatus,
  ClientStatus,
  QuoteStatus,
} from "@/types/domain";
import {
  INVOICE_STATUS_LABELS,
  DEAL_STAGE_LABELS,
  QUOTE_STATUS_LABELS,
} from "@/types/domain";

const INVOICE_VARIANT: Record<InvoiceStatus, "default" | "confirmed" | "probable" | "warning" | "danger" | "hypothetical"> = {
  draft: "hypothetical",
  sent: "probable",
  paid: "confirmed",
  overdue: "danger",
  cancelled: "hypothetical",
};

const DEAL_VARIANT: Record<DealStage, "default" | "confirmed" | "probable" | "warning" | "danger" | "hypothetical"> = {
  lead: "hypothetical",
  qualified: "hypothetical",
  proposal: "probable",
  negotiation: "probable",
  won: "confirmed",
  lost: "danger",
};

const PROJECT_LABELS: Record<ProjectStatus, string> = {
  active: "Actif",
  paused: "En pause",
  done: "Terminé",
  archived: "Archivé",
};

const PROJECT_VARIANT: Record<ProjectStatus, "default" | "confirmed" | "probable" | "warning" | "hypothetical"> = {
  active: "probable",
  paused: "warning",
  done: "confirmed",
  archived: "hypothetical",
};

const CLIENT_LABELS: Record<ClientStatus, string> = {
  prospect: "Prospect",
  active: "Actif",
  archived: "Archivé",
};

const CLIENT_VARIANT: Record<ClientStatus, "default" | "confirmed" | "probable" | "hypothetical"> = {
  prospect: "probable",
  active: "confirmed",
  archived: "hypothetical",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge variant={INVOICE_VARIANT[status]}>{INVOICE_STATUS_LABELS[status]}</Badge>;
}

export function DealStageBadge({ stage }: { stage: DealStage }) {
  return <Badge variant={DEAL_VARIANT[stage]}>{DEAL_STAGE_LABELS[stage]}</Badge>;
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge variant={PROJECT_VARIANT[status]}>{PROJECT_LABELS[status]}</Badge>;
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return <Badge variant={CLIENT_VARIANT[status]}>{CLIENT_LABELS[status]}</Badge>;
}

const QUOTE_VARIANT: Record<QuoteStatus, "default" | "confirmed" | "probable" | "warning" | "danger" | "hypothetical"> = {
  draft: "hypothetical",
  sent: "probable",
  accepted: "confirmed",
  declined: "danger",
  expired: "warning",
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return <Badge variant={QUOTE_VARIANT[status]}>{QUOTE_STATUS_LABELS[status]}</Badge>;
}
