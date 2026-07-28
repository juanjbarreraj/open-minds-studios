/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		// Brand scale driven by the CSS custom properties in index.css, so
  		// `bg-brand`, `text-brand-blue/60`, and friends stay in sync with the
  		// tokens instead of repeating literal rgb() values in components.
  		colors: {
  			brand: {
  				DEFAULT: 'rgb(var(--brand-primary) / <alpha-value>)',
  				deep: 'rgb(var(--brand-primary-deep) / <alpha-value>)',
  				blue: 'rgb(var(--brand-secondary) / <alpha-value>)',
  				'blue-deep': 'rgb(var(--brand-secondary-deep) / <alpha-value>)',
  				amber: 'rgb(var(--brand-accent) / <alpha-value>)',
  				'amber-deep': 'rgb(var(--brand-accent-deep) / <alpha-value>)',
  			},
  			ink: {
  				900: 'rgb(var(--ink-900) / <alpha-value>)',
  				700: 'rgb(var(--ink-700) / <alpha-value>)',
  				600: 'rgb(var(--ink-600) / <alpha-value>)',
  				500: 'rgb(var(--ink-500) / <alpha-value>)',
  				400: 'rgb(var(--ink-400) / <alpha-value>)',
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		boxShadow: {
  			'elev-1': 'var(--elev-1)',
  			'elev-2': 'var(--elev-2)',
  			'elev-3': 'var(--elev-3)',
  			'elev-4': 'var(--elev-4)',
  			'elev-brand': 'var(--elev-brand)',
  		},
  		transitionTimingFunction: {
  			'brand-out': 'var(--ease-out)',
  			'brand-in': 'var(--ease-in)',
  			'brand-inout': 'var(--ease-inout)',
  		},
  		transitionDuration: {
  			press: 'var(--dur-press)',
  			fast: 'var(--dur-fast)',
  			hover: 'var(--dur-hover)',
  			modal: 'var(--dur-modal)',
  		},
  		// Type scale with tuned line heights and tracking, so headings stop
  		// being uniformly heavy and black.
  		fontSize: {
  			display: ['clamp(2.5rem, 1.6rem + 3.6vw, 4.25rem)', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '800' }],
  			h1: ['clamp(2rem, 1.4rem + 2.4vw, 3rem)', { lineHeight: '1.12', letterSpacing: '-0.025em', fontWeight: '700' }],
  			h2: ['clamp(1.5rem, 1.2rem + 1.3vw, 2.125rem)', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
  			h3: ['clamp(1.125rem, 1rem + 0.6vw, 1.375rem)', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '650' }],
  			eyebrow: ['0.75rem', { lineHeight: '1', letterSpacing: '0.18em', fontWeight: '700' }],
  			lead: ['clamp(1rem, 0.95rem + 0.3vw, 1.1875rem)', { lineHeight: '1.65' }],
  		},
  		maxWidth: {
  			prose: '68ch',
  			measure: '54ch',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}