import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Copy, Trash2, Eye, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTemplate } from '../../hooks/useTemplate';
import { MessageTemplate } from '../../types/template';
import TemplateForm from './TemplateForm';
import TemplatePreview from './TemplatePreview';
import QuickReplyBuilder from './QuickReplyBuilder';
import MediaCarouselBuilder from './MediaCarouselBuilder';

export default function TemplateManager() {
  const { user } = useAuth();
  const { templates, loading, fetchTemplates, createTemplate, updateTemplate, deleteTemplate } = useTemplate(user?.merchantId || '');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'text' | 'button' | 'list' | 'media' | 'carousel'>('all');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showQuickReplyBuilder, setShowQuickReplyBuilder] = useState(false);
  const [showMediaBuilder, setShowMediaBuilder] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || template.type === filterType;
    const matchesLanguage = filterLanguage === 'all' || template.language === filterLanguage;
    return matchesSearch && matchesType && matchesLanguage;
  });

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(id);
    }
  };

  const handlePreview = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTemplate(null);
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, formData);
      } else {
        await createTemplate(formData);
      }
      handleFormClose();
      await fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDuplicate = async (template: MessageTemplate) => {
    try {
      await createTemplate({
        ...template,
        id: undefined as any,
        name: `${template.name} (Copy)`,
      });
      await fetchTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Message Templates
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage WhatsApp message templates
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
            <button
              onClick={() => setShowQuickReplyBuilder(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Quick Replies
            </button>
            <button
              onClick={() => setShowMediaBuilder(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Media Carousel
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              New Template
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="text">Text</option>
            <option value="button">Buttons</option>
            <option value="list">List</option>
            <option value="media">Media</option>
            <option value="carousel">Carousel</option>
          </select>
          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Languages</option>
            <option value="en">English</option>
            <option value="pt">Portuguese</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="ja">Japanese</option>
            <option value="zh">Chinese</option>
            <option value="ar">Arabic</option>
            <option value="hi">Hindi</option>
          </select>
        </div>

        {/* Templates Grid */}
        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                  {/* Template Card Header */}
                  <div className="px-4 py-5 sm:px-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                      </div>
                      <div className="ml-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {template.type}
                        </span>
                      </div>
                    </div>

                    {/* Template Preview */}
                    <div className="mt-4 bg-gray-50 rounded p-3">
                      <p className="text-sm text-gray-700 line-clamp-3">{template.body}</p>
                    </div>

                    {/* Metadata */}
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                      <span>{template.language}</span>
                      <span>Sent {template.sendCount} times</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 flex items-center justify-between space-x-2">
                    <button
                      onClick={() => handlePreview(template)}
                      className="inline-flex items-center px-2 py-1 text-gray-600 hover:text-blue-600"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(template)}
                      className="inline-flex items-center px-2 py-1 text-gray-600 hover:text-green-600"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(template)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="inline-flex items-center px-2 py-1 text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No templates found. Create your first template to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Forms and Modals */}
      {showForm && (
        <TemplateForm
          template={editingTemplate || undefined}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
        />
      )}

      {showPreview && selectedTemplate && (
        <TemplatePreview
          template={selectedTemplate}
          onClose={() => setShowPreview(false)}
        />
      )}

      {showQuickReplyBuilder && (
        <QuickReplyBuilder
          onClose={() => setShowQuickReplyBuilder(false)}
          onSave={() => {
            fetchTemplates();
            setShowQuickReplyBuilder(false);
          }}
        />
      )}

      {showMediaBuilder && (
        <MediaCarouselBuilder
          onClose={() => setShowMediaBuilder(false)}
          onSave={() => {
            fetchTemplates();
            setShowMediaBuilder(false);
          }}
        />
      )}
    </div>
  );
}
