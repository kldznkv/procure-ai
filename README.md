# 🚀 ProcureAI

**AI-Powered Procurement Document Processing and Analysis Platform**

ProcureAI is a modern, intelligent procurement management system that leverages artificial intelligence to automatically process, analyze, and extract insights from procurement documents including invoices, purchase orders, contracts, and receipts.

## ✨ Features

### 🤖 **AI-Powered Document Processing**
- **Multi-format Support**: PDF, JPG, PNG, and text documents
- **Intelligent Data Extraction**: Automatically extracts supplier information, amounts, dates, and line items
- **OCR Capabilities**: Process scanned documents and images with optical character recognition
- **Confidence Scoring**: AI-generated reliability scores for extracted data

### 📊 **Advanced Analytics**
- **Spending Analysis**: Track and analyze procurement spending patterns
- **Cost Trends**: Visualize cost trends over time
- **Supplier Comparison**: Compare suppliers based on performance and pricing
- **Compliance Monitoring**: Ensure adherence to procurement policies

### 🔐 **Enterprise Security**
- **Authentication**: Secure user authentication with Clerk
- **Role-based Access**: Granular permissions and access control
- **Data Privacy**: Secure handling of sensitive procurement data
- **Audit Trails**: Complete audit logs for compliance

### ⚡ **Performance & Scalability**
- **Caching**: Redis-powered caching for optimal performance
- **Real-time Processing**: Fast document processing and analysis
- **Scalable Architecture**: Built for enterprise-scale deployments
- **API-First Design**: Comprehensive REST API for integrations

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: Supabase (PostgreSQL)
- **AI/ML**: Anthropic Claude API
- **Authentication**: Clerk
- **Caching**: Redis
- **File Processing**: PDF.js, Tesseract.js, Mammoth
- **Deployment**: Vercel, Docker, Railway

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 8+
- Supabase account
- Anthropic API key
- Clerk account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/procure-ai.git
   cd procure-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables in `.env.local`:
   ```env
   # Required
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   ```

4. **Set up the database**
   ```bash
   # Run the SQL schema in your Supabase dashboard
   cat database/procurement_schema.sql
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
procure-ai/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Main dashboard
│   │   ├── documents/         # Document management
│   │   ├── suppliers/         # Supplier management
│   │   └── workflows/         # Workflow management
│   ├── components/            # React components
│   ├── lib/                   # Utility libraries
│   └── types/                 # TypeScript type definitions
├── database/                  # Database schema and migrations
├── public/                    # Static assets
├── .github/workflows/         # CI/CD pipelines
├── docker-compose.yml         # Docker configuration
├── Dockerfile                 # Container definition
└── README.md                  # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
| `ANTHROPIC_API_KEY` | ✅ | Anthropic Claude API key |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key |
| `REDIS_URL` | ❌ | Redis connection URL (optional) |
| `VECTOR_DB_URL` | ❌ | Vector database URL (optional) |

### Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `database/procurement_schema.sql`
3. Configure Row Level Security (RLS) policies
4. Set up authentication providers in Clerk

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Docker

1. **Build the Docker image**
   ```bash
   docker build -t procure-ai .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

### Railway

1. **Connect your GitHub repository**
2. **Set environment variables**
3. **Deploy** - Railway will automatically build and deploy

## 📚 API Documentation

### Core Endpoints

- `POST /api/documents/process` - Process a procurement document
- `GET /api/documents` - List all documents
- `GET /api/suppliers` - List all suppliers
- `POST /api/suppliers/create` - Create a new supplier
- `GET /api/analysis/spending-patterns` - Get spending analysis
- `GET /api/health` - Health check endpoint

### Authentication

All API endpoints require authentication via Clerk. Include the session token in the Authorization header:

```bash
Authorization: Bearer <session_token>
```

## 🧪 Testing

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests (when implemented)
npm test

# Build for production
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/your-username/procure-ai/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/procure-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/procure-ai/discussions)

## 🗺️ Roadmap

- [ ] Advanced AI model selection
- [ ] Real-time collaboration features
- [ ] Mobile application
- [ ] Advanced analytics dashboard
- [ ] Integration with ERP systems
- [ ] Multi-language support

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com/) for Claude AI
- [Supabase](https://supabase.com/) for the backend
- [Clerk](https://clerk.com/) for authentication
- [Vercel](https://vercel.com/) for deployment platform

---

**Built with ❤️ by the ProcureAI Team**
# Force Vercel redeploy - Mon Sep  8 14:42:41 CEST 2025
