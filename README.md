<div align="center">

# 🇲🇾 Malaysia Site Suitability Dashboard

**Interactive choropleth map dashboard for retail and operations site selection in Malaysia**

[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?logo=leaflet)](https://leafletjs.com/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)](https://vitejs.dev/)

</div>

## 📊 Overview

An interactive geospatial dashboard that visualizes Malaysia's demographic, economic, and infrastructure data to support data-driven site selection decisions for retail and business operations. The dashboard features a **composite site suitability score** that combines multiple factors into a single actionable metric.

### Key Features

- 🗺️ **Interactive Choropleth Maps** - Visualize data across three administrative boundaries:
  - Districts
  - Parliament constituencies
  - DUN (State Legislative Assembly) constituencies

- 📈 **Multiple Data Layers**:
  - **Population Density** - Total population by area
  - **Average Income** - Household income metrics
  - **Competitor Density** - Business competition analysis
  - **Public Services** - Infrastructure and amenities count
  - **Night Lights Intensity** - Economic activity proxy from satellite data
  - **Site Suitability Score** ⭐ - Composite metric combining all factors

- 🎯 **Business Intelligence**:
  - Weighted composite scoring algorithm
  - Real-time data visualization
  - Detailed feature information panels
  - Missing data indicators

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/malaysia-site-suitability.git
   cd malaysia-site-suitability
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

### Build for Production

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
malaysia-site-suitability/
├── components/          # React components
│   ├── MapComponent.tsx # Main map visualization
│   ├── Sidebar.tsx      # Layer selection and controls
│   ├── InfoPanel.tsx    # Feature details panel
│   └── ...
├── data/                # Static data and configurations
├── services/            # API and data transformation logic
├── public/              # GeoJSON boundary files
├── scripts/             # Data processing utilities
└── dosm-data/           # DOSM data sources
```

## 🗺️ Data Sources

- **Department of Statistics Malaysia (DOSM)** - Census and demographic data
- **Satellite Imagery** - Night lights data for economic activity
- **Administrative Boundaries** - Official GeoJSON files for districts, parliament, and DUN

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run enrich-data` - Enrich GeoJSON files with data

### Data Enrichment

The project includes scripts to enrich GeoJSON boundary files with demographic and economic data:

```bash
npm run enrich-district    # Enrich district boundaries
npm run enrich-parliament  # Enrich parliament boundaries
npm run enrich-dun        # Enrich DUN boundaries
npm run enrich-data        # Enrich all boundaries
```

## 📊 Site Suitability Score

The composite **Site Suitability Score** (0-100) is calculated using weighted factors:

- Population density
- Average household income
- Competitor density (inverse weight)
- Public services availability
- Night lights intensity (economic activity)

Higher scores indicate more favorable conditions for business establishment.

## 🎨 Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Mapping Library**: Leaflet with React-Leaflet
- **Charts**: Recharts
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (via inline styles)
- **Data Processing**: D3-scale for color quantization

## 📝 License

[Add your license here]

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

[Add your contact information or project maintainer details]

---

**Built with ❤️ for data-driven decision making in Malaysia**
