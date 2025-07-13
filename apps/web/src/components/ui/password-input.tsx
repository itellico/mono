"use client"
import * as React from "react"
import { Eye, EyeOff, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}
const defaultRequirements: PasswordRequirement[] = [
  {
    label: "At least 8 characters",
    test: (password) => password.length >= 8
  },
  {
    label: "At least one uppercase letter",
    test: (password) => /[A-Z]/.test(password)
  },
  {
    label: "At least one lowercase letter", 
    test: (password) => /[a-z]/.test(password)
  },
  {
    label: "At least one number",
    test: (password) => /\d/.test(password)
  },
  {
    label: "At least one special character",
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
]
interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  showStrengthIndicator?: boolean
  showRequirements?: boolean
  requirements?: PasswordRequirement[]
  strengthLabels?: {
    weak: string
    fair: string
    good: string
    strong: string
  }
  onStrengthChange?: (strength: number, meetsRequirements: boolean) => void
}
export const PasswordInput = function PasswordInput({
  className,
  showStrengthIndicator = false,
  showRequirements = false,
  requirements = defaultRequirements,
  strengthLabels = {
    weak: "Weak",
    fair: "Fair",
    good: "Good",
    strong: "Strong"
  },
  onStrengthChange,
  value,
  onChange,
  ...props
}) {
  const [showPassword, setShowPassword] = React.useState(false)
  const [strength, setStrength] = React.useState(0)
  const [meetsRequirements, setMeetsRequirements] = React.useState(false)
  const passwordValue = value as string || ""
  const calculateStrength = React.useCallback((password: string) => {
    if (!password) return 0
    const passed = requirements.filter(req => req.test(password)).length;
    const percentage = (passed / requirements.length) * 100
    return Math.round(percentage)
  }, [requirements])
  React.useEffect(() => {
    const newStrength = calculateStrength(passwordValue);
    const allRequirementsMet = requirements.every(req => req.test(passwordValue))
    setStrength(newStrength)
    setMeetsRequirements(allRequirementsMet)
    onStrengthChange?.(newStrength, allRequirementsMet)
  }, [passwordValue, calculateStrength, requirements, onStrengthChange])
  const getStrengthLabel = () => {
    if (strength <= 25) return strengthLabels.weak
    if (strength <= 50) return strengthLabels.fair
    if (strength <= 75) return strengthLabels.good
    return strengthLabels.strong
  }
  const getStrengthColor = () => {
    if (strength <= 25) return "bg-red-500"
    if (strength <= 50) return "bg-yellow-500"
    if (strength <= 75) return "bg-blue-500"
    return "bg-emerald-500"
  }
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }
  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          {...props}
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", className)}
          value={value}
          onChange={onChange}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={togglePasswordVisibility}
          disabled={props.disabled}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="sr-only">
            {showPassword ? "Hide password" : "Show password"}
          </span>
        </Button>
      </div>
      {showStrengthIndicator && passwordValue && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Password strength:</span>
            <span className={cn(
              "font-medium",
              strength <= 25 && "text-red-600",
              strength > 25 && strength <= 50 && "text-yellow-600",
              strength > 50 && strength <= 75 && "text-blue-600",
              strength > 75 && "text-emerald-600"
            )}>
              {getStrengthLabel()}
            </span>
          </div>
          <div className="space-y-1">
            <Progress 
              value={strength} 
              className="h-2"
            />
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                getStrengthColor()
              )}
              style={{ width: `${strength}%` }}
            />
          </div>
        </div>
      )}
      {showRequirements && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Password requirements:
          </h4>
          <ul className="space-y-1">
            {requirements.map((requirement, index) => {
              const passed = passwordValue ? requirement.test(passwordValue) : false
              return (
                <li
                  key={index}
                  className={cn(
                    "flex items-center space-x-2 text-sm",
                    passed ? "text-emerald-600" : "text-muted-foreground"
                  )}
                >
                  {passed ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <X className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span>{requirement.label}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
} 