import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { MessageTemplate, TemplateType } from '../../types/template';

interface TemplateFormProps {
  template?: MessageTemplate;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const TEMPLATE_TYPES: TemplateType[] = ['text', 'button', 'list', 'media', 'carousel'];
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
];

export default function TemplateForm({ template, onClose, onSubmit }: TemplateFormProps) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    type: template?.type || 'text' as TemplateType,
    language: template?.language || 'en',
    body: template?.body || '',
    header: template?.header || '',
    footer: template?.footer || '',
    buttons: template?.buttons || [],
    variables: template?.variables || [],
    tags: template?.tags || [],
    allowPreview: template?.allowPreview ?? true,
    allowBroadcast: template?.allowBroadcast ?? true,
  });

  const [newTag, setNewTag] = useState('');
  const [newButton, setNewButton] = useState({ label: '', type: 'quick_reply' as any, payload: '' });
  const [newVariable, setNewVariable] = useState({ name: '', type: 'text' as any });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Template name is required';
    if (!formData.body.trim()) newErrors.body = 'Message body is required';
    if (formData.type === 'button' && formData.buttons.length === 0) {
      newErrors.buttons = 'At least one button is required for button templates';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type: inputType } = e.currentTarget;
    setFormData((prev) => ({
      ...prev,
      [name]: inputType === 'checkbox' ? (e.currentTarget as HTMLInputElement).checked : value,
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleAddButton = () => {
    if (newButton.label.trim() && newButton.payload?.trim()) {
      setFormData((prev) => ({
        ...prev,
        buttons: [
          ...prev.buttons,
          {
            id: `button-${Date.now()}`,
            ...newButton,
          },
        ],
      }));
      setNewButton({ label: '', type: 'quick_reply', payload: '' });
    }
  };

  const handleRemoveButton = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index),
    }));
  };

  const handleAddVariable = () => {
    if (newVariable.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        variables: [
          ...prev.variables,
          {
            id: `var-${Date.now()}`,
            ...newVariable,
            required: true,
          },
        ],
      }));
      setNewVariable({ name: '', type: 'text' });
    }
  };

  const handleRemoveVariable = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {template ? 'Edit Template' : 'Create New Template'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700">Template Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm`}
                placeholder="e.g., Order Confirmation"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Describe what this template is for"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  {TEMPLATE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Language</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Message Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Message Content</h3>

            {formData.type !== 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Header</label>
                <input
                  type="text"
                  name="header"
                  value={formData.header}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="Optional header text"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Body *</label>
              <textarea
                name="body"
                value={formData.body}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border ${
                  errors.body ? 'border-red-500' : 'border-gray-300'
                } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm`}
                placeholder="Your message content. Use {{variable_name}} for dynamic content."
                rows={4}
              />
              {errors.body && <p className="mt-1 text-sm text-red-600">{errors.body}</p>}
              <p className="mt-2 text-xs text-gray-500">
                Tip: Use {{variable_name}} to add dynamic content that will be filled in when sending
              </p>
            </div>

            {formData.type !== 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Footer</label>
                <input
                  type="text"
                  name="footer"
                  value={formData.footer}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="Optional footer text"
                />
              </div>
            )}
          </div>

          {/* Variables */}
          {formData.variables.length > 0 || formData.body.includes('{{') ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Variables</h3>

              {formData.variables.length > 0 && (
                <div className="space-y-2">
                  {formData.variables.map((variable, index) => (
                    <div key={variable.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{variable.name}</p>
                        <p className="text-xs text-gray-500">{variable.type}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariable(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Variable name"
                  value={newVariable.name}
                  onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <select
                  value={newVariable.type}
                  onChange={(e) => setNewVariable({ ...newVariable, type: e.target.value })}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="time">Time</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddVariable}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

          {/* Buttons */}
          {(formData.type === 'button' || formData.type === 'media' || formData.type === 'carousel') && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Action Buttons</h3>

              {formData.buttons.length > 0 && (
                <div className="space-y-2">
                  {formData.buttons.map((button, index) => (
                    <div key={button.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{button.label}</p>
                        <p className="text-xs text-gray-500">{button.payload || button.url}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveButton(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errors.buttons && <p className="text-sm text-red-600">{errors.buttons}</p>}

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Button label"
                  value={newButton.label}
                  onChange={(e) => setNewButton({ ...newButton, label: e.target.value })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <select
                  value={newButton.type}
                  onChange={(e) => setNewButton({ ...newButton, type: e.target.value })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="quick_reply">Quick Reply</option>
                  <option value="url">URL</option>
                  <option value="call">Call</option>
                  <option value="copy_code">Copy Code</option>
                </select>
                <input
                  type="text"
                  placeholder={newButton.type === 'url' ? 'URL' : newButton.type === 'call' ? 'Phone number' : 'Payload/Action'}
                  value={newButton.payload}
                  onChange={(e) => setNewButton({ ...newButton, payload: e.target.value })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddButton}
                  className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Button
                </button>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Tags</h3>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Settings</h3>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="allowPreview"
                  checked={formData.allowPreview}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">Allow preview before sending</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="allowBroadcast"
                  checked={formData.allowBroadcast}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">Allow broadcast/bulk sending</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              {template ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
