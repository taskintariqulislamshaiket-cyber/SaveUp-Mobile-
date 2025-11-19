import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePet } from '../../contexts/PetContext';
import { getStarterPets, getPetConfig } from '../../utils/pet/petConfig';
import { PetType } from '../../types/pet';

interface PetSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (petType: PetType) => void;
  title?: string;
  subtitle?: string;
}

export default function PetSelector({ 
  visible, 
  onClose, 
  onSelect,
  title = 'Choose Your Pet',
  subtitle = 'Pick a companion that matches your financial personality'
}: PetSelectorProps) {
  const { petState } = usePet();
  const [selectedPet, setSelectedPet] = useState<PetType | null>(null);
  
  const availablePets = petState 
    ? petState.unlockedPets.map(id => getPetConfig(id))
    : getStarterPets();

  const handleSelect = () => {
    if (selectedPet) {
      onSelect(selectedPet);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#1e293b', '#0f172a']}
            style={styles.content}
          >
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            <ScrollView 
              style={styles.petList}
              contentContainerStyle={styles.petListContent}
              showsVerticalScrollIndicator={false}
            >
              {availablePets.map((pet) => (
                <TouchableOpacity
                  key={pet.id}
                  style={[
                    styles.petCard,
                    selectedPet === pet.id && styles.petCardSelected,
                  ]}
                  onPress={() => setSelectedPet(pet.id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={selectedPet === pet.id ? pet.gradient : ['#1e293b', '#334155']}
                    style={styles.petCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.petEmoji}>{pet.emoji}</Text>
                    <View style={styles.petInfo}>
                      <Text style={styles.petName}>{pet.name}</Text>
                      <Text style={styles.petPersonality}>{pet.personality}</Text>
                      <Text style={styles.petDescription} numberOfLines={2}>
                        {pet.description}
                      </Text>
                      <View style={styles.bonusContainer}>
                        <Text style={styles.bonusLabel}>✨ Bonus:</Text>
                        <Text style={styles.bonusText}>{pet.bonusDescription}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.selectButton, !selectedPet && styles.selectButtonDisabled]}
                onPress={handleSelect}
                disabled={!selectedPet}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={selectedPet ? ['#00D4A1', '#4CAF50'] : ['#64748b', '#475569']}
                  style={styles.selectButtonGradient}
                >
                  <Text style={styles.selectButtonText}>Select Pet</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 24,
    textAlign: 'center',
  },
  petList: {
    marginBottom: 20,
  },
  petListContent: {
    gap: 12,
  },
  petCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  petCardSelected: {
    borderColor: '#00D4A1',
  },
  petCardGradient: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  petEmoji: {
    fontSize: 60,
  },
  petInfo: {
    flex: 1,
    gap: 4,
  },
  petName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  petPersonality: {
    fontSize: 14,
    color: '#00D4A1',
    fontWeight: '600',
  },
  petDescription: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 4,
  },
  bonusContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(0, 212, 161, 0.1)',
    borderRadius: 8,
    padding: 8,
  },
  bonusLabel: {
    fontSize: 10,
    color: '#00D4A1',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  bonusText: {
    fontSize: 11,
    color: '#e2e8f0',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectButtonDisabled: {
    opacity: 0.5,
  },
  selectButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
