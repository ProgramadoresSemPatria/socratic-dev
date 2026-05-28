import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  // O ESLint flat config do repo falha ao carregar ("plugin:react not found"),
  // o que quebraria o `next build`. Checagem de TypeScript continua ligada.
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
