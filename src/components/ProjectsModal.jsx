import { useState, useEffect } from 'react';
import { X, FolderOpen, Trash2, Clock, Save } from 'lucide-react';
import { listProjects, loadProject, deleteProject } from '../lib/supabase';

export default function ProjectsModal({ onClose, onLoad }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await listProjects();
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async (id) => {
    try {
      const project = await loadProject(id);
      onLoad(project.data, project.id, project.name);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (deleting === id) {
      try {
        await deleteProject(id);
        setProjects(prev => prev.filter(p => p.id !== id));
        setDeleting(null);
      } catch (err) {
        setError(err.message);
      }
    } else {
      setDeleting(id);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface-light)] rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] shrink-0">
          <div className="flex items-center gap-2">
            <Save className="w-4 h-4 text-[var(--color-primary-light)]" />
            <h2 className="text-base font-semibold text-[var(--color-text)]">My Projects</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[var(--color-surface)] rounded transition-colors">
            <X className="w-4 h-4 text-[var(--color-text-dim)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="mx-5 mt-3 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-dim)]">Loading...</div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center">
              <FolderOpen className="w-8 h-8 text-[var(--color-text-dim)] mx-auto mb-2 opacity-40" />
              <p className="text-sm text-[var(--color-text-dim)]">No saved projects yet</p>
              <p className="text-xs text-[var(--color-text-dim)] mt-1 opacity-60">Projects you save will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {projects.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--color-surface)] transition-colors">
                  <button
                    onClick={() => handleLoad(p.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">{p.name}</p>
                    <p className="text-[10px] text-[var(--color-text-dim)] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDate(p.updated_at)}
                    </p>
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className={`p-1.5 rounded transition-colors shrink-0 ${
                      deleting === p.id
                        ? 'bg-red-500/20 text-red-400'
                        : 'hover:bg-[var(--color-surface-light)] text-[var(--color-text-dim)]'
                    }`}
                    title={deleting === p.id ? 'Click again to confirm' : 'Delete project'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
