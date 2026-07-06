'use client'

import { Turnstile } from '@marsidev/react-turnstile'

interface TurnstileCaptchaProps {
    onVerify: (token: string) => void
    onExpire?: () => void
    onError?: () => void
}

export function TurnstileCaptcha({ onVerify, onExpire, onError }: TurnstileCaptchaProps) {
    return (
        <div className="flex justify-center">
            <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={onVerify}
                onExpire={onExpire}
                onError={onError}
                options={{
                    theme: 'light',
                    size: 'normal'
                }}
            />
        </div>
    )
}
