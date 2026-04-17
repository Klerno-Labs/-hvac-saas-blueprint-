'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function CopyReferralButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button onClick={handleCopy} variant="default">
      {copied ? 'Copied!' : 'Copy link'}
    </Button>
  )
}
