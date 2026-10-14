import type { Preview } from '@storybook/react';
import '../src/app/index.css';

const preview: Preview = {
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
        controls: {
            matchers: { color: /(background|color)$/i, date: /Date$/i },
        },
    },
};

export default preview;
