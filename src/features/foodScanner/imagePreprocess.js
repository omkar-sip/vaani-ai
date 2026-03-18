const MAX_FILE_SIZE = 6 * 1024 * 1024;
const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
const MAX_DIMENSION = 1600;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unable to read that image file.'));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas, type) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Unable to prepare the image for scanning.'));
        return;
      }
      resolve(blob);
    }, type, 0.92);
  });
}

export async function preprocessFoodImage(file) {
  if (!file) {
    throw new Error('Please choose an image first.');
  }
  if (!SUPPORTED_TYPES.has(file.type)) {
    throw new Error('Only JPG, PNG, and WEBP images are supported.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Please upload an image under 6 MB.');
  }

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: false });

  canvas.width = width;
  canvas.height = height;

  if (!context) {
    return file;
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.filter = 'grayscale(100%) contrast(145%) brightness(108%)';
  context.drawImage(image, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, 'image/jpeg');
  const processedName = file.name.replace(/\.[^.]+$/, '') + '-scan.jpg';
  return new File([blob], processedName, { type: 'image/jpeg' });
}
