import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { MessageTemplate } from '../../types/template';
import { useTemplate } from '../../hooks/useTemplate';

interface TemplatePreviewProps {
  template: MessageTemplate;
  onClose: () => void;
}

export default function TemplatePreview({ template, onClose }: TemplatePreviewProps) {
  const { previewTemplate, sendTestPreview } = useTemplate(template.merchantId);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'send'>('preview');

  const handleVariableChange = (variableName: string, value: string) => {
    setVariables((prev) => ({
      ...prev,
      [variableName]: value,
    }));
  };

  const generatePreview = async () => {
    try {
      setError(null);
      const result = await previewTemplate(template.id, variables);
      setPreview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    try {
      setSending(true);
      setError(null);
      await sendTestPreview(template.id, phoneNumber, variables);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Preview Template</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-3 px-0 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'preview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab('send')}
              className={`py-3 px-0 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'send'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Send Test
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'preview' ? (
            <div className="space-y-6">
              {/* Variables Form */}
              {template.variables && template.variables.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Fill in Variables</h3>
                  <div className="space-y-3">
                    {template.variables.map((variable) => (
                      <div key={variable.id}>
                        <label className="block text-sm font-medium text-gray-700">
                          {variable.name}
                          {variable.required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type={variable.type === 'number' ? 'number' : 'text'}
                          value={variables[variable.name] || ''}
                          onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                          placeholder={variable.example || `Enter ${variable.name.toLowerCase()}`}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={generatePreview}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Generate Preview
                  </button>
                </div>
              )}

              {/* WhatsApp Preview */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">WhatsApp Message Preview</h3>
                <div className="bg-gray-100 rounded-lg p-4 max-w-sm mx-auto">
                  {/* WhatsApp-like bubble */}
                  <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
                    {preview?.renderedHeader && (
                      <div className="text-sm font-semibold text-gray-900 pb-2 border-b border-gray-200">
                        {preview.renderedHeader}
                      </div>
                    )}

                    <div className="text-sm text-gray-800 leading-relaxed">
                      {preview?.renderedBody || template.body}
                    </div>

                    {preview?.mediaPreview && (
                      <div className="mt-3 rounded-lg overflow-hidden">
                        {preview.mediaPreview.type === 'image' && (
                          <img
                            src={preview.mediaPreview.url}
                            alt="Media"
                            className="w-full h-48 object-cover"
                          />
                        )}
                        {preview.mediaPreview.caption && (
                          <p className="text-xs text-gray-600 mt-2">{preview.mediaPreview.caption}</p>
                        )}
                      </div>
                    )}

                    {preview?.buttons && preview.buttons.length > 0 && (
                      <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                        {preview.buttons.map((button: any, index: number) => (
                          <button
                            key={index}
                            className="w-full px-3 py-2 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                            disabled
                          >
                            {button.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {preview?.renderedFooter && (
                      <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                        {preview.renderedFooter}
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {preview?.validationErrors && preview.validationErrors.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-yellow-800 mb-2">Validation Issues:</p>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {preview.validationErrors.map((err: string, idx: number) => (
                        <li key={idx}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendTest} className="space-y-6 max-w-sm">
              {/* Variables Form */}
              {template.variables && template.variables.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Fill in Variables</h3>
                  <div className="space-y-3">
                    {template.variables.map((variable) => (
                      <div key={variable.id}>
                        <label className="block text-sm font-medium text-gray-700">
                          {variable.name}
                          {variable.required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type={variable.type === 'number' ? 'number' : 'text'}
                          value={variables[variable.name] || ''}
                          onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                          placeholder={variable.example || `Enter ${variable.name.toLowerCase()}`}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Recipient Phone Number *
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890 or 1234567890"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Include country code (e.g., +1 for USA, +55 for Brazil)
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">✓ Test message sent successfully!</p>
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : 'Send Test'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
