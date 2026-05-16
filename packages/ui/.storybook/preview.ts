import type { Preview } from '@storybook/react'

// Tailwind v4 + LandX design tokens. Loaded via Vite's CSS pipeline so all
// utility classes used inside stories resolve correctly.
import '../src/styles/theme.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
    },
    backgrounds: {
      default: 'paper',
      values: [
        { name: 'paper', value: 'hsl(36 38% 98%)' },
        { name: 'ink', value: 'hsl(28 14% 12%)' },
        { name: 'transparent', value: 'transparent' },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile (375)',
          styles: { width: '375px', height: '667px' },
        },
        tablet: {
          name: 'Tablet (768)',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop (1280)',
          styles: { width: '1280px', height: '800px' },
        },
      },
    },
    a11y: {
      element: '#storybook-root',
      manual: false,
    },
    layout: 'centered',
    options: {
      storySort: {
        order: [
          'Docs',
          'Atoms',
          'Feedback',
          'Charts',
          'Primitives',
          'Shell',
          'Maps',
        ],
      },
    },
  },
  tags: ['autodocs'],
}

export default preview
