'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

export function DangerZone() {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        'This will permanently delete your account and all data. Type "DELETE" to confirm.'
      )
    ) {
      return
    }

    const input = prompt('Type DELETE to confirm:')
    if (input !== 'DELETE') {
      alert('Account deletion cancelled')
      return
    }

    setDeleting(true)
    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
      })

      if (res.ok) {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/')
      } else {
        const data = await res.json()
        alert(data.message || 'Failed to delete account')
      }
    } catch {
      alert('Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-600">Danger Zone</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Sign Out</p>
            <p className="text-sm text-gray-600">
              Sign out from all devices
            </p>
          </div>
          <Button variant="secondary" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-600">Delete Account</p>
              <p className="text-sm text-gray-600">
                Permanently delete your account and all data
              </p>
            </div>
            {showDeleteConfirm ? (
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={handleDeleteAccount}
                  loading={deleting}
                  disabled={deleting}
                >
                  Confirm
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Account
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
