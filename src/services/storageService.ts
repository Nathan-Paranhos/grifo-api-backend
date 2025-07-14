import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PendingInspection {
  id: string;
  empresaId: string;
  imovelId: string;
  tipo: 'entrada' | 'saida' | 'manutencao';
  fotos: string[];
  checklist: Record<string, string>;
  observacoes: string;
  createdAt: string;
  status: 'pending' | 'synced' | 'error';
}

const STORAGE_KEYS = {
  PENDING_INSPECTIONS: 'pending_inspections',
  OFFLINE_DATA: 'offline_data',
  USER_PREFERENCES: 'user_preferences',
};

export class StorageService {
  static async savePendingInspection(inspection: PendingInspection): Promise<void> {
    try {
      const existing = await this.getPendingInspections();
      const updated = [...existing, inspection];
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_INSPECTIONS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving pending inspection:', error);
      throw error;
    }
  }

  static async getPendingInspections(): Promise<PendingInspection[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_INSPECTIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting pending inspections:', error);
      return [];
    }
  }

  static async removePendingInspection(id: string): Promise<void> {
    try {
      const existing = await this.getPendingInspections();
      const updated = existing.filter(item => item.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_INSPECTIONS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing pending inspection:', error);
      throw error;
    }
  }

  static async updatePendingInspectionStatus(id: string, status: PendingInspection['status']): Promise<void> {
    try {
      const existing = await this.getPendingInspections();
      const updated = existing.map(item => 
        item.id === id ? { ...item, status } : item
      );
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_INSPECTIONS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating pending inspection status:', error);
      throw error;
    }
  }

  static async clearPendingInspections(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_INSPECTIONS);
    } catch (error) {
      console.error('Error clearing pending inspections:', error);
      throw error;
    }
  }

  static async saveOfflineData(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(`${STORAGE_KEYS.OFFLINE_DATA}_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving offline data:', error);
      throw error;
    }
  }

  static async getOfflineData(key: string): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_KEYS.OFFLINE_DATA}_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting offline data:', error);
      return null;
    }
  }

  static async clearOfflineData(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${STORAGE_KEYS.OFFLINE_DATA}_${key}`);
    } catch (error) {
      console.error('Error clearing offline data:', error);
      throw error;
    }
  }
}