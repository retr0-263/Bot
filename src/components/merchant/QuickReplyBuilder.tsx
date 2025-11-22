import React, { useState } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { useTemplate } from '../../hooks/useTemplate';
import { useAuth } from '../../contexts/AuthContext';

interface QuickReplyBuilderProps {
  onClose: () => void;
  onSave: () => void;
}

export default function QuickReplyBuilder({ onClose, onSave }: QuickReplyBuilderProps) {
  const { user } = useAuth();
  const { createTemplate } = useTemplate(user?.merchantId || '');
  const [name, setName] = useState('');
  const [buttons, setButtons] = useState<Array<{ id: string; label: string; payload: string }>>([]);
  const [newButton, setNewButton] = useState({ label: '', payload: '' });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addButton = () => {
    if (newButton.label.trim() && newButton.payload.trim()) {
      setButtons([
        ...buttons,
        {
          id: `btn-${Date.now()}`,
          ...newButton,
        },
      ]);
      setNewButton({ label: '', payload: '' });
    }
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const moveButton = (fromIndex: number, toIndex: number) => {
    const newButtons = [...buttons];
    const [removed] = newButtons.splice(fromIndex, 1);
    newButtons.splice(toIndex, 0, removed);
    setButtons(newButtons);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Quick reply name is required');
      return;
    }

    if (buttons.length === 0) {
      setError('Add at least one button');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await createTemplate({
        name,
        type: 'button',
        channel: 'whatsapp',
        language: 'en',
        body: 'Quick Reply Options',
        buttons,
        merchantId: user?.merchantId || '',
        status: 'draft',
        variables: [],
        tags: ['quick-reply'],
        allowPreview: true,
        allowBroadcast: false,
        sendCount: 0,
      });
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quick reply');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Quick Reply Builder</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Quick Reply Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Menu"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Preview</label>
            <div className="bg-gray-100 rounded-lg p-4 max-w-sm mx-auto">
              <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
                <p className="text-sm text-gray-800">Quick Reply Options</p>
                {buttons.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    {buttons.map((button) => (
                      <button
                        key={button.id}
                        className="w-full px-3 py-2 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                        disabled
                      >
                        {button.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Buttons List */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Buttons</label>
            {buttons.length > 0 && (
              <div className="space-y-2 mb-4">
                {buttons.map((button, index) => (
                  <div
                    key={button.id}
                    className="flex items-center gap-2 bg-gray-50 p-3 rounded border border-gray-200"
                    draggable
                    onDragStart={() => setDraggedIndex(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedIndex !== null && draggedIndex !== index) {
                        moveButton(draggedIndex, index);
                        setDraggedIndex(null);
                      }
                    }}
                  >
                    <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{button.label}</p>
                      <p className="text-xs text-gray-500 truncate">{button.payload}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeButton(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Button Form */}
            <div className="space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <input
                type="text"
                placeholder="Button label (e.g., View Menu)"
                value={newButton.label}
                onChange={(e) => setNewButton({ ...newButton, label: e.target.value })}
                maxLength={20}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Action payload (e.g., view_menu)"
                value={newButton.payload}
                onChange={(e) => setNewButton({ ...newButton, payload: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addButton}
                className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Button
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Quick Reply'}
          </button>
        </div>
      </div>
    </div>
  );
}
