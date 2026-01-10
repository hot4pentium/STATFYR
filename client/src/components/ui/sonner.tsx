"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={2300}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-green-600 group-[.toaster]:to-green-500 group-[.toaster]:text-white group-[.toaster]:border-green-400/30 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-white/80",
          actionButton:
            "group-[.toast]:bg-white group-[.toast]:text-green-600",
          cancelButton:
            "group-[.toast]:bg-white/20 group-[.toast]:text-white",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
