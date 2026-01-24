import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="sparqnow-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export { useTheme }

