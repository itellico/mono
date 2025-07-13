"use client"

import * as React from "react"
import { Key, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ChangePasswordDialogProps {
  children?: React.ReactNode
  onPasswordChange?: (currentPassword: string, newPassword: string) => Promise<void>
  isLoading?: boolean
  className?: string
}

export function ChangePasswordDialog({
  children,
  onPasswordChange,
  isLoading = false,
  className
}: ChangePasswordDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [passwordStrength, setPasswordStrength] = React.useState(0)
  const [meetsRequirements, setMeetsRequirements] = React.useState(false)

  const resetForm = () => {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setError("")
    setPasswordStrength(0)
    setMeetsRequirements(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  const validateForm = () => {
    if (!currentPassword.trim()) {
      setError("Current password is required")
      return false
    }

    if (!newPassword.trim()) {
      setError("New password is required")
      return false
    }

    if (!meetsRequirements) {
      setError("New password does not meet security requirements")
      return false
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return false
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from current password")
      return false
    }

    setError("")
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await onPasswordChange?.(currentPassword, newPassword)
      setOpen(false)
      resetForm()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to change password")
    }
  }

  const handlePasswordStrengthChange = (strength: number, meets: boolean) => {
    setPasswordStrength(strength)
    setMeetsRequirements(meets)
    // Clear error when password requirements are met
    if (meets && error.includes("security requirements")) {
      setError("")
    }
  }

  const canSubmit = currentPassword && newPassword && confirmPassword && !isLoading

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button 
            variant="outline" 
            className={cn(
              "border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-emerald-950",
              className
            )}
          >
            <Key className="w-4 h-4 mr-2" />
            Change Password
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-600" />
            Change Password
          </DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new secure password.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <PasswordInput
              id="currentPassword"
              placeholder="Enter your current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <PasswordInput
              id="newPassword"
              placeholder="Enter your new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              showStrengthIndicator={true}
              showRequirements={true}
              onStrengthChange={handlePasswordStrengthChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <PasswordInput
              id="confirmPassword"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-red-600">Passwords do not match</p>
            )}
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 