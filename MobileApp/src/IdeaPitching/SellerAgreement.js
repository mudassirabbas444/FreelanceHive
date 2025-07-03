import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import SignatureScreen from 'react-native-signature-canvas';

const SellerAgreement = ({ visible, onClose, onAccept }) => {
  const [isSigned, setIsSigned] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [signature, setSignature] = useState(null);

  const handleSignature = (signature) => {
    setSignature(signature);
    setIsSigned(true);
    setShowSignature(false);
  };

  const handleAccept = () => {
    if (!isAgreed || !isSigned) {
      Alert.alert('Error', 'Please sign the agreement and check the terms acceptance box');
      return;
    }
    onAccept(signature);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <StatusBar style="auto" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FontAwesome name="times" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Seller Agreement</Text>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.heading}>Non-Disclosure and Non-Copy Agreement</Text>
          <Text style={styles.intro}>
            By signing this agreement, you acknowledge and agree to the following terms:
          </Text>

          <View style={styles.terms}>
            <Text style={styles.termItem}>1. You will not copy, replicate, or steal the idea in any form.</Text>
            <Text style={styles.termItem}>2. You will not disclose the idea to any third party without explicit permission.</Text>
            <Text style={styles.termItem}>3. You will not use the idea for your own benefit without proper authorization.</Text>
            <Text style={styles.termItem}>4. Any violation of these terms will result in legal action.</Text>
            <Text style={styles.termItem}>5. You understand that the idea is the intellectual property of the original creator.</Text>
          </View>

          <View style={styles.legal}>
            <Text style={styles.legalTitle}>Legal Notice:</Text>
            <Text style={styles.legalText}>
              Any unauthorized use, copying, or distribution of this idea will be subject to legal action under intellectual property laws. The original creator reserves all rights to pursue legal remedies including but not limited to:
            </Text>
            <View style={styles.legalList}>
              <Text style={styles.legalItem}>• Civil lawsuits for damages</Text>
              <Text style={styles.legalItem}>• Criminal charges for intellectual property theft</Text>
              <Text style={styles.legalItem}>• Injunctions to prevent further use</Text>
              <Text style={styles.legalItem}>• Recovery of legal fees and costs</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.signatureButton}
            onPress={() => setShowSignature(true)}
          >
            <FontAwesome name="pencil" size={20} color="#007bff" />
            <Text style={styles.signatureButtonText}>
              {isSigned ? "Change Signature" : "Add Signature"}
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
              (!isAgreed || !isSigned) && styles.buttonDisabled
            ]}
            onPress={handleAccept}
            disabled={!isAgreed || !isSigned}
          >
            <FontAwesome name="check" size={16} color="#fff" style={styles.buttonIcon} />
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
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#212529',
  },
  intro: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 20,
  },
  terms: {
    marginBottom: 20,
  },
  termItem: {
    fontSize: 14,
    color: '#212529',
    marginBottom: 10,
    lineHeight: 20,
  },
  legal: {
    marginBottom: 20,
  },
  legalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#212529',
  },
  legalText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 10,
    lineHeight: 20,
  },
  legalList: {
    marginLeft: 10,
  },
  legalItem: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 5,
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
    fontSize: 14,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  buttonIcon: {
    marginRight: 5,
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

export default SellerAgreement; 