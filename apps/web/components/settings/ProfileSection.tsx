'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui'
import type { Profile } from '@td2u/shared-types'

interface ProfileSectionProps {
  profile: Profile
  onUpdate: () => void
}

export function ProfileSection({ profile, onUpdate }: ProfileSectionProps) {
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName || null }),
      })

      if (res.ok) {
        onUpdate()
        setEditing(false)
      } else {
        const data = await res.json()
        setError(data.message || 'Failed to update profile')
      }
    } catch {
      setError('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <p className="text-gray-900 mt-1">{profile.email}</p>
        </div>

        {editing ? (
          <div className="space-y-4">
            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={handleSave} loading={saving} disabled={saving}>
                Save
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditing(false)
                  setDisplayName(profile.display_name ?? '')
                  setError(null)
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <label className="text-sm font-medium text-gray-700">
              Display Name
            </label>
            <p className="text-gray-900 mt-1">
              {profile.display_name || <span className="text-gray-400">Not set</span>}
            </p>
            <Button
              variant="secondary"
              onClick={() => setEditing(true)}
              className="mt-2"
            >
              Edit Profile
            </Button>
          </div>
        )}

        <p className="text-xs text-gray-500">
          Member since {new Date(profile.created_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  )
}
