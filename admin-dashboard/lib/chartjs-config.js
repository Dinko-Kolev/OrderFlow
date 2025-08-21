import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register all the components we need
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Global Chart.js configuration
ChartJS.defaults.font.family = 'Inter, system-ui, sans-serif';
ChartJS.defaults.font.size = 12;
ChartJS.defaults.color = '#6B7280';

// Configure tooltip defaults (merge without nuking defaults)
ChartJS.defaults.plugins.tooltip = {
  ...ChartJS.defaults.plugins.tooltip,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  titleColor: '#FFFFFF',
  bodyColor: '#FFFFFF',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderWidth: 1,
  cornerRadius: 8,
  displayColors: true,
  padding: 12,
};

// Configure legend defaults (merge to preserve nested title defaults)
ChartJS.defaults.plugins.legend = {
  ...ChartJS.defaults.plugins.legend,
  display: true,
  position: 'bottom',
  labels: {
    ...(ChartJS.defaults.plugins.legend?.labels || {}),
    usePointStyle: true,
    padding: 20,
    font: {
      ...(ChartJS.defaults.plugins.legend?.labels?.font || {}),
      size: 12,
    },
  },
  // Ensure legend.title has a font object to avoid undefined font errors
  title: {
    ...(ChartJS.defaults.plugins.legend?.title || {}),
    font: {
      ...(ChartJS.defaults.plugins.legend?.title?.font || {}),
      size: (ChartJS.defaults.plugins.legend?.title?.font && ChartJS.defaults.plugins.legend.title.font.size) || 12,
      weight: (ChartJS.defaults.plugins.legend?.title?.font && ChartJS.defaults.plugins.legend.title.font.weight) || '600',
    },
  },
};

// Ensure title plugin defaults include a font object as well
ChartJS.defaults.plugins.title = {
  ...ChartJS.defaults.plugins.title,
  font: {
    ...(ChartJS.defaults.plugins.title?.font || {}),
    size: (ChartJS.defaults.plugins.title?.font && ChartJS.defaults.plugins.title.font.size) || 14,
    weight: (ChartJS.defaults.plugins.title?.font && ChartJS.defaults.plugins.title.font.weight) || '600',
  },
};

// The registration happens automatically when this file is imported
// We export ChartJS for potential use, but the main purpose is registration
export default ChartJS;
