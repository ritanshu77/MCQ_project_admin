import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { Question, Subject, Unit, initialFormState } from '../types';

interface QuestionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string | null;
  onSaveSuccess: () => void;
}

const QuestionEditModal: React.FC<QuestionEditModalProps> = ({ isOpen, onClose, questionId, onSaveSuccess }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Fetch Subjects
  useEffect(() => {
    if (isOpen) {
      const fetchSubjects = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/questions/subjects/list`);
          setSubjects(res.data.subjects);
        } catch (err) {
          console.error('Error fetching subjects:', err);
        }
      };
      fetchSubjects();
    }
  }, [isOpen]);

  // Load Question Data
  useEffect(() => {
    if (isOpen && questionId) {
      const loadQuestion = async () => {
        try {
          setLoading(true);
          const res = await axios.get(`${API_BASE_URL}/questions/${questionId}`);
          const q = res.data.question || res.data;
          
          // Helper to extract ID if field is populated object
          const getid = (val: any) => {
            if (!val) return '';
            if (typeof val === 'object') {
              const id = val._id || val.unitId || val.subjectId || val.id;
              return id ? String(id) : '';
            }
            return String(val);
          };

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
        } catch (err) {
          console.error("Failed to load question", err);
          toast.error("Failed to load question details");
        } finally {
          setLoading(false);
        }
      };
      loadQuestion();
    } else if (isOpen && !questionId) {
      setFormData(initialFormState);
    }
  }, [isOpen, questionId]);

  // Fetch Units when Subject changes
  useEffect(() => {
    if (formData.subjectId) {
      const fetchUnits = async () => {
        try {
          const res = await axios.post(`${API_BASE_URL}/questions/subjects/units`, { subjectId: formData.subjectId });
          setUnits(res.data.units || []);
        } catch (err) {
          console.error('Error fetching units:', err);
        }
      };
      fetchUnits();
    } else {
      setUnits([]);
    }
  }, [formData.subjectId]);

  // Helper to get available chapters based on selected unit
  const getAvailableChapters = () => {
    const selectedUnit = units.find(u => u.unitId === formData.unitId);
    return selectedUnit ? selectedUnit.chapters : [];
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
      
      if (questionId) {
        await axios.patch(`${API_BASE_URL}/questions/${questionId}`, payload);
        toast.success('Question updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/questions`, payload);
        toast.success('Question created successfully');
      }
      
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving question:', err);
      toast.error(err.response?.data?.message || 'Failed to save question');
    } finally {
      setFormLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div className="modal-content" style={{
        background: 'white', width: '90%', maxWidth: '800px', maxHeight: '90vh',
        borderRadius: '8px', display: 'flex', flexDirection: 'column'
      }}>
        <div className="modal-header" style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>{questionId ? 'Edit Question' : 'Add New Question'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body" style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>Loading question details...</p>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Question Number</label>
                <input
                  type="number"
                  min="1"
                  value={formData.questionNumber}
                  onChange={e => setFormData({ ...formData, questionNumber: parseInt(e.target.value) || 1 })}
                  style={{ width: '100px' }}
                />
              </div>

              {/* Question Text */}
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Question Text</label>
                <div className="grid-2-cols">
                  <textarea 
                    placeholder="English" 
                    value={formData.questionText.en} 
                    onChange={e => setFormData({...formData, questionText: {...formData.questionText, en: e.target.value}})}
                    rows={3}
                  />
                  <textarea 
                    placeholder="Hindi" 
                    value={formData.questionText.hi} 
                    onChange={e => setFormData({...formData, questionText: {...formData.questionText, hi: e.target.value}})}
                    rows={3}
                  />
                </div>
              </div>

              {/* Options */}
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Options</label>
                {formData.options.map((opt, idx) => (
                  <div key={idx} className="flex-row-responsive" style={{ marginBottom: '10px' }}>
                    <div style={{ width: '30px', fontWeight: 'bold' }}>{opt.key}</div>
                    <input 
                      type="text" placeholder="Option (En)" 
                      value={opt.text.en}
                      onChange={e => {
                        const newOpts = [...formData.options];
                        newOpts[idx].text.en = e.target.value;
                        setFormData({...formData, options: newOpts});
                      }}
                      style={{ flex: 1 }}
                    />
                    <input 
                      type="text" placeholder="Option (Hi)" 
                      value={opt.text.hi}
                      onChange={e => {
                        const newOpts = [...formData.options];
                        newOpts[idx].text.hi = e.target.value;
                        setFormData({...formData, options: newOpts});
                      }}
                      style={{ flex: 1 }}
                    />
                    <input 
                      type="radio" 
                      name="correctOption"
                      checked={formData.correctOptionKey === opt.key}
                      onChange={() => setFormData({...formData, correctOptionKey: opt.key})}
                    />
                  </div>
                ))}
              </div>

              {/* Classification */}
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Classification</label>
                <div className="grid-3-cols">
                  <select 
                    value={formData.subjectId} 
                    onChange={e => setFormData({...formData, subjectId: e.target.value, unitId: '', chapterId: ''})}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.subjectId} value={s.subjectId}>{s.nameEn}</option>)}
                  </select>
                  
                  <select 
                    value={formData.unitId} 
                    onChange={e => setFormData({...formData, unitId: e.target.value, chapterId: ''})}
                    disabled={!formData.subjectId}
                  >
                    <option value="">Select Unit</option>
                    {units.map(u => <option key={u.unitId} value={u.unitId}>{u.name?.en || 'Unit'}</option>)}
                  </select>

                  <select 
                    value={formData.chapterId} 
                    onChange={e => setFormData({...formData, chapterId: e.target.value})}
                    disabled={!formData.unitId}
                  >
                    <option value="">Select Chapter</option>
                    {getAvailableChapters().map(c => <option key={c._id} value={c._id}>{c.name?.en || 'Chapter'}</option>)}
                    
                    {/* Preserved option for broken/missing chapter links */}
                    {formData.chapterId && !getAvailableChapters().find(c => c._id === formData.chapterId) && (
                      <option value={formData.chapterId}>
                         Unknown Chapter (Preserved) *
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {/* Explanation & Difficulty */}
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div>
                    <label>Explanation</label>
                    <textarea 
                      placeholder="Explanation (English)" 
                      value={formData.explanation.en}
                      onChange={e => setFormData({...formData, explanation: {...formData.explanation, en: e.target.value}})}
                      rows={2}
                      style={{ width: '100%', marginBottom: '5px' }}
                    />
                    <textarea 
                      placeholder="Explanation (Hindi)" 
                      value={formData.explanation.hi}
                      onChange={e => setFormData({...formData, explanation: {...formData.explanation, hi: e.target.value}})}
                      rows={2}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label>Difficulty</label>
                    <select 
                      value={formData.difficulty} 
                      onChange={e => setFormData({...formData, difficulty: e.target.value})}
                      style={{ width: '100%', padding: '8px' }}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    
                    <label style={{ marginTop: '10px', display: 'block' }}>Status</label>
                    <select 
                      value={formData.status} 
                      onChange={e => setFormData({...formData, status: e.target.value})}
                      style={{ width: '100%', padding: '8px' }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer" style={{ padding: '15px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn" onClick={onClose} disabled={formLoading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={formLoading}>
            {formLoading ? 'Saving...' : 'Save Question'}
          </button>
        </div>
      </div>
      <style>{`
        .btn-icon { background: none; border: none; cursor: pointer; padding: 5px; border-radius: 4px; transition: background 0.2s; }
        .btn-icon:hover { background: #f0f0f0; }
        .badge { padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; }
        .badge-easy { background: #e8f5e9; color: #2ecc71; }
        .badge-medium { background: #fff3e0; color: #f39c12; }
        .badge-hard { background: #ffebee; color: #e74c3c; }
        textarea, input[type="text"], select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: 500; font-size: 0.9rem; }
        
        /* Grid Layouts */
        .grid-2-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .grid-3-cols { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .flex-row-responsive { display: flex; align-items: center; gap: 10px; }
        
        @media (max-width: 768px) {
          .grid-2-cols, .grid-3-cols { grid-template-columns: 1fr; }
          .flex-row-responsive { flex-direction: column; align-items: stretch; }
          .modal-content { width: 95%; height: 95vh; }
        }
      `}</style>
    </div>
  );
};

export default QuestionEditModal;
