'use client'

import { useRouter } from 'next/navigation'
import { Header } from './Header'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface HeaderWrapperProps {
  user?: User | null
}

export function HeaderWrapper({ user }: HeaderWrapperProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return <Header user={user} onSignOut={handleSignOut} />
}
