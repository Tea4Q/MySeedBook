import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import ImageButton from './ImageButton';

const ParentComponent = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageSelected = (uri: string) => {
    setSelectedImage(uri);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parent Component</Text>
      <ImageButton onImageSelected={handleImageSelected} />
      {selectedImage && (
        <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  selectedImage: {
    width: 200,
    height: 200,
    marginTop: 20,
  },
});

export default ParentComponent;
