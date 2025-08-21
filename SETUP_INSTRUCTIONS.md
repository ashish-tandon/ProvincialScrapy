# Provincial Bills Tracker - Complete Setup Instructions

## 🚀 Quick Start Guide

Follow these step-by-step instructions to set up the Provincial Bills Tracker with its stunning modern UI.

## Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn**
- **Python** 3.8+
- **Git**
- **Docker** & **Docker Compose** (optional, for production deployment)

## Step 1: Clone the Repository

```bash
git clone https://github.com/ashish-tandon/ProvincialScrapy.git
cd ProvincialScrapy
```

## Step 2: Set Up the Frontend

### Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Configure Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME="Provincial Bills Tracker"

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

### Start the Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Step 3: Set Up the Backend (MCP Server)

### Install Backend Dependencies

```bash
cd ../mcp-server
npm install
```

### Configure Environment Variables

Create a `.env` file in the mcp-server directory:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# NocoDB Configuration
NOCODB_API_URL=http://localhost:8080
NOCODB_API_TOKEN=your-nocodb-token

# Firecrawl Configuration
FIRECRAWL_API_KEY=your-firecrawl-api-key

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Redis Configuration (for Bull Queue)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Start the Backend Server

```bash
npm start
```

The API will be available at `http://localhost:3001`

## Step 4: Set Up NocoDB Database

### Using Docker Compose

```bash
# From the root directory
docker-compose up -d nocodb
```

### Manual Setup

1. Visit `http://localhost:8080`
2. Create a new project called "ProvincialBills"
3. Run the schema initialization script:

```bash
cd scripts
node init_nocodb_schema.js
```

## Step 5: Set Up Python Scrapers

### Create Python Virtual Environment

```bash
# From the root directory
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Install Python Dependencies

```bash
pip install -r requirements.txt
```

### Test Scrapers

```bash
python src/main.py --province ontario --test
```

## Step 6: Production Deployment

### Using Docker Compose

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Manual Production Setup

1. **Build Frontend**:
```bash
cd frontend
npm run build
npm start
```

2. **Set up Nginx** (optional):
```bash
sudo cp nginx/nginx.prod.conf /etc/nginx/sites-available/provincial-tracker
sudo ln -s /etc/nginx/sites-available/provincial-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

3. **Set up SSL** (using Let's Encrypt):
```bash
sudo certbot --nginx -d yourdomain.com
```

## Step 7: Running the Application

### Development Mode

1. **Terminal 1** - Frontend:
```bash
cd frontend
npm run dev
```

2. **Terminal 2** - Backend:
```bash
cd mcp-server
npm run dev
```

3. **Terminal 3** - NocoDB:
```bash
docker-compose up nocodb
```

### Production Mode

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🎨 Customization

### Modify Theme Colors

Edit `frontend/tailwind.config.ts`:
- Change primary color from purple to your brand color
- Adjust the color palette in the `:root` CSS variables

### Add New Features

1. Create new components in `frontend/components/`
2. Add new pages in `frontend/app/`
3. Use the existing UI components for consistency

### Modify Scrapers

Add new provincial scrapers in `src/scrapers/`:
1. Extend the `BaseScraper` class
2. Implement required methods
3. Register in `src/main.py`

## 📱 Features Overview

- **Modern UI**: Beautiful, responsive design with dark mode
- **Real-time Updates**: Live bill tracking with notifications
- **Dashboard**: Interactive analytics and visualizations
- **Authentication**: Secure login/register system
- **Search**: Smart search with filters
- **Responsive**: Works on all devices
- **Animations**: Smooth Framer Motion animations
- **Components**: Reusable UI component library

## 🐛 Troubleshooting

### Frontend Issues

```bash
# Clear Next.js cache
rm -rf .next
npm run dev

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Backend Issues

```bash
# Check logs
docker-compose logs mcp-server

# Restart services
docker-compose restart
```

### Database Issues

```bash
# Reset database
docker-compose down -v
docker-compose up -d
```

## 📞 Support

- **Issues**: https://github.com/ashish-tandon/ProvincialScrapy/issues
- **Documentation**: Check the README files in each directory

## 🎉 Success!

Once everything is running:
1. Visit `http://localhost:3000`
2. Create an account
3. Start tracking provincial bills!

The application features:
- Stunning modern UI with gradients and animations
- Dark/light mode toggle
- Real-time bill tracking
- Beautiful dashboard with analytics
- Responsive design for all devices
- Smooth animations and transitions