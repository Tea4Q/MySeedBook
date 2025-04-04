import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, Platform, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Upload, X, RotateCcw, Check, Image as ImageIcon } from 'lucide-react-native';
import { FlipType, manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface ImageCaptureProps {
  onImageCaptured: (uri: string | null) => void;
}

export default function ImageCapture({ onImageCaptured }: ImageCaptureProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
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
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
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
      onImageCaptured(processedUri);
      setSelectedImage(null);
    } catch (err) {
      setError('Failed to process image');
    }
  };

  const cancelSelection = () => {
    setSelectedImage(null);
    setError(null);
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
        Supported formats: JPG, PNG, HEIF • Max size: 5MB
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
    aspectRatio: 4/3,
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
});