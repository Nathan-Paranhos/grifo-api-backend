export interface Photo {
  id: string;
  uri: string;
  comment?: string;
  timestamp: Date;
}

export interface Inspection {
  id: string;
  propertyId: string;
  inspectorId: string;
  status: 'pending' | 'completed' | 'pending_sync';
  createdAt: Date;
  updatedAt: Date;
  data: any;
  fotos?: Photo[];
}

export interface InspectionData {
  propertyAddress: string;
  inspectorName: string;
  inspectionDate: Date;
  observations: string;
  checklist: Record<string, boolean | string>;
}