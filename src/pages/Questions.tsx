import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { API_BASE_URL } from '../config';
import QuestionEditModal from '../components/QuestionEditModal';
import { Question } from '../types';

const Questions = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Data States
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch Questions
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/questions/questions`, {
        params: {
          page,
          limit: 10,
          search,
          difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
        }
      });
      setQuestions(res.data.questions);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchQuestions();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [page, search, difficultyFilter]);

  // URL editId handler
  useEffect(() => {
    const editId = searchParams.get('editId');
    if (editId && !showModal) {
      setEditingId(editId);
      setShowModal(true);
    }
  }, [searchParams, showModal]);

  // Handlers
  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('editId');
    setSearchParams(newParams);
  };

  const handleSaveSuccess = () => {
    fetchQuestions();
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/questions/${id}`);
      toast.success('Question deleted successfully');
      fetchQuestions();
    } catch (err: any) {
      console.error('Error deleting question:', err);
      toast.error(err.response?.data?.message || 'Failed to delete question');
    }
  };

  const handleEdit = (q: Question) => {
    setEditingId(q._id);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setShowModal(true);
  };

  return (
    <div className="questions-page">
      {/* Header & Actions */}
      <div className="header-actions">
        <h2>Questions Management</h2>
        <button className="btn btn-primary" onClick={handleAddNew} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Plus size={16} /> Add Question
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="search-box" style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input 
            type="text" 
            placeholder="Search questions..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        <select 
          value={difficultyFilter} 
          onChange={(e) => setDifficultyFilter(e.target.value)}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* List */}
      <div className="card">
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Loading questions...</p>
        ) : questions.length === 0 ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>No questions found.</p>
        ) : (
          <>
            <div className="table-responsive" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Question</th>
                    <th>Context</th>
                    <th>Diff</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr key={q._id}>
                      <td>{q.questionNumber}</td>
                      <td style={{ maxWidth: '400px' }}>
                        <div style={{ fontWeight: '500', marginBottom: '4px' }}>{q.questionText?.en?.substring(0, 80)}...</div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{q.questionText?.hi?.substring(0, 80)}...</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          <div><strong>Sub:</strong> {q.subjectName}</div>
                          <div style={{ color: '#666' }}>{q.unitName} &gt; {q.chapterName}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${q.difficulty}`}>{q.difficulty}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-icon" onClick={() => handleEdit(q)} title="Edit">
                            <Edit size={18} color="#3498db" />
                          </button>
                          <button className="btn-icon" onClick={() => handleDelete(q._id)} title="Delete">
                            <Trash2 size={18} color="#e74c3c" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
              <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="btn btn-sm">Prev</button>
              <span style={{ display: 'flex', alignItems: 'center' }}>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-sm">Next</button>
            </div>
          </>
        )}
      </div>

      <QuestionEditModal 
        isOpen={showModal}
        onClose={closeModal}
        questionId={editingId}
        onSaveSuccess={handleSaveSuccess}
      />

      <style>{`
        .btn-icon { background: none; border: none; cursor: pointer; padding: 5px; border-radius: 4px; transition: background 0.2s; }
        .btn-icon:hover { background: #f0f0f0; }
        .badge { padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; }
        .badge-easy { background: #e8f5e9; color: #2ecc71; }
        .badge-medium { background: #fff3e0; color: #f39c12; }
        .badge-hard { background: #ffebee; color: #e74c3c; }
      `}</style>
    </div>
  );
};

export default Questions;
