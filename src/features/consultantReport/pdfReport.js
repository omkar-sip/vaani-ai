import { drawTextBlock, downloadCanvasPdf, wrapText } from '../../utils/canvasPdf';

function sanitizeFileName(value) {
  return String(value || 'consultation-report')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function drawTable(context, { title, rows, x, y, width, accent = '#1d4ed8' }) {
  const labelWidth = 250;
  const valueWidth = width - labelWidth - 26;

  context.fillStyle = accent;
  context.fillRect(x, y, width, 44);
  drawTextBlock(context, {
    text: title,
    x: x + 16,
    y: y + 30,
    maxWidth: width - 32,
    lineHeight: 24,
    color: '#ffffff',
    font: '22px sans-serif',
    weight: '700',
  });

  let currentY = y + 44;
  for (const [label, value] of rows) {
    context.font = '19px sans-serif';
    const valueLines = wrapText(context, value, valueWidth - 16);
    const rowHeight = Math.max(48, valueLines.length * 24 + 20);

    context.fillStyle = '#f8fafc';
    context.fillRect(x, currentY, labelWidth, rowHeight);
    context.fillStyle = '#ffffff';
    context.fillRect(x + labelWidth, currentY, width - labelWidth, rowHeight);

    context.strokeStyle = '#cbd5e1';
    context.lineWidth = 1.5;
    context.strokeRect(x, currentY, labelWidth, rowHeight);
    context.strokeRect(x + labelWidth, currentY, width - labelWidth, rowHeight);

    drawTextBlock(context, {
      text: label,
      x: x + 14,
      y: currentY + 29,
      maxWidth: labelWidth - 28,
      lineHeight: 22,
      color: '#0f172a',
      font: '18px sans-serif',
      weight: '600',
    });

    drawTextBlock(context, {
      text: value,
      x: x + labelWidth + 12,
      y: currentY + 29,
      maxWidth: valueWidth,
      lineHeight: 24,
      color: '#334155',
      font: '18px sans-serif',
    });

    currentY += rowHeight;
  }

  return currentY + 18;
}

function drawBulletSection(context, { title, lines, x, y, width, accent }) {
  context.fillStyle = '#ffffff';
  context.fillRect(x, y, width, 42);
  context.fillStyle = accent;
  context.fillRect(x, y, 10, 42);

  let currentY = drawTextBlock(context, {
    text: title,
    x: x + 22,
    y: y + 29,
    maxWidth: width - 32,
    lineHeight: 24,
    color: '#0f172a',
    font: '22px sans-serif',
    weight: '700',
  });
  currentY += 10;

  const items = lines.length ? lines : ['No additional details captured.'];
  for (const line of items) {
    currentY = drawTextBlock(context, {
      text: `- ${line}`,
      x: x + 12,
      y: currentY,
      maxWidth: width - 24,
      lineHeight: 28,
      color: '#334155',
      font: '19px sans-serif',
    });
    currentY += 8;
  }

  return currentY + 10;
}

function buildConsultantReportCanvas(report) {
  const width = 1240;
  const padding = 72;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to build the PDF report on this browser.');
  }

  canvas.width = width;
  canvas.height = 3600;

  context.fillStyle = '#f8fafc';
  context.fillRect(0, 0, width, canvas.height);

  const gradient = context.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, '#1d4ed8');
  gradient.addColorStop(1, '#0f766e');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, 210);

  let y = 78;
  y = drawTextBlock(context, {
    text: 'Consultation PDF Report',
    x: padding,
    y,
    maxWidth: width - padding * 2,
    lineHeight: 44,
    color: '#ffffff',
    font: '38px sans-serif',
    weight: '700',
  });
  y = drawTextBlock(context, {
    text: report.title,
    x: padding,
    y: y + 8,
    maxWidth: width - padding * 2,
    lineHeight: 28,
    color: 'rgba(255,255,255,0.92)',
    font: '22px sans-serif',
    weight: '600',
  });
  drawTextBlock(context, {
    text: `Generated on ${new Date(report.generatedAt).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    x: padding,
    y: y + 8,
    maxWidth: width - padding * 2,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.84)',
    font: '17px sans-serif',
  });

  y = 252;
  context.fillStyle = '#ffffff';
  context.fillRect(padding, y, width - padding * 2, 150);
  context.strokeStyle = '#bfdbfe';
  context.lineWidth = 2;
  context.strokeRect(padding, y, width - padding * 2, 150);

  drawTextBlock(context, {
    text: `Patient: ${report.patientName}`,
    x: padding + 26,
    y: y + 42,
    maxWidth: width - padding * 2 - 52,
    lineHeight: 26,
    color: '#0f172a',
    font: '24px sans-serif',
    weight: '700',
  });
  drawTextBlock(context, {
    text: `Consultation reason: ${report.consultationReason}`,
    x: padding + 26,
    y: y + 76,
    maxWidth: width - padding * 2 - 52,
    lineHeight: 24,
    color: '#1d4ed8',
    font: '20px sans-serif',
    weight: '600',
  });
  drawTextBlock(context, {
    text: report.summary,
    x: padding + 26,
    y: y + 110,
    maxWidth: width - padding * 2 - 52,
    lineHeight: 24,
    color: '#475569',
    font: '18px sans-serif',
  });

  y += 188;
  y = drawTable(context, {
    title: 'Patient Information',
    rows: report.patientInfoRows,
    x: padding,
    y,
    width: width - padding * 2,
    accent: '#1d4ed8',
  });
  y = drawTable(context, {
    title: 'Clinical Details',
    rows: report.clinicalRows,
    x: padding,
    y,
    width: width - padding * 2,
    accent: '#0f766e',
  });
  y = drawTable(context, {
    title: 'Assessment and Plan',
    rows: report.assessmentRows,
    x: padding,
    y,
    width: width - padding * 2,
    accent: '#b45309',
  });

  y = drawBulletSection(context, {
    title: 'Completed Record Snapshot',
    lines: report.completedFields,
    x: padding,
    y,
    width: width - padding * 2,
    accent: '#1d4ed8',
  });
  y = drawBulletSection(context, {
    title: 'Recent Conversation Highlights',
    lines: report.conversationHighlights,
    x: padding,
    y,
    width: width - padding * 2,
    accent: '#0f766e',
  });
  y = drawBulletSection(context, {
    title: 'Disclaimer',
    lines: [report.disclaimer],
    x: padding,
    y,
    width: width - padding * 2,
    accent: '#475569',
  });

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = width;
  finalCanvas.height = Math.max(y + 40, 1500);
  const finalContext = finalCanvas.getContext('2d');
  if (!finalContext) {
    throw new Error('Unable to finalize the PDF report on this browser.');
  }
  finalContext.fillStyle = '#f8fafc';
  finalContext.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  finalContext.drawImage(canvas, 0, 0);
  return finalCanvas;
}

export async function downloadConsultantReportPdf({ report }) {
  if (!report) {
    throw new Error('No consultant report is available yet.');
  }

  const safeName = sanitizeFileName(report.patientName !== 'Not captured' ? report.patientName : report.title);
  await downloadCanvasPdf({
    canvas: buildConsultantReportCanvas(report),
    fileName: `${safeName}-consultation-report.pdf`,
  });
}
