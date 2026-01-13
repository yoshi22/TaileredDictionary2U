'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import type { Deck } from '@td2u/shared-types'
import type { CsvImportResult } from '@/lib/csv'
import { CSV_MAX_FILE_SIZE, CSV_MAX_ROWS, generateSampleCSV } from '@/lib/csv'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (_result: CsvImportResult) => void
  decks: Deck[]
  defaultDeckId?: string
}

type ImportState = 'idle' | 'uploading' | 'success' | 'error'

export function ImportModal({
  isOpen,
  onClose,
  onSuccess,
  decks,
  defaultDeckId,
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [deckId, setDeckId] = useState<string>(defaultDeckId || '')
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [state, setState] = useState<ImportState>('idle')
  const [result, setResult] = useState<CsvImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFile(null)
      setDeckId(defaultDeckId || '')
      setSkipDuplicates(true)
      setState('idle')
      setResult(null)
      setError(null)
      setShowErrors(false)
    }
  }, [isOpen, defaultDeckId])

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state !== 'uploading') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose, state])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && state !== 'uploading') {
      onClose()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    validateAndSetFile(selectedFile)
  }

  const validateAndSetFile = (selectedFile: File | undefined) => {
    if (!selectedFile) return

    // Validate file type
    if (!selectedFile.name.endsWith('.csv') && selectedFile.type !== 'text/csv') {
      setError('Please select a CSV file')
      return
    }

    // Validate file size
    if (selectedFile.size > CSV_MAX_FILE_SIZE) {
      setError(`File too large. Maximum size is ${CSV_MAX_FILE_SIZE / 1024 / 1024}MB`)
      return
    }

    setFile(selectedFile)
    setError(null)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dropZoneRef.current?.classList.remove('border-blue-500', 'bg-blue-50')

    const droppedFile = e.dataTransfer.files[0]
    validateAndSetFile(droppedFile)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dropZoneRef.current?.classList.add('border-blue-500', 'bg-blue-50')
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dropZoneRef.current?.classList.remove('border-blue-500', 'bg-blue-50')
  }, [])

  const handleImport = async () => {
    if (!file) return

    setState('uploading')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (deckId) {
        formData.append('deck_id', deckId)
      }
      formData.append('skip_duplicates', String(skipDuplicates))

      const response = await fetch('/api/entries/import', {
        method: 'POST',
        body: formData,
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message || 'Import failed')
      }

      setResult(json.data)
      setState('success')
      onSuccess(json.data)
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : 'Import failed')
    }
  }

  const handleDownloadTemplate = () => {
    const csvContent = generateSampleCSV()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'td2u-import-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>Import Entries from CSV</CardTitle>
          </CardHeader>
          <CardContent>
            {state === 'success' && result ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-800">Import Complete</h3>
                  <div className="mt-2 text-sm text-green-700 space-y-1">
                    <p>Total rows: {result.total}</p>
                    <p>Imported: {result.imported}</p>
                    {result.skipped > 0 && <p>Skipped (duplicates): {result.skipped}</p>}
                    {result.failed > 0 && <p className="text-orange-600">Failed: {result.failed}</p>}
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowErrors(!showErrors)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {showErrors ? 'Hide errors' : `Show ${result.errors.length} error(s)`}
                    </button>
                    {showErrors && (
                      <div className="mt-2 max-h-40 overflow-y-auto border rounded p-2 text-xs space-y-1">
                        {result.errors.map((err, i) => (
                          <p key={i} className="text-red-600">
                            Row {err.row}: {err.message}
                            {err.term && ` (term: ${err.term})`}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={onClose}>Close</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* File upload area */}
                <div
                  ref={dropZoneRef}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors"
                >
                  {file ? (
                    <div className="space-y-2">
                      <svg
                        className="mx-auto h-10 w-10 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <svg
                        className="mx-auto h-10 w-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="text-sm text-gray-600">
                        Drag and drop a CSV file here, or
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        browse to select
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,text/csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {/* Deck selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign to deck (optional)
                    </label>
                    <select
                      value={deckId}
                      onChange={(e) => setDeckId(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">No deck</option>
                      {decks.map((deck) => (
                        <option key={deck.id} value={deck.id}>
                          {deck.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Skip duplicates */}
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Skip duplicate terms
                    </span>
                  </label>
                </div>

                {/* Error message */}
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                {/* Info */}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Maximum {CSV_MAX_ROWS} rows per import</p>
                  <p>Required column: term</p>
                  <p>Optional columns: context, deck_id</p>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="text-blue-600 hover:underline"
                  >
                    Download template CSV
                  </button>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    disabled={state === 'uploading'}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={!file || state === 'uploading'}
                    loading={state === 'uploading'}
                  >
                    Import
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
