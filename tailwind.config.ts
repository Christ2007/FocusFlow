import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				// Task category colors
				focus: {
					DEFAULT: 'hsl(var(--focus))',
					foreground: 'hsl(var(--focus-foreground))'
				},
				energy: {
					DEFAULT: 'hsl(var(--energy))',
					foreground: 'hsl(var(--energy-foreground))',
					glow: 'hsl(var(--energy-glow))'
				},
				creative: {
					DEFAULT: 'hsl(var(--creative))',
					foreground: 'hsl(var(--creative-foreground))',
					glow: 'hsl(var(--creative-glow))'
				},
				// Gamification colors
				badge: {
					gold: 'hsl(var(--badge-gold))',
					silver: 'hsl(var(--badge-silver))',
					bronze: 'hsl(var(--badge-bronze))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
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
			backgroundImage: {
				'gradient-success': 'var(--gradient-success)',
				'gradient-focus': 'var(--gradient-focus)',
				'gradient-energy': 'var(--gradient-energy)',
				'gradient-creative': 'var(--gradient-creative)'
			},
			boxShadow: {
				'card': 'var(--shadow-card)',
				'task': 'var(--shadow-task)',
				'success': 'var(--shadow-success)',
				'glow': 'var(--shadow-glow)'
			},
			transitionTimingFunction: {
				'smooth': 'var(--transition-smooth)',
				'bounce': 'var(--transition-bounce)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
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
				},
				// Gamification animations
				'celebrate': {
					'0%, 100%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(1.05)' }
				},
				'bounce-in': {
					'0%': { transform: 'scale(0.3)', opacity: '0' },
					'50%': { transform: 'scale(1.05)' },
					'70%': { transform: 'scale(0.9)' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'slide-up': {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 20px -5px hsl(var(--primary) / 0.3)' },
					'50%': { boxShadow: '0 0 30px -5px hsl(var(--primary) / 0.5)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'celebrate': 'celebrate 0.6s ease-in-out',
				'bounce-in': 'bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				'slide-up': 'slide-up 0.4s ease-out',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
