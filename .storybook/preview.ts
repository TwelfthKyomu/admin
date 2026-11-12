import type { Preview } from '@storybook/react';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { themes } from 'storybook/theming';
import '../src/app/index.css';

const inter = Inter({
    subsets: ['latin', 'cyrillic'],
    variable: '--font-sans',
    display: 'swap',
});

const mono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
});

document.documentElement.classList.add(inter.variable, mono.variable);
document.body.classList.add('dark');

const preview: Preview = {
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
        docs: { theme: themes.dark },
        controls: {
            matchers: { color: /(background|color)$/i, date: /Date$/i },
        },
    },
};

export default preview;
