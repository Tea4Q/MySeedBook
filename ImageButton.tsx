import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Camera, Upload } from 'lucide-react-native';
import ImageCapture from './ImageCapture';

interface ImageButtonProps {
  onImageSelected: (uri: string) => void;
}

const ImageButton: React.FC<ImageButtonProps> = ({ onImageSelected }) => {
  const [showImageCapture, setShowImageCapture] = useState(false);

  const handleImageCaptured = (uri: string | null) => {
    setShowImageCapture(false);
    if (uri) {
      onImageSelected(uri);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.button}
        onPress={() => setShowImageCapture(true)}
      >
        <Camera size={24} color="#ffffff" />
        <Text style={styles.buttonText}>Take Photo</Text>
      </Pressable>

      {showImageCapture && (
        <ImageCapture onImageCaptured={handleImageCaptured} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
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
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ImageButton;
