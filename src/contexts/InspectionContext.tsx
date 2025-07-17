import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { StorageService } from '../services/storageService';
import { ApiService } from '../services/apiService';
import { PDFService } from '../services/pdfService';
import { GoogleDriveService } from '../services/googleDriveService';
import { Inspection, Photo } from '../types/inspection';

interface InspectionContextData {
  inspections: Inspection[];
  googleDriveFolderId: string | null;
  addInspection: (inspection: Inspection) => void;
  updateInspection: (inspection: Inspection) => void;
  generateAndUploadPDF: (inspection: Inspection, photos: Photo[]) => Promise<void>;
  setupGoogleDrive: (accessToken: string, folderName: string) => Promise<void>;
}

const InspectionContext = createContext<InspectionContextData>({} as InspectionContextData);

export const InspectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userData } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [pendingSync, setPendingSync] = useState<Inspection[]>([]);
  const [googleDriveFolderId, setGoogleDriveFolderId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    loadInspections();
  }, [userData]);

  useEffect(() => {
    if (!isOffline) {
      syncPendingInspections();
    }
  }, [isOffline]);

  const loadInspections = async () => {
    if (!userData) return;
    const localInspections = await StorageService.get('inspections', []);
    setInspections(localInspections);
    const pending = localInspections.filter(i => i.status === 'pending_sync');
    setPendingSync(pending);
  };

  const addInspection = async (inspection: Inspection) => {
    const newInspection = { ...inspection, status: isOffline ? 'pending_sync' : 'completed' };
    const updatedInspections = [...inspections, newInspection];
    setInspections(updatedInspections);
    await StorageService.save('inspections', updatedInspections);

    if (!isOffline) {
      try {
        await ApiService.createInspection(newInspection);
      } catch (error) {
        console.error('Failed to sync new inspection:', error);
        newInspection.status = 'pending_sync';
        setInspections([...inspections, newInspection]);
        await StorageService.save('inspections', [...inspections, newInspection]);
      }
    }
  };

  const syncPendingInspections = async () => {
    const pending = inspections.filter(i => i.status === 'pending_sync');
    if (pending.length === 0) return;

    for (const inspection of pending) {
      try {
        await ApiService.createInspection(inspection);
        const updatedInspections = inspections.map(i => 
          i.id === inspection.id ? { ...i, status: 'completed' } : i
        );
        setInspections(updatedInspections);
        await StorageService.save('inspections', updatedInspections);
      } catch (error) {
        console.error(`Failed to sync inspection ${inspection.id}:`, error);
      }
    }
  };

  const updateInspection = async (updatedInspection: Inspection) => {
    const updatedInspections = inspections.map(i =>
      i.id === updatedInspection.id ? updatedInspection : i
    );
    setInspections(updatedInspections);
    await StorageService.save('inspections', updatedInspections);

    if (!isOffline) {
      try {
        await ApiService.updateInspection(updatedInspection.id, updatedInspection);
      } catch (error) {
        console.error(`Failed to sync updated inspection ${updatedInspection.id}:`, error);
        // Optionally handle failed update, e.g., mark for later sync
      }
    }
  };

  const generateAndUploadPDF = async (inspection: Inspection, photos: Photo[]) => {
    // 1. Gerar o PDF inicial com os dados da vistoria
    const pdfResult = await PDFService.generatePDF(inspection);

    if (!pdfResult.success || !pdfResult.pdfPath) {
      console.error('Falha ao gerar o PDF inicial.');
      return;
    }

    // 2. Adicionar imagens e comentários ao PDF
    const imageResult = await PDFService.addImagesToPDF(pdfResult.pdfPath, photos);

    if (!imageResult.success) {
      console.error('Falha ao adicionar imagens ao PDF.');
      return;
    }

    // 3. Fazer upload para o Google Drive
    if (googleDriveFolderId) {
      const uploadResult = await GoogleDriveService.uploadFile(pdfResult.pdfPath, googleDriveFolderId);
      if (uploadResult.success) {
        // PDF enviado com sucesso para o Google Drive!
      } else {
        console.error('Falha ao enviar o PDF para o Google Drive.');
      }
    } else {
      console.warn('ID da pasta do Google Drive não configurado. Pulando upload.');
    }

    // 4. PDF gerado com sucesso
    console.log('PDF gerado com sucesso:', pdfResult.pdfPath);
  };

  const setupGoogleDrive = async (accessToken: string, folderName: string) => {
    try {
      GoogleDriveService.setAccessToken(accessToken);
      const folderId = await GoogleDriveService.getOrCreateFolder(folderName);
      if (folderId) {
        setGoogleDriveFolderId(folderId);
        // Pasta do Google Drive configurada
      } else {
        console.error('Não foi possível obter ou criar a pasta no Google Drive.');
      }
    } catch (error) {
      console.error('Erro ao configurar o Google Drive:', error);
    }
  };

  return (
    <InspectionContext.Provider value={{ inspections, addInspection, updateInspection, generateAndUploadPDF, setupGoogleDrive, googleDriveFolderId }}>
      {children}
    </InspectionContext.Provider>
  );
};

export function useInspection(): InspectionContextData {
  const context = useContext(InspectionContext);
  return context;
}