import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  Dimensions,
  StatusBar
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import SignatureScreen from 'react-native-signature-canvas';
import RNFetchBlob from 'rn-fetch-blob';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const { width } = Dimensions.get('window');

const ShareholderAgreement = ({
  visible,
  onClose,
  onAccept,
  requestData,
  isBuyer = false,
  existingAgreement = null
}) => {
  const [isBuyerSigned, setIsBuyerSigned] = useState(false);
  const [isSellerSigned, setIsSellerSigned] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [buyerSignature, setBuyerSignature] = useState(null);
  const [sellerSignature, setSellerSignature] = useState(null);
  const [showSignature, setShowSignature] = useState(false);

  useEffect(() => {
    if (existingAgreement) {
      setPdfUrl(existingAgreement);
    }
  }, [existingAgreement]);

  const handleSignature = (signature) => {
    if (isBuyer) {
      setBuyerSignature(signature);
      setIsBuyerSigned(true);
    } else {
      setSellerSignature(signature);
      setIsSellerSigned(true);
    }
    setShowSignature(false);
  };

  const generatePDF = async () => {
    try {
      // Create PDF content
      const pdfContent = `
        Shareholder Agreement
        
        Date: ${new Date().toLocaleDateString()}
        
        Buyer: ${requestData.buyerName}
        Seller: ${requestData.sellerName}
        Idea: ${requestData.ideaTitle}
        
        Terms of Agreement:
        1. Contribution Type: ${requestData.contributionType}
        2. Contribution Details: ${requestData.contributionDetails}
        3. Equity Share: ${requestData.equityRequested}%
        
        The Buyer agrees to provide the specified contribution in exchange for the agreed equity share.
        The Seller agrees to accept the contribution and grant the specified equity share.
        
        Both parties agree to the terms and conditions set forth in this Agreement.
      `;

      // Create FormData
      const formData = new FormData();

      // Add signatures if available
      if (isBuyer && buyerSignature) {
        formData.append('buyerSignature', buyerSignature);
      }
      if (!isBuyer && sellerSignature) {
        formData.append('sellerSignature', sellerSignature);
      }

      formData.append('content', pdfContent);
      formData.append('isInitialUpload', isBuyer ? 'true' : 'false');
      formData.append('isSellerSignature', !isBuyer ? 'true' : 'false');

      if (!isBuyer && requestData._id) {
        formData.append('requestId', requestData._id);
      }

      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/shareholder-request/upload-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload PDF');
      }

      const { pdfUrl } = await response.json();
      setPdfUrl(pdfUrl);
      return pdfUrl;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  const handleAccept = async () => {
    if (!isAgreed || (isBuyer && !isBuyerSigned) || (!isBuyer && !isSellerSigned)) {
      Alert.alert('Error', 'Please complete all required fields');
      return;
    }

    try {
      const pdfUrl = await generatePDF();
      onAccept(pdfUrl);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate agreement. Please try again.');
    }
  };

  const downloadAgreement = async () => {
    if (!pdfUrl) {
      Alert.alert('Error', 'No agreement available to download');
      return;
    }

    try {
      const { config, fs } = RNFetchBlob;
      const token = await AsyncStorage.getItem('token');

      const response = await config({
        fileCache: true,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          title: 'Shareholder Agreement',
          description: 'Downloading agreement...',
          mime: 'application/pdf',
          mediaScannable: true,
          path: `${fs.dirs.DownloadDir}/Shareholder_Agreement_${Date.now()}.pdf`
        }
      }).fetch('GET', pdfUrl, {
        'Authorization': `Bearer ${token}`
      });

      if (Platform.OS === 'ios') {
        const filePath = response.path();
        RNFetchBlob.ios.openDocument(filePath);
      }

      Alert.alert('Success', 'Agreement downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download agreement');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FontAwesome name="times" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Shareholder Agreement</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.details}>
            <Text style={styles.heading}>Agreement Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Buyer:</Text>
              <Text style={styles.value}>{requestData.buyerName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Seller:</Text>
              <Text style={styles.value}>{requestData.sellerName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Idea:</Text>
              <Text style={styles.value}>{requestData.ideaTitle}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Contribution Type:</Text>
              <Text style={styles.value}>{requestData.contributionType}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Contribution Details:</Text>
              <Text style={styles.value}>{requestData.contributionDetails}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Equity Share:</Text>
              <Text style={styles.value}>{requestData.equityRequested}%</Text>
            </View>
          </View>

          <View style={styles.terms}>
            <Text style={styles.heading}>Terms and Conditions</Text>
            <Text style={styles.termItem}>1. The Buyer agrees to provide the specified contribution as detailed above.</Text>
            <Text style={styles.termItem}>2. The Seller agrees to accept the contribution and grant the specified equity share.</Text>
            <Text style={styles.termItem}>3. Both parties agree to maintain confidentiality regarding the business idea.</Text>
            <Text style={styles.termItem}>4. Any disputes shall be resolved through mutual agreement or legal means.</Text>
            <Text style={styles.termItem}>5. This agreement is legally binding and enforceable.</Text>
          </View>

          <TouchableOpacity
            style={styles.signatureButton}
            onPress={() => setShowSignature(true)}
          >
            <FontAwesome name="pencil" size={20} color="#007bff" />
            <Text style={styles.signatureButtonText}>
              {isBuyer ? "Add Buyer's Signature" : "Add Seller's Signature"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setIsAgreed(!isAgreed)}
          >
            <FontAwesome
              name={isAgreed ? "check-square-o" : "square-o"}
              size={24}
              color="#007bff"
            />
            <Text style={styles.checkboxText}>
              I have read and agree to the terms of this agreement
            </Text>
          </TouchableOpacity>

          {pdfUrl && (
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={downloadAgreement}
            >
              <FontAwesome name="download" size={20} color="#007bff" />
              <Text style={styles.downloadButtonText}>Download Agreement</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.acceptButton,
              (!isAgreed || (isBuyer && !isBuyerSigned) || (!isBuyer && !isSellerSigned)) && styles.buttonDisabled
            ]}
            onPress={handleAccept}
            disabled={!isAgreed || (isBuyer && !isBuyerSigned) || (!isBuyer && !isSellerSigned)}
          >
            <Text style={styles.buttonText}>Sign Agreement</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showSignature}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowSignature(false)}
        >
          <View style={styles.signatureContainer}>
            <SignatureScreen
              onOK={handleSignature}
              onEmpty={() => Alert.alert('Error', 'Please provide a signature')}
              descriptionText="Sign here"
              clearText="Clear"
              confirmText="Save"
              webStyle={`.m-signature-pad--footer
                {display: none; margin: 0px;}
                .m-signature-pad {
                  box-shadow: none;
                  border: none;
                }
                .m-signature-pad--body {
                  border: none;
                }
                .m-signature-pad--body canvas {
                  background-color: #f8f9fa;
                }`}
            />
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  details: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#212529',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    fontWeight: '600',
    width: 140,
    color: '#495057',
  },
  value: {
    flex: 1,
    color: '#212529',
  },
  terms: {
    marginBottom: 20,
  },
  termItem: {
    marginBottom: 10,
    color: '#495057',
    lineHeight: 20,
  },
  signatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  signatureButtonText: {
    color: '#007bff',
    marginLeft: 10,
    fontSize: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxText: {
    marginLeft: 10,
    flex: 1,
    color: '#212529',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  downloadButtonText: {
    color: '#007bff',
    marginLeft: 10,
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  acceptButton: {
    backgroundColor: '#007bff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  signatureContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default ShareholderAgreement; 