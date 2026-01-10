'use client'

import { Spinner } from '@/components/ui'
import {
  ProfileSection,
  UsageSection,
  PlanSection,
  DangerZone,
} from '@/components/settings'
import { useProfile } from '@/hooks/useProfile'

export default function SettingsPage() {
  const { profile, loading, error, mutate } = useProfile()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Failed to load settings
        </h2>
        <p className="text-gray-600">{error?.message}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <ProfileSection profile={profile} onUpdate={mutate} />

      {profile.entitlement && (
        <>
          <UsageSection entitlement={profile.entitlement} />
          <PlanSection entitlement={profile.entitlement} />
        </>
      )}

      <DangerZone />
    </div>
  )
}
