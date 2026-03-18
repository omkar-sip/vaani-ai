function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to prepare the image for the PDF report.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to load the product image for the PDF report.'));
    image.src = src;
  });
}

function wrapText(context, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (context.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function drawTextBlock(context, { text, x, y, maxWidth, lineHeight, color = '#374151', font = '28px sans-serif', weight }) {
  context.fillStyle = color;
  context.font = weight ? `${weight} ${font}` : font;
  const lines = Array.isArray(text) ? text : wrapText(context, text, maxWidth);
  let currentY = y;
  for (const line of lines) {
    context.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

async function buildReportCanvas({ result, imageFile }) {
  const width = 1240;
  const padding = 80;
  const contentWidth = width - padding * 2;
  const imageUrl = imageFile ? await readFileAsDataUrl(imageFile) : null;
  const productImage = imageUrl ? await loadImage(imageUrl) : null;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to build the PDF report on this browser.');
  }

  canvas.width = width;
  canvas.height = 2400;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  let y = 90;
  context.fillStyle = '#f97316';
  context.fillRect(padding, y, 220, 14);
  y += 44;

  y = drawTextBlock(context, {
    text: 'Food Ingredients Report',
    x: padding,
    y,
    maxWidth: contentWidth,
    lineHeight: 44,
    color: '#111827',
    font: '36px sans-serif',
    weight: '700',
  });
  y += 10;

  y = drawTextBlock(context, {
    text: `Product: ${result.productName || 'Not provided'}`,
    x: padding,
    y,
    maxWidth: contentWidth,
    lineHeight: 28,
    color: '#374151',
    font: '22px sans-serif',
    weight: '600',
  });
  y = drawTextBlock(context, {
    text: `Risk level: ${result.riskLevel}`,
    x: padding,
    y,
    maxWidth: contentWidth,
    lineHeight: 28,
    color: '#374151',
    font: '22px sans-serif',
    weight: '600',
  });
  y += 20;

  if (productImage) {
    const maxImageWidth = contentWidth;
    const maxImageHeight = 420;
    const scale = Math.min(maxImageWidth / productImage.width, maxImageHeight / productImage.height);
    const imageWidth = Math.round(productImage.width * scale);
    const imageHeight = Math.round(productImage.height * scale);
    context.fillStyle = '#f8fafc';
    context.fillRect(padding, y, imageWidth, imageHeight);
    context.drawImage(productImage, padding, y, imageWidth, imageHeight);
    y += imageHeight + 28;
  }

  const sections = [
    { title: 'Quick summary', lines: [result.summary] },
    { title: 'What you should do now', lines: result.actionSteps || [] },
    {
      title: 'Triggered alerts',
      lines: result.triggeredAlerts?.length
        ? result.triggeredAlerts.map((alert) => `${alert.ingredient}: ${alert.reason}`)
        : ['No major ingredient triggers were found from the visible label.'],
    },
    {
      title: 'Extracted ingredients',
      lines: result.ingredients?.length ? [result.ingredients.join(', ')] : ['Not available'],
    },
    {
      title: 'Healthier alternatives you can buy',
      lines: result.recommendedAlternatives?.length
        ? result.recommendedAlternatives.map(
            (item) => `${item.name} (${item.availability || 'ONLINE'}): ${item.reason}`
          )
        : ['No online alternatives were needed for this product.'],
    },
    {
      title: 'Home dishes or remedy-style swaps',
      lines: result.homeSuggestions?.length
        ? result.homeSuggestions.map((item) => `${item.name}: ${item.reason}`)
        : ['No extra home suggestions were required for this scan.'],
    },
    {
      title: 'Disclaimer',
      lines: ['This analysis is AI-generated and not a substitute for medical advice.'],
    },
  ];

  for (const section of sections) {
    context.fillStyle = '#fff7ed';
    context.fillRect(padding, y, contentWidth, 42);
    y = drawTextBlock(context, {
      text: section.title,
      x: padding + 16,
      y: y + 28,
      maxWidth: contentWidth - 32,
      lineHeight: 26,
      color: '#9a3412',
      font: '22px sans-serif',
      weight: '700',
    });
    y += 8;

    for (const line of section.lines) {
      const bulletLine = section.lines.length > 1 ? `- ${line}` : line;
      y = drawTextBlock(context, {
        text: bulletLine,
        x: padding + 10,
        y,
        maxWidth: contentWidth - 20,
        lineHeight: 28,
        color: '#374151',
        font: '20px sans-serif',
      });
      y += 8;
    }
    y += 18;
  }

  const finalHeight = Math.max(y + 80, 1200);
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = width;
  finalCanvas.height = finalHeight;
  const finalContext = finalCanvas.getContext('2d');
  finalContext.fillStyle = '#ffffff';
  finalContext.fillRect(0, 0, width, finalHeight);
  finalContext.drawImage(canvas, 0, 0);

  return finalCanvas;
}

function getJpegDimensions(bytes) {
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) + bytes[offset + 3];
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return {
        height: (bytes[offset + 5] << 8) + bytes[offset + 6],
        width: (bytes[offset + 7] << 8) + bytes[offset + 8],
      };
    }
    offset += 2 + length;
  }
  throw new Error('Unable to parse the image for the PDF report.');
}

async function canvasToJpegBytes(canvas) {
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((value) => {
      if (!value) {
        reject(new Error('Unable to export the PDF page image.'));
        return;
      }
      resolve(value);
    }, 'image/jpeg', 0.88);
  });
  return new Uint8Array(await blob.arrayBuffer());
}

function buildPdfFromJpegs(jpegPages) {
  const encoder = new TextEncoder();
  const objects = [];
  const pageObjectIds = [];
  const contentObjectIds = [];
  const imageObjectIds = [];
  const pagesRootId = 2;
  let nextId = 3;

  for (const _page of jpegPages) {
    imageObjectIds.push(nextId++);
    contentObjectIds.push(nextId++);
    pageObjectIds.push(nextId++);
  }

  objects[1] = encoder.encode(`1 0 obj\n<< /Type /Catalog /Pages ${pagesRootId} 0 R >>\nendobj\n`);
  objects[2] = encoder.encode(`2 0 obj\n<< /Type /Pages /Count ${pageObjectIds.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] >>\nendobj\n`);

  jpegPages.forEach((page, index) => {
    const imageId = imageObjectIds[index];
    const contentId = contentObjectIds[index];
    const pageId = pageObjectIds[index];
    const imageHeader = encoder.encode(
      `${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>\nstream\n`
    );
    const imageFooter = encoder.encode(`\nendstream\nendobj\n`);
    objects[imageId] = [imageHeader, page.bytes, imageFooter];

    const contentStream = `q\n595.28 0 0 841.89 0 0 cm\n/Im${index + 1} Do\nQ\n`;
    const contentBytes = encoder.encode(contentStream);
    objects[contentId] = encoder.encode(
      `${contentId} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${contentStream}endstream\nendobj\n`
    );

    objects[pageId] = encoder.encode(
      `${pageId} 0 obj\n<< /Type /Page /Parent ${pagesRootId} 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im${index + 1} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`
    );
  });

  const parts = [encoder.encode('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n')];
  const offsets = [0];
  let position = parts[0].length;

  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = position;
    const objectParts = Array.isArray(objects[id]) ? objects[id] : [objects[id]];
    for (const part of objectParts) {
      parts.push(part);
      position += part.length;
    }
  }

  const xrefOffset = position;
  const xrefLines = [`xref\n0 ${objects.length}\n`, '0000000000 65535 f \n'];
  for (let id = 1; id < objects.length; id += 1) {
    xrefLines.push(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
  }
  const trailer = `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  parts.push(encoder.encode(xrefLines.join('')));
  parts.push(encoder.encode(trailer));

  return new Blob(parts, { type: 'application/pdf' });
}

export async function downloadFoodReportPdf({ result, imageFile }) {
  if (!result) {
    throw new Error('No report is available to download yet.');
  }

  const reportCanvas = await buildReportCanvas({ result, imageFile });
  const pageHeightPx = Math.floor(reportCanvas.width * (841.89 / 595.28));
  const pages = [];

  for (let y = 0; y < reportCanvas.height; y += pageHeightPx) {
    const sliceHeight = Math.min(pageHeightPx, reportCanvas.height - y);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = reportCanvas.width;
    pageCanvas.height = pageHeightPx;
    const pageContext = pageCanvas.getContext('2d');
    pageContext.fillStyle = '#ffffff';
    pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    pageContext.drawImage(
      reportCanvas,
      0,
      y,
      reportCanvas.width,
      sliceHeight,
      0,
      0,
      pageCanvas.width,
      sliceHeight
    );

    const bytes = await canvasToJpegBytes(pageCanvas);
    const dimensions = getJpegDimensions(bytes);
    pages.push({ bytes, ...dimensions });
  }

  const blob = buildPdfFromJpegs(pages);
  const anchor = document.createElement('a');
  const safeName = (result.productName || 'food-report').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `${safeName}-ingredient-report.pdf`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
}
