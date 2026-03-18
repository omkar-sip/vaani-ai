import { drawTextBlock, downloadCanvasPdf } from '../../utils/canvasPdf';

function sanitizeFileName(value) {
  return String(value || 'companion-report')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function drawMetricCard(context, { x, y, width, height, title, value, sublabel, tone }) {
  context.fillStyle = tone.bg;
  context.fillRect(x, y, width, height);
  context.strokeStyle = tone.border;
  context.lineWidth = 2;
  context.strokeRect(x, y, width, height);

  drawTextBlock(context, {
    text: title,
    x: x + 22,
    y: y + 34,
    maxWidth: width - 44,
    lineHeight: 24,
    color: '#475569',
    font: '19px sans-serif',
    weight: '600',
  });
  drawTextBlock(context, {
    text: value,
    x: x + 22,
    y: y + 78,
    maxWidth: width - 44,
    lineHeight: 34,
    color: tone.value,
    font: '30px sans-serif',
    weight: '700',
  });
  drawTextBlock(context, {
    text: sublabel,
    x: x + 22,
    y: y + height - 24,
    maxWidth: width - 44,
    lineHeight: 22,
    color: '#64748b',
    font: '17px sans-serif',
  });
}

function drawSection(context, { title, lines, x, y, width, accent }) {
  context.fillStyle = '#ffffff';
  context.fillRect(x, y, width, 44);
  context.fillStyle = accent;
  context.fillRect(x, y, 12, 44);

  let currentY = drawTextBlock(context, {
    text: title,
    x: x + 22,
    y: y + 31,
    maxWidth: width - 32,
    lineHeight: 28,
    color: '#0f172a',
    font: '24px sans-serif',
    weight: '700',
  });
  currentY += 10;

  const items = lines.length ? lines : ['No additional details yet.'];
  for (const line of items) {
    const text = items.length > 1 ? `- ${line}` : line;
    currentY = drawTextBlock(context, {
      text,
      x: x + 12,
      y: currentY,
      maxWidth: width - 24,
      lineHeight: 29,
      color: '#334155',
      font: '20px sans-serif',
    });
    currentY += 10;
  }

  return currentY + 8;
}

function buildCompanionReportCanvas(report) {
  const width = 1240;
  const padding = 76;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to build the PDF report on this browser.');
  }

  canvas.width = width;
  canvas.height = 3400;

  context.fillStyle = '#f8fafc';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const gradient = context.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, '#0f766e');
  gradient.addColorStop(1, '#0891b2');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, 220);

  let y = 78;
  y = drawTextBlock(context, {
    text: 'Companion Health Analysis',
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
  y = drawTextBlock(context, {
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
    lineHeight: 24,
    color: 'rgba(255,255,255,0.84)',
    font: '18px sans-serif',
  });

  y = 270;
  context.fillStyle = '#ffffff';
  context.fillRect(padding, y, width - padding * 2, 168);
  context.strokeStyle = '#cbd5e1';
  context.lineWidth = 2;
  context.strokeRect(padding, y, width - padding * 2, 168);

  drawTextBlock(context, {
    text: report.overallStatus,
    x: padding + 28,
    y: y + 42,
    maxWidth: 300,
    lineHeight: 30,
    color: '#0f766e',
    font: '24px sans-serif',
    weight: '700',
  });
  drawTextBlock(context, {
    text: report.overview,
    x: padding + 28,
    y: y + 82,
    maxWidth: width - padding * 2 - 260,
    lineHeight: 28,
    color: '#334155',
    font: '20px sans-serif',
  });

  context.fillStyle = '#ecfeff';
  context.fillRect(width - padding - 180, y + 26, 152, 112);
  context.strokeStyle = '#67e8f9';
  context.strokeRect(width - padding - 180, y + 26, 152, 112);
  drawTextBlock(context, {
    text: 'Wellness Score',
    x: width - padding - 160,
    y: y + 56,
    maxWidth: 124,
    lineHeight: 22,
    color: '#155e75',
    font: '16px sans-serif',
    weight: '600',
  });
  drawTextBlock(context, {
    text: String(report.wellnessScore),
    x: width - padding - 152,
    y: y + 112,
    maxWidth: 124,
    lineHeight: 32,
    color: '#0f766e',
    font: '40px sans-serif',
    weight: '700',
  });

  y += 208;
  const cardWidth = Math.floor((width - padding * 2 - 36) / 4);
  const tones = {
    teal: { bg: '#ecfeff', border: '#67e8f9', value: '#0f766e' },
    amber: { bg: '#fffbeb', border: '#fcd34d', value: '#b45309' },
    rose: { bg: '#fff1f2', border: '#fda4af', value: '#be123c' },
    sky: { bg: '#eff6ff', border: '#93c5fd', value: '#1d4ed8' },
  };

  drawMetricCard(context, {
    x: padding,
    y,
    width: cardWidth,
    height: 156,
    title: 'Mood',
    value: `${report.mood.emoji} ${report.mood.label}`,
    sublabel: report.mood.note,
    tone: tones.teal,
  });
  drawMetricCard(context, {
    x: padding + cardWidth + 12,
    y,
    width: cardWidth,
    height: 156,
    title: 'Sleep',
    value: report.sleep.hours != null ? `${report.sleep.hours}h` : report.sleep.quality,
    sublabel: report.sleep.note,
    tone: tones.sky,
  });
  drawMetricCard(context, {
    x: padding + (cardWidth + 12) * 2,
    y,
    width: cardWidth,
    height: 156,
    title: 'Stress',
    value: `${report.stress.percent}%`,
    sublabel: report.stress.note,
    tone: tones.rose,
  });
  drawMetricCard(context, {
    x: padding + (cardWidth + 12) * 3,
    y,
    width: cardWidth,
    height: 156,
    title: 'Healthy Habits',
    value: `${report.habitsDone}/${report.habitsTotal}`,
    sublabel: 'Tracked routines mentioned positively in the session.',
    tone: tones.amber,
  });

  y += 196;

  const sections = [
    { title: 'Key Findings', lines: report.keyFindings, accent: '#0f766e' },
    {
      title: 'Strengths Already Visible',
      lines: report.strengths.length ? report.strengths : ['This session focused more on risk areas than stable routines.'],
      accent: '#2563eb',
    },
    { title: 'Improvement Steps', lines: report.improvementSteps, accent: '#b45309' },
    { title: 'Personalized Healthcare Tips', lines: report.personalizedTips, accent: '#7c3aed' },
    {
      title: 'Habit Snapshot',
      lines: report.habits.map((habit) => `${habit.name}: ${habit.status} - ${habit.note}`),
      accent: '#0f766e',
    },
    {
      title: 'Conversation Highlights',
      lines: report.conversationHighlights.length ? report.conversationHighlights : ['No clear user highlights were captured yet.'],
      accent: '#1d4ed8',
    },
    { title: 'Follow-up Guidance', lines: report.followUp, accent: '#be123c' },
    { title: 'Disclaimer', lines: [report.disclaimer], accent: '#475569' },
  ];

  for (const section of sections) {
    y = drawSection(context, {
      title: section.title,
      lines: section.lines,
      x: padding,
      y,
      width: width - padding * 2,
      accent: section.accent,
    });
    y += 12;
  }

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = width;
  finalCanvas.height = Math.max(y + 50, 1500);
  const finalContext = finalCanvas.getContext('2d');
  if (!finalContext) {
    throw new Error('Unable to finalize the PDF report on this browser.');
  }
  finalContext.fillStyle = '#f8fafc';
  finalContext.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  finalContext.drawImage(canvas, 0, 0);
  return finalCanvas;
}

export async function downloadCompanionReportPdf({ report }) {
  if (!report) {
    throw new Error('No companion report is available yet.');
  }

  const canvas = buildCompanionReportCanvas(report);
  const safeName = sanitizeFileName(report.title || 'companion-report');
  await downloadCanvasPdf({
    canvas,
    fileName: `${safeName}-health-analysis.pdf`,
  });
}
