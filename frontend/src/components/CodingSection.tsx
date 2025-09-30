import React from 'react';
import CodingTestPlatform from './CodingTestPlatform';

interface CodingSectionProps {
  questions: any[];
  codeAnswers: Record<number, { code: string; language: string; result?: any; codingResult?: any }>;
  onCodeAnswerChange: (answers: Record<number, { code: string; language: string; result?: any; codingResult?: any }>) => void;
  testDuration?: number;
  testName?: string;
}

const CodingSection: React.FC<CodingSectionProps> = ({ 
  questions, 
  codeAnswers, 
  onCodeAnswerChange,
  testDuration = 60,
  testName = "Coding Test"
}) => {
  const handleSubmit = (answers: any) => {
    try {
      const processedAnswers: Record<number, { code: string; language: string; result?: any; codingResult?: any }> = {};
      
      Object.keys(answers).forEach(key => {
        const questionIndex = parseInt(key);
        const answer = answers[questionIndex];
        
        processedAnswers[questionIndex] = {
          code: answer.code || '',
          language: answer.language || 'javascript',
          result: answer.result || null,
          codingResult: answer.codingResult || null
        };
      });
      
      onCodeAnswerChange(processedAnswers);
      console.log('Coding submission successful:', processedAnswers);
    } catch (error) {
      console.error('Coding submission error:', error);
      throw error;
    }
  };

  return (
    <CodingTestPlatform
      questions={questions}
      testDuration={testDuration}
      onSubmit={handleSubmit}
      testName={testName}
    />
  );
};

export default CodingSection;