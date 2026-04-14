import PDFDocument from 'pdfkit';
import { PassThrough } from 'node:stream';

interface HoldingRow {
  productName: string;
  setName: string;
  setCode: string;
  quantity: number;
  purchaseDate: Date | null;
  costBasis: number;
  currentValue: number;
  unrealizedPnl: number;
}

interface Summary {
  totalValue: number;
  costBasis: number;
  unrealizedPnl: number;
  holdings: number;
  uniqueProducts: number;
}

export interface InsurancePdfInput {
  user: {
    displayName: string | null;
    email: string;
  };
  summary: Summary;
  holdings: HoldingRow[];
}

/**
 * Generate an insurance-grade portfolio PDF.
 *
 * Returns a readable stream so the route can `.pipe(reply.raw)` directly
 * and avoid buffering the whole document in memory.
 */
export function generateInsurancePdf(input: InsurancePdfInput): PassThrough {
  const stream = new PassThrough();
  const doc = new PDFDocument({ size: 'LETTER', margin: 54, bufferPages: true });
  doc.pipe(stream);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // ── Header brand bar
  doc
    .rect(0, 0, doc.page.width, 76)
    .fill('#0B0B18');
  doc
    .fill('#FFFFFF')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('GrailIQ', 54, 26);
  doc
    .font('Helvetica')
    .fontSize(10)
    .fill('#7F77DD')
    .text('Sealed Pokémon TCG · Portfolio Statement', 54, 52);
  doc
    .fontSize(10)
    .fill('#F4C430')
    .text(dateStr, doc.page.width - 54 - 160, 42, { width: 160, align: 'right' });

  doc.moveDown(4);

  // ── Owner info
  doc
    .fill('#1F2937')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('OWNER', 54, 110);
  doc
    .font('Helvetica')
    .fontSize(13)
    .fill('#111827')
    .text(input.user.displayName ?? '—', 54, 125);
  doc
    .fontSize(10)
    .fill('#6B7280')
    .text(input.user.email, 54, 144);

  // ── Summary box
  const boxY = 180;
  doc
    .rect(54, boxY, doc.page.width - 108, 90)
    .lineWidth(1)
    .stroke('#E5E7EB');

  const summaryCol = (label: string, value: string, i: number) => {
    const colW = (doc.page.width - 108) / 4;
    const x = 54 + colW * i;
    doc
      .fontSize(9)
      .fill('#6B7280')
      .font('Helvetica-Bold')
      .text(label.toUpperCase(), x + 16, boxY + 16);
    doc
      .fontSize(18)
      .fill('#111827')
      .font('Helvetica-Bold')
      .text(value, x + 16, boxY + 32);
  };

  summaryCol('Total Value', fmtMoney(input.summary.totalValue), 0);
  summaryCol('Cost Basis', fmtMoney(input.summary.costBasis), 1);
  summaryCol(
    'Unrealized P&L',
    `${input.summary.unrealizedPnl >= 0 ? '+' : ''}${fmtMoney(input.summary.unrealizedPnl)}`,
    2,
  );
  summaryCol(
    'Holdings',
    `${input.summary.holdings} (${input.summary.uniqueProducts} SKUs)`,
    3,
  );

  // ── Holdings table
  const tableY = 300;
  doc
    .fontSize(12)
    .fill('#111827')
    .font('Helvetica-Bold')
    .text('Holdings', 54, tableY);

  const headerY = tableY + 22;
  const cols = [
    { label: 'Product', x: 54, w: 210 },
    { label: 'Set', x: 266, w: 80 },
    { label: 'Qty', x: 348, w: 28, align: 'right' as const },
    { label: 'Cost', x: 380, w: 60, align: 'right' as const },
    { label: 'Value', x: 442, w: 60, align: 'right' as const },
    { label: 'P&L', x: 504, w: 60, align: 'right' as const },
  ];

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fill('#6B7280');
  cols.forEach((c) =>
    doc.text(c.label.toUpperCase(), c.x, headerY, {
      width: c.w,
      align: c.align ?? 'left',
    }),
  );
  doc
    .moveTo(54, headerY + 14)
    .lineTo(doc.page.width - 54, headerY + 14)
    .lineWidth(1)
    .stroke('#E5E7EB');

  let rowY = headerY + 22;
  doc.font('Helvetica').fontSize(9).fill('#111827');
  for (const h of input.holdings) {
    // Page break when close to bottom
    if (rowY > doc.page.height - 80) {
      doc.addPage();
      rowY = 80;
    }

    const pnlColor = h.unrealizedPnl >= 0 ? '#059669' : '#DC2626';

    doc.fill('#111827').text(h.productName, cols[0].x, rowY, { width: cols[0].w, ellipsis: true });
    doc.fill('#6B7280').text(`${h.setName} · ${h.setCode}`, cols[1].x, rowY, {
      width: cols[1].w,
      ellipsis: true,
    });
    doc.fill('#111827').text(String(h.quantity), cols[2].x, rowY, {
      width: cols[2].w,
      align: 'right',
    });
    doc.fill('#111827').text(fmtMoney(h.costBasis), cols[3].x, rowY, {
      width: cols[3].w,
      align: 'right',
    });
    doc.fill('#111827').text(fmtMoney(h.currentValue), cols[4].x, rowY, {
      width: cols[4].w,
      align: 'right',
    });
    doc
      .fill(pnlColor)
      .text(
        `${h.unrealizedPnl >= 0 ? '+' : ''}${fmtMoney(h.unrealizedPnl)}`,
        cols[5].x,
        rowY,
        { width: cols[5].w, align: 'right' },
      );

    rowY += 18;
  }

  // ── Footer on every page
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(8)
      .fill('#9CA3AF')
      .font('Helvetica')
      .text(
        `Generated ${now.toISOString()} · Page ${i + 1} of ${pageCount} · grailiq.com`,
        54,
        doc.page.height - 48,
        { width: doc.page.width - 108, align: 'center' },
      );
  }

  doc.end();
  return stream;
}

function fmtMoney(v: number): string {
  const n = Math.round(v * 100) / 100;
  const abs = Math.abs(n)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${n < 0 ? '-' : ''}$${abs}`;
}
