import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { X, Scan, Sparkles } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { premiumManager } from '@/utils/premiumManager';
import { lookupSeedByBarcode, type SeedLookupResult } from '@/utils/seedDataLookup';

// Platform-specific imports - only load on mobile
let BarcodeScannerModule: any = null;
let PermissionsModule: any = null;

// Only import on native platforms
if (Platform.OS === 'ios' || Platform.OS === 'android') {
  try {
    const BarcodeScanner = require('expo-barcode-scanner');
    BarcodeScannerModule = BarcodeScanner.BarCodeScanner;
    PermissionsModule = BarcodeScanner.BarCodeScanner;
  } catch (error) {
    // Silently fail on web or if module not available
    if (__DEV__) {
      console.log('Barcode scanner not available on this platform');
    }
  }
}

export interface ScannedSeedData {
  barcode: string;
  barcodeType: string;
  seedName?: string;
  type?: string;
  variety?: string;
  description?: string;
  supplier?: string;
  // Add more fields as needed
}

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: ScannedSeedData) => void;
  onUpgradeRequired: () => void;
}

export default function BarcodeScannerModal({
  visible,
  onClose,
  onScan,
  onUpgradeRequired,
}: BarcodeScannerModalProps) {
  const { colors } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  // Check if platform supports barcode scanning
  const isPlatformSupported = Platform.OS === 'ios' || Platform.OS === 'android';

  useEffect(() => {
    checkPremiumStatus();
  }, [visible]);

  useEffect(() => {
    if (visible && isPlatformSupported) {
      requestCameraPermission();
    }
  }, [visible, isPlatformSupported]);

  const checkPremiumStatus = async () => {
    try {
      await premiumManager.initialize();
      const subscription = premiumManager.getSubscription();
      setIsPremium(subscription?.features.barcode_scanner || false);
    } catch (error) {
      console.error('Error checking premium status:', error);
      setIsPremium(false);
    }
  };

  const requestCameraPermission = async () => {
    if (!PermissionsModule) {
      setHasPermission(false);
      return;
    }

    try {
      const { status } = await PermissionsModule.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || isProcessing) return;

    setScanned(true);
    setIsProcessing(true);

    try {
      // Lookup seed information based on barcode
      const seedInfo = await performSeedLookup(data, type);

      // Call the onScan callback with the scanned data
      onScan({
        barcode: data,
        barcodeType: type,
        ...seedInfo,
      });

      // Close the modal after successful scan
      setTimeout(() => {
        onClose();
        setScanned(false);
        setIsProcessing(false);
      }, 500);
    } catch (error) {
      console.error('Error processing barcode:', error);
      Alert.alert(
        'Scan Error',
        'Unable to process this barcode. You can still manually enter seed information.',
        [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false);
              setIsProcessing(false);
            },
          },
        ]
      );
    }
  };

  const performSeedLookup = async (
    barcode: string,
    type: string
  ): Promise<Partial<ScannedSeedData>> => {
    // Use the seed data lookup service
    const lookupResult: SeedLookupResult = await lookupSeedByBarcode(barcode, type);
    
    return {
      seedName: lookupResult.seedName,
      type: lookupResult.type,
      variety: lookupResult.variety,
      description: lookupResult.description,
      supplier: lookupResult.supplier,
    };
  };

  // Handle web platform
  if (!isPlatformSupported) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.webContainer}>
          <View style={[styles.webContent, { backgroundColor: colors.card }]}>
            <Scan size={64} color={colors.primary} style={styles.webIcon} />
            <Text style={[styles.webTitle, { color: colors.text }]}>
              Mobile Feature Only
            </Text>
            <Text style={[styles.webMessage, { color: colors.textSecondary }]}>
              Barcode scanning is only available on iOS and Android mobile devices.
              Please use the mobile app to scan seed package barcodes.
            </Text>
            <Pressable
              style={[styles.webButton, { backgroundColor: colors.primary }]}
              onPress={onClose}
            >
              <Text style={[styles.webButtonText, { color: colors.primaryText }]}>
                Got It
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  // Handle non-premium users
  if (!isPremium) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.container}>
          <View style={[styles.premiumContent, { backgroundColor: colors.card }]}>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.text} />
            </Pressable>

            <Sparkles size={64} color={colors.primary} style={styles.premiumIcon} />
            
            <Text style={[styles.premiumTitle, { color: colors.text }]}>
              Premium Feature
            </Text>
            
            <Text style={[styles.premiumMessage, { color: colors.textSecondary }]}>
              Barcode scanning is a premium feature that lets you quickly add seeds to your
              inventory by scanning seed package barcodes.
            </Text>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Scan size={20} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Instant seed package scanning
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Sparkles size={20} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Auto-fill seed information
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Sparkles size={20} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Save time on data entry
                </Text>
              </View>
            </View>

            <Pressable
              style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                onClose();
                onUpgradeRequired();
              }}
            >
              <Sparkles size={20} color={colors.primaryText} />
              <Text style={[styles.upgradeButtonText, { color: colors.primaryText }]}>
                Upgrade to Premium
              </Text>
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                Maybe Later
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  // Handle camera permission not granted
  if (hasPermission === false) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.container}>
          <View style={[styles.content, { backgroundColor: colors.card }]}>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.text} />
            </Pressable>

            <Text style={[styles.title, { color: colors.text }]}>Camera Permission Required</Text>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              Please grant camera permission to scan barcodes. You can enable this in your device
              settings.
            </Text>

            <Pressable
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: colors.primaryText }]}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  // Show loading while checking permission
  if (hasPermission === null) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.container}>
          <View style={[styles.content, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.message, { color: colors.textSecondary, marginTop: 16 }]}>
              Initializing camera...
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  // Render barcode scanner
  const BarCodeScanner = BarcodeScannerModule;

  return (
    <Modal visible={visible} transparent={false} animationType="slide">
      <View style={styles.scannerContainer}>
        {BarCodeScanner && (
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        )}

        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top bar */}
          <View style={[styles.topBar, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={28} color="#ffffff" />
            </Pressable>
            <Text style={styles.topBarText}>Scan Seed Package Barcode</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Scanning frame */}
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          {/* Instructions */}
          <View style={[styles.instructions, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
            <Scan size={24} color="#ffffff" />
            <Text style={styles.instructionsText}>
              {isProcessing ? 'Processing barcode...' : 'Position barcode within the frame'}
            </Text>
            {scanned && (
              <Pressable
                style={styles.rescanButton}
                onPress={() => {
                  setScanned(false);
                  setIsProcessing(false);
                }}
              >
                <Text style={styles.rescanButtonText}>Tap to Scan Again</Text>
              </Pressable>
            )}
          </View>
        </View>

        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.processingText}>Looking up seed information...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Web platform styles
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  webContent: {
    borderRadius: 16,
    padding: 32,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  webIcon: {
    marginBottom: 16,
  },
  webTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  webMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  webButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  webButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Premium gate styles
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  premiumContent: {
    borderRadius: 16,
    padding: 32,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  premiumIcon: {
    marginBottom: 16,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  premiumMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  featureList: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
  },
  upgradeButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 16,
  },

  // Permission/loading styles
  content: {
    borderRadius: 16,
    padding: 32,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Scanner styles
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  topBarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  scanFrame: {
    alignSelf: 'center',
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#4CAF50',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 12,
  },
  instructions: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  instructionsText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
  rescanButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderRadius: 8,
  },
  rescanButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  processingText: {
    color: '#ffffff',
    fontSize: 16,
  },
});
