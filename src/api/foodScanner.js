export async function scanFoodLabel({ file, userId, productName, allergies, conditions, mode }) {
  const formData = new FormData();
  formData.append('image', file);
  if (userId) formData.append('userId', userId);
  if (productName) formData.append('productName', productName);
  formData.append('mode', mode || 'companion');
  formData.append('allergies', JSON.stringify(allergies || []));
  formData.append('conditions', JSON.stringify(conditions || []));

  const response = await fetch('/api/food/scan', {
    method: 'POST',
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Unable to scan this food label right now.');
  }

  return payload;
}
