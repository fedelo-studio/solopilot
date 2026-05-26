import { notFound } from "next/navigation";
import { getClientById, getCompanySettings, getQuoteById } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/finance/format";
import { AutoPrint } from "../../../factures/[id]/pdf/auto-print";

export default async function QuotePdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await getQuoteById(id);
  if (!quote) notFound();

  const [client, company] = await Promise.all([
    getClientById(quote.clientId),
    getCompanySettings(),
  ]);

  return (
    <>
      <AutoPrint />
      <div className="invoice-page">
        <style>{`
          @page { size: A4; margin: 20mm; }
          @media print {
            html, body { background: white !important; }
            .no-print { display: none !important; }
          }
          .invoice-page {
            background: white;
            color: #050505;
            font-family: var(--font-strawford, ui-sans-serif), system-ui, sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            padding: 24px;
            max-width: 210mm;
            margin: 0 auto;
          }
          .invoice-page h1, .invoice-page h2 { font-weight: 500; }
          .invoice-page table { width: 100%; border-collapse: collapse; }
          .invoice-page th, .invoice-page td { padding: 8px 4px; vertical-align: top; }
          .invoice-page thead th { border-bottom: 1px solid #050505; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; text-align: left; color: #555; }
          .invoice-page tbody tr { border-bottom: 1px solid #eaeaea; }
          .invoice-page .right { text-align: right; }
          .invoice-page .mono { font-family: var(--font-jetbrains, ui-monospace), monospace; font-variant-numeric: tabular-nums; }
          .invoice-page .muted { color: #555; }
          .invoice-page .accent { color: #ff4a1c; font-weight: 500; }
          .invoice-page .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
          .invoice-page .meta { font-size: 9pt; }
          .invoice-page .total-card { display: flex; justify-content: space-between; align-items: baseline; border-top: 2px solid #050505; padding-top: 12px; margin-top: 8px; }
          .invoice-page footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #eaeaea; font-size: 9pt; color: #555; }
        `}</style>

        <header className="header-grid">
          <div>
            <h1 style={{ fontSize: "22pt", letterSpacing: "-0.02em", marginBottom: 4 }}>
              {company.companyName}
            </h1>
            <div className="muted meta">{company.ownerName}</div>
          </div>
          <div className="right">
            <div className="meta muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Devis
            </div>
            <h2 className="mono" style={{ fontSize: "22pt", letterSpacing: "-0.01em", marginTop: 4 }}>
              {quote.number}
            </h2>
          </div>
        </header>

        <section className="header-grid" style={{ marginBottom: 24 }}>
          <div>
            <div className="meta muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
              Destinataire
            </div>
            <div style={{ fontWeight: 500 }}>{client?.name ?? "—"}</div>
            {client?.address ? <div className="meta muted">{client.address}</div> : null}
            {client?.email ? <div className="meta muted">{client.email}</div> : null}
            {client?.vatNumber ? <div className="meta muted">{client.vatNumber}</div> : null}
          </div>
          <div className="right">
            <Row label="Émis le" value={formatDate(quote.issuedAt)} />
            {quote.validUntil ? <Row label="Valide jusqu'au" value={formatDate(quote.validUntil)} /> : null}
            <Row label="Devise" value={quote.currency} />
          </div>
        </section>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th className="right" style={{ width: "70px" }}>Qté</th>
              <th className="right" style={{ width: "110px" }}>Prix unit.</th>
              <th className="right" style={{ width: "70px" }}>TVA</th>
              <th className="right" style={{ width: "120px" }}>Total HT</th>
            </tr>
          </thead>
          <tbody>
            {quote.lines.map((line) => (
              <tr key={line.id}>
                <td>{line.description}</td>
                <td className="right mono">{line.quantity}</td>
                <td className="right mono">{formatMoney(line.unitPrice, quote.currency)}</td>
                <td className="right mono">{line.vatRate}%</td>
                <td className="right mono">{formatMoney(line.total, quote.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 24, marginLeft: "auto", maxWidth: 320 }}>
          <Row label="Sous-total" value={formatMoney(quote.subtotal, quote.currency)} mono />
          <Row label="TVA" value={formatMoney(quote.vatAmount, quote.currency)} mono />
          <div className="total-card">
            <span>Total TTC</span>
            <span className="mono accent" style={{ fontSize: "16pt" }}>
              {formatMoney(quote.total, quote.currency)}
            </span>
          </div>
        </div>

        {quote.notes ? (
          <section style={{ marginTop: 40 }}>
            <div className="meta muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              Notes
            </div>
            <p>{quote.notes}</p>
          </section>
        ) : null}

        <footer>
          {company.iban ? <div>IBAN : <span className="mono">{company.iban}</span></div> : null}
          {company.invoiceFooter ? <div style={{ marginTop: 8 }}>{company.invoiceFooter}</div> : null}
          <div style={{ marginTop: 8 }}>
            {company.companyName} · devis émis le {formatDate(quote.issuedAt)}
          </div>
        </footer>
      </div>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "11pt" }}>
      <span className="muted">{label}</span>
      <span className={mono ? "mono" : ""}>{value}</span>
    </div>
  );
}
