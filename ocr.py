import cv2
import pytesseract
from PIL import Image
import numpy as np
import os
import argparse
from pathlib import Path

class ImageTextExtractor:
    def __init__(self, tesseract_path=None):
        """
        Initialize the text extractor optimized for phone screenshots
        
        Args:
            tesseract_path (str): Path to tesseract executable if not in PATH
        """
        if tesseract_path:
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
        
        # Common phone screenshot dimensions for optimization
        self.phone_configs = {
            'default': r'--oem 3 --psm 6',
            'single_column': r'--oem 3 --psm 4',  # For single column text
            'sparse_text': r'--oem 3 --psm 8',   # For sparse text
            'single_word': r'--oem 3 --psm 8',   # For single words
            'vertical_text': r'--oem 3 --psm 5'  # For vertical text blocks
        }
    
    def preprocess_screenshot(self, image_path):
        """
        Preprocess phone screenshot for optimal OCR
        
        Args:
            image_path (str): Path to the screenshot file
            
        Returns:
            numpy.ndarray: Preprocessed image
        """
        # Read image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not read image from {image_path}")
        
        # Get image dimensions to detect phone aspect ratio
        height, width = image.shape[:2]
        aspect_ratio = height / width
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # For phone screenshots, often need to enhance contrast
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # Apply bilateral filter to reduce noise while preserving edges
        denoised = cv2.bilateralFilter(enhanced, 9, 75, 75)
        
        # Apply adaptive thresholding (better for screenshots with varying lighting)
        binary = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                     cv2.THRESH_BINARY, 11, 2)
        
        # For very high resolution screenshots, resize to optimize processing
        if width > 1080 or height > 1920:
            scale_factor = min(1080/width, 1920/height)
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            binary = cv2.resize(binary, (new_width, new_height), interpolation=cv2.INTER_AREA)
        
        return binary, aspect_ratio
    
    def extract_text_basic(self, image_path, lang='eng'):
        """
        Extract text from image using basic OCR
        
        Args:
            image_path (str): Path to the image file
            lang (str): Language code for OCR (default: 'eng')
            
        Returns:
            str: Extracted text
        """
        try:
            # Open image with PIL
            image = Image.open(image_path)
            
            # Extract text
            text = pytesseract.image_to_string(image, lang=lang)
            
            return text.strip()
        
        except Exception as e:
            print(f"Error extracting text from {image_path}: {str(e)}")
            return ""
    
    def extract_text_from_screenshot(self, image_path, lang='eng'):
        """
        Extract text from phone screenshot with optimized settings
        
        Args:
            image_path (str): Path to the screenshot file
            lang (str): Language code for OCR (default: 'eng')
            
        Returns:
            dict: Dictionary containing extracted text and metadata
        """
        try:
            # Preprocess screenshot
            processed_image, aspect_ratio = self.preprocess_screenshot(image_path)
            
            # Convert back to PIL Image
            pil_image = Image.fromarray(processed_image)
            
            # Determine best OCR configuration based on aspect ratio
            if aspect_ratio > 1.5:  # Tall phone screenshot
                config = self.phone_configs['single_column']
            else:
                config = self.phone_configs['default']
            
            # Extract text with optimized config
            text = pytesseract.image_to_string(pil_image, lang=lang, config=config)
            
            # Get confidence data
            data = pytesseract.image_to_data(pil_image, lang=lang, output_type=pytesseract.Output.DICT)
            
            # Calculate average confidence
            confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            # Extract metadata
            file_stats = os.stat(image_path)
            file_size = file_stats.st_size / 1024  # KB
            
            return {
                'filename': os.path.basename(image_path),
                'text': text.strip(),
                'confidence': round(avg_confidence, 2),
                'word_count': len(text.split()) if text.strip() else 0,
                'file_size_kb': round(file_size, 2),
                'aspect_ratio': round(aspect_ratio, 2),
                'processing_config': config
            }
        
        except Exception as e:
            print(f"Error processing screenshot {image_path}: {str(e)}")
            return {
                'filename': os.path.basename(image_path),
                'text': '',
                'confidence': 0,
                'word_count': 0,
                'file_size_kb': 0,
                'aspect_ratio': 0,
                'processing_config': 'error',
                'error': str(e)
            }
    
    def extract_text_with_confidence(self, image_path, lang='eng'):
        """
        Extract text with confidence scores
        
        Args:
            image_path (str): Path to the image file
            lang (str): Language code for OCR (default: 'eng')
            
        Returns:
            dict: Dictionary containing text and confidence information
        """
        try:
            # Open image with PIL
            image = Image.open(image_path)
            
            # Get detailed data
            data = pytesseract.image_to_data(image, lang=lang, output_type=pytesseract.Output.DICT)
            
            # Extract text with confidence > 0
            text_parts = []
            confidences = []
            
            for i in range(len(data['text'])):
                if int(data['conf'][i]) > 0:
                    text_parts.append(data['text'][i])
                    confidences.append(int(data['conf'][i]))
            
            full_text = ' '.join(text_parts)
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            return {
                'text': full_text.strip(),
                'confidence': round(avg_confidence, 2),
                'word_count': len(text_parts)
            }
        
        except Exception as e:
            print(f"Error extracting text from {image_path}: {str(e)}")
            return {'text': '', 'confidence': 0, 'word_count': 0}
    
    def process_screenshot_folder(self, folder_path, output_file=None, create_summary=True):
        """
        Process all screenshots in a folder and extract text
        
        Args:
            folder_path (str): Path to folder containing screenshots
            output_file (str): Path to output file (optional)
            create_summary (bool): Whether to create a processing summary
            
        Returns:
            dict: Dictionary with processing results and summary
        """
        results = {}
        summary = {
            'total_files': 0,
            'processed_successfully': 0,
            'failed_files': 0,
            'total_words_extracted': 0,
            'average_confidence': 0,
            'file_types': {},
            'processing_time': 0
        }
        
        import time
        start_time = time.time()
        
        # Supported screenshot formats (common phone formats)
        supported_formats = ('.png', '.jpg', '.jpeg', '.webp', '.heic', '.heif')
        
        folder_path = Path(folder_path)
        if not folder_path.exists():
            print(f"Folder {folder_path} does not exist")
            return results, summary
        
        # Get all screenshot files
        screenshot_files = [f for f in folder_path.iterdir() 
                          if f.suffix.lower() in supported_formats and f.is_file()]
        
        summary['total_files'] = len(screenshot_files)
        
        if not screenshot_files:
            print(f"No supported screenshot files found in {folder_path}")
            return results, summary
        
        print(f"Found {len(screenshot_files)} screenshots to process...")
        print("Processing screenshots:")
        print("-" * 50)
        
        confidences = []
        
        for i, screenshot_file in enumerate(screenshot_files, 1):
            print(f"[{i}/{len(screenshot_files)}] Processing: {screenshot_file.name}")
            
            # Track file extensions
            ext = screenshot_file.suffix.lower()
            summary['file_types'][ext] = summary['file_types'].get(ext, 0) + 1
            
            # Extract text from screenshot
            result = self.extract_text_from_screenshot(str(screenshot_file))
            results[screenshot_file.name] = result
            
            if 'error' not in result:
                summary['processed_successfully'] += 1
                summary['total_words_extracted'] += result['word_count']
                if result['confidence'] > 0:
                    confidences.append(result['confidence'])
                print(f"  ✓ Extracted {result['word_count']} words (confidence: {result['confidence']}%)")
            else:
                summary['failed_files'] += 1
                print(f"  ✗ Failed: {result['error']}")
        
        # Calculate average confidence
        if confidences:
            summary['average_confidence'] = round(sum(confidences) / len(confidences), 2)
        
        summary['processing_time'] = round(time.time() - start_time, 2)
        
        # Save results to file
        if output_file:
            self._save_screenshot_results(results, summary, output_file)
            print(f"\nResults saved to: {output_file}")
        
        # Print summary
        if create_summary:
            self._print_processing_summary(summary)
        
        return results, summary

    def _save_screenshot_results(self, results, summary, output_file):
        """Save screenshot processing results to file"""
        with open(output_file, 'w', encoding='utf-8') as f:
            # Write summary
            f.write("PHONE SCREENSHOT TEXT EXTRACTION RESULTS\n")
            f.write("=" * 50 + "\n\n")
            
            f.write("PROCESSING SUMMARY:\n")
            f.write(f"Total files: {summary['total_files']}\n")
            f.write(f"Successfully processed: {summary['processed_successfully']}\n")
            f.write(f"Failed: {summary['failed_files']}\n")
            f.write(f"Total words extracted: {summary['total_words_extracted']}\n")
            f.write(f"Average confidence: {summary['average_confidence']}%\n")
            f.write(f"Processing time: {summary['processing_time']} seconds\n")
            f.write(f"File types: {summary['file_types']}\n\n")
            
            # Write individual results
            f.write("INDIVIDUAL RESULTS:\n")
            f.write("=" * 50 + "\n\n")
            
            for filename, result in results.items():
                f.write(f"=== {filename} ===\n")
                f.write(f"File size: {result['file_size_kb']} KB\n")
                f.write(f"Aspect ratio: {result['aspect_ratio']}\n")
                f.write(f"Words extracted: {result['word_count']}\n")
                f.write(f"Confidence: {result['confidence']}%\n")
                f.write(f"Config used: {result['processing_config']}\n")
                
                if 'error' in result:
                    f.write(f"Error: {result['error']}\n")
                else:
                    f.write(f"\nExtracted text:\n{result['text']}\n")
                
                f.write("\n" + "-" * 50 + "\n\n")
    
    def _print_processing_summary(self, summary):
        """Print a formatted processing summary"""
        print("\n" + "=" * 50)
        print("PROCESSING SUMMARY")
        print("=" * 50)
        print(f"Total screenshots: {summary['total_files']}")
        print(f"Successfully processed: {summary['processed_successfully']}")
        print(f"Failed: {summary['failed_files']}")
        print(f"Total words extracted: {summary['total_words_extracted']}")
        print(f"Average confidence: {summary['average_confidence']}%")
        print(f"Processing time: {summary['processing_time']} seconds")
        print(f"File types found: {summary['file_types']}")
        
        if summary['processed_successfully'] > 0:
            print(f"Average words per screenshot: {summary['total_words_extracted'] / summary['processed_successfully']:.1f}")
        
        print("=" * 50)
    parser = argparse.ArgumentParser(description='Extract text from images using OCR')
    parser.add_argument('input', help='Input image file or folder path')
    parser.add_argument('-o', '--output', help='Output file path (optional)')
    parser.add_argument('-m', '--method', choices=['basic', 'advanced', 'confidence'], 
                       default='basic', help='Extraction method')
    parser.add_argument('-l', '--lang', default='eng', help='Language code for OCR')
    parser.add_argument('--tesseract-path', help='Path to tesseract executable')
    
    args = parser.parse_args()
    
    # Initialize extractor
    extractor = ImageTextExtractor(args.tesseract_path)
    
    input_path = Path(args.input)
    
    if input_path.is_file():
        # Single image
        print(f"Extracting text from: {input_path}")
        
        if args.method == 'basic':
            text = extractor.extract_text_basic(str(input_path), args.lang)
        elif args.method == 'advanced':
            text = extractor.extract_text_advanced(str(input_path), args.lang)
        elif args.method == 'confidence':
            result = extractor.extract_text_with_confidence(str(input_path), args.lang)
            text = f"Text: {result['text']}\nConfidence: {result['confidence']}%\nWords: {result['word_count']}"
        
        print("\n" + "="*50)
        print("EXTRACTED TEXT:")
        print("="*50)
        print(text)
        
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(text)
            print(f"\nText saved to: {args.output}")
    
    elif input_path.is_dir():
        # Multiple images
        print(f"Processing images in folder: {input_path}")
        results = extractor.extract_from_multiple_images(str(input_path), args.output, args.method)
        
        print("\n" + "="*50)
        print("EXTRACTION RESULTS:")
        print("="*50)
        for filename, text in results.items():
            print(f"\n--- {filename} ---")
            print(text[:200] + "..." if len(text) > 200 else text)
    
    else:
        print(f"Error: {input_path} is not a valid file or directory")

if __name__ == "__main__":
    # Example usage when run directly
    try:
        main()
    except KeyboardInterrupt:
        print("\nOperation cancelled by user")
    except Exception as e:
        print(f"An error occurred: {str(e)}")