# Legal Assist Agent — Frontend Client

A premium, responsive chat interface built for the Vectorless-RAG Autonomous Legal Assistant. Users can ask complex Indian legal scenarios, sign in via Google, and inspect the agent's real-time step-by-step reasoning process.

---

## ✨ Features

- **Modern & Responsive Chat Interface:** Sleek, dynamic chat UI optimized with responsive heights (`dvh`) for mobile devices.
- **Agent Reasoning Process Accordion:** Real-time collapsible reasoning logs showing thoughts, tool calls, and observations with full Markdown formatting and divider support.
- **Supabase Authentication:** Secure sign-in workflow supporting Google OAuth.
- **Inline Citations & Meta Sheets:** Automatic inline citation extraction that reveals metadata drawers when clicked.
- **Dynamic Follow-Ups & Action Items:** Contextual follow-up suggestions and action checklists generated on the fly.
- **Sleek Animations:** Built with Framer Motion for smooth accordion expand/collapse behaviors, stream animations, and theme transitions.

---

## 🛠️ Technology Stack

- **Framework:** Next.js (App Router, Turbopack)
- **Styling:** Tailwind CSS (configured with dark-mode tailwind variables)
- **Animations:** Framer Motion
- **Markdown Parsing:** ReactMarkdown, remark-gfm
- **Icons:** Lucide React
- **Auth:** Supabase Auth (via standard JS client library)

---

## ⚙️ Configuration & Environment Setup

Create a `.env` file in the root directory and configure the following variables:

```env
NEXT_PUBLIC_API_URL=https://your-legal-vectorless-rag-hf-space.hf.space
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

- `NEXT_PUBLIC_API_URL`: Points to your Hugging Face Space FastAPI deployment (or `http://localhost:8000` during local backend testing).
- `NEXT_PUBLIC_SUPABASE_URL` / `KEY`: Configures Supabase OAuth redirection.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to start using the client.

### 3. Build for Production
```bash
npm run build
```

---

## 🌐 Deployment

The frontend is ready for zero-configuration deployments on **Vercel**:
1. Connect this repository to your Vercel project.
2. Inject your production environment variables (Supabase URL/Key, HF Space URL).
3. Vercel will automatically build and deploy the production bundle.
