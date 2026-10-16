# Mando Central A.N.E. (Reenactment Frontend) ⚔️

Mando Central A.N.E. is an interactive web application developed with **React** and **TypeScript** for the comprehensive management of historical reenactment events, associations, and troops. The project provides a secure, hierarchical, and modern user experience designed specifically for the Spanish Napoleonic Association (A.N.E.).

🛠️ **Technologies Used**

* **Core:** React (Vite), TypeScript.
* **Styles:** Tailwind CSS (v3) for a modular, predictable, and responsive design.
* **Navigation:** React Router DOM (Nested Layouts, Protected Routes).
* **Forms & State:** React Hook Form (with asynchronous validations) and native React Context API.
* **Assets & External APIs:** Cloudinary (Image hosting), qrcode.react (SVG QR generation).
* **Security:** JWT Authentication handling with robust interceptors (Axios/Fetch wrapper).

✨ **Main Features**

1. **Hierarchical Roles Management (RBAC):** Differentiated access levels for Supreme Command (Admin), Presidents, and standard Reenactors.
2. **Reactive Dashboards:** Custom control panels per role showing real-time metrics (active troops, historical casualties, deployed weapons).
3. **Digital Wallet (QR):** Mobile-first view for reenactors to check their deployment passes and authorized weapons, generating high-readability SVG QR codes on the client side.
4. **Master-Detail Views & Lazy Loading:** Advanced data tables for event management, optimizing network performance by loading participation details only when expanded.
5. **Weapons Control Export:** Secure generation of official armory censuses (CSV format with UTF-8 BOM) for legal compliance, processed directly from binary blobs.
6. **Cognitive UI Design:** Application of Gestalt Laws (Proximity, Similarity, Figure-Ground) to reduce cognitive load in complex logistical forms.

🧪 **Testing**

The application features a robust testing suite to guarantee the stability of the system, including business logic, routing guards, and UI components.

**Unit & Component Testing (Vitest + React Testing Library)**
Tests evaluate API mocks, React context injection, and polymorphic forms.
To run the tests:

```bash
npm run test
```

**End-to-End (E2E) Testing (Playwright)**
Independent E2E flows that do not rely on pre-existing database states. They simulate real browser interactions (Chromium) for complex tasks like creating associations, enrolling troops, and testing security perimeters.

To run the E2E suite with the visual UI:

```bash
npx playwright test --ui
```

📦 **Local Installation and Development**

1. Clone the repository and enter the project folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.development` file targeting your local backend:
   ```env
   VITE_API_URL=http://localhost:8081/api
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

☁️ **Production Deployment (AWS EC2 + Docker)**

The frontend is containerized using a highly optimized **Multi-stage build** (Node.js for building + Nginx Alpine for serving static files).

**1. Build and Push the Image (Local Machine)**
First, build the production image and push it to DockerHub:

```bash
# Build the image
docker compose -f docker-compose.preprod.yml up -d --build

# Tag the image for DockerHub
docker tag frontend-recreacion-mando-central-frontend:latest your_user/mando-central-frontend-aws:latest

# Push to DockerHub
docker push your_user/mando-central-frontend-aws:latest
```

**2. Deploy on AWS**
*Note: If you have already set up the environment and environment variables for the **ReenactmentBackend** in your AWS EC2 instance, deploying the frontend is incredibly simple. You do not need to clone the repository.*

Just access your EC2 terminal, ensure your `docker-compose.aws.yaml` includes the frontend service pointing to your DockerHub image, and run:

```bash
# Download the latest images of ALL services (Backend and Frontend)
sudo -E docker-compose -f docker-compose.aws.yaml pull

# Start/Restart the containers
sudo -E docker-compose -f docker-compose.aws.yaml up -d
```