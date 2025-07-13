import { create } from 'zustand';

interface TranslationUIState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedLanguages: string[];
  setSelectedLanguages: (languages: string[]) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
}

export const useTranslationUIStore = create<TranslationUIState>((set) => ({
  activeTab: 'translations',
  setActiveTab: (tab) => set({ activeTab: tab }),
  searchTerm: '',
  setSearchTerm: (term) => set({ searchTerm: term }),
  selectedLanguages: [],
  setSelectedLanguages: (languages) => set({ selectedLanguages: languages }),
  filterStatus: 'all',
  setFilterStatus: (status) => set({ filterStatus: status }),
}));
