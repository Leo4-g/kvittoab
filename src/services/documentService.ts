import { supabase } from '../supabase';

// Only frontend code here!
export async function processReceiptWithOCR(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:3001/api/ocr', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  if (result.error) throw new Error(result.error);

  return { text: result.text };
}

// Upload document to storage and database
export async function uploadDocument(documentData: any) {
  try {
    const {
      title,
      amount,
      date,
      vendor,
      taxCategory,
      notes,
      userId,
      transactionType,
      image,
    } = documentData;

    let imageUrl = null;
    if (image) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, image);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('receipts')
        .getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
    }

    // If expense, make amount negative
    let finalAmount = parseFloat(amount);
    if (transactionType === 'expense' && finalAmount > 0) {
      finalAmount = -finalAmount;
    }

    const { error } = await supabase.from('receipts').insert({
      date,
      amount: finalAmount,
      vendor,
      tax_category: taxCategory,
      notes,
      user_id: userId,
      type: transactionType,
      title,
      image_url: imageUrl,
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

