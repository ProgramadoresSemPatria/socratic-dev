'use client'

import { RequireAuth } from '@/components/require-auth'
import { OnboardingFlow } from '@/features/onboarding/components/onboarding-flow'

export default function OnboardingPage() {
  return (
    <RequireAuth next='/onboarding'>
      {(user) => <OnboardingFlow user={user} />}
    </RequireAuth>
  )
}
