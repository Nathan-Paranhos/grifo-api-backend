export const colors = {
  // Cores principais da identidade visual oficial
  primary: '#1E3A8A', // Azul Escuro
  secondary: '#F59E0B', // Laranja/Amarelo
  accent: '#F59E0B', // Laranja/Amarelo
  background: '#F3F4F6', // Cinza Claro

  // Cores de interface
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#4B5563',
  textLight: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',

  // Gradientes usando as cores oficiais
  gradients: {
    primary: ['#1E3A8A', '#1D4ED8'],
    secondary: ['#F59E0B', '#FBBF24'],
    gold: ['#C8A157', '#E5C675'],
    surface: ['#FFFFFF', '#F8F9FA'],
  },

  // Semantic colors
  info: '#3B82F6',

  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  orange: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
} as const;