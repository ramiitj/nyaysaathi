import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/landing/LanguageSelector';

const Landing: React.FC = () => {
  const { t } = useTranslation();

  const currentDate = new Date();
  const formattedDate = `${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getDate().toString().padStart(2, '0')}/${currentDate.getFullYear()}`;

  return (
    <div className="container mx-auto py-8">
      <LanguageSelector />
      <div className="text-center">
        {/* Replace with a culturally relevant image for Indian users */}
        <img
          src="/assets/placeholder-indian-hero.jpg" // Placeholder image
          alt="Hero Image"
          className="mx-auto rounded-lg shadow-md"
        />
        <h1 className="text-4xl font-bold mt-4">{t('Welcome to Nyaysaathi')}</h1>
        <p className="text-gray-600 mt-2">{t('Your gateway to legal empowerment')}</p>
      </div>

      {/* Add a section for India-specific content */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-2">India-Specific Content</h2>
        <p className="text-gray-600">
          {/* Add content here that is relevant to Indian users */}
          This section will highlight features and resources that are specifically tailored for our users in India.
        </p>
      </div>
      <div className="text-center mt-4">
        <p>Today's Date: {formattedDate}</p>
      </div>
    </div>
  );
};

export default Landing;
