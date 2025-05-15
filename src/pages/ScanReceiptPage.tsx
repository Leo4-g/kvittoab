import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { processReceiptWithOCR, uploadDocument } from '../services/documentService';

export default function ScanReceiptPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [transactionType, setTransactionType] = useState<'income' | 'expense' | null>(null);
  const [showTypeSelection, setShowTypeSelection] = useState(true);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showCameraInterface, setShowCameraInterface] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  // Create refs for file inputs and video element
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const selectTransactionType = (type: 'income' | 'expense') => {
    setTransactionType(type);
    setShowTypeSelection(false);
    setShowImageUpload(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Process image
      await processImage(file);
    }
  };

  const handleUploadClick = () => {
    // Open file browser
    fileInputRef.current?.click();
  };

  const handleCameraCapture = async () => {
    try {
      // Close camera interface if it's already open
      if (showCameraInterface) {
        setShowCameraInterface(false);
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
        }
        return;
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera access is not supported in this browser. Please use the upload option instead.');
        return;
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      setCameraStream(stream);
      setShowCameraInterface(true);
      
      // Set the video stream to the video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Failed to access camera. Please check your camera permissions or use the upload option instead.');
    }
  };

  const takePicture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame to the canvas
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
          setImage(file);
          
          // Create preview
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
          
          // Close camera interface
          setShowCameraInterface(false);
          if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
          }
          
          // Process image
          await processImage(file);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const processImage = async (file: File) => {
    setProcessing(true);
    
    try {
      // Process with OCR
      const result = await processReceiptWithOCR(file);
      
      setOcrResult(result);
      
      // Pre-fill form with extracted data
      if (result) {
        if (result.total) setAmount(result.total.toString());
        if (result.date) setDate(result.date);
        if (result.vendor) setVendor(result.vendor);
        setTitle(`Receipt from ${result.vendor || 'Unknown'}`);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process the receipt. Please try again or enter details manually.');
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setImage(null);
    setImagePreview(null);
    setOcrResult(null);
    setTitle('');
    setAmount('');
    setDate('');
    setVendor('');
    setCategory('');
    setNotes('');
    setTransactionType(null);
    setShowTypeSelection(true);
    setShowImageUpload(false);
    setShowCameraInterface(false);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!image) {
      alert('Please scan or upload a receipt image');
      return;
    }

    if (!title || !amount) {
      alert('Please provide at least a title and amount');
      return;
    }

    if (!transactionType) {
      alert('Please select whether this is an income or expense');
      return;
    }

    setProcessing(true);

    try {
      const documentData = {
        title,
        amount: parseFloat(amount),
        date: date || new Date().toISOString().split('T')[0],
        vendor,
        category,
        notes,
        userId: currentUser?.id,
        userType: currentUser?.userType,
        status: currentUser?.userType === 'admin' || currentUser?.userType === 'accountant' ? 'approved' : 'pending',
        image,
        transactionType,
      };

      await uploadDocument(documentData);
      alert('Receipt uploaded successfully');
      resetForm();
      navigate('/');
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload the receipt. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">Scan Receipt</h1>
      
      {showTypeSelection && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-center">Select Transaction Type</h2>
          <p className="text-gray-600 mb-6 text-center">Is this an income or expense?</p>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => selectTransactionType('income')}
              className="flex items-center justify-center px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors w-full max-w-xs"
            >
              <TrendingUp className="mr-2" size={20} />
              <span>Income</span>
            </button>
            
            <button
              onClick={() => selectTransactionType('expense')}
              className="flex items-center justify-center px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors w-full max-w-xs"
            >
              <TrendingDown className="mr-2" size={20} />
              <span>Expense</span>
            </button>
          </div>
        </div>
      )}
      
      {showImageUpload && !imagePreview && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {/* File input for regular uploads */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div className="flex flex-col items-center justify-center">
              <div className="text-indigo-600 mb-4">
                <Camera size={48} />
              </div>
              <p className="text-gray-600 mb-6">Upload a receipt image or take a photo</p>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleUploadClick}
                  className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <Upload size={20} className="mr-2" />
                  <span>Upload Image</span>
                </button>
                
                <button
                  onClick={handleCameraCapture}
                  className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <Camera size={20} className="mr-2" />
                  <span>Use Camera</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Camera interface */}
          {showCameraInterface && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg overflow-hidden max-w-lg w-full">
                <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
                  <h3 className="text-lg font-medium">Take a Photo</h3>
                  <button 
                    onClick={handleCameraCapture}
                    className="text-white hover:text-gray-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="relative">
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline
                    className="w-full h-auto"
                  ></video>
                  <canvas ref={canvasRef} className="hidden"></canvas>
                </div>
                
                <div className="p-4 flex justify-center">
                  <button
                    onClick={takePicture}
                    className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center hover:bg-indigo-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {imagePreview && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-6">
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Receipt preview" 
                className="w-full h-auto max-h-96 object-contain rounded-lg"
              />
              <button
                onClick={resetForm}
                className="absolute top-2 right-2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          {processing ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
              <p className="text-indigo-600 font-medium">Processing receipt...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 className="text-xl font-semibold mb-4">Receipt Details</h2>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Transaction Type</label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setTransactionType('income')}
                    className={`flex items-center justify-center px-4 py-2 rounded-md flex-1 ${
                      transactionType === 'income' 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}
                  >
                    <TrendingUp size={20} className="mr-2" />
                    <span>Income</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setTransactionType('expense')}
                    className={`flex items-center justify-center px-4 py-2 rounded-md flex-1 ${
                      transactionType === 'expense' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-red-50 text-red-600 border border-red-200'
                    }`}
                  >
                    <TrendingDown size={20} className="mr-2" />
                    <span>Expense</span>
                  </button>
                </div>
              </div>
              
              {ocrResult && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-md mb-4">
                  OCR completed. Please verify the extracted information.
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="title" className="block text-gray-700 font-medium mb-2">Title</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Receipt title"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="amount" className="block text-gray-700 font-medium mb-2">Amount ($)</label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="date" className="block text-gray-700 font-medium mb-2">Date</label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="vendor" className="block text-gray-700 font-medium mb-2">Vendor</label>
                <input
                  type="text"
                  id="vendor"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Vendor name"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="category" className="block text-gray-700 font-medium mb-2">Category</label>
                <input
                  type="text"
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Office Supplies, Travel, etc."
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="notes" className="block text-gray-700 font-medium mb-2">Notes</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Additional notes"
                  rows={4}
                ></textarea>
              </div>
              
              <button
                type="submit"
                disabled={processing}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
              >
                {processing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Submit Receipt</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
