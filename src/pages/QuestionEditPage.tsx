import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QuestionForm from '../components/QuestionForm';
import { ChevronLeft } from 'lucide-react';

const QuestionEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate back after success, or maybe stay?
    // User probably wants to go back to feedback list or questions list.
    // Let's go back.
    navigate(-1);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="question-edit-page min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-5xl mx-auto mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="group flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-white hover:shadow-sm"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
          Back to List
        </button>
      </div>
      
      <QuestionForm 
        questionId={id} 
        onSuccess={handleSuccess} 
        onCancel={handleCancel} 
      />
    </div>
  );
};

export default QuestionEditPage;
