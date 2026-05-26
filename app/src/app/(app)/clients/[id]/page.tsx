import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Mail, Phone, MapPin, FileText, Pencil } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { ClientStatusBadge, InvoiceStatusBadge, ProjectStatusBadge, DealStageBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";
import { ContactDialog } from "@/components/contacts/contact-dialog";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  getClientById,
  getContactsByClient,
  getDeals,
  getExpenses,
  getInvoices,
  getProjectsByClient,
} from "@/lib/data";
import { balanceDue, liveStatus } from "@/lib/finance/invoices";
import { weightedValue } from "@/lib/finance/deals";
import { formatDate } from "@/lib/finance/format";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [client, contacts, projects, invoices, deals, expenses] = await Promise.all([
    getClientById(id),
    getContactsByClient(id),
    getProjectsByClient(id),
    getInvoices(),
    getDeals(),
    getExpenses(),
  ]);

  if (!client) notFound();

  const clientInvoices = invoices.filter((i) => i.clientId === client.id);
  const clientDeals = deals.filter((d) => d.clientId === client.id);
  const clientExpenses = expenses.filter((e) => {
    const link = e.link;
    if (link.type === "client") return link.id === client.id;
    if (link.type === "project") return projects.some((p) => p.id === link.id);
    if (link.type === "deal") return clientDeals.some((d) => d.id === link.id);
    return false;
  });

  const revenuePaid = clientInvoices
    .filter((i) => liveStatus(i) === "paid")
    .reduce((acc, i) => acc + i.total, 0);
  const owed = clientInvoices
    .filter((i) => liveStatus(i) === "sent" || liveStatus(i) === "overdue")
    .reduce((acc, i) => acc + balanceDue(i), 0);
  const openDealsValue = clientDeals
    .filter((d) => d.stage !== "won" && d.stage !== "lost")
    .reduce((acc, d) => acc + weightedValue(d), 0);
  const expensesTotal = clientExpenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href="/clients"
        className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        Tous les clients
      </Link>

      <PageHeader
        eyebrow="Client"
        title={client.name}
        description={
          <span className="inline-flex items-center gap-2">
            <ClientStatusBadge status={client.status} />
            <span className="text-xs text-muted-foreground">
              Créé le {formatDate(client.createdAt)}
            </span>
          </span>
        }
        actions={
          <>
            <Button asChild variant="ghost">
              <Link href={`/clients/${client.id}/edit`}>
                <Pencil className="h-4 w-4" />
                Modifier
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/factures/nouvelle">
                <FileText className="h-4 w-4" />
                Nouvelle facture
              </Link>
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <MetricCard label="CA encaissé" value={revenuePaid} tone="confirmed" />
        <MetricCard label="À encaisser" value={owed} tone="probable" />
        <MetricCard label="Pipeline pondéré" value={openDealsValue} tone="probable" />
        <MetricCard label="Dépenses liées" value={expensesTotal} tone="neutral" />
      </div>

      {/* Identity card + Contacts */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Coordonnées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {client.email ? (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a>
              </div>
            ) : null}
            {client.phone ? (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                {client.phone}
              </div>
            ) : null}
            {client.address ? (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{client.address}</span>
              </div>
            ) : null}
            {client.vatNumber ? (
              <div className="text-xs text-muted-foreground">N° TVA · {client.vatNumber}</div>
            ) : null}
            {client.notes ? (
              <p className="rounded-md border border-border bg-muted/30 p-2 text-xs text-muted-foreground">
                {client.notes}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Contacts</CardTitle>
              <CardDescription>{contacts.length} contact(s) chez ce client.</CardDescription>
            </div>
            <ContactDialog clientId={client.id} />
          </CardHeader>
          <CardContent className="divide-y divide-border/70">
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun contact enregistré.</p>
            ) : (
              contacts.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 py-2 text-sm first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {c.firstName} {c.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{c.role ?? "—"}</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {c.email ?? c.phone ?? ""}
                  </div>
                  <ContactDialog contact={c} clientId={client.id} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projects */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Projets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {projects.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">Aucun projet pour ce client.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Vendu</TableHead>
                  <TableHead className="text-right">Interne</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/projets/${p.id}`} className="font-medium hover:underline">
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <ProjectStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money amount={p.soldBudget} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      <Money amount={p.internalBudget} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Deals */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Deals</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {clientDeals.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">Aucun deal pour ce client.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Étape</TableHead>
                  <TableHead className="text-right">Estimé</TableHead>
                  <TableHead className="text-right">Pondéré</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientDeals.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell>
                      <DealStageBadge stage={d.stage} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money amount={d.estimatedAmount} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money amount={weightedValue(d)} className="text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Factures</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {clientInvoices.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">Aucune facture émise.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Solde dû</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientInvoices.map((inv) => {
                  const status = liveStatus(inv);
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium num">#{inv.number}</TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(inv.dueDate)}</TableCell>
                      <TableCell className="text-right">
                        <Money amount={inv.total} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money amount={balanceDue(inv)} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
