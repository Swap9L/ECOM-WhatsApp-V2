import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface TwoFactorSetupProps {
  onSetupComplete: () => void;
}

export default function TwoFactorSetup({ onSetupComplete }: TwoFactorSetupProps) {
  const [stage, setStage] = useState<'initial' | 'setupQR' | 'verifyCode' | 'complete'>('initial');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  const setupTwoFactor = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest('POST', '/api/2fa/setup');
      const data = await response.json();

      if (data.success) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setStage('setupQR');
      } else {
        setError(data.message || 'Failed to set up 2FA');
      }
    } catch (err) {
      console.error('Error setting up 2FA:', err);
      setError('An error occurred while setting up 2FA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTwoFactor = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest('POST', '/api/2fa/verify', { token: verificationCode });
      const data = await response.json();

      if (data.success) {
        setStage('complete');
        setTimeout(() => {
          onSetupComplete();
        }, 2000);
      } else {
        setError(data.message || 'Invalid code. Please try again.');
      }
    } catch (err) {
      console.error('Error verifying 2FA token:', err);
      setError('An error occurred while verifying your code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Two-Factor Authentication Setup</CardTitle>
        <CardDescription>
          Secure your admin account with Google Authenticator
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {stage === 'initial' && (
          <div className="text-center py-4">
            <p className="mb-6 text-muted-foreground">
              Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to sign in.
            </p>
            <Button onClick={setupTwoFactor} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Set Up Two-Factor Authentication
            </Button>
          </div>
        )}

        {stage === 'setupQR' && qrCode && (
          <div className="text-center">
            <p className="mb-4 text-muted-foreground">
              Scan this QR code with your Google Authenticator app
            </p>
            
            <div className="mb-4 flex justify-center">
              <img src={qrCode} alt="QR Code for Google Authenticator" className="border p-2 rounded" />
            </div>
            
            {secret && (
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-1">Or enter this code manually:</p>
                <code className="bg-muted p-2 rounded text-sm">{secret}</code>
              </div>
            )}
            
            <div className="space-y-4">
              <p className="text-sm">Enter the 6-digit code from your authenticator app:</p>
              <Input
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').substring(0, 6))}
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
              <Button onClick={verifyTwoFactor} disabled={isLoading || verificationCode.length !== 6}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Code
              </Button>
            </div>
          </div>
        )}

        {stage === 'complete' && (
          <div className="text-center py-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Setup Complete!</h3>
            <p className="text-muted-foreground">
              Two-factor authentication has been successfully enabled for your account.
            </p>
          </div>
        )}
      </CardContent>

      {stage === 'setupQR' && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setStage('initial')}>
            Back
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}