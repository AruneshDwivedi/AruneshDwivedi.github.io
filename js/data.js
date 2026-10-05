/* =========================================================
   data.js – ALL portfolio content lives here.
   Add a project or blog post by adding an object to the arrays below;
   the page renders them automatically (see main.js). No HTML editing.

   PROJECT FIELDS
     id, cat (filter group), title, summary, problem, highlights[],
     stack[], links[{label,url}], img (diagram or screenshot),
     shots[{src,caption}]  <- put real screenshots in assets/shots/
     video                 <- e.g. "assets/video/demo.mp4" (optional)
   ========================================================= */

window.PROJECTS = [
  {
    id: "oss-pipeline",
    cat: "Automation",
    title: "AI-Assisted OSS Contribution Pipeline",
    summary: "Two-phase pipeline that finds bugs in open-source infrastructure tooling, drafts Go fixes, and submits them upstream only after human review.",
    problem: "Open-source infra tools often fail silently: panics and truncated results that never reach a maintainer. I wanted a repeatable way to find and fix those, without flooding maintainers with unreviewed AI output.",
    highlights: [
      "Phase 1 drafts autonomously; Phase 2 (publish) is manually triggered and human-gated.",
      "28 merged pull requests across 25+ production infrastructure projects, including Argo Rollouts, Kong, Apache Solr Operator, APISIX Ingress Controller, VictoriaMetrics Operator, OpenSearch k8s Operator, Buildkite CLI, ClickHouse Operator, helm-unittest and Porter.",
      "Fix example: Argo Rollouts anti-affinity nil-check that removed a controller panic halting progressive delivery.",
      "Fix example: Solr Operator rolling-update logic that mishandled already-deleted pods, unblocking safe restarts of stateful workloads.",
      "Fix example: Buildkite CLI cluster-secret listing now paginates instead of truncating results.",
      "Rebuilt the review model after finding the first version too opaque for open-source norms: added a post-submission CI monitoring loop and disclosure-by-default."
    ],
    stack: ["Go", "Python", "GitHub Actions", "Kubernetes operators", "Git"],
    links: [{ label: "Merged PRs on GitHub", url: "https://github.com/search?q=author%3AAruneshDwivedi+is%3Apr+is%3Amerged&type=pullrequests" }],
    img: "assets/oss-pipeline.svg", shots: [], video: null
  },
  {
    id: "terraform-three-tier",
    cat: "IaC",
    title: "Scalable Three-Tier AWS Infrastructure",
    summary: "Multi-AZ web stack composed from reusable Terraform modules: network, compute, ALB and RDS.",
    problem: "Hand-built AWS environments drift and are hard to reproduce. The goal was one module library that stands up the same stack for any environment.",
    highlights: [
      "Reusable modules for network, compute, ALB and RDS, composed per environment.",
      "Multi-AZ layout: load balancer in public subnets, app and database tiers private.",
      "Diagnosed and documented live deployment failures across ALB routing, EC2 user_data and security-group rules (see the blog post on this)."
    ],
    stack: ["Terraform", "AWS VPC", "ALB", "EC2 Auto Scaling", "RDS", "Security Groups"],
    links: [{ label: "Repository", url: "https://github.com/AruneshDwivedi/terraform-aws-scalable-webapp" }],
    img: "assets/terraform-three-tier.svg", shots: [], video: null
  },
  {
    id: "k8s-monitoring",
    cat: "Containers",
    title: "Kubernetes Deployment & Monitoring Stack",
    summary: "Containerised service shipped with Helm behind NGINX Ingress, autoscaled by HPA and observed with Prometheus and Grafana.",
    problem: "A deployment is only production-ready once you have seen it scale and seen it fail. I wanted to validate autoscaling and observability, not just apply manifests.",
    highlights: [
      "Helm chart deploys the service behind NGINX Ingress.",
      "Horizontal Pod Autoscaler validated scaling from 2 to 5 replicas under load.",
      "Prometheus and Grafana dashboards for cluster and application health."
    ],
    stack: ["Kubernetes", "Helm", "NGINX Ingress", "HPA", "Prometheus", "Grafana"],
    links: [{ label: "Repository", url: "https://github.com/AruneshDwivedi/k8s-production-deployment" }],
    img: "assets/k8s-monitoring.svg", shots: [], video: null
  },
  {
    id: "jenkins-cicd",
    cat: "CI/CD",
    title: "Jenkins CI/CD Pipeline on AWS",
    summary: "End-to-end pipeline: automated provisioning, configuration management, deployment and one-step rollback.",
    problem: "Manual releases are slow and unrepeatable. This pipeline turns a git push into infrastructure, configuration and a verified release.",
    highlights: [
      "Jenkins drives Terraform (provision) then Ansible (configure) then deploy, in one pipeline run.",
      "One-step rollback to the last known-good release.",
      "Environment-based configuration keeps dev, staging and production consistent."
    ],
    stack: ["Jenkins", "Terraform", "Ansible", "AWS", "Node.js"],
    links: [{ label: "Repository", url: "https://github.com/AruneshDwivedi/aws-nodejs-cicd" }],
    img: "assets/jenkins-cicd.svg", shots: [], video: null
  },
  {
    id: "ops-automation",
    cat: "Automation",
    title: "Production Ops & Incident Response (Ole Solutions)",
    summary: "Bash and Python automation plus incident response on live client systems running on Yandex Cloud.",
    problem: "Client systems needed repeatable provisioning and fast, documented recovery instead of tribal knowledge.",
    highlights: [
      "Automated provisioning, deployment and health-check workflows, replacing manual runbook steps and cutting hands-on effort per release.",
      "Administered client infrastructure end to end: server provisioning, SSH key and sudo access control, deployment validation, DNS, firewall and routing.",
      "Incident response: triage, root-cause analysis from systemd service state and journald/syslog, remediation, post-incident write-ups that fed back into automation.",
      "Authored runbooks so recurring fixes became process."
    ],
    stack: ["Bash", "Python", "Linux / systemd", "Yandex Cloud", "DNS & firewalls"],
    links: [],
    note: "Client work: no public repository.",
    img: "assets/ops-automation.svg", shots: [], video: null
  }
];

/* ---------------------------------------------------------
   BLOG POSTS. `body` is trusted HTML written by the site owner.
   Sample dates: edit before publishing.
   --------------------------------------------------------- */
window.POSTS = [
  {
    id: "silent-failures",
    title: "Turning silent failures into actionable errors",
    date: "2026-10-02",
    read: "6 min",
    tag: "Open source",
    excerpt: "Most of my merged upstream fixes share one shape: a panic or a quiet truncation that should have been a clear error. Notes on finding them and fixing them well.",
    body: `
<p>Looking across my merged pull requests to Kubernetes tooling, most of them fall into the same bucket: <strong>something fails silently, or crashes unhelpfully, and the fix is to make it fail loudly and specifically.</strong> That pattern is a good lens for anyone starting to contribute to infrastructure projects.</p>

<h3>Three fixes, one pattern</h3>
<ul>
<li><strong>A nil-check in Argo Rollouts.</strong> An anti-affinity code path could dereference a nil value and panic the controller, which halted progressive delivery. The fix is small; the blast radius of the bug was not.</li>
<li><strong>Rolling updates in the Solr Operator.</strong> The logic mishandled pods that were already deleted, which blocked safe restarts of a stateful workload.</li>
<li><strong>Buildkite CLI secret listing.</strong> Results were truncated instead of paginated, so users saw an incomplete list with no warning.</li>
</ul>

<blockquote>If a user can't tell that something went wrong, the bug isn't just the crash. It's the missing signal.</blockquote>

<h3>What a good fix looks like</h3>
<p>Controllers run in a reconcile loop, so a panic does not just fail one request; it can stall everything the controller manages. When I review a candidate bug I ask three questions:</p>
<ol>
<li>Can this input actually occur in a real cluster, or only in a contrived test?</li>
<li>What does the user see when it happens: a clear message, nothing, or a stack trace?</li>
<li>Can the fix be expressed as a guard plus a descriptive error, with a test that fails before and passes after?</li>
</ol>
<p>In Go, the second question usually leads to wrapping errors with context so callers can tell what failed:</p>
<pre><code>// Illustrative pattern, not code from a specific project
if spec.Affinity == nil {
    return fmt.Errorf("rollout %q: anti-affinity configured without affinity spec", name)
}
// ... later, callers can add context as errors travel up:
return fmt.Errorf("reconciling rollout %q: %w", name, err)</code></pre>

<h3>Doing this responsibly</h3>
<p>I use automation to find and draft fixes, but a human reviews every change before anything is submitted. My first version of that process was not transparent enough for open-source norms, so I rebuilt it: submission is manually triggered, AI assistance is disclosed by default, and a monitoring loop watches upstream CI after submission so I can respond quickly if a check fails. Maintainers are volunteers or busy professionals; the contribution should reduce their work, not add to it.</p>

<div class="refs"><h4>References</h4><ol>
<li><a href="https://go.dev/blog/go1.13-errors" target="_blank" rel="noopener">Working with Errors in Go 1.13 (go.dev)</a></li>
<li><a href="https://kubernetes.io/docs/concepts/architecture/controller/" target="_blank" rel="noopener">Kubernetes Controllers (kubernetes.io)</a></li>
<li><a href="https://argo-rollouts.readthedocs.io/en/stable/" target="_blank" rel="noopener">Argo Rollouts documentation</a></li>
<li><a href="https://opensource.guide/how-to-contribute/" target="_blank" rel="noopener">How to Contribute to Open Source (opensource.guide)</a></li>
</ol></div>`
  },
  {
    id: "incident-loop",
    title: "My incident-response loop for a live Linux server",
    date: "2026-09-18",
    read: "5 min",
    tag: "Operations",
    excerpt: "When a client system is down, the order of operations matters more than cleverness. The systemd and journald loop I use, and why every incident ends in a runbook.",
    body: `
<p>On-call is mostly a discipline problem. When a client's system is misbehaving, the goal is to move from <em>"something is wrong"</em> to <em>"this is the cause"</em> without guessing. This is the loop I follow on Linux hosts managed through systemd.</p>

<h3>1. Establish what is actually failing</h3>
<p>Start with state, not theories.</p>
<pre><code>systemctl --failed
systemctl status myapp.service
systemctl is-active myapp.service</code></pre>
<p>This separates "the service is down" from "the service is up but unhealthy" and from "the network in front of it is the problem."</p>

<h3>2. Read the logs for the right window</h3>
<p>journald lets you scope by unit and time, which keeps you from drowning in noise.</p>
<pre><code>journalctl -u myapp.service --since "1 hour ago"
journalctl -u myapp.service -p err -b
journalctl -xe</code></pre>
<p>I look for the first error in the window, not the loudest one. Later errors are often consequences.</p>

<h3>3. Check the layers around the service</h3>
<ul>
<li>Is DNS resolving the name to the expected address?</li>
<li>Do firewall and routing rules permit the traffic?</li>
<li>Did a recent deploy or config change coincide with the first error?</li>
</ul>

<h3>4. Fix, then validate</h3>
<p>Remediation is not done when the service starts. It is done when the health check passes and the original symptom is gone. I validate against the same check that first failed.</p>

<h3>5. Turn the fix into process</h3>
<p>This is the step that compounds. Each incident ends with a short write-up and one of two outcomes: a new runbook entry, or a change to the automation so the problem cannot recur the same way. Blameless post-incident reviews are standard SRE practice for exactly this reason: the output is learning that persists.</p>

<div class="refs"><h4>References</h4><ol>
<li><a href="https://www.freedesktop.org/software/systemd/man/latest/journalctl.html" target="_blank" rel="noopener">journalctl manual (freedesktop.org)</a></li>
<li><a href="https://www.freedesktop.org/software/systemd/man/latest/systemctl.html" target="_blank" rel="noopener">systemctl manual (freedesktop.org)</a></li>
<li><a href="https://sre.google/sre-book/postmortem-culture/" target="_blank" rel="noopener">Postmortem Culture (Google SRE Book)</a></li>
</ol></div>`
  },
  {
    id: "terraform-failures",
    title: "Three-tier AWS with Terraform: where it actually breaks",
    date: "2026-09-04",
    read: "7 min",
    tag: "Infrastructure as Code",
    excerpt: "Modules make a stack reproducible, but the failures I hit were in the seams: ALB health checks, user_data, and security-group chaining.",
    body: `
<p>Terraform modules make a three-tier stack reproducible. They do not make it correct. When I built a multi-AZ web stack from modules for network, compute, ALB and RDS, the problems that cost me time were all in the seams between components.</p>

<h3>ALB returns 502/503: check the target group first</h3>
<p>If the load balancer is up but traffic fails, the target group's health check is the usual culprit. The health check path, port and expected response code must match what the app actually serves. A health check that points at a path returning a redirect or 404 will mark every instance unhealthy, and the ALB will have nowhere to send traffic.</p>

<h3>user_data runs once, as root, at first boot</h3>
<p>Bootstrap scripts passed through <code>user_data</code> execute on first launch, and a failure partway through does not retry. Two habits help: make the script idempotent and fail loudly, and know where to look afterwards.</p>
<pre><code>sudo cat /var/log/cloud-init-output.log
sudo cloud-init status --long</code></pre>
<p>If the app never started, the answer is almost always in that log, not in the Terraform output.</p>

<h3>Security groups should chain, not open up</h3>
<p>Rather than allowing CIDR ranges between tiers, reference security groups: the ALB group may reach the app group, and only the app group may reach the database group. When something cannot connect, walking the chain tier by tier finds the missing rule faster than widening access to "test."</p>

<h3>Design the modules around change</h3>
<ul>
<li>Keep each module's inputs and outputs small and explicit.</li>
<li>Compose environments from modules; do not copy and edit.</li>
<li>Write down failure modes as you hit them. My notes from this build became the checklist I now run for new stacks.</li>
</ul>

<div class="refs"><h4>References</h4><ol>
<li><a href="https://developer.hashicorp.com/terraform/language/modules" target="_blank" rel="noopener">Terraform: Modules (HashiCorp)</a></li>
<li><a href="https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html" target="_blank" rel="noopener">Health checks for ALB target groups (AWS)</a></li>
<li><a href="https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html" target="_blank" rel="noopener">Run commands on launch with user data (AWS)</a></li>
</ol></div>`
  }
];
