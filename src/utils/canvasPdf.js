export function wrapText(context, text, maxWidth) {
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

export function drawTextBlock(
  context,
  { text, x, y, maxWidth, lineHeight, color = '#374151', font = '28px sans-serif', weight }
) {
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
  objects[2] = encoder.encode(
    `2 0 obj\n<< /Type /Pages /Count ${pageObjectIds.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] >>\nendobj\n`
  );

  jpegPages.forEach((page, index) => {
    const imageId = imageObjectIds[index];
    const contentId = contentObjectIds[index];
    const pageId = pageObjectIds[index];
    const imageHeader = encoder.encode(
      `${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>\nstream\n`
    );
    const imageFooter = encoder.encode('\nendstream\nendobj\n');
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

export async function downloadCanvasPdf({ canvas, fileName }) {
  const pageHeightPx = Math.floor(canvas.width * (841.89 / 595.28));
  const pages = [];

  for (let y = 0; y < canvas.height; y += pageHeightPx) {
    const sliceHeight = Math.min(pageHeightPx, canvas.height - y);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = pageHeightPx;
    const pageContext = pageCanvas.getContext('2d');
    if (!pageContext) {
      throw new Error('Unable to build the PDF report on this browser.');
    }

    pageContext.fillStyle = '#ffffff';
    pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    pageContext.drawImage(
      canvas,
      0,
      y,
      canvas.width,
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
  anchor.href = URL.createObjectURL(blob);
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
}
