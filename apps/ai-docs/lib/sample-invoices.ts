import PDFDocument from "pdfkit";

interface InvoiceItem {
  description: string;
  qty: number;
  price: number;
}

interface InvoiceData {
  id: string;
  filename: string;
  currency: string;
  taxRate?: number;
  vendor: { name: string; address: string; email: string; phone: string };
  billTo: { name: string; address: string; city: string; email: string };
  invoice: { number: string; date: string; due: string };
  items: InvoiceItem[];
  notes?: string;
}

function fmt(n: number, code = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(n);
}

function drawHRule(doc: PDFKit.PDFDocument, y: number) {
  doc.moveTo(50, y).lineTo(545, y).strokeColor("#e5e7eb").lineWidth(0.5).stroke();
}

function buildInvoice(doc: PDFKit.PDFDocument, data: InvoiceData) {
  const { vendor, billTo, invoice, items } = data;
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const tax = subtotal * (data.taxRate ?? 0);
  const total = subtotal + tax;

  doc.rect(0, 0, 595, 90).fill("#1e3a5f");
  doc.font("Helvetica-Bold").fontSize(26).fillColor("#ffffff").text(vendor.name, 50, 28);
  doc.font("Helvetica").fontSize(9).fillColor("#93c5fd")
    .text(vendor.address, 50, 58)
    .text(`${vendor.email}  ·  ${vendor.phone}`, 50, 70);
  doc.font("Helvetica-Bold").fontSize(32).fillColor("#ffffff")
    .text("INVOICE", 370, 28, { align: "right", width: 175 });

  doc.rect(370, 95, 175, 80).fill("#f0f9ff").stroke("#bae6fd");
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#0369a1")
    .text("INVOICE NO.", 378, 103)
    .text("DATE", 378, 121)
    .text("DUE DATE", 378, 139)
    .text("AMOUNT DUE", 378, 157);
  doc.font("Helvetica").fontSize(8).fillColor("#0f172a")
    .text(invoice.number, 460, 103, { align: "right", width: 77 })
    .text(invoice.date, 460, 121, { align: "right", width: 77 })
    .text(invoice.due, 460, 139, { align: "right", width: 77 });
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#0369a1")
    .text(fmt(total, data.currency), 460, 157, { align: "right", width: 77 });

  doc.font("Helvetica-Bold").fontSize(8).fillColor("#6b7280").text("BILL TO", 50, 103);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text(billTo.name, 50, 115);
  doc.font("Helvetica").fontSize(9).fillColor("#374151")
    .text(billTo.address, 50, 129)
    .text(billTo.city, 50, 141)
    .text(billTo.email, 50, 153);

  const tableTop = 200;
  doc.rect(50, tableTop, 495, 20).fill("#1e3a5f");
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff")
    .text("DESCRIPTION", 58, tableTop + 6)
    .text("QTY", 360, tableTop + 6, { width: 40, align: "right" })
    .text("UNIT PRICE", 405, tableTop + 6, { width: 75, align: "right" })
    .text("TOTAL", 483, tableTop + 6, { width: 55, align: "right" });

  let y = tableTop + 20;
  items.forEach((item, i) => {
    const lineTotal = item.qty * item.price;
    doc.rect(50, y, 495, 22).fill(i % 2 === 0 ? "#f8fafc" : "#ffffff");
    doc.font("Helvetica").fontSize(9).fillColor("#1f2937")
      .text(item.description, 58, y + 7, { width: 295 })
      .text(String(item.qty), 360, y + 7, { width: 40, align: "right" })
      .text(fmt(item.price, data.currency), 405, y + 7, { width: 75, align: "right" })
      .text(fmt(lineTotal, data.currency), 483, y + 7, { width: 55, align: "right" });
    y += 22;
  });

  drawHRule(doc, y + 4);
  y += 16;

  function totalsRow(label: string, value: string, bold = false, accent = false) {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(bold ? 10 : 9)
      .fillColor(accent ? "#0369a1" : "#374151")
      .text(label, 390, y, { width: 95, align: "right" })
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fillColor(accent ? "#0369a1" : "#0f172a")
      .text(value, 490, y, { width: 55, align: "right" });
    y += bold ? 18 : 15;
  }

  totalsRow("Subtotal", fmt(subtotal, data.currency));
  if (data.taxRate) totalsRow(`Tax (${Math.round(data.taxRate * 100)}%)`, fmt(tax, data.currency));
  drawHRule(doc, y);
  y += 8;
  totalsRow("TOTAL DUE", fmt(total, data.currency), true, true);

  if (data.notes) {
    y += 20;
    drawHRule(doc, y);
    y += 12;
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#6b7280").text("NOTES & PAYMENT TERMS", 50, y);
    y += 12;
    doc.font("Helvetica").fontSize(9).fillColor("#374151").text(data.notes, 50, y, { width: 495 });
  }

  doc.rect(0, 760, 595, 82).fill("#f0f9ff");
  doc.font("Helvetica").fontSize(8).fillColor("#6b7280")
    .text(`Thank you for your business — ${vendor.name}`, 50, 773, { align: "center", width: 495 })
    .text(`Questions? Contact us at ${vendor.email}`, 50, 785, { align: "center", width: 495 });
}

export function generateSamplePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    buildInvoice(doc, data);
    doc.end();
  });
}

// ─── randomisation helpers ────────────────────────────────────────────────────

function ri(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rp(base: number, pct = 0.25) {
  const delta = base * pct;
  const raw = base - delta + Math.random() * delta * 2;
  return Math.round(raw * 100) / 100;
}

function randomDate(daysBack = 180): string {
  const d = new Date();
  d.setDate(d.getDate() - ri(7, daysBack));
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function pad(n: number, len = 4) {
  return String(n).padStart(len, "0");
}

// ─── invoice factories ────────────────────────────────────────────────────────

function makeAcme(): InvoiceData {
  const num = `INV-${new Date().getFullYear()}-${pad(ri(1, 9999))}`;
  const hrs = ri(20, 60);
  const rate = rp(250, 0.2);
  const date = randomDate();
  return {
    id: "acme",
    filename: `invoice-acme-software-${num}.pdf`,
    currency: "USD",
    taxRate: 0.08,
    vendor: {
      name: "Acme Software Solutions Inc.",
      address: "742 Evergreen Terrace, Suite 400, Springfield, IL 62701",
      email: "billing@acmesoftware.com",
      phone: "+1 (312) 555-0192",
    },
    billTo: {
      name: "GlobalTech Enterprises LLC",
      address: "1 Infinite Loop",
      city: "Cupertino, CA 95014",
      email: "ap@globaltech.com",
    },
    invoice: { number: num, date, due: addDays(date, 30) },
    items: [
      { description: "Enterprise SaaS License — Annual Subscription (Pro Tier)", qty: 1, price: rp(12000, 0.3) },
      { description: `Onboarding & Implementation Services (${hrs} hrs @ $${rate.toFixed(0)}/hr)`, qty: hrs, price: rate },
      { description: "Custom API Integration Module", qty: 1, price: rp(3500, 0.3) },
      { description: "Priority Support Package (12 months)", qty: 1, price: rp(1800, 0.2) },
      { description: "Data Migration & ETL Pipeline Setup", qty: 1, price: rp(2200, 0.25) },
    ],
    notes: `Payment due within 30 days. Wire transfer preferred. Late payments subject to 1.5% monthly interest. Contract #GTE-${new Date().getFullYear()}-${pad(ri(1, 999), 4)}.`,
  };
}

function makeNorthStar(): InvoiceData {
  const num = `INV-NS-${pad(ri(1, 9999))}`;
  const seniorHrs = ri(20, 50);
  const seniorRate = rp(195, 0.2);
  const analystHrs = ri(15, 40);
  const analystRate = rp(145, 0.2);
  const workshopDays = ri(1, 3);
  const date = randomDate();
  return {
    id: "northstar",
    filename: `invoice-northstar-consulting-${num}.pdf`,
    currency: "USD",
    taxRate: 0,
    vendor: {
      name: "NorthStar Consulting Group",
      address: "88 Pine Street, Floor 12, New York, NY 10005",
      email: "invoices@northstarcg.com",
      phone: "+1 (212) 555-0384",
    },
    billTo: {
      name: "Meridian Healthcare Partners",
      address: "300 Research Drive",
      city: "Durham, NC 27701",
      email: "finance@meridianhealth.org",
    },
    invoice: { number: num, date, due: addDays(date, 30) },
    items: [
      { description: "Strategic IT Roadmap Assessment (Phase 1)", qty: 1, price: rp(8500, 0.3) },
      { description: `Senior Consultant — Project Management (${seniorHrs} hrs @ $${seniorRate.toFixed(0)}/hr)`, qty: seniorHrs, price: seniorRate },
      { description: `Business Analyst — Requirements Gathering (${analystHrs} hrs @ $${analystRate.toFixed(0)}/hr)`, qty: analystHrs, price: analystRate },
      { description: `Executive Workshop Facilitation (${workshopDays} day${workshopDays > 1 ? "s" : ""})`, qty: workshopDays, price: rp(2200, 0.2) },
      { description: "Deliverable: IT Strategy Document & Roadmap Report", qty: 1, price: rp(1500, 0.25) },
    ],
    notes: `Net 30 terms apply. No tax applies per professional services exemption. PO reference: MHP-${new Date().getFullYear()}-IT-${pad(ri(1, 999), 3)}.`,
  };
}

function makePeak(): InvoiceData {
  const num = `INV-PS-${pad(ri(1000, 9999))}`;
  const chairs = ri(4, 16);
  const desks = ri(2, 8);
  const keyboards = ri(5, 20);
  const monitors = ri(3, 10);
  const cables = ri(10, 30);
  const date = randomDate();
  return {
    id: "peak",
    filename: `invoice-peak-supplies-${num}.pdf`,
    currency: "USD",
    taxRate: 0.0875,
    vendor: {
      name: "Peak Office Supplies Co.",
      address: "5500 Industrial Way, Unit 3, Denver, CO 80216",
      email: "orders@peaksupplies.com",
      phone: "+1 (720) 555-0277",
    },
    billTo: {
      name: "Sunrise Marketing Agency",
      address: "2104 Commerce Street, Suite 200",
      city: "Dallas, TX 75201",
      email: "purchasing@sunrisemarketing.com",
    },
    invoice: { number: num, date, due: addDays(date, 30) },
    items: [
      { description: "Ergonomic Office Chair — Model ErgoPlus 3000 (Black)", qty: chairs, price: rp(489.99, 0.15) },
      { description: "Standing Desk Converter — 32-inch Dual Monitor", qty: desks, price: rp(229.5, 0.15) },
      { description: "Wireless Keyboard & Mouse Combo (Business Edition)", qty: keyboards, price: rp(78.0, 0.15) },
      { description: "27-inch LED Monitor — 4K UHD, USB-C", qty: monitors, price: rp(345.0, 0.15) },
      { description: "Cable Management Kit (per workstation)", qty: cables, price: rp(24.99, 0.1) },
      { description: "Delivery & Installation Service", qty: 1, price: rp(350.0, 0.2) },
    ],
    notes: "All items include 1-year manufacturer warranty. Returns accepted within 14 days in original packaging. Texas sales tax (8.75%) applied.",
  };
}

export function getSampleInvoices(): InvoiceData[] {
  return [makeAcme(), makeNorthStar(), makePeak()];
}
