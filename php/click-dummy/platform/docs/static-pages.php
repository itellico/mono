<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/footer.php';

echo renderHeader("Static Pages Development Guide", "Developer", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'docs/static-pages.php'); ?>
    
    <div class="main-content flex-grow-1">
        <div class="container-fluid">
            <h1 class="mb-4">Static Pages Development Guide</h1>
            
            <!-- Quick Start -->
            <div class="card mb-4">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">🚀 Quick Start: Create Static Marketing Pages</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <h6>1. Create Project</h6>
                            <pre class="bg-light p-2"><code>mono create marketing go-models
cd apps/go-models
npm install</code></pre>
                        </div>
                        <div class="col-md-4">
                            <h6>2. Build Pages</h6>
                            <pre class="bg-light p-2"><code>npm run dev
# Edit pages/index.tsx
# Add components</code></pre>
                        </div>
                        <div class="col-md-4">
                            <h6>3. Deploy to CDN</h6>
                            <pre class="bg-light p-2"><code>npm run build
npm run export
vercel --prod</code></pre>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Architecture Overview -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Architecture Overview</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Static Site (Marketing)</h6>
                            <ul>
                                <li><strong>Framework:</strong> Next.js with Static Export</li>
                                <li><strong>Hosting:</strong> CDN (Vercel/Netlify/CloudFront)</li>
                                <li><strong>Performance:</strong> 100/100 Lighthouse</li>
                                <li><strong>Cost:</strong> ~$0 (CDN only)</li>
                                <li><strong>Examples:</strong> Homepage, About, Features</li>
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h6>Dynamic App (Platform)</h6>
                            <ul>
                                <li><strong>Framework:</strong> React with Fastify API</li>
                                <li><strong>Hosting:</strong> AWS/GCP with Auto-scaling</li>
                                <li><strong>Auth:</strong> Session-based with Redis</li>
                                <li><strong>Database:</strong> PostgreSQL with Read Replicas</li>
                                <li><strong>Examples:</strong> Dashboard, Profile, Admin</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Dynamic Widgets -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Dynamic Widget Examples</h5>
                </div>
                <div class="card-body">
                    <h6>Featured Models Widget</h6>
                    <pre class="bg-light p-3"><code class="language-typescript">// components/widgets/FeaturedModels.tsx
export function FeaturedModels({ limit = 6 }) {
  const [models, setModels] = useState([]);
  
  useEffect(() => {
    fetch(`${API_URL}/api/v1/public/models/featured?limit=${limit}`)
      .then(res => res.json())
      .then(setModels);
  }, [limit]);
  
  return (
    &lt;div className="grid grid-cols-3 gap-6"&gt;
      {models.map(model => (
        &lt;ModelCard key={model.id} model={model} /&gt;
      ))}
    &lt;/div&gt;
  );
}</code></pre>
                    
                    <h6 class="mt-4">Newsletter Signup Widget</h6>
                    <pre class="bg-light p-3"><code class="language-typescript">// components/widgets/NewsletterForm.tsx
export function NewsletterForm() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/api/v1/public/newsletter/subscribe`, {
      method: 'POST',
      body: JSON.stringify({ email: e.target.email.value })
    });
  };
  
  return (
    &lt;form onSubmit={handleSubmit}&gt;
      &lt;input type="email" name="email" required /&gt;
      &lt;button type="submit"&gt;Subscribe&lt;/button&gt;
    &lt;/form&gt;
  );
}</code></pre>
                </div>
            </div>

            <!-- API Endpoints -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Public API Endpoints for Static Pages</h5>
                </div>
                <div class="card-body">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Endpoint</th>
                                <th>Description</th>
                                <th>Cache</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><code>GET /api/v1/public/models/featured</code></td>
                                <td>Featured models for homepage</td>
                                <td>5 min</td>
                            </tr>
                            <tr>
                                <td><code>GET /api/v1/public/models/latest</code></td>
                                <td>Latest model profiles</td>
                                <td>5 min</td>
                            </tr>
                            <tr>
                                <td><code>GET /api/v1/public/stats</code></td>
                                <td>Platform statistics</td>
                                <td>1 hour</td>
                            </tr>
                            <tr>
                                <td><code>POST /api/v1/public/registration/quick</code></td>
                                <td>Quick registration form</td>
                                <td>No cache</td>
                            </tr>
                            <tr>
                                <td><code>POST /api/v1/public/newsletter/subscribe</code></td>
                                <td>Newsletter signup</td>
                                <td>No cache</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Deployment Options -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Deployment Options</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="border rounded p-3">
                                <h6>Option 1: Vercel (Recommended)</h6>
                                <ul class="small">
                                    <li>Automatic deployments</li>
                                    <li>Global CDN included</li>
                                    <li>Preview URLs</li>
                                    <li>Analytics built-in</li>
                                </ul>
                                <pre class="bg-light p-2 small"><code>vercel --prod</code></pre>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="border rounded p-3">
                                <h6>Option 2: Netlify</h6>
                                <ul class="small">
                                    <li>Drag & drop deploy</li>
                                    <li>Form handling</li>
                                    <li>Split testing</li>
                                    <li>Edge functions</li>
                                </ul>
                                <pre class="bg-light p-2 small"><code>netlify deploy</code></pre>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="border rounded p-3">
                                <h6>Option 3: AWS S3 + CloudFront</h6>
                                <ul class="small">
                                    <li>Full control</li>
                                    <li>Cost effective</li>
                                    <li>Custom domains</li>
                                    <li>Lambda@Edge</li>
                                </ul>
                                <pre class="bg-light p-2 small"><code>aws s3 sync</code></pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Media Strategy -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Media & Graphics Strategy</h5>
                </div>
                <div class="card-body">
                    <h6>Where to Host Different Media Types</h6>
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Location</th>
                                <th>Example</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Marketing Images</td>
                                <td>CDN (with Next.js)</td>
                                <td><code>/images/hero-bg.jpg</code></td>
                            </tr>
                            <tr>
                                <td>User Uploads</td>
                                <td>S3/R2 via API</td>
                                <td><code>api.site.com/media/uuid.jpg</code></td>
                            </tr>
                            <tr>
                                <td>Icons/Logos</td>
                                <td>Inline SVG or CDN</td>
                                <td><code>&lt;Logo /&gt;</code> component</td>
                            </tr>
                            <tr>
                                <td>Videos</td>
                                <td>YouTube/Vimeo embed</td>
                                <td><code>&lt;iframe&gt;</code> with lazy load</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Performance Tips -->
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Performance Best Practices</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>✅ Do's</h6>
                            <ul>
                                <li>Use <code>next/image</code> for automatic optimization</li>
                                <li>Implement <code>loading="lazy"</code> for images</li>
                                <li>Use <code>getStaticProps</code> for data fetching</li>
                                <li>Enable ISR for frequently updated content</li>
                                <li>Implement proper cache headers</li>
                                <li>Use WebP format with fallbacks</li>
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h6>❌ Don'ts</h6>
                            <ul>
                                <li>Don't fetch data on every request</li>
                                <li>Avoid large JavaScript bundles</li>
                                <li>Don't use unoptimized images</li>
                                <li>Avoid inline critical CSS</li>
                                <li>Don't block rendering with scripts</li>
                                <li>Avoid too many API calls</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
pre code {
    font-size: 12px;
}
.border {
    border-color: #dee2e6 !important;
}
</style>

<?php echo renderFooter(); ?>