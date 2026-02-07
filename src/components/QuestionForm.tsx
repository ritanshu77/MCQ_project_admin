import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Save, X } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface BilingualText {
  en: string;
  hi: string;
}

interface Option {
  text: BilingualText;
  key: string; // 'A', 'B', 'C', 'D', 'E'
}

interface Question {
  _id: string;
  questionText: BilingualText;
  options: Option[];
  correctOptionKey: string;
  explanation?: BilingualText;
  subjectId?: string;
  unitId?: string;
  chapterId?: string;
  subjectName?: string;
  unitName?: string;
  chapterName?: string;
  difficulty: string;
  questionNumber: number;
  status: string;
}

interface Subject {
  subjectId: string;
  nameEn: string;
  nameHi: string;
}

interface Unit {
  unitId: string;
  name: BilingualText;
  chapters: Chapter[];
}

interface Chapter {
  _id: string;
  name: BilingualText;
}

const initialFormState = {
  questionNumber: 1,
  questionText: { en: '', hi: '' },
  options: [
    { text: { en: '', hi: '' }, key: 'A' },
    { text: { en: '', hi: '' }, key: 'B' },
    { text: { en: '', hi: '' }, key: 'C' },
    { text: { en: '', hi: '' }, key: 'D' },
  ],
  correctOptionKey: 'A',
  explanation: { en: '', hi: '' },
  subjectId: '',
  unitId: '',
  chapterId: '',
  difficulty: 'medium',
  status: 'active'
};

interface QuestionFormProps {
  questionId?: string;
  initialData?: Question;
  onSuccess: () => void;
  onCancel: () => void;
  isModal?: boolean;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ questionId, initialData, onSuccess, onCancel, isModal = false }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [formLoading, setFormLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Store original question data to access names if IDs are broken
  const [originalQuestion, setOriginalQuestion] = useState<Question | null>(null);

  // Fetch Subjects
  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/questions/subjects/list`);
      setSubjects(res.data.subjects);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Fetch Question Data if ID provided and no initialData
  useEffect(() => {
    const fetchQuestion = async () => {
      if (questionId && !initialData) {
        try {
          setLoadingData(true);
          const res = await axios.get(`${API_BASE_URL}/questions/${questionId}`);
          const q = res.data.question || res.data;
          setOriginalQuestion(q);
          populateForm(q);
        } catch (err) {
          console.error('Error fetching question:', err);
          toast.error('Failed to load question');
        } finally {
          setLoadingData(false);
        }
      } else if (initialData) {
        setOriginalQuestion(initialData);
        populateForm(initialData);
      }
    };

    fetchQuestion();
  }, [questionId, initialData]);

  const getid = (val: any) => {
    if (!val) return '';
    if (typeof val === 'object') {
      const id = val._id || val.unitId || val.subjectId || val.id;
      return id ? String(id) : '';
    }
    return String(val);
  };

  const populateForm = (q: Question) => {
    setFormData({
      questionNumber: q.questionNumber || 1,
      questionText: q.questionText || { en: '', hi: '' },
      options: q.options || initialFormState.options,
      correctOptionKey: q.correctOptionKey || 'A',
      explanation: q.explanation || { en: '', hi: '' },
      subjectId: getid(q.subjectId) || '',
      unitId: getid(q.unitId) || '',
      chapterId: getid(q.chapterId) || '',
      difficulty: q.difficulty || 'medium',
      status: q.status || 'active'
    });
  };

  // Fetch Units when Subject changes
  useEffect(() => {
    if (formData.subjectId) {
      fetchUnits(formData.subjectId);
    } else {
      setUnits([]);
    }
  }, [formData.subjectId]);

  const fetchUnits = async (subjectId: string) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/questions/subjects/units`, { subjectId });
      setUnits(res.data.units || []);
    } catch (err) {
      console.error('Error fetching units:', err);
    }
  };

  const handleSave = async () => {
    try {
      setFormLoading(true);
      // Basic Validation
      if (!formData.questionText.en && !formData.questionText.hi) {
        toast.error('Question text is required (English or Hindi)');
        setFormLoading(false);
        return;
      }
      if (!formData.subjectId) {
        toast.error('Subject is required');
        setFormLoading(false);
        return;
      }

      // Clean payload: remove empty strings for IDs
      const payload: any = { ...formData };
      if (!payload.unitId) delete payload.unitId;
      if (!payload.chapterId) delete payload.chapterId;
      
      const idToUpdate = questionId || (initialData ? initialData._id : null);

      if (idToUpdate) {
        await axios.patch(`${API_BASE_URL}/questions/${idToUpdate}`, payload);
        toast.success('Question updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/questions`, payload);
        toast.success('Question created successfully');
      }
      
      onSuccess();
    } catch (err: any) {
      console.error('Error saving question:', err);
      toast.error(err.response?.data?.message || 'Failed to save question');
    } finally {
      setFormLoading(false);
    }
  };

  // Helper to get available chapters based on selected unit
  const getAvailableChapters = () => {
    const selectedUnit = units.find(u => u.unitId === formData.unitId);
    return selectedUnit ? selectedUnit.chapters : [];
  };

  if (loadingData) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading question data...</div>;
  }

  return (
    <div className={`question-form ${!isModal ? 'bg-white rounded-xl shadow-lg border border-gray-100' : ''} ${!isModal ? 'max-w-5xl mx-auto my-8 overflow-hidden' : ''}`}>
      {!isModal && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">✏️</span>
            Edit Question
          </h2>
          <p className="text-blue-100 mt-1 opacity-90">Update question details, options, and settings.</p>
        </div>
      )}
      
      <div className={`p-6 ${isModal ? '' : 'space-y-8'}`}>
        
        {/* Top Meta Section */}
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center gap-4">
           <div className="flex-1">
             <label className="block text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">Question Number</label>
             <input 
                type="number" 
                value={formData.questionNumber}
                onChange={e => setFormData({ ...formData, questionNumber: parseInt(e.target.value) || 1 })}
                className="w-24 px-3 py-2 bg-white border border-blue-200 rounded-lg text-lg font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
           </div>
           <div className="flex gap-4">
              <div className="text-center px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-500 font-medium uppercase">Difficulty</div>
                <div className={`font-bold ${formData.difficulty === 'easy' ? 'text-green-600' : formData.difficulty === 'medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                  {formData.difficulty.charAt(0).toUpperCase() + formData.difficulty.slice(1)}
                </div>
              </div>
              <div className="text-center px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-500 font-medium uppercase">Status</div>
                <div className={`font-bold ${formData.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                  {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                </div>
              </div>
           </div>
        </div>

        {/* Question Text Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <span className="text-lg font-bold text-gray-800">Question Content</span>
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Bilingual</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="w-5 h-5 flex items-center justify-center bg-blue-100 text-blue-600 rounded text-xs">EN</span>
                English Text
              </label>
              <textarea 
                placeholder="Enter question in English..." 
                value={formData.questionText.en} 
                onChange={e => setFormData({...formData, questionText: {...formData.questionText, en: e.target.value}})}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-700 placeholder-gray-400 text-base"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="w-5 h-5 flex items-center justify-center bg-orange-100 text-orange-600 rounded text-xs">HI</span>
                Hindi Text
              </label>
              <textarea 
                placeholder="प्रश्न हिंदी में दर्ज करें..." 
                value={formData.questionText.hi} 
                onChange={e => setFormData({...formData, questionText: {...formData.questionText, hi: e.target.value}})}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-gray-700 placeholder-gray-400 text-base"
              />
            </div>
          </div>
        </div>

        {/* Options Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
             <span className="text-lg font-bold text-gray-800">Options</span>
             <span className="text-xs text-gray-500">Select the radio button for the correct answer</span>
          </div>

          <div className="space-y-3">
            {formData.options.map((opt, idx) => (
              <div 
                key={idx} 
                className={`group flex flex-col md:flex-row items-stretch md:items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                  formData.correctOptionKey === opt.key 
                    ? 'border-green-500 bg-green-50/30 shadow-sm' 
                    : 'border-transparent bg-gray-50 hover:bg-white hover:shadow-md hover:border-gray-200'
                }`}
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg shadow-sm transition-colors ${
                  formData.correctOptionKey === opt.key 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white text-gray-500 border border-gray-200 group-hover:border-blue-300 group-hover:text-blue-600'
                }`}>
                  {opt.key}
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" placeholder="Option (English)" 
                    value={opt.text.en}
                    onChange={e => {
                      const newOpts = [...formData.options];
                      newOpts[idx].text.en = e.target.value;
                      setFormData({...formData, options: newOpts});
                    }}
                    className="w-full bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none px-2 py-1 transition-colors placeholder-gray-400"
                  />
                  <input 
                    type="text" placeholder="विकल्प (हिंदी)" 
                    value={opt.text.hi}
                    onChange={e => {
                      const newOpts = [...formData.options];
                      newOpts[idx].text.hi = e.target.value;
                      setFormData({...formData, options: newOpts});
                    }}
                    className="w-full bg-transparent border-b border-gray-300 focus:border-orange-500 focus:outline-none px-2 py-1 transition-colors placeholder-gray-400"
                  />
                </div>

                <div className="flex items-center justify-end md:justify-center pt-2 md:pt-0 border-t md:border-t-0 border-gray-200 md:pl-4 md:border-l">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="radio" 
                      name="correctOption"
                      checked={formData.correctOptionKey === opt.key}
                      onChange={() => setFormData({...formData, correctOptionKey: opt.key})}
                      className="w-5 h-5 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span className={`text-sm font-medium ${formData.correctOptionKey === opt.key ? 'text-green-700' : 'text-gray-400'}`}>
                      {formData.correctOptionKey === opt.key ? 'Correct Answer' : 'Mark Correct'}
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Classification & Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Classification */}
           <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <span className="text-lg font-bold text-gray-800">Classification</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Subject</label>
                  <select 
                    value={formData.subjectId} 
                    onChange={e => setFormData({...formData, subjectId: e.target.value, unitId: '', chapterId: ''})}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.subjectId} value={s.subjectId}>{s.nameEn}</option>)}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Unit</label>
                  <select 
                    value={formData.unitId} 
                    onChange={e => setFormData({...formData, unitId: e.target.value, chapterId: ''})}
                    disabled={!formData.subjectId}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">Select Unit</option>
                    {units.map(u => <option key={u.unitId} value={u.unitId}>{u.name?.en || 'Unit'}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Chapter</label>
                  <select 
                    value={formData.chapterId} 
                    onChange={e => setFormData({...formData, chapterId: e.target.value})}
                    disabled={!formData.unitId}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">Select Chapter</option>
                    {getAvailableChapters().map(c => <option key={c._id} value={c._id}>{c.name?.en || 'Chapter'}</option>)}
                    {/* Preserved option */}
                    {formData.chapterId && !getAvailableChapters().find(c => c._id === formData.chapterId) && (
                      <option value={formData.chapterId}>
                         {originalQuestion?.chapterName || 'Unknown Chapter (Preserved)'} *
                      </option>
                    )}
                  </select>
                </div>
              </div>
           </div>

           {/* Settings */}
           <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <span className="text-lg font-bold text-gray-800">Settings</span>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Difficulty</label>
                  <select 
                    value={formData.difficulty} 
                    onChange={e => setFormData({...formData, difficulty: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
           </div>
        </div>

        {/* Explanation Section */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-800">Explanation</span>
            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Optional</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <textarea 
              placeholder="Explanation in English..." 
              value={formData.explanation.en} 
              onChange={e => setFormData({...formData, explanation: {...formData.explanation, en: e.target.value}})}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
            <textarea 
              placeholder="स्पष्टीकरण (हिंदी)..." 
              value={formData.explanation.hi} 
              onChange={e => setFormData({...formData, explanation: {...formData.explanation, hi: e.target.value}})}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 mt-8">
          <button 
            onClick={onCancel} 
            disabled={formLoading}
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all disabled:opacity-50"
          >
             {isModal ? 'Cancel' : 'Cancel & Back'}
          </button>
          <button 
            onClick={handleSave} 
            disabled={formLoading}
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 focus:ring-4 focus:ring-blue-500/30 transition-all disabled:opacity-70 disabled:hover:transform-none"
          >
            <Save size={18} /> 
            {formLoading ? 'Saving...' : 'Save Question'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default QuestionForm;
