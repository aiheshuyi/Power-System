import { createApp, h } from 'vue';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';

import App from './App.vue';
import ErrorBoundary from './components/ErrorBoundary.vue';

import './index.css';
import './App.css';

const Root = {
  render: () => h(ErrorBoundary, null, { default: () => h(App) })
};

createApp(Root).use(Antd).mount('#app');