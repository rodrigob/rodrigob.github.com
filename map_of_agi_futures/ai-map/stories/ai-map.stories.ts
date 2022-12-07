import { html, TemplateResult } from 'lit';
import '../src/ai-map.js';

export default {
  title: 'AiMap',
  component: 'ai-map',
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

interface Story<T> {
  (args: T): TemplateResult;
  args?: Partial<T>;
  argTypes?: Record<string, unknown>;
}

interface ArgTypes {
  title?: string;
  backgroundColor?: string;
}

const Template: Story<ArgTypes> = ({ title, backgroundColor = 'white' }: ArgTypes) => html`
  <ai-map style="--ai-map-background-color: ${backgroundColor}" .title=${title}></ai-map>
`;

export const App = Template.bind({});
App.args = {
  title: 'My app',
};
