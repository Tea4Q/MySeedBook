import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Camera, Upload, Droplets, Sun, Ruler, Clock, Sprout, Mountain, FlaskRound as Flask } from 'lucide-react-native';
import { ImageCapture  } from '@/components/ImageCapture/';

type SeedType = {
  label: string;
  value: string;
};

const seedTypes: SeedType[] = [
  { label: 'Vegetable', value: 'vegetable' },
  { label: 'Herb', value: 'herb' },
  { label: 'Flower', value: 'flower' },
  { label: 'Fruit', value: 'fruit' },
];

export default function AddSeedScreen() {
  const [selectedType, setSelectedType] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string>('https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </Pressable>
        <Text style={styles.title}>Add New Seed</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imageSection}>
          <Image source={{ uri: previewImage }} style={styles.previewImage} />
          <View style={styles.imageButtons}>
            <Pressable style={styles.imageButton}>
              <Camera size={24} color="#2d7a3a" />
              <Text style={styles.imageButtonText}>Take Photo</Text>
            </Pressable>
            <Pressable style={styles.imageButton}>
              <Upload size={24} color="#2d7a3a" />
              <Text style={styles.imageButtonText}>Upload</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Seed Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Brandywine Tomato"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Seed Type</Text>
            <View style={styles.typeContainer}>
              {seedTypes.map((type) => (
                <Pressable
                  key={type.value}
                  style={[
                    styles.typeButton,
                    selectedType === type.value && styles.selectedType,
                  ]}
                  onPress={() => setSelectedType(type.value)}>
                  <Text
                    style={[
                      styles.typeButtonText,
                      selectedType === type.value && styles.selectedTypeText,
                    ]}>
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your seeds..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 2, marginLeft: 12 }]}>
              <Text style={styles.label}>Purchase Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Supplier</Text>
            <TextInput
              style={styles.input}
              placeholder="Select supplier"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.timingSection}>
            <Text style={styles.sectionTitle}>Growth Timeline</Text>
            
            <View style={styles.timelineRow}>
              <View style={styles.timelineItem}>
                <Sprout size={24} color="#2d7a3a" />
                <Text style={styles.timelineLabel}>Days to Germinate</Text>
                <TextInput
                  style={styles.timelineInput}
                  placeholder="e.g., 7-10 days"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.timelineItem}>
                <Clock size={24} color="#2d7a3a" />
                <Text style={styles.timelineLabel}>Days to Harvest</Text>
                <TextInput
                  style={styles.timelineInput}
                  placeholder="e.g., 60-80 days"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>

          <View style={styles.plantingSection}>
            <Text style={styles.sectionTitle}>Planting Instructions</Text>
            
            <View style={styles.instructionRow}>
              <View style={styles.instructionItem}>
                <Ruler size={24} color="#2d7a3a" />
                <Text style={styles.instructionLabel}>Planting Depth</Text>
                <TextInput
                  style={styles.instructionInput}
                  placeholder="e.g., 1/4 inch"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.instructionItem}>
                <Ruler style={{ transform: [{ rotate: '90deg' }] }} size={24} color="#2d7a3a" />
                <Text style={styles.instructionLabel}>Spacing</Text>
                <TextInput
                  style={styles.instructionInput}
                  placeholder="e.g., 12 inches"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.instructionRow}>
              <View style={styles.instructionItem}>
                <Droplets size={24} color="#2d7a3a" />
                <Text style={styles.instructionLabel}>Watering</Text>
                <TextInput
                  style={styles.instructionInput}
                  placeholder="e.g., Keep soil moist"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.instructionItem}>
                <Sun size={24} color="#2d7a3a" />
                <Text style={styles.instructionLabel}>Sunlight</Text>
                <TextInput
                  style={styles.instructionInput}
                  placeholder="e.g., Full sun"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>

          <View style={styles.soilSection}>
            <Text style={styles.sectionTitle}>Soil & Nutrients</Text>
            
            <View style={styles.soilRow}>
              <View style={styles.soilItem}>
                <Mountain size={24} color="#2d7a3a" />
                <Text style={styles.soilLabel}>Soil Type</Text>
                <TextInput
                  style={styles.soilInput}
                  placeholder="e.g., Well-draining loam"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.soilItem}>
               <Flask size={24} color = "#2d7a3a"/>
                <Text style={styles.soilLabel}>Fertilizer</Text>
                <TextInput
                  style={styles.soilInput}
                  placeholder="e.g., 5-10-5 NPK"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Planting Season</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Early Spring"
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Harvest Season</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Late Summer"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        <Pressable style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Add to Inventory</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#336633',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageSection: {
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 12,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d7a3a',
    gap: 8,
  },
  imageButtonText: {
    fontSize: 16,
    color: '#2d7a3a',
    fontWeight: '600',
  },
  formSection: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a472a',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#2d7a3a',
  },
  selectedType: {
    backgroundColor: '#2d7a3a',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#2d7a3a',
    fontWeight: '600',
  },
  selectedTypeText: {
    color: '#ffffff',
  },
  row: {
    flexDirection: 'row',
  },
  timingSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  timelineItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  timelineLabel: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  timelineInput: {
    backgroundColor: '#f8faf8',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    textAlign: 'center',
    fontSize: 14,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  plantingSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a472a',
    marginBottom: 16,
  },
  instructionRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  instructionItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  instructionLabel: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  instructionInput: {
    backgroundColor: '#f8faf8',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    textAlign: 'center',
    fontSize: 14,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  soilSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  soilRow: {
    flexDirection: 'row',
    gap: 16,
  },
  soilItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  soilLabel: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  soilInput: {
    backgroundColor: '#f8faf8',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    textAlign: 'center',
    fontSize: 14,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#2d7a3a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
