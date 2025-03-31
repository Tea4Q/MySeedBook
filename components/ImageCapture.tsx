import { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Image, Platform, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Upload, X, RotateCcw, Check, Image as ImageIcon } from 'lucide-react-native';
import { FlipType, manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface ImageCaptureProps {
  onImageSelected: (uri: string) => void;
  maxSize?: number; // Maximum file size in bytes
  aspectRatio?: [number, number]; // Desired aspect ratio [width, height]
  uploadUrl: string;
  onUploadSuccess: (response: any) => void;
  onUploadFailure: (error: any) => void;
}

export default function ImageCapture({
  onImageSelected,
  maxSize = 5 * 1024 * 1024, // 5MB default
  aspectRatio = [4, 3],
  uploadUrl,
  onUploadSuccess,
  onUploadFailure,
}: ImageCaptureProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const processImage = async (uri: string): Promise<string> => {
    setIsProcessing(true);
    try {
      // Resize and compress the image
      const processedResult = await manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        {
          compress: 0.8,
          format: SaveFormat.JPEG,
        }
      );

      return processedResult.uri;
    } catch (err) {
      throw new Error('Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const validateImage = async (uri: string): Promise<boolean> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      if (blob.size > maxSize) {
        setError(`Image size exceeds ${maxSize / (1024 * 1024)}MB limit`);
        return false;
      }

      return true;
    } catch (err) {
      setError('Failed to validate image');
      return false;
    }
  };

  const takePhoto = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          setError('Camera permission is required');
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const isValid = await validateImage(result.assets[0].uri);
        if (isValid) {
          setSelectedImage(result.assets[0].uri);
        }
      }
    } catch (err) {
      setError('Failed to capture photo');
      console.error('Camera error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadPhoto = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const isValid = await validateImage(result.assets[0].uri);
        if (isValid) {
          setSelectedImage(result.assets[0].uri);
        }
      }
    } catch (err) {
      setError('Failed to upload photo');
      console.error('Upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmImage = async () => {
    if (!selectedImage) return;

    try {
      setIsProcessing(true);
      const processedUri = await processImage(selectedImage);
      onImageSelected(processedUri);
      setSelectedImage(null);
    } catch (err) {
      setError('Failed to process image');
    }
  };

  const cancelSelection = () => {
    setSelectedImage(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      setError('No image selected');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch(selectedImage);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('image', blob, 'image.jpg');

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const responseData = await uploadResponse.json();

      if (uploadResponse.ok) {
        onUploadSuccess(responseData);
      } else {
        onUploadFailure(responseData);
        setError(`Upload failed: ${uploadResponse.status}`);
      }
    } catch (err: any) {
      onUploadFailure(err);
      setError(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (selectedImage) {
    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri: selectedImage }} style={styles.preview} />

        {isProcessing ? (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.processingText}>Processing image...</Text>
          </View>
        ) : (
          <View style={styles.previewActions}>
            <Pressable
              style={[styles.previewButton, styles.cancelButton]}
              onPress={cancelSelection}>
              <X size={24} color="#dc2626" />
              <Text style={[styles.previewButtonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              style={[styles.previewButton, styles.retakeButton]}
              onPress={takePhoto}>
              <RotateCcw size={24} color="#2d7a3a" />
              <Text style={[styles.previewButtonText, styles.retakeButtonText]}>
                Retake
              </Text>
            </Pressable>

            <Pressable
              style={[styles.previewButton, styles.confirmButton]}
              onPress={confirmImage}>
              <Check size={24} color="#ffffff" />
              <Text style={[styles.previewButtonText, styles.confirmButtonText]}>
                Confirm
              </Text>
            </Pressable>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.uploadButton,
            pressed && styles.uploadButtonPressed,
            isUploading && styles.uploadButtonDisabled,
          ]}
          onPress={handleUpload}
          disabled={isUploading}>
          {isUploading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Upload size={24} color="#ffffff" />
              <Text style={styles.uploadButtonText}>Upload</Text>
            </>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.dropZone}>
        <ImageIcon size={48} color="#666666" />
        <Text style={styles.dropZoneText}>
          Drag and drop an image here or use the buttons below
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={takePhoto}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Camera size={24} color="#ffffff" />
              <Text style={styles.buttonText}>Take Photo</Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={uploadPhoto}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Upload size={24} color="#ffffff" />
              <Text style={styles.buttonText}>Upload Photo</Text>
            </>
          )}
        </Pressable>
      </View>

      <Text style={styles.helpText}>
        Supported formats: JPG, PNG, HEIF • Max size: {maxSize / (1024 * 1024)}MB
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dropZone: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  dropZoneText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d7a3a',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonPressed: {
    backgroundColor: '#236b2e',
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  helpText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  previewActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    gap: 12,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fef2f2',
  },
  cancelButtonText: {
    color: '#dc2626',
  },
  retakeButton: {
    backgroundColor: '#ffffff',
  },
  retakeButtonText: {
    color: '#2d7a3a',
  },
  confirmButton: {
    backgroundColor: '#2d7a3a',
  },
  confirmButtonText: {
    color: '#ffffff',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 12,
  },
  uploadButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d7a3a',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  uploadButtonPressed: {
    backgroundColor: '#236b2e',
    transform: [{ scale: 0.98 }],
  },
  uploadButtonDisabled: {
    opacity: 0.7,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
