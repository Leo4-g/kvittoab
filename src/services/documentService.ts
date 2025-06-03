import { analyzeReceiptImage, extractReceiptInfo } from './googleVision';
import { supabase } from '../supabase';

// Process receipt with OCR
export async function processReceiptWithOCR(file: File) {
  try {
    // Convert file to base64
    const base64Image = await fileToBase64(file);
    
    // Call Google Vision API
    const visionResponse = await analyzeReceiptImage(base64Image);
    
    // Extract receipt information
    if (visionResponse.error) {
      console.error('Vision API error:', visionResponse.error);
      return null;
    }
    
    const receiptInfo = extractReceiptInfo(visionResponse);
    return receiptInfo;
  } catch (error) {
    console.error('Error processing receipt with OCR:', error);
    throw error;
  }
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
      image, // <-- Pass the File object here
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
      image_url: imageUrl, // <-- Save the image URL
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

// Helper function to convert File to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

