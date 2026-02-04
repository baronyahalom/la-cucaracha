import { extensions } from '@wix/astro/builders';

export default extensions.customElement({
  id: '15c8b295-3cf0-4d59-82ca-48172c88177c',
  name: 'mainWidget',
  width: {
    defaultWidth: 450,
    allowStretch: true
  },
  height: {
    defaultHeight: 250
  },
  installation: {
    autoAdd: true
  },
  presets: [
    {
      id: '5faa8bc8-f21e-4e68-b179-4e4e09e5d8fe',
      name: 'Default',
      thumbnailUrl: '{{BASE_URL}}/main-widget-thumbnail.png',
    },
  ],
  
  tagName: 'main-widget',
  element: './extensions/site/widgets/main-widget/main-widget.tsx',
  settings: './extensions/site/widgets/main-widget/main-widget.panel.tsx',
});
