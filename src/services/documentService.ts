import { analyzeReceiptImage, extractReceiptInfo } from './googleVision';

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
    // In a real implementation, this would:
    // 1. Upload the image to storage (Firebase Storage, Supabase Storage, etc.)
    // 2. Save the document metadata to the database
    
    // For now, we'll just simulate a successful upload
    console.log('Document data to upload:', documentData);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      documentId: 'doc_' + Math.random().toString(36).substr(2, 9)
    };
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
