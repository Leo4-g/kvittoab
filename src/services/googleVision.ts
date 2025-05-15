import axios from 'axios';

// This is a client-side implementation that uses a proxy server approach
// In a production environment, you would typically handle this on your backend

const GOOGLE_VISION_API_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';

// In a real app, you would store this in environment variables and use a backend proxy
// For this demo, we'll assume you'll set up a proxy server or use Firebase Functions
const API_KEY = 'YOUR_GOOGLE_CLOUD_API_KEY'; 

export interface GoogleVisionResponse {
  textAnnotations?: {
    description: string;
    boundingPoly?: {
      vertices: { x: number; y: number }[];
    };
  }[];
  fullTextAnnotation?: {
    text: string;
    pages: any[];
  };
  error?: any;
}

export async function analyzeReceiptImage(imageBase64: string): Promise<GoogleVisionResponse> {
  try {
    // Remove data URL prefix if present
    const base64Content = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    
    const requestData = {
      requests: [
        {
          image: {
            content: base64Content
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1
            },
            {
              type: 'DOCUMENT_TEXT_DETECTION',
              maxResults: 1
            }
          ]
        }
      ]
    };

    // In a real application, you would make this request through your backend
    // to protect your API key
    const response = await axios.post(
      `${GOOGLE_VISION_API_ENDPOINT}?key=${API_KEY}`,
      requestData
    );

    if (response.data && response.data.responses && response.data.responses[0]) {
      return response.data.responses[0];
    }
    
    return { error: 'No response data' };
  } catch (error) {
    console.error('Error analyzing image with Google Vision:', error);
    return { error };
  }
}

// Function to extract receipt information from Google Vision response
export function extractReceiptInfo(visionResponse: GoogleVisionResponse) {
  if (!visionResponse.fullTextAnnotation) {
    return null;
  }
  
  const text = visionResponse.fullTextAnnotation.text;
  
  // Extract date - look for common date formats
  const dateRegex = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/;
  const dateMatch = text.match(dateRegex);
  
  // Extract amount - look for dollar amounts
  const amountRegex = /\$?\s*(\d+\.\d{2})/g;
  const amountMatches = [...text.matchAll(amountRegex)];
  
  // Usually the largest amount is the total
  let largestAmount = '';
  let largestValue = 0;
  
  amountMatches.forEach(match => {
    const value = parseFloat(match[1]);
    if (value > largestValue) {
      largestValue = value;
      largestAmount = match[0];
    }
  });
  
  // Extract vendor - usually the first few lines of a receipt
  const lines = text.split('\n');
  let vendor = '';
  
  if (lines.length > 0) {
    // First line is often the vendor name
    vendor = lines[0].trim();
    
    // If first line is too short, it might be a logo or header
    // Try the second line
    if (vendor.length < 3 && lines.length > 1) {
      vendor = lines[1].trim();
    }
  }
  
  return {
    date: dateMatch ? dateMatch[0] : '',
    amount: largestAmount.replace('$', '').trim(),
    vendor: vendor,
    fullText: text
  };
}
