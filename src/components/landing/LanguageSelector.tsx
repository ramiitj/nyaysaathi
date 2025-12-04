import React from 'react';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllLanguages, LanguageCode } from '@/config/languages';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const languages = getAllLanguages();

  return (
    <Select value={language} onValueChange={(value) => setLanguage(value as LanguageCode)}>
      <SelectTrigger className="w-[180px] bg-card/50 backdrop-blur-sm border-border/50">
        <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {languages.map((lang) => (
          <SelectItem
            key={lang.code}
            value={lang.code}
            className={`${lang.fontClass} ${lang.direction === 'rtl' ? 'text-right' : ''}`}
          >
            <span className="flex items-center gap-2">
              <span>{lang.nativeName}</span>
              <span className="text-muted-foreground text-xs">({lang.name})</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;