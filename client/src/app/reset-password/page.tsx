"use client";
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '../../lib/api';
import { useEffect } from 'react';
import { validatePasswordResetToken } from '../../lib/validateResetToken';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean|null>(null);
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    validatePasswordResetToken(token).then(valid => setTokenValid(valid));
  }, [token]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (value.length < 6) {
      setPasswordStrength('weak');
    } else if (value.length < 10) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Invalid or missing token.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-transparent pt-24 pb-12">
      <div className="w-full max-w-md mx-auto p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h1 className="text-4xl font-bold text-center mb-6 bg-gradient-to-r from-primary-700 to-orchid-600 bg-clip-text text-transparent">
          Reset Password
        </h1>
        {error && <div className="text-red-600 mb-2 text-center">{error}</div>}
        {tokenValid === null ? (
          <div className="text-gray-500 text-center">Validating token...</div>
        ) : !tokenValid ? (
          <div className="text-red-600 text-center font-semibold">Invalid or expired password reset token.</div>
        ) : success ? (
          <div className="text-green-600 text-center">Password reset successful! Redirecting to login...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block mb-4">
              <span className="font-semibold text-gray-800 dark:text-gray-200">New Password</span>
              <input
                type="password"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mt-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={password}
                onChange={handlePasswordChange}
                required
              />
              {password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getPasswordStrengthColor()}`}
                        style={{
                          width:
                            passwordStrength === 'weak' ? '33%' :
                            passwordStrength === 'medium' ? '66%' :
                            passwordStrength === 'strong' ? '100%' : '0%'
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">{passwordStrength}</span>
                  </div>
                </div>
              )}
            </label>
            <label className="block mb-6">
              <span className="font-semibold text-gray-800 dark:text-gray-200">Confirm Password</span>
              <input
                type="password"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mt-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </label>
            <button
              type="submit"
              className="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-primary-700 to-orchid-600 text-white border-2 border-primary-700 dark:border-orchid-600 shadow-md hover:scale-[1.03] transition-transform"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
