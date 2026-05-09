import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const outputDir = path.join(process.cwd(), "sample-documents");
fs.mkdirSync(outputDir, { recursive: true });

function createPDF(filename: string, title: string, sections: { heading: string; body: string }[]) {
  return new Promise<void>((resolve) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const stream = fs.createWriteStream(path.join(outputDir, filename));
    doc.pipe(stream);

    // Title
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text(title, { align: "center" })
      .moveDown(1.5);

    for (const section of sections) {
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(section.heading)
        .moveDown(0.4);

      doc
        .fontSize(11)
        .font("Helvetica")
        .text(section.body, { align: "justify" })
        .moveDown(1.2);
    }

    doc.end();
    stream.on("finish", resolve);
  });
}

async function main() {
  await createPDF("returns-and-refunds.pdf", "Returns & Refunds Policy", [
    {
      heading: "30-Day Return Window",
      body: "You may return most items within 30 days of delivery for a full refund. Items must be unused, in their original packaging, and accompanied by a receipt or order confirmation email. Certain product categories such as digital downloads, perishable goods, and custom-engraved items are non-returnable.",
    },
    {
      heading: "How to Start a Return",
      body: "To initiate a return, log in to your account, navigate to Order History, select the order containing the item, and click 'Return Item'. You will receive a prepaid return shipping label via email within 1 business day. Pack the item securely and drop it off at any authorized carrier location.",
    },
    {
      heading: "Refund Timeline",
      body: "Once we receive and inspect the returned item (typically 2–3 business days after carrier delivery), we will process your refund within 5 business days. Refunds are issued to the original payment method. Credit card refunds may take an additional 3–7 business days to appear on your statement depending on your bank.",
    },
    {
      heading: "Damaged or Defective Items",
      body: "If you received a damaged or defective item, contact support@shop.example.com within 7 days of delivery. Include your order number and photos of the damage. We will ship a replacement at no cost or issue a full refund, whichever you prefer. You do not need to return the damaged item.",
    },
    {
      heading: "Exchanges",
      body: "We do not process direct exchanges. To swap for a different size or color, return the original item and place a new order. If you need the replacement urgently, place the new order immediately and we will prioritize fulfillment.",
    },
    {
      heading: "Non-Returnable Items",
      body: "The following items cannot be returned: digital gift cards, downloadable software, personalized or custom-made products, hazardous materials, and items marked 'Final Sale' at the time of purchase.",
    },
  ]);

  await createPDF("shipping-and-delivery.pdf", "Shipping & Delivery Guide", [
    {
      heading: "Standard Shipping",
      body: "Standard shipping is available on all orders and takes 5–7 business days from the date of dispatch. Orders placed before 2:00 PM EST Monday–Friday are typically dispatched the same day. Orders placed on weekends or public holidays are dispatched on the next business day. Standard shipping is free on orders over $50.",
    },
    {
      heading: "Expedited Shipping",
      body: "Expedited shipping (2–3 business days) is available for an additional $9.99. This option is available for most items shipped within the contiguous United States. Alaska, Hawaii, and US territories may require an additional 1–2 days.",
    },
    {
      heading: "Overnight Shipping",
      body: "Overnight shipping guarantees next-business-day delivery by 10:30 AM when ordered before 12:00 PM EST. The cost is $24.99 per shipment. Overnight shipping is not available for oversized items, hazardous goods, or orders shipping to PO boxes.",
    },
    {
      heading: "International Shipping",
      body: "We ship to over 40 countries. International orders typically arrive within 10–21 business days depending on destination and local customs processing. Customers are responsible for any import duties, taxes, or customs fees levied by the destination country. We are not liable for delays caused by customs.",
    },
    {
      heading: "Order Tracking",
      body: "Once your order ships, you will receive a shipping confirmation email with a tracking number. You can track your package in real time on our website under 'Track Order' or directly on the carrier's website. Tracking information may take up to 24 hours to appear after dispatch.",
    },
    {
      heading: "Lost or Stolen Packages",
      body: "If your tracking shows 'Delivered' but you have not received your package, first check around your property and with neighbors. If the package is still missing after 2 business days, contact us at support@shop.example.com with your order number. We will file a carrier claim and send a replacement or refund within 5 business days.",
    },
  ]);

  await createPDF("product-faq.pdf", "Product FAQ · SmartHome Hub X1", [
    {
      heading: "What is the SmartHome Hub X1?",
      body: "The SmartHome Hub X1 is a central control device for your smart home ecosystem. It supports Zigbee, Z-Wave, Wi-Fi, and Bluetooth protocols, allowing you to connect and automate up to 200 devices from a single app. It also works with Amazon Alexa, Google Assistant, and Apple HomeKit.",
    },
    {
      heading: "What devices are compatible?",
      body: "Hub X1 is compatible with the majority of major smart home brands including Philips Hue, LIFX, Nest, Ring, Ecobee, August, Yale, Schlage, TP-Link Kasa, and hundreds more. A full compatibility list is available at hub.example.com/compatible-devices. New device integrations are added via automatic firmware updates.",
    },
    {
      heading: "How do I set up the Hub X1?",
      body: "Setup takes about 10 minutes. Plug the Hub into power and your router using the included Ethernet cable. Download the SmartHome app (iOS or Android), create an account, and tap 'Add Device' → 'Hub X1'. Follow the in-app instructions to complete pairing. Wi-Fi setup is also supported if an Ethernet connection is unavailable.",
    },
    {
      heading: "Does it require a subscription?",
      body: "Basic local control is completely free with no subscription required. The optional SmartHome Premium plan ($4.99/month or $39.99/year) adds remote access away from home, advanced automation rules, multi-user sharing, cloud backup of device settings, and AI-powered energy usage reports.",
    },
    {
      heading: "What happens during an internet outage?",
      body: "Hub X1 can still control all locally connected Zigbee, Z-Wave, and Bluetooth devices during an internet outage. Wi-Fi devices that rely on cloud services may be unavailable. Schedules and automations stored on the Hub continue to run without internet. Voice assistant commands require internet connectivity.",
    },
    {
      heading: "How do I reset the Hub X1 to factory settings?",
      body: "Hold the reset button on the back of the Hub for 10 seconds until the LED flashes red. The Hub will restart and return to factory defaults. All paired devices and automations will be erased. You can re-pair devices after setup. If you have a Premium account, you can restore your device configuration from the cloud backup.",
    },
    {
      heading: "What is the warranty on Hub X1?",
      body: "Hub X1 comes with a 2-year limited warranty covering manufacturing defects. Physical damage, water damage, and damage from unauthorized modifications are not covered. To make a warranty claim, contact support@hub.example.com with your proof of purchase and a description of the issue.",
    },
  ]);

  console.log(`✓ Created 3 PDF files in ${outputDir}/`);
  console.log("  - returns-and-refunds.pdf");
  console.log("  - shipping-and-delivery.pdf");
  console.log("  - product-faq.pdf");
}

main().catch(console.error);