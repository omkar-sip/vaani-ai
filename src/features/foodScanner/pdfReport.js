import { drawTextBlock, downloadCanvasPdf } from '../../utils/canvasPdf';

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

export async function downloadFoodReportPdf({ result, imageFile }) {
  if (!result) {
    throw new Error('No report is available to download yet.');
  }

  const reportCanvas = await buildReportCanvas({ result, imageFile });
  const safeName = (result.productName || 'food-report').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
  await downloadCanvasPdf({
    canvas: reportCanvas,
    fileName: `${safeName}-ingredient-report.pdf`,
  });
}
